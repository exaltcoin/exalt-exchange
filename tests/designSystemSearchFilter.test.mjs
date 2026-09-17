import "./helpers/domTestSetup.js";

import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

import { SearchInput } from "../src/design-system/SearchInput.jsx";
import { FilterBar } from "../src/design-system/FilterBar.jsx";

const h = React.createElement;

test.afterEach(() => {
  cleanup();
});

test("SearchInput is a controlled input - value comes from the caller, onChange reports new value", () => {
  let value = "";
  render(
    h(SearchInput, {
      value,
      onChange: (e) => (value = e.target.value),
      ariaLabel: "Search markets",
    })
  );

  fireEvent.change(screen.getByLabelText("Search markets"), {
    target: { value: "BTC" },
  });
  assert.equal(value, "BTC");
});

test("SearchInput shows a clear button only when there is a value, and calls onClear", () => {
  let cleared = false;
  const { rerender } = render(
    h(SearchInput, {
      value: "",
      onChange: () => {},
      onClear: () => (cleared = true),
      ariaLabel: "Search",
    })
  );

  assert.equal(screen.queryByRole("button", { name: "Clear search" }), null);

  rerender(
    h(SearchInput, {
      value: "BTC",
      onChange: () => {},
      onClear: () => (cleared = true),
      ariaLabel: "Search",
    })
  );

  fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
  assert.equal(cleared, true);
});

test("SearchInput shows a loading spinner instead of the clear button while loading=true", () => {
  const { container } = render(
    h(SearchInput, {
      value: "BTC",
      onChange: () => {},
      loading: true,
      ariaLabel: "Search",
    })
  );

  assert.equal(screen.queryByRole("button", { name: "Clear search" }), null);
  assert.ok(container.querySelector(".ex2-search__spinner"));
});

test("SearchInput disabled state disables the underlying input", () => {
  render(
    h(SearchInput, {
      value: "",
      onChange: () => {},
      disabled: true,
      ariaLabel: "Search",
    })
  );

  assert.equal(screen.getByLabelText("Search").disabled, true);
});

const FILTERS = [
  {
    key: "status",
    label: "Status",
    value: "all",
    onChange: () => {},
    options: [
      { value: "all", label: "All statuses" },
      { value: "FILLED", label: "Filled" },
    ],
  },
];

test("FilterBar renders each filter as a labeled select, controlled by the caller", () => {
  let changed;
  render(
    h(FilterBar, {
      filters: [
        {
          ...FILTERS[0],
          onChange: (v) => (changed = v),
        },
      ],
    })
  );

  const select = screen.getByLabelText("Status");
  fireEvent.change(select, { target: { value: "FILLED" } });
  assert.equal(changed, "FILLED");
});

test("FilterBar shows active-filter chips only when supplied, and Reset only when there are active chips", () => {
  const { rerender } = render(h(FilterBar, { filters: FILTERS }));
  assert.equal(screen.queryByText("Reset filters"), null);

  rerender(
    h(FilterBar, {
      filters: FILTERS,
      activeChips: [{ key: "status", label: "Status: Filled" }],
      onReset: () => {},
    })
  );

  assert.ok(screen.getByText("Status: Filled"));
  assert.ok(screen.getByText("Reset filters"));
});

test("FilterBar chip remove button calls onRemoveChip with the chip's key", () => {
  let removedKey;
  render(
    h(FilterBar, {
      filters: FILTERS,
      activeChips: [{ key: "status", label: "Status: Filled" }],
      onRemoveChip: (key) => (removedKey = key),
    })
  );

  fireEvent.click(
    screen.getByRole("button", { name: "Remove filter: Status: Filled" })
  );
  assert.equal(removedKey, "status");
});

test("FilterBar Reset button calls onReset", () => {
  let resetCalled = false;
  render(
    h(FilterBar, {
      filters: FILTERS,
      activeChips: [{ key: "status", label: "Status: Filled" }],
      onReset: () => (resetCalled = true),
    })
  );

  fireEvent.click(screen.getByText("Reset filters"));
  assert.equal(resetCalled, true);
});
