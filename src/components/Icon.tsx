interface IconProps {
  name: string;
  size?: number;
  color?: string;
  stroke?: number;
}

export function Icon({ name, size = 18, color = 'currentColor', stroke = 2 }: IconProps) {
  const s = size;
  const p = { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'play':       return <svg {...p}><path d="M7 5l12 7-12 7V5z" fill={color} stroke="none"/></svg>;
    case 'pause':      return <svg {...p}><rect x="6" y="5" width="4" height="14" fill={color} stroke="none"/><rect x="14" y="5" width="4" height="14" fill={color} stroke="none"/></svg>;
    case 'skip':       return <svg {...p}><path d="M5 4l10 8-10 8V4z" fill={color} stroke="none"/><rect x="17" y="4" width="2" height="16" fill={color} stroke="none"/></svg>;
    case 'x':          return <svg {...p}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case 'plus':       return <svg {...p}><path d="M12 5v14M5 12h14"/></svg>;
    case 'minus':      return <svg {...p}><path d="M5 12h14"/></svg>;
    case 'search':     return <svg {...p}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>;
    case 'chev':       return <svg {...p}><path d="M9 6l6 6-6 6"/></svg>;
    case 'chev-d':     return <svg {...p}><path d="M6 9l6 6 6-6"/></svg>;
    case 'drag':       return <svg {...p} stroke="none" fill={color}><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>;
    case 'work':       return <svg {...p}><path d="M6 4v16M18 4v16M3 8h3M3 16h3M18 8h3M18 16h3M6 12h12"/></svg>;
    case 'rest':       return <svg {...p}><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>;
    case 'trans':      return <svg {...p}><path d="M4 7h13l-3-3M20 17H7l3 3"/></svg>;
    case 'warm':       return <svg {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></svg>;
    case 'cool':       return <svg {...p}><path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19M12 5l-3 4 3 3-3 4 3 3M12 5l3 4-3 3 3 4-3 3"/></svg>;
    case 'repeat':     return <svg {...p}><path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3"/></svg>;
    case 'settings':   return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 008 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9 1.65 1.65 0 004.27 7.18l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6 1.65 1.65 0 0010 3.09V3a2 2 0 114 0v.09A1.65 1.65 0 0015 4.6a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
    case 'flame':      return <svg {...p}><path d="M12 2c2 4 6 6 6 11a6 6 0 11-12 0c0-3 2-4 2-7 1 1 2 2 4 2-1-2-1-4 0-6z"/></svg>;
    case 'time':       return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'check':      return <svg {...p}><path d="M5 12l5 5L20 7"/></svg>;
    case 'trash':      return <svg {...p}><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M6 6l1 14a2 2 0 002 2h6a2 2 0 002-2l1-14"/></svg>;
    case 'copy':       return <svg {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>;
    case 'sound':      return <svg {...p}><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 010 7M19 5a9 9 0 010 14"/></svg>;
    case 'note':       return <svg {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>;
    case 'tag':        return <svg {...p}><path d="M20 12l-9 9-8-8V3h10l7 9z"/><circle cx="7" cy="7" r="1.5" fill={color}/></svg>;
    case 'grid':       return <svg {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
    case 'list':       return <svg {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>;
    case 'back':       return <svg {...p}><path d="M19 12H5M12 19l-7-7 7-7"/></svg>;
    case 'sparkle':    return <svg {...p}><path d="M12 3l1.5 5L18 9l-4.5 1L12 15l-1.5-5L6 9l4.5-1L12 3z" fill={color} stroke="none"/></svg>;
    case 'bolt':       return <svg {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" fill={color} stroke="none"/></svg>;
    case 'volume':     return <svg {...p}><path d="M11 5L6 9H2v6h4l5 4V5z" fill={color} stroke={color}/></svg>;
    case 'map':        return <svg {...p}><path d="M12 3v5M12 11v5"/><circle cx="12" cy="4" r="2.5"/><circle cx="12" cy="12" r="2.5"/><circle cx="12" cy="20" r="2.5"/></svg>;
    default: return null;
  }
}
