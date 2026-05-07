# Branding

Final, locked-in brand identity for the project. If something here is referenced in code (color hex, name spelling, etc.) and you want to change it, change it here first, then update the code.

## Name

**Helpforge**

- Spelling: capitalized "H," lowercase rest, single word. Always written `Helpforge`, never `HelpForge`, `HELPFORGE`, or `helpforge`.
- Pronunciation: "HELP-forj."
- Why this name: descriptive without being literal — "forging" a help system from the user's content matches the product's actual workflow (raw URLs/PDFs → polished AI support agent). The verb "forge" gives the brand its own action word ("forge a bot" instead of generic "create" or "build"). Confirmed unavailable as a major company / product / GitHub project / domain at the time of selection.

## Tagline

**Forge an AI support bot from your website in 30 seconds.**

Use this verbatim on the landing page hero and in the README. The "30 seconds" is the differentiator — don't soften it. The verb "forge" pairs the tagline to the brand name.

## Brand color

Primary: **violet-600** (`#7c3aed`)
Accent: **fuchsia-500** (`#d946ef`)
Background dark: **slate-950** (`#020617`)
Background light: **white** (`#ffffff`) / **slate-50** (`#f8fafc`)

These map directly to Tailwind class names — no custom hex values in components if you can help it. Use `bg-violet-600`, `text-violet-600`, `from-violet-600 to-fuchsia-500` for gradients, etc.

**Why violet:** in 2026, violet is the de-facto color of AI products (OpenAI gradients, Claude, Anthropic, Mistral). Upwork buyers searching "AI developer" pattern-match this aesthetic immediately. It's the safe-but-effective choice.

**CSS variable mapping** (set in `app/globals.css`):

```css
:root {
  --primary: oklch(0.541 0.281 293.009); /* violet-600 */
  --accent: oklch(0.969 0.016 293.756); /* violet-50 (subtle bg) */
  --ring: oklch(0.541 0.281 293.009); /* violet-600 focus ring */
}
```

shadcn v3 + Tailwind v4 uses OKLCH (perceptually uniform color space). Don't change to HSL — it'll break the dark-mode contrast tuning.

## Logo

**Letter monogram in a rounded square.**

- Shape: rounded square, 8px corner radius at 64×64 size
- Background: linear gradient `violet-600 → fuchsia-500` (top-left to bottom-right)
- Letter: bold "H" in white, centered, ~70% of the square's height
- Font: Inter or whatever the app uses for headings, weight 700 or 800

Generate it once as an SVG (it's just a `<rect>` + `<text>`) and reuse everywhere. Save to `branding/logo.svg`. Export PNG variants at 64×64 (favicon) and 256×256 (OG card) when needed in Phase 7.

A minimal SVG that works:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#7c3aed"/>
      <stop offset="1" stop-color="#d946ef"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#g)"/>
  <text x="32" y="44" font-family="Inter, system-ui, sans-serif" font-size="38" font-weight="800" fill="white" text-anchor="middle">H</text>
</svg>
```

## Voice and copy

- Direct, not cute. "Forge an AI support bot" not "Spin up a smart assistant."
- Specific over vague. "30 seconds" beats "fast." "Cite sources" beats "trustworthy answers."
- The verb "forge" is reserved for the user-facing onboarding and hero copy. Don't overuse it elsewhere — internal docs and dashboard chrome should use plain language.
- No emojis in product copy. Only in marketing if used very sparingly.
- Avoid "magic," "AI-powered" (everything is AI-powered now), "revolutionize," "next-gen."

## Where this gets referenced

- `app/layout.tsx` metadata — title, description, OG tags
- `tailwind.config.ts` / `app/globals.css` — color tokens
- `components/logo.tsx` — the SVG component
- `app/page.tsx` — landing hero and tagline
- `README.md` — top of the repo
- `public/favicon.ico`, `public/og-image.png` — generated assets
