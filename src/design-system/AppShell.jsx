import { useState } from "react";
import "./AppShell.css";
import { Drawer } from "./Drawer.jsx";
import { DesktopOnly, MobileOnly } from "./Layout.jsx";

/*
  App Shell primitives own layout/interaction chrome only - never
  the menu contents, active-route logic, permissions, or auth
  state. All of that stays exactly where it already lives (today:
  app.jsx's own `page` state, `menuItems`/`adminMenuItems`/etc.
  arrays, and `isLoggedIn`/role checks) and is passed in as props.
  This is what "do not hardcode route availability independently
  from the actual router/feature flags" means in practice: the
  shell renders whatever list of items it's given, nothing more.

  navItems: [{ key, label, icon?, onClick }]
  activeKey: the currently active item's key, for aria-current
*/

export const DesktopSidebar = ({
  navItems,
  activeKey,
  header,
  footer,
  className = "",
}) => (
  <DesktopOnly>
    <nav
      className={`ex2-shell-sidebar ${className}`.trim()}
      aria-label="Primary navigation"
    >
      {header ? <div className="ex2-shell-sidebar__header">{header}</div> : null}

      <ul className="ex2-shell-sidebar__list">
        {navItems.map((item) => (
          <li key={item.key}>
            <button
              type="button"
              className={`ex2-shell-sidebar__item ${
                item.key === activeKey ? "ex2-shell-sidebar__item--active" : ""
              }`}
              aria-current={item.key === activeKey ? "page" : undefined}
              onClick={item.onClick}
            >
              {item.icon ? (
                <span className="ex2-shell-sidebar__icon" aria-hidden="true">
                  {item.icon}
                </span>
              ) : null}
              <span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>

      {footer ? <div className="ex2-shell-sidebar__footer">{footer}</div> : null}
    </nav>
  </DesktopOnly>
);

/*
  DesktopHeader: top bar with the entry points explicitly required
  - notifications, account/profile, language, theme, and an
  optional system/maintenance indicator - none of which this
  component implements itself; each is a caller-supplied slot
  (typically a Popover-based menu from the calling page).
*/
export const DesktopHeader = ({
  logo,
  search,
  notificationSlot,
  accountSlot,
  languageSlot,
  themeSlot,
  systemStatusSlot,
  className = "",
}) => (
  <DesktopOnly>
    <header className={`ex2-shell-header ${className}`.trim()}>
      <div className="ex2-shell-header__start">
        {logo}
        {search ? (
          <div className="ex2-shell-header__search">{search}</div>
        ) : null}
      </div>

      <div className="ex2-shell-header__end">
        {systemStatusSlot}
        {languageSlot}
        {themeSlot}
        {notificationSlot}
        {accountSlot}
      </div>
    </header>
  </DesktopOnly>
);

/*
  MobileHeader: compact top bar with a menu-open trigger; the
  actual navigation list lives in MobileNav (a Drawer), not here.
*/
export const MobileHeader = ({
  logo,
  onOpenMenu,
  notificationSlot,
  className = "",
}) => (
  <MobileOnly>
    <header className={`ex2-shell-mobile-header ${className}`.trim()}>
      <button
        type="button"
        className="ex2-shell-mobile-header__menu-btn"
        aria-label="Open navigation menu"
        onClick={onOpenMenu}
      >
        ☰
      </button>
      <div className="ex2-shell-mobile-header__logo">{logo}</div>
      <div className="ex2-shell-mobile-header__actions">
        {notificationSlot}
      </div>
    </header>
  </MobileOnly>
);

/*
  MobileNav: the navigation list, in a bottom-sheet Drawer (per the
  redesign brief's "mobile is designed, not desktop-compressed"
  rule) rather than squeezing the desktop sidebar into a narrow
  screen. Reuses Drawer's real focus-trap/Escape/scroll-lock
  behavior - no separate mobile-only accessibility implementation.
*/
export const MobileNav = ({
  open,
  onClose,
  navItems,
  activeKey,
  accountSlot,
  languageSlot,
  themeSlot,
  title = "Menu",
}) => (
  <Drawer open={open} onClose={onClose} title={title} side="bottom">
    <ul className="ex2-shell-mobile-nav__list">
      {navItems.map((item) => (
        <li key={item.key}>
          <button
            type="button"
            className={`ex2-shell-mobile-nav__item ${
              item.key === activeKey
                ? "ex2-shell-mobile-nav__item--active"
                : ""
            }`}
            aria-current={item.key === activeKey ? "page" : undefined}
            onClick={() => {
              item.onClick();
              onClose();
            }}
          >
            {item.icon ? (
              <span className="ex2-shell-sidebar__icon" aria-hidden="true">
                {item.icon}
              </span>
            ) : null}
            <span>{item.label}</span>
          </button>
        </li>
      ))}
    </ul>

    {accountSlot || languageSlot || themeSlot ? (
      <div className="ex2-shell-mobile-nav__footer">
        {accountSlot}
        {languageSlot}
        {themeSlot}
      </div>
    ) : null}
  </Drawer>
);

/*
  AppShell: composes the above into the standard desktop
  sidebar+header / mobile header+drawer layout around a single
  content region. `mobileMenuOpen` is managed internally via
  useState unless the caller passes a controlled `mobileMenuOpen`/
  `onMobileMenuOpenChange` pair (needed if, e.g., a route change
  should also close the menu).
*/
export const AppShell = ({
  navItems,
  activeKey,
  logo,
  search,
  notificationSlot,
  accountSlot,
  languageSlot,
  themeSlot,
  systemStatusSlot,
  sidebarHeader,
  sidebarFooter,
  children,
  mobileMenuOpen: controlledOpen,
  onMobileMenuOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onMobileMenuOpenChange ?? setInternalOpen;

  return (
    <div className="ex2-shell">
      <DesktopSidebar
        navItems={navItems}
        activeKey={activeKey}
        header={sidebarHeader}
        footer={sidebarFooter}
      />

      <div className="ex2-shell__main">
        <DesktopHeader
          logo={logo}
          search={search}
          notificationSlot={notificationSlot}
          accountSlot={accountSlot}
          languageSlot={languageSlot}
          themeSlot={themeSlot}
          systemStatusSlot={systemStatusSlot}
        />

        <MobileHeader
          logo={logo}
          onOpenMenu={() => setOpen(true)}
          notificationSlot={notificationSlot}
        />

        <main className="ex2-shell__content">{children}</main>
      </div>

      <MobileNav
        open={open}
        onClose={() => setOpen(false)}
        navItems={navItems}
        activeKey={activeKey}
        accountSlot={accountSlot}
        languageSlot={languageSlot}
        themeSlot={themeSlot}
      />
    </div>
  );
};

export default AppShell;
