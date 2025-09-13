// SVG de iglesia (church)
export const ChurchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width={80} height={80} viewBox="0 0 64 64" fill="none" {...props}>
    <g stroke="#3b5a75" strokeWidth={2} strokeLinejoin="round">
      <rect x="16" y="28" width="32" height="24" rx="2"/>
      <path d="M8 52V36l24-20 24 20v16"/>
      <rect x="28" y="40" width="8" height="12" rx="1"/>
      <path d="M32 12v-4M32 8h0" strokeLinecap="round"/>
      <circle cx="32" cy="36" r="2"/>
    </g>
  </svg>
);

// SVG de copas (cheers)
export const CheersIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width={80} height={80} viewBox="0 0 64 64" fill="none" {...props}>
    <g stroke="#3b5a75" strokeWidth={2} strokeLinejoin="round">
      <path d="M20 24c0 8 8 16 8 16s8-8 8-16"/>
      <path d="M44 24c0 8-8 16-8 16s-8-8-8-16"/>
      <path d="M24 24l-8-8m32 8l8-8"/>
      <path d="M32 40v12"/>
      <path d="M28 52h8"/>
      <circle cx="32" cy="20" r="12"/>
      <path d="M26 10c0-2 4-2 4 0" strokeLinecap="round"/>
      <path d="M38 10c0-2-4-2-4 0" strokeLinecap="round"/>
      <path d="M32 6v2" strokeLinecap="round"/>
      <path d="M29 7l1 2" strokeLinecap="round"/>
      <path d="M35 7l-1 2" strokeLinecap="round"/>
      <path d="M32 4v1" strokeLinecap="round"/>
    </g>
    <g fill="#3b5a75">
      <circle cx="32" cy="8" r="1"/>
      <circle cx="29" cy="10" r="0.7"/>
      <circle cx="35" cy="10" r="0.7"/>
    </g>
  </svg>
);
