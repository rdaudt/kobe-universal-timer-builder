import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Icon } from './Icon';
import { Block, BlockChip, RepeatChip, RepeatBlockCard } from './Block';
import { BlockEditor } from './BlockEditor';
import { TimerSettings } from './TimerSettings';
import { makeBlock, makeRepeat, totalDuration, fmtLoose, compositionStrip, countBlocks, uid } from '../lib/helpers';
import type { TimerDefinition, TimerNode, FoundationBlock, RepeatBlock } from '../types';

// ─── Path helpers ───────────────────────────────────────────────────────────

type Path = number[];

function getAt(seq: TimerNode[], path: Path): TimerNode {
  let node: { sequence: TimerNode[] } = { sequence: seq };
  for (let i = 0; i < path.length; i++) {
    node = node.sequence[path[i]] as RepeatBlock;
  }
  return node as unknown as TimerNode;
}

function getParentSeq(seq: TimerNode[], path: Path): TimerNode[] {
  if (path.length === 0) return seq;
  let node: { sequence: TimerNode[] } = { sequence: seq };
  for (let i = 0; i < path.length - 1; i++) {
    node = node.sequence[path[i]] as RepeatBlock;
  }
  return node.sequence;
}


const PALETTE_TYPES = ['warmup', 'work', 'rest', 'transition', 'cooldown'] as const;

interface DropTarget {
  parentPath: Path;
  index: number;
}

// dnd-kit drag IDs
// palette: "palette:work", "palette:repeat"
// canvas block: block id
// dropzone: "dz:path:index"  e.g. "dz:0,1:2"

function dzId(parentPath: Path, index: number): string {
  return `dz:${parentPath.join(',')}:${index}`;
}
function parseDzId(id: string): DropTarget | null {
  const m = id.match(/^dz:([^:]*):(\d+)$/);
  if (!m) return null;
  const pathStr = m[1];
  return {
    parentPath: pathStr === '' ? [] : pathStr.split(',').map(Number),
    index: parseInt(m[2], 10),
  };
}

// ─── DropZone ───────────────────────────────────────────────────────────────

import { useDroppable } from '@dnd-kit/core';

function DropZone({ parentPath, index, active }: { parentPath: Path; index: number; active: boolean }) {
  const id = dzId(parentPath, index);
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        height: isOver ? 36 : (active ? 20 : 8),
        transition: 'height .15s ease',
      }}
    >
      {isOver && <div className="drop-hint">Drop here</div>}
    </div>
  );
}

// ─── DraggableBlock ─────────────────────────────────────────────────────────

import { useDraggable } from '@dnd-kit/core';

function DraggableFoundationBlock({
  block, path, onOpen, nestViz: _nestViz, styleVariant,
}: {
  block: FoundationBlock; path: Path; onOpen: (p: Path) => void;
  nestViz: string; styleVariant: string;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: block.id });
  return (
    <div ref={setNodeRef} {...attributes}>
      <Block
        block={block}
        dragging={isDragging}
        styleVariant={styleVariant as 'snap' | 'flat' | 'layered'}
        onClick={() => onOpen(path)}
        dragHandleProps={listeners}
      />
    </div>
  );
}

interface DraggableRepeatProps {
  block: RepeatBlock;
  path: Path;
  onOpen: (p: Path) => void;
  onDecrement: (p: Path) => void;
  onIncrement: (p: Path) => void;
  drag: ActiveDrag | null;
  dropTarget: DropTarget | null;
  onDzDragOver: (parentPath: Path, index: number, e: { active: { id: string } }) => void;
  nestViz: string;
  styleVariant: string;
  depth: number;
  renderSeq: (seq: TimerNode[], parentPath: Path, depth: number) => React.ReactNode;
}

function DraggableRepeat({
  block, path, onOpen, onDecrement, onIncrement,
  drag: _drag, dropTarget: _dropTarget, nestViz, styleVariant: _styleVariant, depth, renderSeq,
}: DraggableRepeatProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: block.id });
  return (
    <div ref={setNodeRef} {...attributes}>
      <RepeatBlockCard
        block={block}
        dragging={isDragging}
        onClick={() => onOpen(path)}
        onDecrement={() => onDecrement(path)}
        onIncrement={() => onIncrement(path)}
        dragHandleProps={listeners}
        nestViz={nestViz}
      >
        {renderSeq(block.sequence, path, depth + 1)}
        {block.sequence.length === 0 && (
          <EmptyContainer path={path} />
        )}
      </RepeatBlockCard>
    </div>
  );
}

