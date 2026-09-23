import "./helpers/domTestSetup.js";

import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

import { Drawer } from "../src/design-system/Drawer.jsx";

const h = React.createElement;

test.afterEach(() => {
  cleanup();
});

test("Drawer does not render when open=false", () => {
  render(h(Drawer, { open: false, onClose: () => {} }, "Body"));
  assert.equal(screen.queryByRole("dialog"), null);
});

test("Drawer renders with role=dialog/aria-modal and defaults to side=end", () => {
  render(
    h(Drawer, { open: true, onClose: () => {}, title: "Filters" }, "Body")
  );

  const dialog = screen.getByRole("dialog");
  assert.equal(dialog.getAttribute("aria-modal"), "true");
  assert.ok(document.querySelector(".ex2-drawer--end"));
});

test("Drawer side=bottom applies the mobile-sheet class", () => {
  render(
    h(Drawer, { open: true, onClose: () => {}, side: "bottom" }, "Body")
  );

  assert.ok(document.querySelector(".ex2-drawer--bottom"));
});

test("Drawer Escape key calls onClose", () => {
  let closed = false;
  render(
    h(Drawer, { open: true, onClose: () => (closed = true), title: "Menu" }, "Body")
  );

  const event = new window.KeyboardEvent("keydown", {
    key: "Escape",
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);
  assert.equal(closed, true);
});

test("Drawer close (x) button calls onClose", () => {
  let closed = false;
  render(
    h(Drawer, { open: true, onClose: () => (closed = true), title: "Menu" }, "Body")
  );

  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  assert.equal(closed, true);
});

test("Drawer backdrop click calls onClose", () => {
  let closed = false;
  render(
    h(Drawer, { open: true, onClose: () => (closed = true) }, "Body")
  );

  fireEvent.mouseDown(document.querySelector(".ex2-drawer-overlay"));
  assert.equal(closed, true);
});

test("Drawer locks and restores background scroll", () => {
  const { rerender } = render(
    h(Drawer, { open: true, onClose: () => {} }, "Body")
  );
  assert.equal(document.body.style.overflow, "hidden");

  rerender(h(Drawer, { open: false, onClose: () => {} }, "Body"));
  assert.notEqual(document.body.style.overflow, "hidden");
});

test("Drawer moves focus inside on open", () => {
  render(
    h(Drawer, { open: true, onClose: () => {} }, h("button", null, "Apply"))
  );

  const dialog = screen.getByRole("dialog");
  assert.ok(dialog.contains(document.activeElement));
});
