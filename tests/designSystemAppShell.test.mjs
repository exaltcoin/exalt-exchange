import "./helpers/domTestSetup.js";

import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

import {
  DesktopSidebar,
  DesktopHeader,
  MobileHeader,
  MobileNav,
  AppShell,
} from "../src/design-system/AppShell.jsx";

const h = React.createElement;

test.afterEach(() => {
  cleanup();
});

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", onClick: () => {} },
  { key: "markets", label: "Markets", onClick: () => {} },
  { key: "wallets", label: "Wallets", onClick: () => {} },
];

test("DesktopSidebar renders exactly the nav items it's given - no hardcoded routes", () => {
  render(h(DesktopSidebar, { navItems: NAV_ITEMS, activeKey: "dashboard" }));

  assert.ok(screen.getByRole("button", { name: "Dashboard" }));
  assert.ok(screen.getByRole("button", { name: "Markets" }));
  assert.ok(screen.getByRole("button", { name: "Wallets" }));
});

test("DesktopSidebar marks the active item with aria-current=page", () => {
  render(h(DesktopSidebar, { navItems: NAV_ITEMS, activeKey: "markets" }));

  assert.equal(
    screen.getByRole("button", { name: "Markets" }).getAttribute("aria-current"),
    "page"
  );
  assert.equal(
    screen.getByRole("button", { name: "Dashboard" }).getAttribute("aria-current"),
    null
  );
});

test("DesktopSidebar item click calls the item's own onClick, supplied entirely by the caller", () => {
  let clicked = false;
  const items = [
    { key: "dashboard", label: "Dashboard", onClick: () => (clicked = true) },
  ];
  render(h(DesktopSidebar, { navItems: items, activeKey: "dashboard" }));

  fireEvent.click(screen.getByRole("button", { name: "Dashboard" }));
  assert.equal(clicked, true);
});

test("DesktopHeader renders only the slots it's given - no invented notification/account UI", () => {
  render(
    h(DesktopHeader, {
      logo: h("span", null, "EXALT"),
      notificationSlot: h("button", null, "Notifications"),
    })
  );

  assert.ok(screen.getByText("EXALT"));
  assert.ok(screen.getByRole("button", { name: "Notifications" }));
  assert.equal(screen.queryByRole("button", { name: "Account" }), null);
});

test("MobileHeader's menu button calls onOpenMenu", () => {
  let opened = false;
  render(
    h(MobileHeader, {
      logo: h("span", null, "EXALT"),
      onOpenMenu: () => (opened = true),
    })
  );

  fireEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));
  assert.equal(opened, true);
});

test("MobileNav is a real Drawer (role=dialog) with the same nav items as the sidebar", () => {
  render(
    h(MobileNav, {
      open: true,
      onClose: () => {},
      navItems: NAV_ITEMS,
      activeKey: "wallets",
    })
  );

  assert.ok(screen.getByRole("dialog"));
  assert.ok(screen.getByRole("button", { name: "Wallets" }));
  assert.equal(
    screen.getByRole("button", { name: "Wallets" }).getAttribute("aria-current"),
    "page"
  );
});

test("MobileNav item click fires the item's onClick AND closes the drawer (onClose)", () => {
  let clicked = false;
  let closed = false;
  const items = [
    { key: "dashboard", label: "Dashboard", onClick: () => (clicked = true) },
  ];

  render(
    h(MobileNav, {
      open: true,
      onClose: () => (closed = true),
      navItems: items,
      activeKey: "dashboard",
    })
  );

  fireEvent.click(screen.getByRole("button", { name: "Dashboard" }));
  assert.equal(clicked, true);
  assert.equal(closed, true);
});

test("AppShell renders children in the content region", () => {
  render(
    h(
      AppShell,
      {
        navItems: NAV_ITEMS,
        activeKey: "dashboard",
        logo: h("span", null, "EXALT"),
      },
      h("p", null, "Dashboard content")
    )
  );

  assert.ok(screen.getByText("Dashboard content"));
});

test("AppShell manages mobile menu open state internally by default - opening via the mobile header opens MobileNav", () => {
  render(
    h(
      AppShell,
      {
        navItems: NAV_ITEMS,
        activeKey: "dashboard",
        logo: h("span", null, "EXALT"),
      },
      "Content"
    )
  );

  assert.equal(screen.queryByRole("dialog"), null);

  fireEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));
  assert.ok(screen.getByRole("dialog"));
});

test("AppShell supports controlled mobileMenuOpen/onMobileMenuOpenChange", () => {
  let openState = false;
  const setOpen = (v) => (openState = v);

  const Wrapper = () => {
    const [open, setOpenState] = React.useState(openState);
    return h(
      AppShell,
      {
        navItems: NAV_ITEMS,
        activeKey: "dashboard",
        logo: h("span", null, "EXALT"),
        mobileMenuOpen: open,
        onMobileMenuOpenChange: (v) => {
          setOpen(v);
          setOpenState(v);
        },
      },
      "Content"
    );
  };

  render(h(Wrapper));
  fireEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));
  assert.equal(openState, true);
});
