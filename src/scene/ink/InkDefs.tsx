/**
 * Shared SVG filters, mounted once. Filters are only applied to layers that
 * move by CSS transform (composited), never to geometry that is re-drawn every
 * frame, so the cost is paid once per layer.
 */
export function InkDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden>
      <defs>
        {/* Wet edge: ink bleeding into paper fibres. */}
        <filter id="ink-bleed" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="11" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* Dry brush: broken, granular stroke edges. */}
        <filter id="ink-dry" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="5" result="grain" />
          <feColorMatrix in="grain" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.25" result="mask" />
          <feComposite in="SourceGraphic" in2="mask" operator="in" result="dry" />
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="9" result="n" />
          <feDisplacementMap in="dry" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* Uneven seal-paste impression. */}
        <filter id="seal-wear" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.6" />
          <feComposite in="SourceGraphic" operator="in" />
        </filter>
        {/* Soft wash for mist and cloud. */}
        <filter id="wash" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="wash-heavy" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <linearGradient id="mist-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a1a18" stopOpacity="1" />
          <stop offset="0.55" stopColor="#1a1a18" stopOpacity="0.55" />
          <stop offset="1" stopColor="#1a1a18" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="mist-fade-soft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a1a18" stopOpacity="0.9" />
          <stop offset="0.35" stopColor="#1a1a18" stopOpacity="0.35" />
          <stop offset="1" stopColor="#1a1a18" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}
