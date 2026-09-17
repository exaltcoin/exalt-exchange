import "./helpers/domTestSetup.js";

import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { render, screen, cleanup, act } from "@testing-library/react";

import {
  normalizeTheme,
  readThemeFromStorage,
  saveThemeToStorage,
  applyThemeToDocument,
  THEME_STORAGE_KEY,
  DEFAULT_THEME,
} from "../src/design-system/theme.js";

import {
  ThemeProvider,
  useTheme,
} from "../src/design-system/ThemeProvider.jsx";

const h = React.createElement;

test.beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

test.afterEach(() => {
  cleanup();
});

test("normalizeTheme accepts only dark/light and defaults unknown values to dark", () => {
  assert.equal(normalizeTheme("light"), "light");
  assert.equal(normalizeTheme("dark"), "dark");
  assert.equal(normalizeTheme("LIGHT"), "light");
  assert.equal(normalizeTheme("neon"), DEFAULT_THEME);
  assert.equal(normalizeTheme(undefined), DEFAULT_THEME);
});

test("saveThemeToStorage persists under the canonical key and readThemeFromStorage reads it back", () => {
  saveThemeToStorage("light");
  assert.equal(
    window.localStorage.getItem(THEME_STORAGE_KEY),
    "light"
  );
  assert.equal(readThemeFromStorage(), "light");
});

test("applyThemeToDocument sets data-theme on the document root", () => {
  applyThemeToDocument("light");
  assert.equal(
    document.documentElement.getAttribute("data-theme"),
    "light"
  );
});

test("ThemeProvider exposes current theme via useTheme and defaults to a valid theme with no crash", () => {
  const Reader = () => {
    const { theme } = useTheme();
    return h("span", { "data-testid": "theme-value" }, theme);
  };

  render(h(ThemeProvider, null, h(Reader)));

  const value = screen.getByTestId("theme-value").textContent;
  assert.ok(value === "dark" || value === "light");
});

test("toggleTheme flips the theme, updates the DOM attribute, and persists the choice", () => {
  let api;
  const Reader = () => {
    api = useTheme();
    return h("span", { "data-testid": "theme-value" }, api.theme);
  };

  render(h(ThemeProvider, null, h(Reader)));

  const before = screen.getByTestId("theme-value").textContent;

  act(() => {
    api.toggleTheme();
  });

  const after = screen.getByTestId("theme-value").textContent;
  assert.notEqual(before, after);
  assert.equal(
    document.documentElement.getAttribute("data-theme"),
    after
  );
  assert.equal(
    window.localStorage.getItem(THEME_STORAGE_KEY),
    after
  );
});

test("setTheme sets an explicit theme rather than toggling", () => {
  let api;
  const Reader = () => {
    api = useTheme();
    return null;
  };

  render(h(ThemeProvider, null, h(Reader)));

  act(() => {
    api.setTheme("light");
  });
  assert.equal(api.theme, "light");

  act(() => {
    api.setTheme("light");
  });
  assert.equal(api.theme, "light");
});

test("useTheme throws a clear error when used outside a ThemeProvider", () => {
  const Reader = () => {
    useTheme();
    return null;
  };

  const originalError = console.error;
  console.error = () => {};

  assert.throws(() => {
    render(h(Reader));
  }, /useTheme must be used within a ThemeProvider/);

  console.error = originalError;
});