function EmptyContainer({ path }: { path: Path }) {
  const id = dzId(path, 0);
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        padding: '14px 8px', borderRadius: 12,
        border: isOver ? '1.5px solid var(--gold)' : '1.5px dashed rgba(240, 201, 58, 0.32)',
        background: isOver ? 'rgba(240, 201, 58, 0.08)' : 'rgba(240, 201, 58, 0.04)',
        color: 'var(--ink-3)', fontSize: 11, textAlign: 'center',
        letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600,
        transition: 'all .15s',
      }}
    >
      {isOver ? <span style={{ color: 'var(--gold)' }}>Drop here</span> : 'Drop blocks inside'}
    </div>
  );
}

// ─── Palette cancel zone ─────────────────────────────────────────────────────
// Wraps the palette panel as a droppable so that drags released over the
// palette register an over-id of 'palette-zone' rather than hitting a canvas
// DropZone that is hidden behind the palette (DOM coords, not z-index, drive
// dnd-kit collision detection).
function PalettePanel({ children, style }: { children: React.ReactNode; style: React.CSSProperties }) {
  const { setNodeRef } = useDroppable({ id: 'palette-zone' });
  return <div ref={setNodeRef} style={style}>{children}</div>;
}

// ─── Palette chip with draggable ────────────────────────────────────────────

function PaletteBlockChip({ type }: { type: FoundationBlock['type'] }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `palette:${type}` });
  return (
    <div ref={setNodeRef} {...attributes} style={{ flex: '1 1 calc(33.33% - 6px)', minWidth: 0 }}>
      <BlockChip type={type} dragging={isDragging} dragProps={listeners} />
    </div>
  );
}

function PaletteRepeatChip() {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: 'palette:repeat' });
  return (
    <div ref={setNodeRef} {...attributes} style={{ flex: '1 1 calc(33.33% - 6px)', minWidth: 0 }}>
      <RepeatChip dragging={isDragging} dragProps={listeners} />
    </div>
  );
}

// ─── Active drag state ───────────────────────────────────────────────────────

interface ActiveDrag {
  id: string;
  kind: 'palette' | 'canvas';
  type?: string;
  node?: TimerNode;
}

// ─── Builder ────────────────────────────────────────────────────────────────

export interface BuilderProps {
  timer: TimerDefinition;
  onChange: (t: TimerDefinition) => void;
  onRun: () => void;
  onBack: () => void;
  onRestore?: (id: string) => void;
  blockStyle?: string;
  nestViz?: string;
}

