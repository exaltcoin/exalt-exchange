import "./helpers/domTestSetup.js";

import test from "node:test";
import assert from "node:assert/strict";
import React, { useState } from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

import {
  toNavItem,
  buildShellNavItems,
} from "../src/navigation/buildShellNavItems.js";
import { AppShell } from "../src/design-system/AppShell.jsx";
import { ThemeProvider, useTheme } from "../src/design-system/ThemeProvider.jsx";
import { Button } from "../src/design-system/Button.jsx";

const h = React.createElement;
const identityTranslate = (key, fallback) => fallback;

test.afterEach(() => {
  cleanup();
});

/*
  These tests exercise the REAL functions app.jsx actually calls
  (navigation/buildShellNavItems.js), not a reimplementation of
  them, plus a real rendered AppShell wired the same way app.jsx
  wires it - the closest practical integration coverage without
  mounting the full ~2000-line App component (which makes real
  network calls and reads localStorage on mount).
*/

test("toNavItem parses the existing 'emoji label' tuple format exactly as before (icon/label split, translation, click)", () => {
  let selectedKey;
  const item = toNavItem(
    ["dashboard", "\ud83d\udcca Dashboard"],
    identityTranslate,
    (key) => (selectedKey = key)
  );

  assert.equal(item.key, "dashboard");
  assert.equal(item.icon, "\ud83d\udcca");
  assert.equal(item.label, "Dashboard");

  item.onClick();
  assert.equal(selectedKey, "dashboard");
});

test("buildShellNavItems includes only the base menu when no access flags are set - exact existing gating behavior", () => {
  const items = buildShellNavItems({
    menuItems: [["dashboard", "\ud83d\udcca Dashboard"], ["markets", "\ud83d\udcc8 Markets"]],
    adminMenuItems: [["admin", "\u2699\ufe0f Admin Panel"]],
    ownerMenuItems: [["owner-control", "\ud83d\udc51 Owner Control"]],
    superAdminMenuItems: [["super-admin", "\ud83d\udee1\ufe0f Super Admin"]],
    moderatorMenuItems: [["moderator-panel", "\ud83e\uddf0 Moderator Panel"]],
    access: {},
    translate: identityTranslate,
    onSelect: () => {},
  });

  const keys = items.map((item) => item.key);
  assert.deepEqual(keys, ["dashboard", "markets"]);
});

test("buildShellNavItems includes admin items only when access.admin is true, same for owner/superAdmin/moderator independently", () => {
  const base = {
    menuItems: [["dashboard", "\ud83d\udcca Dashboard"]],
    adminMenuItems: [["admin", "\u2699\ufe0f Admin Panel"]],
    ownerMenuItems: [["owner-control", "\ud83d\udc51 Owner Control"]],
    superAdminMenuItems: [["super-admin", "\ud83d\udee1\ufe0f Super Admin"]],
    moderatorMenuItems: [["moderator-panel", "\ud83e\uddf0 Moderator Panel"]],
    translate: identityTranslate,
    onSelect: () => {},
  };

  const adminOnly = buildShellNavItems({ ...base, access: { admin: true } });
  assert.deepEqual(adminOnly.map((i) => i.key), ["dashboard", "admin"]);

  const ownerOnly = buildShellNavItems({ ...base, access: { owner: true } });
  assert.deepEqual(ownerOnly.map((i) => i.key), ["dashboard", "owner-control"]);

  const all = buildShellNavItems({
    ...base,
    access: { admin: true, owner: true, superAdmin: true, moderator: true },
  });
  assert.deepEqual(all.map((i) => i.key), [
    "dashboard",
    "admin",
    "owner-control",
    "super-admin",
    "moderator-panel",
  ]);
});

test("buildShellNavItems preserves the exact order: base, then admin, then owner, then superAdmin, then moderator", () => {
  const items = buildShellNavItems({
    menuItems: [["a", "1 A"]],
    adminMenuItems: [["b", "2 B"]],
    ownerMenuItems: [["c", "3 C"]],
    superAdminMenuItems: [["d", "4 D"]],
    moderatorMenuItems: [["e", "5 E"]],
    access: { admin: true, owner: true, superAdmin: true, moderator: true },
    translate: identityTranslate,
    onSelect: () => {},
  });

  assert.deepEqual(items.map((i) => i.key), ["a", "b", "c", "d", "e"]);
});

