import "./helpers/domTestSetup.js";

import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";

import { Badge } from "../src/design-system/Badge.jsx";
import { Alert } from "../src/design-system/Alert.jsx";

const h = React.createElement;

test.afterEach(() => {
  cleanup();
});

test("Badge renders children and applies the requested tone class", () => {
  render(h(Badge, { tone: "success" }, "Filled"));

  const badge = screen.getByText("Filled");
  assert.ok(badge.className.includes("ex2-badge--success"));
});

test("Badge falls back to neutral tone for an unrecognized value, never silently blank", () => {
  render(h(Badge, { tone: "not-a-real-tone" }, "Pending"));

  const badge = screen.getByText("Pending");
  assert.ok(badge.className.includes("ex2-badge--neutral"));
});

test("Badge with dot=true renders a dot element alongside the label", () => {
  const { container } = render(h(Badge, { tone: "buy", dot: true }, "Buy"));

  assert.ok(container.querySelector(".ex2-badge__dot"));
  assert.ok(screen.getByText("Buy"));
});

test("Alert uses role=alert for danger/warning tones (assistive tech interrupts for these)", () => {
  render(h(Alert, { tone: "danger" }, "Insufficient balance"));

  const alert = screen.getByRole("alert");
  assert.ok(alert.textContent.includes("Insufficient balance"));
});

test("Alert uses role=status (polite) for info/success tones, not role=alert", () => {
  render(h(Alert, { tone: "success" }, "Order placed"));

  assert.equal(screen.queryByRole("alert"), null);
  assert.ok(screen.getByRole("status"));
});

test("Alert renders an optional title separately from the body", () => {
  render(
    h(
      Alert,
      { tone: "warning", title: "Price deviation" },
      "The order price differs from market price by more than 5%."
    )
  );

  assert.ok(screen.getByText("Price deviation"));
  assert.ok(
    screen.getByText(/differs from market price/)
  );
});
