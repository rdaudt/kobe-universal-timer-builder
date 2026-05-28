import { Icon } from './Icon';
import { BLOCK_DEFAULTS, fmt, shade } from '../lib/helpers';
import type { FoundationBlock, RepeatBlock } from '../types';

type StyleVariant = 'snap' | 'flat' | 'layered';

interface BlockProps {
  block: FoundationBlock;
  mini?: boolean;
  dragging?: boolean;
  isOverlay?: boolean;
  styleVariant?: StyleVariant;
  dragHandle?: boolean;
  hideDuration?: boolean;
  onClick?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  style?: React.CSSProperties;
}

export function Block({
  block, mini, dragging, isOverlay, styleVariant = 'snap',
  dragHandle = true, hideDuration = false,
  onClick, dragHandleProps, style: extraStyle,
}: BlockProps) {
  const def = BLOCK_DEFAULTS[block.type] ?? BLOCK_DEFAULTS['work'];
  const ink = block.type === 'rest' ? '#F4EFE2' : (def.ink ?? '#0F0F11');

  const baseStyle: React.CSSProperties = {
    '--blk-bg': block.color,
    '--blk-ink': ink,
    ...extraStyle,
  } as React.CSSProperties;

  let blockClass = 'block';
  if (dragging) blockClass += ' block--dragging';
  if (isOverlay) blockClass += ' block--overlay';
  if (styleVariant === 'flat') blockClass += ' block--flat';
  if (styleVariant === 'layered') blockClass += ' block--layered';

  if (styleVariant === 'layered') {
    Object.assign(baseStyle, {
      borderRadius: 16,
      boxShadow:
        `0 2px 0 ${shade(block.color, -0.35)},` +
        `0 4px 0 ${shade(block.color, -0.55)},` +
        'inset 0 1px 0 rgba(255,255,255,0.18)',
    });
  }

  return (
    <div className={blockClass} style={baseStyle} onClick={onClick}>
      <Icon name={def.icon ?? 'work'} size={18} color={ink} stroke={2.4} />
      <div className="col">
        <div className="name" style={{ color: ink }}>{block.name}</div>
        {!mini && (
          <div className="meta" style={{ color: ink, opacity: 0.7 }}>
            {def.label}
          </div>
        )}
      </div>
      {!hideDuration && (
        <div className="dur" style={{ color: ink }}>{fmt(block.duration)}</div>
      )}
      {dragHandle && (
        <div style={{ opacity: 0.45, marginLeft: 2, cursor: 'grab', touchAction: 'none' }} {...dragHandleProps}>
          <Icon name="drag" size={16} color={ink} />
        </div>
      )}
    </div>
  );
}

interface BlockChipProps {
  type: FoundationBlock['type'];
  dragging?: boolean;
  dragProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function BlockChip({ type, dragging, dragProps }: BlockChipProps) {
  const def = BLOCK_DEFAULTS[type];
  const ink = type === 'rest' ? '#F4EFE2' : def.ink;
  return (
    <div
      className={`block block--chip ${dragging ? 'block--dragging' : ''}`}
      style={{ '--blk-bg': def.color, '--blk-ink': ink, minWidth: 116, cursor: 'grab', touchAction: 'none' } as React.CSSProperties}
      {...dragProps}
    >
      <Icon name={def.icon} size={16} color={ink} stroke={2.4} />
      <div className="col">
        <div className="name" style={{ color: ink }}>{def.label}</div>
        <div className="meta" style={{ color: ink, opacity: 0.7 }}>{fmt(def.defaultDur)}</div>
      </div>
    </div>
  );
}

interface RepeatChipProps {
  dragging?: boolean;
  dragProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function RepeatChip({ dragging, dragProps }: RepeatChipProps) {
  return (
    <div
      className={`block block--chip ${dragging ? 'block--dragging' : ''}`}
      style={{
        minWidth: 116,
        background: 'transparent',
        border: '1.5px dashed var(--gold-2)',
        color: 'var(--gold-2)',
        boxShadow: 'none',
        cursor: 'grab',
        touchAction: 'none',
      }}
      {...dragProps}
    >
      <Icon name="repeat" size={16} color="var(--gold-2)" stroke={2.4} />
      <div className="col">
        <div className="name" style={{ color: 'var(--gold-2)' }}>Repeat</div>
        <div className="meta" style={{ color: 'var(--gold-2)', opacity: 0.7 }}>Loop</div>
      </div>
    </div>
  );
}

interface RepeatBlockCardProps {
  block: RepeatBlock;
  dragging?: boolean;
  isOverlay?: boolean;
  onClick?: () => void;
  onDecrement?: () => void;
  onIncrement?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  children?: React.ReactNode;
  nestViz?: string;
}

export function RepeatBlockCard({
  block, dragging, isOverlay, onClick, onDecrement, onIncrement,
  dragHandleProps, children, nestViz = 'bracket',
}: RepeatBlockCardProps) {
  return (
    <div
      className={`repeat ${dragging ? 'block--dragging' : ''} ${isOverlay ? 'block--overlay' : ''}`}
      data-viz={nestViz}
      onClick={onClick}
      style={{ cursor: 'pointer', marginBottom: 2 }}
    >
      <div className="bracket" />
      <div className="rep-head" style={{ gap: 10 }}>
        <div
          className="rep-x"
          style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {block.name} <span style={{ opacity: 0.7 }}>×{block.repetitions}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onDecrement?.(); }}
            style={{ width: 22, height: 22, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--gold-2)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
          ><Icon name="minus" size={11} color="var(--gold-2)" /></button>
          <button
            onClick={(e) => { e.stopPropagation(); onIncrement?.(); }}
            style={{ width: 22, height: 22, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--gold-2)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
          ><Icon name="plus" size={11} color="var(--gold-2)" /></button>
          <div style={{ opacity: 0.45, cursor: 'grab', touchAction: 'none' }} {...dragHandleProps}>
            <Icon name="drag" size={16} color="var(--gold-2)" />
          </div>
        </div>
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function Connector({ short }: { short?: boolean }) {
  return <div className="connector" style={{ height: short ? 10 : 14 }} />;
}