/*
  Real rendered integration: AppShell wired exactly as app.jsx
  wires it (navItems from buildShellNavItems, activeKey = page
  state, mobileMenuOpen = real component state), proving the whole
  pipeline - not just the pure function - works end to end.
*/
test("a real page-state-driven AppShell: selecting a nav item updates page state, mobile menu opens/closes through real state", () => {
  const Wrapper = () => {
    const [page, setPage] = useState("dashboard");
    const [menuOpen, setMenuOpen] = useState(false);

    const navItems = buildShellNavItems({
      menuItems: [
        ["dashboard", "\ud83d\udcca Dashboard"],
        ["markets", "\ud83d\udcc8 Markets"],
      ],
      access: {},
      translate: identityTranslate,
      onSelect: (key) => {
        setPage(key);
        setMenuOpen(false);
      },
    });

    return h(
      AppShell,
      {
        navItems,
        activeKey: page,
        mobileMenuOpen: menuOpen,
        onMobileMenuOpenChange: setMenuOpen,
        logo: h("span", null, "EXALT"),
      },
      h("p", null, `Current page: ${page}`)
    );
  };

  render(h(Wrapper));

  assert.ok(screen.getByText("Current page: dashboard"));

  fireEvent.click(screen.getByRole("button", { name: "Markets" }));
  assert.ok(screen.getByText("Current page: markets"));

  // opening mobile menu uses the same real state
  fireEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));
  assert.ok(screen.getByRole("dialog"));

  // selecting a mobile nav item also updates page state AND closes the menu
  fireEvent.click(
    screen.getAllByRole("button", { name: "Dashboard" }).find((btn) =>
      btn.closest('[role="dialog"]')
    )
  );
  assert.ok(screen.getByText("Current page: dashboard"));
  assert.equal(screen.queryByRole("dialog"), null);
});

test("logout wiring: the accountSlot's real onClick invokes the caller's actual logout function, not a stub", () => {
  let logoutCalled = false;
  const realLogout = () => {
    logoutCalled = true;
  };

  render(
    h(
      AppShell,
      {
        navItems: [],
        activeKey: "dashboard",
        logo: h("span", null, "EXALT"),
        accountSlot: h(
          Button,
          { variant: "ghost", size: "sm", onClick: realLogout },
          "Logout"
        ),
      },
      "Content"
    )
  );

  fireEvent.click(screen.getByRole("button", { name: "Logout" }));
  assert.equal(logoutCalled, true);
});

test("theme toggle wiring: a themeSlot using the real useTheme hook actually changes the real app theme", () => {
  const ThemeToggleButton = () => {
    const { theme, toggleTheme } = useTheme();
    return h(
      Button,
      { variant: "ghost", size: "sm", onClick: toggleTheme },
      theme === "dark" ? "\u2600\ufe0f" : "\ud83c\udf19"
    );
  };

  const Wrapper = () =>
    h(
      ThemeProvider,
      null,
      h(
        AppShell,
        {
          navItems: [],
          activeKey: "dashboard",
          logo: h("span", null, "EXALT"),
          themeSlot: h(ThemeToggleButton),
        },
        "Content"
      )
    );

  render(h(Wrapper));

  // themeSlot renders once in the desktop header and once in the
  // mobile nav footer (both always present, toggled by CSS, not
  // conditional rendering) - both share the same ThemeProvider, so
  // clicking either one flips the real app-wide theme for both.
  const before = document.documentElement.getAttribute("data-theme");
  const [firstToggle] = screen.getAllByRole("button");
  fireEvent.click(firstToggle);
  const after = document.documentElement.getAttribute("data-theme");

  assert.notEqual(before, after);
});

test("notificationSlot and languageSlot render whatever real component the caller supplies - AppShell invents nothing itself", () => {
  render(
    h(
      AppShell,
      {
        navItems: [],
        activeKey: "dashboard",
        logo: h("span", null, "EXALT"),
        notificationSlot: h("div", { className: "real-notification-bell" }, "3 unread"),
        languageSlot: h("div", { className: "real-language-switcher" }, "EN"),
      },
      "Content"
    )
  );

  // Rendered in both the desktop header and mobile nav (see theme
  // toggle test above for why) - assert real content appears at
  // least once, exactly as the caller supplied it, nothing invented.
  const bells = document.querySelectorAll(".real-notification-bell");
  const switchers = document.querySelectorAll(".real-language-switcher");
  assert.ok(bells.length >= 1);
  assert.ok(switchers.length >= 1);
  assert.equal(bells[0].textContent, "3 unread");
  assert.equal(switchers[0].textContent, "EN");
});

test("no navigation item is invented: every rendered item traces back to a tuple the caller supplied, nothing extra appears", () => {
  const menuItems = [
    ["dashboard", "\ud83d\udcca Dashboard"],
    ["markets", "\ud83d\udcc8 Markets"],
    ["wallets", "\ud83d\udc5b Wallets"],
  ];

  const navItems = buildShellNavItems({
    menuItems,
    access: {},
    translate: identityTranslate,
    onSelect: () => {},
  });

  const { container } = render(
    h(
      AppShell,
      { navItems, activeKey: "dashboard", logo: h("span", null, "EXALT") },
      "Content"
    )
  );

  // Scope to the desktop sidebar only (one of the two parallel
  // desktop/mobile renders) to count each real item exactly once.
  const sidebar = document.querySelector(".ex2-shell-sidebar");
  const renderedLabels = Array.from(
    sidebar.querySelectorAll(".ex2-shell-sidebar__item")
  ).map((btn) => btn.textContent.trim());

  const expectedLabels = menuItems.map(([, label]) => label);

  const normalize = (s) => s.replace(/\s+/g, "");

  assert.deepEqual(
    renderedLabels.map(normalize),
    expectedLabels.map(normalize)
  );
});
