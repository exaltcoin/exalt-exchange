import "./Layout.css";

/*
  These are layout-only primitives - they position and space
  content, they do not add borders/shadows/backgrounds by default.
  This is deliberate: the redesign's whole point is to stop wrapping
  everything in a bordered box. A page that needs a visually
  distinct surface (e.g. a form panel) should apply that narrowly
  and intentionally in its own CSS, not get one for free from the
  generic layout primitive - that's exactly how the old
  ExaltTheme.css ended up forcing every element into the same
  gradient-glass-card treatment.
*/

export const PageContainer = ({
  children,
  maxWidth = "1280px",
  className = "",
}) => (
  <div
    className={`ex2-page-container ${className}`.trim()}
    style={{ "--ex2-page-max-width": maxWidth }}
  >
    {children}
  </div>
);

/*
  Section: a titled region of a page (e.g. Dashboard's "Portfolio",
  "Recent Activity"). Uses a heading + divider, not a bordered box,
  to separate content - dense and readable rather than boxed.
*/
export const Section = ({
  title,
  action,
  children,
  className = "",
  as: Heading = "h2",
}) => (
  <section className={`ex2-section ${className}`.trim()}>
    {title || action ? (
      <div className="ex2-section__header">
        {title ? (
          <Heading className="ex2-section__title">{title}</Heading>
        ) : null}
        {action ? <div className="ex2-section__action">{action}</div> : null}
      </div>
    ) : null}
    <div className="ex2-section__body">{children}</div>
  </section>
);

/*
  Toolbar: a horizontal row of controls (search + filters + actions)
  that wraps sensibly on narrow screens instead of clipping.
*/
export const Toolbar = ({ children, className = "" }) => (
  <div className={`ex2-toolbar ${className}`.trim()}>{children}</div>
);

/*
  Stack: vertical or horizontal flex layout with a token-based gap -
  the most common layout need, replacing ad-hoc inline margin/padding
  hacks scattered through the legacy CSS.
*/
export const Stack = ({
  direction = "column",
  gap = "3",
  align,
  justify,
  wrap = false,
  children,
  className = "",
}) => (
  <div
    className={`ex2-stack ${className}`.trim()}
    style={{
      display: "flex",
      flexDirection: direction,
      gap: `var(--ex2-space-${gap})`,
      alignItems: align,
      justifyContent: justify,
      flexWrap: wrap ? "wrap" : "nowrap",
    }}
  >
    {children}
  </div>
);

/*
  Grid: a simple responsive grid - `minItemWidth` drives an
  auto-fill column count via CSS Grid, so callers don't need to
  hand-write breakpoints for common card/tile grids.
*/
export const Grid = ({
  minItemWidth = "220px",
  gap = "4",
  children,
  className = "",
}) => (
  <div
    className={`ex2-grid ${className}`.trim()}
    style={{
      display: "grid",
      gridTemplateColumns: `repeat(auto-fill, minmax(${minItemWidth}, 1fr))`,
      gap: `var(--ex2-space-${gap})`,
    }}
  >
    {children}
  </div>
);

/*
  SplitPane: two-region layout (e.g. order book + trade form, chart
  + positions panel) that stacks vertically on narrow screens
  instead of squeezing two narrow columns onto a phone screen -
  this is the "mobile is designed, not desktop-compressed" rule
  applied at the layout-primitive level.

  The stack breakpoint is fixed at 768px in Layout.css rather than
  configurable per-instance: CSS custom properties cannot be read
  inside an @media condition, so a `stackBelow` prop threaded
  through as a CSS variable would silently do nothing - it's
  intentionally not offered as a prop for that reason, rather than
  shipping one that looks configurable but isn't.
*/
export const SplitPane = ({
  start,
  end,
  startWidth = "320px",
  gap = "4",
  className = "",
}) => (
  <div
    className={`ex2-split-pane ${className}`.trim()}
    style={{
      "--ex2-split-start-width": startWidth,
      "--ex2-split-gap": `var(--ex2-space-${gap})`,
    }}
  >
    <div className="ex2-split-pane__start">{start}</div>
    <div className="ex2-split-pane__end">{end}</div>
  </div>
);

/*
  Visibility helpers: only where genuinely useful (e.g. showing a
  mobile-only bottom nav vs a desktop-only sidebar) - not a general
  substitute for real responsive layout, which each primitive above
  already handles via CSS.
*/
export const DesktopOnly = ({ children }) => (
  <div className="ex2-desktop-only">{children}</div>
);

export const MobileOnly = ({ children }) => (
  <div className="ex2-mobile-only">{children}</div>
);
