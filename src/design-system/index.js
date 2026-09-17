/*
  EXALT Design System — Entry Point & Architecture Rules
  =======================================================

  This is the ONLY file pages should import the design system from:

    import { Button, Badge, Alert, useTheme, ... } from "../design-system";

  Never import a design-system component's internal .jsx file
  directly from a page. This keeps the public surface intentional
  and lets internals move/split without breaking every importer.

  ---------------------------------------------------------------
  1. HOW tokens.css ENTERS THE APP (exactly once)
  ---------------------------------------------------------------
  tokens.css is imported exactly once, at the application's root
  entry module (src/main.jsx), BEFORE style.css/ExaltTheme.css:

    import "./design-system/tokens.css";
    import "./style.css";
    import "./styles/ExaltTheme.css";

  Individual design-system components (Button.jsx, etc.) import
  only their OWN component-scoped CSS (Button.css, etc.) - never
  tokens.css again - since CSS custom properties on :root are
  global once loaded once. No page or component should import
  tokens.css a second time.

  ---------------------------------------------------------------
  2. MIGRATION PLAN FOR style.css / ExaltTheme.css
  ---------------------------------------------------------------
  These two files (6,220 lines combined) are NOT deleted or
  rewritten wholesale. They are retired incrementally, page by
  page, in the exact migration order already agreed:

    App Shell/Navigation/Dashboard -> Markets -> Spot -> Futures ->
    Wallet/Funds -> Deposits/Withdrawals -> Web3 -> P2P ->
    Account/Security/KYC -> Notifications/Statements/Support ->
    remaining modules -> Admin

  For each page migrated:
    a) Identify which ExaltTheme.css/style.css selectors that page
       actually uses (e.g. Dashboard.jsx's .dashboard-card rules).
    b) Replace the page's markup/classes with design-system
       components + tokens.
    c) Delete ONLY those now-unused selectors from
       ExaltTheme.css/style.css in the same change - never leave
       dead rules behind "just in case."
    d) Never add a new `!important` rule to force the old system
       and the new system to agree - if a conflict appears, the
       page being migrated wins outright (its old rule is deleted).

  This means style.css/ExaltTheme.css shrink monotonically as
  migration proceeds, and the two systems never compete for the
  same page at the same time - a given page is driven by exactly
  one of them. There is no "run both indefinitely" end state;
  once every page in the migration order is done, both legacy
  files are deleted entirely.

  Do NOT duplicate an old rule under a new component name (e.g.
  copying .stat-card's gradient-glass styling into a new
  design-system Card component). New components use the token
  system's flatter, denser visual language - see tokens.css's own
  header comment for why (smaller radii, restrained shadows,
  fewer competing surfaces).

  ---------------------------------------------------------------
  3. THEME STATE
  ---------------------------------------------------------------
  Theme state (dark/light) is centralized in ONE place:
  design-system/theme.js (storage) + ThemeProvider.jsx (React
  state/context). No component or page should read/write
  `localStorage["exalt_theme"]` directly - always go through
  useTheme().

  Security note: THEME_STORAGE_KEY ("exalt_theme") stores only the
  string "dark" or "light" - never a token, session id, or any
  auth-adjacent value. It uses the same plain localStorage
  mechanism as the language preference (i18n/storage.js), which is
  the existing, already-reviewed pattern for non-sensitive UI
  preferences in this app. It is read/written independently of
  the auth token storage used elsewhere (apiClient.js) and never
  touches it.

  ---------------------------------------------------------------
  4. RTL
  ---------------------------------------------------------------
  RTL is handled once, centrally, by the existing
  i18n/direction.js (applyLanguageDirection sets dir="rtl"/"ltr"
  on <html>) - already wired in and unaffected by this design
  system. Every design-system component's CSS uses logical
  properties (margin-inline-start, padding-inline-end, etc.)
  instead of physical left/right properties, so RTL support is
  automatic and requires no per-component RTL-specific code or
  props. See any component's .css file for the pattern.

  ---------------------------------------------------------------
  5. FINANCIAL COLOR SEMANTICS
  ---------------------------------------------------------------
  --ex2-buy/--ex2-sell (and the success/danger tokens they map
  from) are defined once per theme in tokens.css and never
  redefined per component. A "buy" badge is the same green in
  dark and light mode's respective palettes - see tokens.css's
  dark vs light blocks for the exact values chosen for each
  theme's contrast requirements.
*/

export { Button } from "./Button.jsx";
export { Badge } from "./Badge.jsx";
export { Alert } from "./Alert.jsx";
export { Skeleton, SkeletonText } from "./Skeleton.jsx";
export {
  EmptyState,
  ErrorState,
  MaintenanceState,
} from "./RequestStates.jsx";
export { ThemeProvider, useTheme } from "./ThemeProvider.jsx";
export {
  normalizeTheme,
  DEFAULT_THEME,
  SUPPORTED_THEMES,
} from "./theme.js";
export { FormField } from "./FormField.jsx";
export { Input, AmountInput } from "./Input.jsx";
export { Select } from "./Select.jsx";
export { Checkbox, Switch } from "./Checkbox.jsx";
export { Tabs, TabPanel } from "./Tabs.jsx";
export { Dialog } from "./Dialog.jsx";
export { Drawer } from "./Drawer.jsx";
export { useFocusTrap } from "./useFocusTrap.js";
export { ToastProvider, useToast } from "./Toast.jsx";
export { Tooltip } from "./Tooltip.jsx";
export { Pagination } from "./Pagination.jsx";
export { DataTable } from "./DataTable.jsx";
export { ConfirmationDialog } from "./ConfirmationDialog.jsx";
export { StatusBadge, getStatusTone } from "./StatusBadge.jsx";
export { Popover } from "./Popover.jsx";
export { SearchInput } from "./SearchInput.jsx";
export { FilterBar } from "./FilterBar.jsx";
export {
  PageContainer,
  Section,
  Toolbar,
  Stack,
  Grid,
  SplitPane,
  DesktopOnly,
  MobileOnly,
} from "./Layout.jsx";
export {
  AppShell,
  DesktopSidebar,
  DesktopHeader,
  MobileHeader,
  MobileNav,
} from "./AppShell.jsx";
