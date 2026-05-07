import { cn } from "@/lib/utils";

export function Logo({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-label="Helpforge"
    >
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
          <stop offset="1" stopColor="#d946ef" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#helpforge-logo-g)" />
      <text
        x="32"
        y="44"
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="38"
        fontWeight="800"
        fill="white"
        textAnchor="middle"
      >
        H
      </text>
    </svg>
  );
}
