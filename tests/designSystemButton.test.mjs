import "./helpers/domTestSetup.js";

import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

import { Button } from "../src/design-system/Button.jsx";

const h = React.createElement;

test.afterEach(() => {
  cleanup();
});

test("renders its label and defaults to the primary variant/medium size", () => {
  render(h(Button, null, "Place Order"));

  const button = screen.getByRole("button", { name: "Place Order" });
  assert.ok(button.className.includes("ex2-btn--primary"));
  assert.ok(button.className.includes("ex2-btn--md"));
  assert.equal(button.disabled, false);
});

test("applies the requested variant and size classes", () => {
  render(h(Button, { variant: "sell", size: "lg" }, "Sell BTC"));

  const button = screen.getByRole("button", { name: "Sell BTC" });
  assert.ok(button.className.includes("ex2-btn--sell"));
  assert.ok(button.className.includes("ex2-btn--lg"));
});

test("falls back to primary/md for an unrecognized variant or size rather than applying no styling class", () => {
  render(
    h(
      Button,
      { variant: "not-a-real-variant", size: "not-a-real-size" },
      "Test"
    )
  );

  const button = screen.getByRole("button", { name: "Test" });
  assert.ok(button.className.includes("ex2-btn--primary"));
  assert.ok(button.className.includes("ex2-btn--md"));
});

test("is disabled and shows aria-busy while loading, and does not fire onClick", () => {
  let clicked = false;
  render(
    h(
      Button,
      { loading: true, onClick: () => (clicked = true) },
      "Submitting"
    )
  );

  const button = screen.getByRole("button", { name: "Submitting" });
  assert.equal(button.disabled, true);
  assert.equal(button.getAttribute("aria-busy"), "true");

  fireEvent.click(button);
  assert.equal(clicked, false);
});

test("respects an explicit disabled prop independent of loading", () => {
  render(h(Button, { disabled: true }, "Unavailable"));

  const button = screen.getByRole("button", { name: "Unavailable" });
  assert.equal(button.disabled, true);
});

test("fires onClick when enabled and not loading", () => {
  let clicked = false;
  render(h(Button, { onClick: () => (clicked = true) }, "Confirm"));

  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  assert.equal(clicked, true);
});

test("is keyboard-focusable (no tabindex removed) - a native <button>, not a styled <div>", () => {
  render(h(Button, null, "Focus me"));

  const button = screen.getByRole("button", { name: "Focus me" });
  assert.equal(button.tagName, "BUTTON");
  assert.equal(button.getAttribute("tabindex"), null); // native buttons need no explicit tabindex
});
