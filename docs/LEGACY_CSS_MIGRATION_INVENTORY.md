# Legacy CSS Migration Inventory — App Shell / Navigation / Dashboard

Produced before the first live-page migration, per the redesign safety
rules. All figures below are from direct inspection of the actual
files in this source tree, not estimates.

## Overall size

| File | Lines | `!important` count |
|---|---|---|
| `src/style.css` | 5,871 | 650 |
| `src/styles/ExaltTheme.css` | 349 | 47 |
| **Total** | **6,220** | **697** |

`ExaltTheme.css` loads after `style.css` in the current cascade
(`main.jsx` imports `App` — which transitively imports `style.css` via
`app.jsx` — before its own `ExaltTheme.css` import), so `ExaltTheme.css`
is the effective final-word override layer today, matching its own
internal comment describing itself as an "Exalt Premium Override
Layer."

## Selectors directly relevant to App Shell / Navigation / Dashboard

Real selectors found in `style.css` (line numbers as of this
inventory):

```
24:   .sidebar{
65:   .topbar{
289:  .dashboard-row{
373:  .dashboard-page,
602:  .topbar div {
606:  .topbar h2 {
611:  .topbar p {
843:  .sidebar-profile strong {
894:  .sidebar-profile:hover {
962:  .sidebar ul {
1388: .sidebar-item,
1389: .menu-item{
1395: .sidebar button:hover,
1396: .sidebar-item:hover,
1397: .menu-item:hover{
1407: .sidebar-item.active,
1408: .menu-item.active{
4048: .topbar-logo,
4061: .sidebar .main-logo {
4877: .dashboard-app-shell > .main > .topbar,
4902: .dashboard-app-shell .topbar-main-row,
4910: .dashboard-app-shell .topbar-brand,
4920: .dashboard-app-shell .topbar-brand > div,
4926: .dashboard-app-shell .topbar-logo,
4943: .dashboard-app-shell .topbar h2,
4944: .dashboard-app-shell .topbar-brand h2,
4960: .dashboard-app-shell .topbar p,
4961: .dashboard-app-shell .topbar-brand p,
4977: .dashboard-app-shell .topbar-language-row,
4997: .dashboard-app-shell .topbar-language-row::-webkit-scrollbar,
5002: .dashboard-app-shell .topbar-language-row > *,
5009: .dashboard-app-shell .topbar-profile-btn,
5032: .dashboard-app-shell > .main > .topbar-account-actions,
5047: .dashboard-app-shell > .main > .topbar-account-actions .connect-btn,
5112: .dashboard-page,
5431: .topbar-profile-btn:focus-visible,
```

The `.dashboard-app-shell` block (lines ~4877–5431) alone contains
**100 `!important` declarations** — the single densest concentration
of override pressure in the entire file, sitting exactly where the
new `AppShell`/`DesktopHeader`/`DesktopSidebar` components will land.

Real selectors found in `ExaltTheme.css`:

```
36:  .dashboard,
224: .dashboard,
225: .dashboard-page,
257: .dashboard-card,
281: .sidebar button,
289: .sidebar button.active,
290: .sidebar .active,
```

The `.dashboard-card` rule (line 257) is part of a shared block that
also targets `.positions-panel`, `.orderbook-card`, `.coin-details-box`,
`.market-card`, `.p2p-card`, and others — forcing the exact same
gradient-glass background/border/shadow onto all of them
simultaneously with `!important`. This is the concrete, file-verified
version of the "everything is the same box" problem the redesign is
meant to fix — one shared rule currently controls the visual identity
of dashboard cards, order books, coin detail panels, and P2P cards,
regardless of what each of those actually is.

`.sidebar button` / `.sidebar .active` (lines 281–290) force
background/border/color with `!important` — these are the selectors
most likely to visually clash with the new `DesktopSidebar` component
if any migrated markup accidentally retains the `.sidebar`/legacy
button structure instead of switching fully to
`design-system/AppShell.jsx`.

## Selectors likely to override new design-system components

Any of the above `!important` rules will beat the design-system's
plain (non-`!important`) component styles on specificity+source-order
grounds if a migrated page's markup still carries the old class names
(`.sidebar`, `.topbar`, `.dashboard-card`, `.menu-item`, etc.) alongside
the new `ex2-*` classes. This is exactly why the migration plan
(documented in `src/design-system/index.js`) requires **full markup
replacement**, not class-name addition — a page must stop rendering
the legacy class names entirely, not layer new classes on top of them.

## Migration procedure for this batch (App Shell / Navigation / Dashboard)

1. Replace `app.jsx`'s sidebar/topbar JSX with `design-system/AppShell.jsx`
   components, removing the legacy `.sidebar`/`.topbar`/`.menu-item`
   class names from the rendered markup entirely.
2. Once no rendered markup uses `.sidebar`, `.topbar`, `.dashboard-app-shell`,
   `.menu-item`, `.sidebar-item`, `.sidebar-profile`, `.topbar-logo`,
   `.topbar-brand`, `.topbar-language-row`, `.topbar-profile-btn`, or
   `.topbar-account-actions`, delete those selector blocks from
   `style.css`/`ExaltTheme.css` in the same change.
3. For `.dashboard-card` / `.dashboard-page` / `.dashboard-row` /
   `.dashboard`: same procedure once the Dashboard page itself is
   migrated (next in the migration order) — do not remove these yet,
   since `Dashboard.jsx` still uses them and hasn't been migrated in
   this batch.
4. Rerun the full regression/build suite after each removal, not just
   after all removals, so a broken selector deletion is caught
   immediately rather than bundled with unrelated changes.

No selectors have been deleted yet — this document is the inventory
step only, produced before touching `app.jsx`'s live markup.
