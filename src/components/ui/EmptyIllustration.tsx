/** Small, decorative desk vignettes: never a substitute for the next-action text. */
export function EmptyIllustration({ kind = 'research' }: { kind?: 'research' | 'inbox' | 'people' | 'map' }) {
  return (
    <svg viewBox="0 0 144 88" fill="none" aria-hidden="true" focusable="false" className="mx-auto mb-4 h-20 w-36 text-accent-ink">
      <ellipse cx="72" cy="75" rx="57" ry="8" fill="currentColor" opacity="0.05" />
      <path d="M18 74h108" stroke="currentColor" strokeOpacity="0.3" />
      {kind === 'people' ? (
        <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="54" cy="29" r="10" /><circle cx="91" cy="35" r="8" />
          <path d="M32 68v-9c0-15 44-15 44 0v9M80 53c13-5 30 0 30 11v4M50 42l4 6 5-6" />
        </g>
      ) : kind === 'map' ? (
        <g stroke="currentColor" strokeWidth="1.8">
          <path d="m28 22 28-9 31 10 29-9v48l-29 9-31-10-28 9V22Z" fill="currentColor" fillOpacity="0.04" />
          <path d="M56 13v48M87 23v48M42 42l28-7 28 13" strokeDasharray="3 4" />
          <circle cx="70" cy="35" r="4" fill="currentColor" />
        </g>
      ) : kind === 'inbox' ? (
        <g stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
          <path d="M31 34h82v35H31z" fill="currentColor" fillOpacity="0.04" />
          <path d="m31 35 41 24 41-24M31 69l27-19M113 69 86 50" />
          <path d="M49 32V16h46v16M58 23h28" strokeLinecap="round" />
        </g>
      ) : (
        <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M37 15h45l14 14v40H37V15Z" fill="currentColor" fillOpacity="0.04" />
          <path d="M82 15v15h14M48 31h20M48 41h27M48 51h17" />
          <circle cx="91" cy="54" r="14" fill="var(--surface)" /><path d="m101 65 13 12" strokeWidth="3" />
        </g>
      )}
      <circle cx="120" cy="20" r="3" fill="var(--brass)" opacity="0.6" />
      <path d="M22 41v8m-4-4h8" stroke="var(--brass)" strokeWidth="1.5" />
    </svg>
  )
}
