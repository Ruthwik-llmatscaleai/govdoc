import * as React from "react";

export const ArrowUp = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

export const SquareStop = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <rect x="6" y="6" width="12" height="12" rx="1.5" />
  </svg>
);

export const VoiceWave = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" {...props}>
    <line x1="4" y1="9" x2="4" y2="15" />
    <line x1="8" y1="6" x2="8" y2="18" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="16" y1="5" x2="16" y2="19" />
    <line x1="20" y1="10" x2="20" y2="14" />
  </svg>
);
