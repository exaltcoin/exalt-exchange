import "./helpers/domTestSetup.js";

import test from "node:test";
import assert from "node:assert/strict";
import React, { useState } from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

import { Tabs } from "../src/design-system/Tabs.jsx";
import { Dialog } from "../src/design-system/Dialog.jsx";

const h = React.createElement;

test.afterEach(() => {
  cleanup();
});

const TABS = [
  { id: "open", label: "Open Orders" },
  { id: "filled", label: "Filled" },
  { id: "cancelled", label: "Cancelled", disabled: true },
];

test("Tabs renders proper ARIA tablist/tab roles and marks the active tab selected", () => {
  render(h(Tabs, { tabs: TABS, activeId: "open", onChange: () => {} }));

  assert.ok(screen.getByRole("tablist"));
  const openTab = screen.getByRole("tab", { name: "Open Orders" });
  assert.equal(openTab.getAttribute("aria-selected"), "true");
  const filledTab = screen.getByRole("tab", { name: "Filled" });
  assert.equal(filledTab.getAttribute("aria-selected"), "false");
});

test("Tabs disabled tab cannot be clicked into and is marked disabled", () => {
  let called = false;
  render(
    h(Tabs, { tabs: TABS, activeId: "open", onChange: () => (called = true) })
  );

  const disabledTab = screen.getByRole("tab", { name: "Cancelled" });
  assert.equal(disabledTab.disabled, true);
  fireEvent.click(disabledTab);
  assert.equal(called, false);
});

test("Tabs ArrowRight moves selection to the next enabled tab, skipping disabled ones", () => {
  const Wrapper = () => {
    const [active, setActive] = useState("open");
    return h(Tabs, { tabs: TABS, activeId: active, onChange: setActive });
  };

  render(h(Wrapper));

  const openTab = screen.getByRole("tab", { name: "Open Orders" });
  openTab.focus();
  fireEvent.keyDown(openTab, { key: "ArrowRight" });

  const filledTab = screen.getByRole("tab", { name: "Filled" });
  assert.equal(filledTab.getAttribute("aria-selected"), "true");
});

test("Tabs clicking a tab calls onChange with that tab's id", () => {
  let selected;
  render(
    h(Tabs, { tabs: TABS, activeId: "open", onChange: (id) => (selected = id) })
  );

  fireEvent.click(screen.getByRole("tab", { name: "Filled" }));
  assert.equal(selected, "filled");
});

test("Dialog does not render anything when open=false", () => {
  render(
    h(Dialog, { open: false, onClose: () => {}, title: "Confirm" }, "Body")
  );

  assert.equal(screen.queryByRole("dialog"), null);
});

test("Dialog renders with role=dialog and aria-modal when open, and moves focus inside", () => {
  render(
    h(
      Dialog,
      { open: true, onClose: () => {}, title: "Confirm withdrawal" },
      h("button", null, "Confirm")
    )
  );

  const dialog = screen.getByRole("dialog");
  assert.equal(dialog.getAttribute("aria-modal"), "true");

  // focus should have moved into the dialog (first focusable element)
  // synchronously as part of render()'s own act() flushing of effects
  assert.ok(dialog.contains(document.activeElement));
});

test("Dialog Escape key calls onClose when dismissOnEscape is true (default)", () => {
  let closed = false;
  render(
    h(
      Dialog,
      { open: true, onClose: () => (closed = true), title: "Confirm" },
      "Body"
    )
  );

  fireEvent.keyDown(document, { key: "Escape" });
  assert.equal(closed, true);
});

test("Dialog Escape does NOT close when dismissOnEscape=false (security-sensitive confirmations)", () => {
  let closed = false;
  render(
    h(
      Dialog,
      {
        open: true,
        onClose: () => (closed = true),
        title: "Withdraw 5000 USDT",
        dismissOnEscape: false,
      },
      "Body"
    )
  );

  fireEvent.keyDown(document, { key: "Escape" });
  assert.equal(closed, false);
});

test("Dialog backdrop click calls onClose by default", () => {
  let closed = false;
  render(
    h(
      Dialog,
      { open: true, onClose: () => (closed = true), title: "Confirm" },
      "Body"
    )
  );

  const overlay = document.querySelector(".ex2-dialog-overlay");
  fireEvent.mouseDown(overlay);
  assert.equal(closed, true);
});

test("Dialog backdrop click does NOT close when dismissOnBackdrop=false", () => {
  let closed = false;
  render(
    h(
      Dialog,
      {
        open: true,
        onClose: () => (closed = true),
        title: "Withdraw",
        dismissOnBackdrop: false,
      },
      "Body"
    )
  );

  const overlay = document.querySelector(".ex2-dialog-overlay");
  fireEvent.mouseDown(overlay);
  assert.equal(closed, false);
});

test("Dialog close (×) button calls onClose", () => {
  let closed = false;
  render(
    h(
      Dialog,
      { open: true, onClose: () => (closed = true), title: "Confirm" },
      "Body"
    )
  );

  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  assert.equal(closed, true);
});

test("Dialog locks background scroll while open and restores it on close", () => {
  const { rerender } = render(
    h(Dialog, { open: true, onClose: () => {}, title: "Confirm" }, "Body")
  );

  assert.equal(document.body.style.overflow, "hidden");

  rerender(
    h(Dialog, { open: false, onClose: () => {}, title: "Confirm" }, "Body")
  );

  assert.notEqual(document.body.style.overflow, "hidden");
});

test("Dialog Tab key cycles focus within the dialog (does not escape to background)", () => {
  render(
    h(
      Dialog,
      { open: true, onClose: () => {}, title: "Confirm" },
      [
        h("button", { key: "a" }, "First"),
        h("button", { key: "b" }, "Last"),
      ]
    )
  );

  // The dialog's own Close (x) button is the first focusable element
  // in DOM order, ahead of the caller's own "First"/"Last" buttons.
  const closeButton = screen.getByRole("button", { name: "Close" });
  const last = screen.getByRole("button", { name: "Last" });

  last.focus();
  assert.equal(document.activeElement, last);

  const event = new window.KeyboardEvent("keydown", {
    key: "Tab",
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);

  assert.equal(document.activeElement, closeButton);
});
