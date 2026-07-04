// Outline blackletter "L" (Leads) — stroke-only, gothic flavor, no emoji.
// Hand-drawn path; inherits color via currentColor.
export function LogoL({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinejoin="miter"
      strokeLinecap="square"
      aria-label="L"
    >
      {/* main letterform: flag → stem → swept foot with end facet */}
      <path d="M33 5 L15 14 L22 18 L22 44 L15 51 L26 58 L46 58 L55 48 L48 45 L32 50 L32 16 Z" />
      {/* gothic hairline through the stem */}
      <path d="M12 32 L40 25" strokeWidth={2} />
    </svg>
  );
}
