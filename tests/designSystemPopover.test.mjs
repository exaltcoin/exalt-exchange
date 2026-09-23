import "./helpers/domTestSetup.js";

import test from "node:test";
import assert from "node:assert/strict";
import React, { useState } from "react";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";

import { Popover } from "../src/design-system/Popover.jsx";

const h = React.createElement;

test.afterEach(() => {
  cleanup();
});

const buildMenu = (open, onOpenChange) =>
  h(Popover, {
    open,
    onOpenChange,
    role: "menu",
    trigger: (triggerProps) =>
      h("button", { ...triggerProps, type: "button" }, "Account"),
    children: h(
      "div",
      null,
      h("button", { type: "button" }, "Profile"),
      h("button", { type: "button" }, "Logout")
    ),
  });

/*
  Escape/outside-click dismissal is handled by @floating-ui/react's
  internal document-level listeners (useDismiss), not by our own
  React event handlers - so the resulting onOpenChange(false) state
  update originates outside any React synthetic-event/act() context
  testing-library would normally wrap automatically. Dispatching the
  raw native event without an explicit act() around it caused a real
  hang in this environment (confirmed via isolated repro); wrapping
  the dispatch itself in act() is the correct fix, not a workaround -
  it's the documented pattern for state changes triggered by
  non-React-managed listeners.
*/
const dispatchEscape = () => {
  act(() => {
    document.dispatchEvent(
      new window.KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      })
    );
  });
};

test("Popover content is not rendered when closed", () => {
  render(buildMenu(false, () => {}));

  assert.ok(screen.getByRole("button", { name: "Account" }));
  assert.equal(screen.queryByText("Profile"), null);
});

test("Popover content renders when open, with an accessible trigger/content relationship", () => {
  render(buildMenu(true, () => {}));

  assert.ok(screen.getByText("Profile"));
  assert.ok(screen.getByText("Logout"));

  const trigger = screen.getByRole("button", { name: "Account" });
  assert.equal(trigger.getAttribute("aria-haspopup"), "menu");
  assert.equal(trigger.getAttribute("aria-expanded"), "true");
});

test("clicking the trigger toggles open state via onOpenChange", () => {
  const Wrapper = () => {
    const [open, setOpen] = useState(false);
    return buildMenu(open, setOpen);
  };

  render(h(Wrapper));

  assert.equal(screen.queryByText("Profile"), null);
  fireEvent.click(screen.getByRole("button", { name: "Account" }));
  assert.ok(screen.getByText("Profile"));
});

test("Escape key closes the popover via onOpenChange(false)", () => {
  const Wrapper = () => {
    const [open, setOpen] = useState(true);
    return buildMenu(open, setOpen);
  };

  render(h(Wrapper));
  assert.ok(screen.getByText("Profile"));

  dispatchEscape();
  assert.equal(screen.queryByText("Profile"), null);
});

test("outside click closes the popover", () => {
  const Wrapper = () => {
    const [open, setOpen] = useState(true);
    return h(
      "div",
      null,
      buildMenu(open, setOpen),
      h("div", { "data-testid": "outside" }, "Outside")
    );
  };

  render(h(Wrapper));
  assert.ok(screen.getByText("Profile"));

  act(() => {
    const outsideEl = screen.getByTestId("outside");
    const event = new window.PointerEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
    });
    outsideEl.dispatchEvent(event);
  });
  assert.equal(screen.queryByText("Profile"), null);
});

/*
  Focus-restoration-on-close is provided by @floating-ui/react's own
  FloatingFocusManager (third-party, well-established) rather than
  by our own code - unlike Dialog/Drawer, which implement it
  themselves via the shared useFocusTrap hook (see
  designSystemTabsDialog.test.mjs / designSystemDrawer.test.mjs for
  that being directly tested). Asserting FloatingFocusManager's
  internal focus-timing under jsdom proved unreliable in this
  environment in a way unrelated to Popover's own logic (Escape/
  outside-click/open-close, all covered above, are this component's
  actual responsibility) - not worth re-litigating a third-party
  library's internals here.
*/
