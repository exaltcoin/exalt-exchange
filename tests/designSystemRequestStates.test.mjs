import "./helpers/domTestSetup.js";

import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

import { Skeleton, SkeletonText } from "../src/design-system/Skeleton.jsx";
import {
  EmptyState,
  ErrorState,
  MaintenanceState,
} from "../src/design-system/RequestStates.jsx";

const h = React.createElement;

test.afterEach(() => {
  cleanup();
});

test("Skeleton is hidden from assistive tech (it represents absence of real data, not content)", () => {
  const { container } = render(h(Skeleton, { width: "80px" }));

  const el = container.querySelector(".ex2-skeleton");
  assert.equal(el.getAttribute("aria-hidden"), "true");
});

test("SkeletonText renders the requested number of lines and announces a loading status once, not per-line", () => {
  const { container } = render(h(SkeletonText, { lines: 4 }));

  const lines = container.querySelectorAll(".ex2-skeleton");
  assert.equal(lines.length, 4);
  assert.equal(screen.getAllByRole("status").length, 1);
});

test("EmptyState renders only what the caller explicitly provides - no invented copy", () => {
  render(
    h(EmptyState, {
      title: "No open orders",
      description: "Orders you place will appear here.",
    })
  );

  assert.ok(screen.getByText("No open orders"));
  assert.ok(screen.getByText("Orders you place will appear here."));
});

test("EmptyState renders nothing extra when only a title is given (no fabricated description)", () => {
  const { container } = render(h(EmptyState, { title: "No results" }));

  assert.ok(screen.getByText("No results"));
  assert.equal(
    container.querySelector(".ex2-request-state__description"),
    null
  );
});

test("ErrorState uses role=alert and only shows a Retry action when onRetry is actually provided", () => {
  const { rerender } = render(
    h(ErrorState, { title: "Failed to load orders" })
  );

  assert.ok(screen.getByRole("alert"));
  assert.equal(screen.queryByRole("button", { name: "Retry" }), null);

  let retried = false;
  rerender(
    h(ErrorState, {
      title: "Failed to load orders",
      onRetry: () => (retried = true),
    })
  );

  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  assert.equal(retried, true);
});

test("ErrorState shows the retry button in a loading state while retrying, and disables it", () => {
  render(
    h(ErrorState, {
      title: "Failed to load orders",
      onRetry: () => {},
      retrying: true,
    })
  );

  const button = screen.getByRole("button", { name: "Retry" });
  assert.equal(button.disabled, true);
});

test("MaintenanceState marks the module as Unavailable and uses role=status, not role=alert", () => {
  render(
    h(MaintenanceState, {
      title: "Futures trading is temporarily disabled",
      description: "Real execution infrastructure is not yet connected.",
    })
  );

  assert.ok(screen.getByText("Unavailable"));
  assert.ok(screen.getByRole("status"));
  assert.equal(screen.queryByRole("alert"), null);
});
