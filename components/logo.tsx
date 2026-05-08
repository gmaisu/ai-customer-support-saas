import { cn } from "@/lib/utils";

export function Logo({
  className,
  size = 32,
  glow = false,
}: {
  className?: string;
  size?: number;
  /** When true, adds a forge spark dot at top-right and a deeper drop shadow. */
  glow?: boolean;
}) {
  const sparkSize = Math.max(4, Math.round(size * 0.18));
  return (
    <span
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
      aria-label="Helpforge"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size}>
        <defs>
          <linearGradient
            id="helpforge-logo-g"
            x1="0"
            y1="0"
            x2="64"
            y2="64"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#7c3aed" />
            <stop offset="0.5" stopColor="#a855f7" />
            <stop offset="1" stopColor="#d946ef" />
          </linearGradient>
          <radialGradient id="helpforge-logo-shine" cx="0.3" cy="0.2" r="0.7">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="0.6" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="64" height="64" rx="18" fill="url(#helpforge-logo-g)" />
        <rect width="64" height="64" rx="18" fill="url(#helpforge-logo-shine)" />
        <text
          x="32"
          y="44"
          fontFamily="var(--font-geist-sans), Inter, system-ui, sans-serif"
          fontSize="38"
          fontWeight="800"
          fill="white"
          textAnchor="middle"
          letterSpacing="-1"
        >
          H
        </text>
      </svg>
      {glow && (
        <span
          aria-hidden
          className="hf-pulse absolute"
          style={{
            top: -2,
            right: -2,
            width: sparkSize,
            height: sparkSize,
            borderRadius: 999,
            background: "var(--forge)",
            boxShadow: "0 0 10px var(--forge-glow)",
          }}
        />
      )}
    </span>
  );
}
