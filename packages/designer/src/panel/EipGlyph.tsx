import type { BlockDefinition } from '@flowcamel/core';

interface Props {
  kind: BlockDefinition['glyph'];
}

export function EipGlyph({ kind }: Props) {
  const stroke = 'currentColor';
  const sw = 1.2;

  switch (kind) {
    case 'source':
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="6" cy="12" r="3" stroke={stroke} strokeWidth={sw} />
          <path d="M9 12h11" stroke={stroke} strokeWidth={sw} />
          <path d="M17 9l3 3-3 3" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      );
    case 'filter':
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M3 12h6" stroke={stroke} strokeWidth={sw} />
          <path d="M15 12h6" stroke={stroke} strokeWidth={sw} />
          <rect x="9" y="7" width="6" height="10" stroke={stroke} strokeWidth={sw} />
          <path d="M11 9l2 6" stroke={stroke} strokeWidth={sw} />
        </svg>
      );
    case 'transform':
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="3" y="6" width="6" height="6" stroke={stroke} strokeWidth={sw} />
          <rect x="15" y="12" width="6" height="6" stroke={stroke} strokeWidth={sw} />
          <path d="M9 9c3 0 3 6 6 6" stroke={stroke} strokeWidth={sw} />
        </svg>
      );
    case 'split':
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="5" cy="12" r="2" stroke={stroke} strokeWidth={sw} />
          <circle cx="19" cy="6" r="2" stroke={stroke} strokeWidth={sw} />
          <circle cx="19" cy="18" r="2" stroke={stroke} strokeWidth={sw} />
          <path d="M7 12l10-6" stroke={stroke} strokeWidth={sw} />
          <path d="M7 12l10 6" stroke={stroke} strokeWidth={sw} />
        </svg>
      );
    case 'log':
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="4" y="5" width="16" height="14" stroke={stroke} strokeWidth={sw} />
          <path d="M7 10h4M7 13h7M7 16h5" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        </svg>
      );
    case 'router':
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="6" cy="12" r="2" stroke={stroke} strokeWidth={sw} />
          <circle cx="18" cy="6" r="2" stroke={stroke} strokeWidth={sw} />
          <circle cx="18" cy="12" r="2" stroke={stroke} strokeWidth={sw} />
          <circle cx="18" cy="18" r="2" stroke={stroke} strokeWidth={sw} />
          <path d="M8 12h2M10 12l6-6M10 12h6M10 12l6 6" stroke={stroke} strokeWidth={sw} />
        </svg>
      );
    case 'destination':
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M3 12h11" stroke={stroke} strokeWidth={sw} />
          <path d="M11 9l3 3-3 3" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" />
          <rect x="16" y="8" width="5" height="8" stroke={stroke} strokeWidth={sw} />
        </svg>
      );
  }
}
