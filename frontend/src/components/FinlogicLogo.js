/**
 * FinlogicLogo — inline SVG brand mark matching the uploaded logo.
 *
 * Icon mark:
 *   • Top horizontal rail  (full width, violet)
 *   • Left vertical rail   (full height, violet)
 *   • Gold/amber square    (bottom-left quadrant)
 *   — that's it. No bottom or right rails.
 *
 * Props:
 *   size   — icon height in px
 *   variant — "full" (icon + wordmark) | "icon" (icon only)
 *   darkBg — true → white wordmark  |  false → dark-purple wordmark
 */
export default function FinlogicLogo({
  size = 40,
  variant = "full",
  darkBg = false,
  className = "",
}) {
  const violet      = "#5B2FD4";
  const gold        = "#F59F01";
  const wordPrimary   = darkBg ? "#FFFFFF"              : "#3A138A";
  const wordSecondary = darkBg ? "rgba(255,255,255,0.55)" : "#6B3DD4";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>

      {/* ── Icon mark ── */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        {/* Top horizontal rail */}
        <rect x="8" y="8" width="84" height="14" rx="3" fill={violet} />

        {/* Left vertical rail */}
        <rect x="8" y="8" width="14" height="84" rx="3" fill={violet} />

        {/* Gold accent square — bottom-left quadrant */}
        <rect x="26" y="60" width="28" height="28" rx="5" fill={gold} />
      </svg>

      {/* ── Wordmark ── */}
      {variant === "full" && (
        <svg
          height={size * 0.82}
          viewBox="0 0 220 84"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Finlogic Capital Limited"
          style={{ overflow: "visible" }}
        >
          <text
            x="0" y="30"
            fontFamily="'Geist', 'Inter', 'Arial Black', sans-serif"
            fontWeight="900"
            fontSize="31"
            letterSpacing="0.5"
            fill={wordPrimary}
          >
            FINLOGIC
          </text>
          <text
            x="0" y="58"
            fontFamily="'Geist', 'Inter', 'Arial Black', sans-serif"
            fontWeight="900"
            fontSize="31"
            letterSpacing="0.5"
            fill={wordPrimary}
          >
            CAPITAL
          </text>
          <text
            x="1" y="80"
            fontFamily="'Geist', 'Inter', 'Arial Black', sans-serif"
            fontWeight="600"
            fontSize="22"
            letterSpacing="3"
            fill={wordSecondary}
          >
            LIMITED
          </text>
        </svg>
      )}
    </span>
  );
}
