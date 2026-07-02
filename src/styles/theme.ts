/**
 * GHLG design tokens — JS-side mirror of src/styles/theme.css.
 *
 * Use these when a token is needed outside Tailwind classes
 * (canvas drawing, tray icon tinting, inline SVG, etc.).
 * The CSS file is the source of truth; keep both in sync.
 *
 * Palette rule: red is the ONLY accent color in the system.
 * It marks primary actions, active/watching states, and important tags.
 * Neutral-positive ("success") states use white/gray — never green.
 */
export const colors = {
  /** App background (dark mode default). */
  ink: "#0d0d0d",
  /** Cards / panels. */
  panel: "#1a1a1a",
  /** Hovered / raised panels. */
  panelRaised: "#242424",

  /** The one red. Primary actions, WATCHING state, bug tags. */
  accent: "#e63946",
  /** Pressed / muted red. */
  accentDim: "#a32833",

  /** Primary text, off-white. */
  fg: "#f5f5f4",
  /** Secondary / muted text. */
  fgMuted: "#8a8a8a",
  /** Disabled text / hints. */
  fgFaint: "#5c5c5c",

  /** Subtle dividers — dark gray, not pure black. */
  edge: "#2e2e2e",
  edgeStrong: "#3d3d3d",
} as const;

export const fonts = {
  /** UI chrome and labels. */
  sans: '"Inter", ui-sans-serif, system-ui, sans-serif',
  /** Code, diffs, file paths, timestamps. */
  mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
} as const;

/** Tray/watch state → icon tint. OFF has no icon (app quit). */
export const watchStateColor = {
  idle: colors.fgMuted,
  watching: colors.accent,
} as const;

export type WatchState = keyof typeof watchStateColor;
