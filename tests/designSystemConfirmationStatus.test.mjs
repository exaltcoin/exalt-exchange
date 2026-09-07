import "./helpers/domTestSetup.js";

import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

import { ConfirmationDialog } from "../src/design-system/ConfirmationDialog.jsx";
import { StatusBadge, getStatusTone } from "../src/design-system/StatusBadge.jsx";

const h = React.createElement;

test.afterEach(() => {
  cleanup();
});

test("ConfirmationDialog renders exactly the rows the caller supplies - no invented fields", () => {
  render(
    h(ConfirmationDialog, {
      open: true,
      onClose: () => {},
      onConfirm: () => {},
      title: "Confirm order",
      rows: [
        { label: "Pair", value: "BTC/USDT" },
        { label: "Amount", value: "0.5 BTC" },
        { label: "Estimated fee", value: "0.001 BTC" },
      ],
    })
  );

  assert.ok(screen.getByText("Pair"));
  assert.ok(screen.getByText("BTC/USDT"));
  assert.ok(screen.getByText("Estimated fee"));
  assert.ok(screen.getByText("0.001 BTC"));
  // No row for e.g. "Network" was supplied - must not appear
  assert.equal(screen.queryByText("Network"), null);
});

test("ConfirmationDialog only calls onConfirm on an explicit button click, never automatically", () => {
  let confirmed = false;
  render(
    h(ConfirmationDialog, {
      open: true,
      onClose: () => {},
      onConfirm: () => (confirmed = true),
      title: "Confirm order",
      rows: [{ label: "Amount", value: "1 ETH" }],
    })
  );

  // mount + a tick, still not confirmed
  assert.equal(confirmed, false);

  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  assert.equal(confirmed, true);
});

test("ConfirmationDialog cancel button calls onClose and not onConfirm", () => {
  let closed = false;
  let confirmed = false;
  render(
    h(ConfirmationDialog, {
      open: true,
      onClose: () => (closed = true),
      onConfirm: () => (confirmed = true),
      title: "Confirm",
      rows: [],
    })
  );

  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  assert.equal(closed, true);
  assert.equal(confirmed, false);
});

test("ConfirmationDialog with tone=danger is NOT dismissible via Escape by default (withdrawal/security safety)", () => {
  let closed = false;
  render(
    h(ConfirmationDialog, {
      open: true,
      onClose: () => (closed = true),
      onConfirm: () => {},
      title: "Withdraw 5000 USDT",
      tone: "danger",
      rows: [{ label: "Amount", value: "5000 USDT" }],
    })
  );

  const event = new window.KeyboardEvent("keydown", {
    key: "Escape",
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);
  assert.equal(closed, false);
});

test("ConfirmationDialog with tone=neutral (default) IS dismissible via Escape", () => {
  let closed = false;
  render(
    h(ConfirmationDialog, {
      open: true,
      onClose: () => (closed = true),
      onConfirm: () => {},
      title: "Cancel order",
      rows: [],
    })
  );

  const event = new window.KeyboardEvent("keydown", {
    key: "Escape",
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);
  assert.equal(closed, true);
});

test("ConfirmationDialog respects an explicit dismissOnEscape override even for tone=danger", () => {
  let closed = false;
  render(
    h(ConfirmationDialog, {
      open: true,
      onClose: () => (closed = true),
      onConfirm: () => {},
      title: "Withdraw",
      tone: "danger",
      dismissOnEscape: true,
      rows: [],
    })
  );

  const event = new window.KeyboardEvent("keydown", {
    key: "Escape",
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);
  assert.equal(closed, true);
});

test("ConfirmationDialog shows a loading Confirm button and disables Cancel while confirming=true", () => {
  render(
    h(ConfirmationDialog, {
      open: true,
      onClose: () => {},
      onConfirm: () => {},
      title: "Withdraw",
      rows: [],
      confirming: true,
    })
  );

  const confirmBtn = screen.getByRole("button", { name: "Confirm" });
  assert.equal(confirmBtn.disabled, true);
  assert.equal(confirmBtn.getAttribute("aria-busy"), "true");

  const cancelBtn = screen.getByRole("button", { name: "Cancel" });
  assert.equal(cancelBtn.disabled, true);
});

test("ConfirmationDialog only renders a warning block when the caller passes one", () => {
  const { rerender } = render(
    h(ConfirmationDialog, {
      open: true,
      onClose: () => {},
      onConfirm: () => {},
      title: "Confirm",
      rows: [],
    })
  );
  assert.equal(screen.queryByRole("alert"), null);

  rerender(
    h(ConfirmationDialog, {
      open: true,
      onClose: () => {},
      onConfirm: () => {},
      title: "Confirm",
      rows: [],
      warning: "Price has moved more than 5% since you opened this form.",
    })
  );
  assert.ok(screen.getByRole("alert").textContent.includes("moved more than 5%"));
});

test("getStatusTone maps known real backend statuses to consistent tones", () => {
  assert.equal(getStatusTone("FILLED"), "success");
  assert.equal(getStatusTone("filled"), "success");
  assert.equal(getStatusTone("Pending"), "warning");
  assert.equal(getStatusTone("REJECTED"), "danger");
  assert.equal(getStatusTone("partially filled"), "info");
});

test("getStatusTone falls back to neutral for an unrecognized status rather than guessing", () => {
  assert.equal(getStatusTone("SOME_FUTURE_STATUS_NOT_YET_MAPPED"), "neutral");
  assert.equal(getStatusTone(undefined), "neutral");
});

test("StatusBadge renders the raw status text by default, never a translated/invented label", () => {
  render(h(StatusBadge, { status: "FILLED" }));
  assert.ok(screen.getByText("FILLED"));
});

test("StatusBadge uses an explicit label override when the caller provides one (e.g. an already-translated string)", () => {
  render(h(StatusBadge, { status: "FILLED", label: "Dolduruldu" }));
  assert.ok(screen.getByText("Dolduruldu"));
  assert.equal(screen.queryByText("FILLED"), null);
});