export function Builder({ timer, onChange, onRun, onBack, onRestore, blockStyle = 'snap', nestViz = 'bracket' }: BuilderProps) {
  const [editing, setEditing] = useState<Path | null>(null);
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  const [nameEdit, setNameEdit] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const dur = totalDuration(timer.sequence);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  // ── Mutation helpers ────────────────────────────────────────────────────

  const update = useCallback((mutator: (d: TimerDefinition) => void) => {
    const next = JSON.parse(JSON.stringify(timer)) as TimerDefinition;
    mutator(next);
    onChange(next);
  }, [timer, onChange]);

  const insertAt = (parentPath: Path, index: number, block: TimerNode) => {
    update((d) => {
      const seq = parentPath.length === 0
        ? d.sequence
        : (getAt(d.sequence, parentPath) as RepeatBlock).sequence;
      seq.splice(index, 0, block);
    });
  };

  const removeAt = (path: Path) => {
    update((d) => {
      const seq = getParentSeq(d.sequence, path);
      seq.splice(path[path.length - 1], 1);
    });
  };

  const updateAt = (path: Path, mut: (n: TimerNode) => void) => {
    update((d) => {
      const node = getAt(d.sequence, path);
      mut(node);
    });
  };

  const decrement = (path: Path) => updateAt(path, (n) => { if (n.type === 'repeat') n.repetitions = Math.max(2, n.repetitions - 1); });
  const increment = (path: Path) => updateAt(path, (n) => { if (n.type === 'repeat') n.repetitions = Math.min(99, n.repetitions + 1); });

  // ── dnd-kit handlers ───────────────────────────────────────────────────

  const handleDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    if (id.startsWith('palette:')) {
      const type = id.split(':')[1];
      setActiveDrag({ id, kind: 'palette', type });
    } else {
      // find the node
      const find = (seq: TimerNode[]): TimerNode | null => {
        for (const b of seq) {
          if (b.id === id) return b;
          if (b.type === 'repeat') { const f = find(b.sequence); if (f) return f; }
        }
        return null;
      };
      const node = find(timer.sequence);
      if (node) setActiveDrag({ id, kind: 'canvas', node });
    }
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveDrag(null);
    const overId = String(e.over?.id ?? '');
    if (!overId || overId === 'palette-zone') return;
    const dt = parseDzId(overId);
    if (!dt) return;

    const dragId = String(e.active.id);

    if (dragId.startsWith('palette:')) {
      const type = dragId.split(':')[1];
      const newNode = type === 'repeat'
        ? makeRepeat(3, [], { name: 'Round' })
        : makeBlock(type as FoundationBlock['type']);
      insertAt(dt.parentPath, dt.index, newNode);
    } else {
      // Find and remove the node from its current position, then insert
      let movedNode: TimerNode | null = null;
      update((d) => {
        const remove = (seq: TimerNode[]): boolean => {
          for (let i = 0; i < seq.length; i++) {
            if (seq[i].id === dragId) {
              [movedNode] = seq.splice(i, 1);
              return true;
            }
            if (seq[i].type === 'repeat') {
              if (remove((seq[i] as RepeatBlock).sequence)) return true;
            }
          }
          return false;
        };
        remove(d.sequence);
      });
      if (!movedNode) return;

      // Now insert at target
      update((d) => {
        const seq = dt.parentPath.length === 0
          ? d.sequence
          : (getAt(d.sequence, dt.parentPath) as RepeatBlock).sequence;

        // Prevent dragging a container into itself (can't happen since we removed it)
        let adjustedIndex = dt.index;
        if (adjustedIndex > seq.length) adjustedIndex = seq.length;
        seq.splice(adjustedIndex, 0, movedNode!);
      });
    }
  };

  // ── Render sequence ────────────────────────────────────────────────────

  const renderSeq = (seq: TimerNode[], parentPath: Path, depth: number): React.ReactNode => {
    const items: React.ReactNode[] = [];
    for (let i = 0; i <= seq.length; i++) {
      items.push(
        <DropZone key={`dz-${i}`} parentPath={parentPath} index={i} active={!!activeDrag} />
      );
      if (i < seq.length) {
        const block = seq[i];
        const path = [...parentPath, i];
        if (block.type === 'repeat') {
          items.push(
            <DraggableRepeat
              key={block.id}
              block={block}
              path={path}
              onOpen={setEditing}
              onDecrement={decrement}
              onIncrement={increment}
              drag={activeDrag}
              dropTarget={null}
              onDzDragOver={() => {}}
              nestViz={nestViz}
              styleVariant={blockStyle}
              depth={depth}
              renderSeq={renderSeq}
            />
          );
        } else {
          items.push(
            <DraggableFoundationBlock
              key={block.id}
              block={block}
              path={path}
              onOpen={setEditing}
              nestViz={nestViz}
              styleVariant={blockStyle}
            />
          );
        }
      }
    }
    return <div>{items}</div>;
  };

  // ── Drag overlay ───────────────────────────────────────────────────────

  const overlayContent = activeDrag ? (
    activeDrag.kind === 'palette' ? (
      <div style={{ width: 120 }}>
        {activeDrag.type === 'repeat'
          ? <RepeatChip />
          : <BlockChip type={activeDrag.type as FoundationBlock['type']} />}
      </div>
    ) : activeDrag.node ? (
      activeDrag.node.type === 'repeat'
        ? (
          <div style={{ width: 280, opacity: 0.9 }}>
            <RepeatBlockCard
              block={activeDrag.node}
              isOverlay
              nestViz={nestViz}
            >
              <div style={{ height: 20 }} />
            </RepeatBlockCard>
          </div>
        ) : (
          <div style={{ width: 280 }}>
            <Block
              block={activeDrag.node}
              isOverlay
              styleVariant={blockStyle as 'snap' | 'flat' | 'layered'}
              dragHandle={false}
            />
          </div>
        )
    ) : null
  ) : null;

  // ── Edit sheet ─────────────────────────────────────────────────────────

  const editingBlock = editing ? getAt(timer.sequence, editing) : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="app app--grid" data-nestviz={nestViz} style={{ display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <div style={{ padding: 'calc(env(safe-area-inset-top, 12px) + 12px) 16px 0', position: 'relative', zIndex: 4, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 14 }}>
            <button onClick={onBack} className="btn btn--icon" style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.05)' }}>
              <Icon name="back" size={16} color="var(--ink)" />
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn--icon"
                style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.05)' }}
                onClick={() => setSettingsOpen(true)}
              >
                <Icon name="settings" size={16} color="var(--ink)" />
              </button>
              <button
                className="btn"
                style={{ padding: '8px 14px', height: 38, fontSize: 13, background: 'rgba(255,255,255,0.05)', color: 'var(--ink)' }}
                onClick={() => onChange({ ...timer, updatedAt: new Date().toISOString() })}
              >
                Save
              </button>
            </div>
          </div>

          {nameEdit ? (
            <input
              autoFocus
              value={timer.name}
              onChange={(e) => onChange({ ...timer, name: e.target.value })}
              onBlur={() => setNameEdit(false)}
              onKeyDown={(e) => { if (e.key === 'Enter') setNameEdit(false); }}
              className="t-display"
              style={{
                fontSize: 34, fontWeight: 800, color: 'var(--ink)',
                background: 'transparent', border: 'none', outline: 'none',
                width: '100%', padding: '0 0 4px', borderBottom: '2px solid var(--gold)',
                letterSpacing: '0.01em', textTransform: 'uppercase', fontFamily: 'var(--f-display)',
              }}
            />
          ) : (
            <h1 onClick={() => setNameEdit(true)} className="t-display" style={{ fontSize: 34, margin: '0 0 6px', lineHeight: 0.95, cursor: 'text' }}>
              {timer.name}
            </h1>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span className="pill pill--gold" style={{ fontSize: 12, padding: '6px 12px' }}>
              <Icon name="time" size={12} />
              {fmtLoose(dur)}
            </span>
            <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>
              {countBlocks(timer.sequence)} blocks
            </span>
          </div>

          <MiniTimeline timer={timer} />
        </div>

        {/* Canvas */}
        <div
          className="no-scrollbar"
          style={{ flex: 1, overflow: 'auto', padding: '8px 16px calc(250px + env(safe-area-inset-bottom, 0px))', position: 'relative', zIndex: 2 }}
        >
          {renderSeq(timer.sequence, [], 0)}
          {timer.sequence.length === 0 && !activeDrag && (
            <div style={{ textAlign: 'center', color: 'var(--ink-3)', padding: '60px 30px' }}>
              <div className="t-display" style={{ fontSize: 22, color: 'var(--ink-2)', marginBottom: 6 }}>Empty canvas</div>
              <div style={{ fontSize: 13 }}>Drag a block from below to begin.</div>
            </div>
          )}
        </div>

        {/* Palette + Run button */}
        <PalettePanel style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 8,
          padding: `12px 16px calc(30px + env(safe-area-inset-bottom, 0px))`,
          background: 'var(--surface-2)',
          borderTop: '1px solid var(--gold)',
          borderRadius: '12px 12px 0 0',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '6px 2px 14px', marginBottom: 6 }}>
            {PALETTE_TYPES.map((type) => (
              <PaletteBlockChip key={type} type={type} />
            ))}
            <PaletteRepeatChip />
          </div>
          <button
            onClick={onRun}
            disabled={timer.sequence.length === 0}
            className="btn btn--gold glow"
            style={{ width: '100%', height: 56, fontSize: 17, opacity: timer.sequence.length === 0 ? 0.45 : 1 }}
          >
            <Icon name="play" size={18} color="var(--gold-ink)" />
            Run Timer
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--f-display)', fontSize: 17, letterSpacing: '-0.01em' }}>
              {fmtLoose(dur)}
            </span>
          </button>
        </PalettePanel>

        {/* Block editor sheet */}
        {editing && editingBlock && (
          <BlockEditor
            path={editing}
            block={editingBlock}
            onChange={(mut) => updateAt(editing, mut)}
            onClose={() => setEditing(null)}
            onDelete={() => { removeAt(editing); setEditing(null); }}
            onDuplicate={() => {
              const node = getAt(timer.sequence, editing);
              const copy = { ...JSON.parse(JSON.stringify(node)), id: uid() };
              insertAt(editing.slice(0, -1), editing[editing.length - 1] + 1, copy);
              setEditing(null);
            }}
          />
        )}
        {settingsOpen && (
          <TimerSettings
            timer={timer}
            onChange={onChange}
            onClose={() => setSettingsOpen(false)}
            isUserModifiedBundled={timer.isBundled && timer.version > 1}
            onRestore={onRestore ? () => { onRestore(timer.id); setSettingsOpen(false); } : undefined}
          />
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {overlayContent}
      </DragOverlay>
    </DndContext>
  );
}

function MiniTimeline({ timer }: { timer: TimerDefinition }) {
  const items = compositionStrip(timer.sequence);
  return (
    <div style={{ margin: '12px 0 0' }}>
      <div style={{ display: 'flex', height: 6, borderRadius: 999, overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
        {items.map((it, i) => (
          <span key={i} style={{ flex: it.weight, background: it.color, borderRight: i < items.length - 1 ? '1px solid var(--bg)' : 'none' }} />
        ))}
      </div>
    </div>
  );
}
