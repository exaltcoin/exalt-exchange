import "./helpers/domTestSetup.js";

import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

import { FormField } from "../src/design-system/FormField.jsx";
import { Input, AmountInput } from "../src/design-system/Input.jsx";
import { Select } from "../src/design-system/Select.jsx";
import { Checkbox, Switch } from "../src/design-system/Checkbox.jsx";

const h = React.createElement;

test.afterEach(() => {
  cleanup();
});

test("FormField associates label, hint and error via aria-describedby using the render-prop pattern", () => {
  render(
    h(
      FormField,
      { label: "Amount", hint: "In USDT", error: null, required: true },
      (fieldProps) => h(Input, fieldProps)
    )
  );

  const input = screen.getByLabelText(/Amount/);
  assert.ok(input.getAttribute("aria-describedby")?.includes("hint"));
  assert.equal(input.getAttribute("aria-required"), "true");
});

test("FormField shows the error message (role=alert) instead of the hint when both would apply, and never invents error text", () => {
  render(
    h(
      FormField,
      { label: "Withdrawal address", hint: "BEP-20 only", error: "Invalid address format" },
      (fieldProps) => h(Input, fieldProps)
    )
  );

  assert.ok(screen.getByRole("alert").textContent.includes("Invalid address format"));
  assert.equal(screen.queryByText("BEP-20 only"), null);
});

test("Input forwards a ref and marks itself aria-invalid when invalid=true", () => {
  let ref;
  render(
    h(Input, {
      invalid: true,
      "aria-label": "Search",
      ref: (el) => (ref = el),
    })
  );

  const input = screen.getByLabelText("Search");
  assert.equal(input.getAttribute("aria-invalid"), "true");
  assert.equal(ref, input);
});

test("Input disabled state actually disables the underlying <input>", () => {
  render(h(Input, { disabled: true, "aria-label": "Disabled field" }));
  assert.equal(screen.getByLabelText("Disabled field").disabled, true);
});

test("AmountInput accepts a plain integer and calls onChange", () => {
  let value;
  render(
    h(AmountInput, {
      "aria-label": "Amount",
      decimals: 8,
      value: "",
      onChange: (e) => (value = e.target.value),
    })
  );

  fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "100" } });
  assert.equal(value, "100");
});

test("AmountInput rejects a second decimal point / malformed input (never calls onChange for it)", () => {
  let callCount = 0;
  render(
    h(AmountInput, {
      "aria-label": "Amount",
      decimals: 8,
      value: "",
      onChange: () => (callCount += 1),
    })
  );

  fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "1.2.3" } });
  assert.equal(callCount, 0);
});

test("AmountInput enforces the given decimals precision (e.g. decimals=2 rejects a 3rd decimal digit)", () => {
  let lastAccepted = "";
  render(
    h(AmountInput, {
      "aria-label": "Price",
      decimals: 2,
      value: "",
      onChange: (e) => (lastAccepted = e.target.value),
    })
  );

  const input = screen.getByLabelText("Price");
  fireEvent.change(input, { target: { value: "10.12" } });
  assert.equal(lastAccepted, "10.12");

  fireEvent.change(input, { target: { value: "10.123" } });
  // rejected - lastAccepted should remain the previously accepted value
  assert.equal(lastAccepted, "10.12");
});

test("AmountInput renders an optional suffix as an end adornment", () => {
  render(
    h(AmountInput, {
      "aria-label": "Amount",
      suffix: "USDT",
      decimals: 8,
    })
  );

  assert.ok(screen.getByText("USDT"));
});

test("Select renders provided options and forwards onChange", () => {
  let selected;
  render(
    h(
      Select,
      { "aria-label": "Network", onChange: (e) => (selected = e.target.value) },
      [
        h("option", { key: "bep20", value: "BEP20" }, "BEP-20"),
        h("option", { key: "erc20", value: "ERC20" }, "ERC-20"),
      ]
    )
  );

  fireEvent.change(screen.getByLabelText("Network"), { target: { value: "ERC20" } });
  assert.equal(selected, "ERC20");
});

test("Checkbox is a real native checkbox (keyboard/space-toggleable) with an associated label", () => {
  let checked = false;
  render(
    h(Checkbox, {
      id: "agree",
      label: "I agree to the terms",
      checked,
      onChange: () => (checked = !checked),
    })
  );

  const box = screen.getByLabelText("I agree to the terms");
  assert.equal(box.type, "checkbox");
  fireEvent.click(box);
  assert.equal(checked, true);
});

test("Switch uses role=switch on a real checkbox input, not a fake div toggle", () => {
  render(h(Switch, { id: "notif", label: "Email notifications" }));

  const toggle = screen.getByRole("switch", { name: "Email notifications" });
  assert.equal(toggle.tagName, "INPUT");
  assert.equal(toggle.type, "checkbox");
});
