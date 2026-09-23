import "./helpers/domTestSetup.js";

import test from "node:test";
import assert from "node:assert/strict";

import {
  applyThemeToDocument,
  readThemeFromStorage,
  saveThemeToStorage,
  THEME_STORAGE_KEY,
  DEFAULT_THEME,
} from "../src/design-system/theme.js";

test.beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

test("main.jsx's synchronous pre-mount sequence: readThemeFromStorage + applyThemeToDocument sets data-theme before any React render would occur", () => {
  saveThemeToStorage("light");
  // Simulate exactly what main.jsx does at module top-level, before
  // ReactDOM.createRoot(...).render(...) is ever called.
  applyThemeToDocument(readThemeFromStorage());

  assert.equal(document.documentElement.getAttribute("data-theme"), "light");
});

test("with no persisted preference at all, the synchronous pre-mount call still sets a valid, non-empty data-theme (system/default strategy, never left unset)", () => {
  // no saveThemeToStorage call - simulates a first-time visitor
  applyThemeToDocument(readThemeFromStorage());

  const value = document.documentElement.getAttribute("data-theme");
  assert.ok(value === "dark" || value === "light");
});

test("a persisted theme preference survives being read again on a simulated fresh page load (no reset)", () => {
  saveThemeToStorage("light");

  // simulate a fresh load: a completely new read, independent of
  // any in-memory state
  const themeOnReload = readThemeFromStorage();
  assert.equal(themeOnReload, "light");
});

test("theme storage key is completely distinct from the app's auth token keys (token/user) - verified against apiClient.js's actual keys", () => {
  assert.equal(THEME_STORAGE_KEY, "exalt_theme");
  assert.notEqual(THEME_STORAGE_KEY, "token");
  assert.notEqual(THEME_STORAGE_KEY, "user");
});

test("saving a theme preference does not touch the auth token/user localStorage keys", () => {
  window.localStorage.setItem("token", "fake-jwt-token-value");
  window.localStorage.setItem("user", JSON.stringify({ id: "123" }));

  saveThemeToStorage("light");

  assert.equal(window.localStorage.getItem("token"), "fake-jwt-token-value");
  assert.equal(
    window.localStorage.getItem("user"),
    JSON.stringify({ id: "123" })
  );
});

test("theme storage key is distinct from the language storage key (exalt_exchange_language)", () => {
  assert.notEqual(THEME_STORAGE_KEY, "exalt_exchange_language");
});

test("setting data-theme does not touch the dir attribute (RTL), and setting dir does not touch data-theme - independent attributes", () => {
  document.documentElement.setAttribute("dir", "rtl");
  applyThemeToDocument("light");

  assert.equal(document.documentElement.getAttribute("dir"), "rtl");
  assert.equal(document.documentElement.getAttribute("data-theme"), "light");

  document.documentElement.setAttribute("dir", "ltr");
  assert.equal(document.documentElement.getAttribute("data-theme"), "light");
});
