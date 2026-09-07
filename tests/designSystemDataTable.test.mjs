import "./helpers/domTestSetup.js";

import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

import { DataTable } from "../src/design-system/DataTable.jsx";

const h = React.createElement;

test.afterEach(() => {
  cleanup();
});

const COLUMNS = [
  { key: "pair", header: "Pair" },
  { key: "amount", header: "Amount", align: "end", sortable: true },
  { key: "status", header: "Status" },
];

const ROWS = [
  { id: "1", pair: "BTC/USDT", amount: "0.5", status: "FILLED" },
  { id: "2", pair: "ETH/USDT", amount: "2.0", status: "OPEN" },
];

const renderCell = (row, column) => row[column.key];
const getRowKey = (row) => row.id;

test("renders real rows with accessible column headers", () => {
  render(
    h(DataTable, {
      columns: COLUMNS,
      rows: ROWS,
      getRowKey,
      renderCell,
      ariaLabel: "Open orders",
    })
  );

  const table = screen.getByRole("table", { name: "Open orders" });
  assert.ok(table);
  assert.ok(screen.getByText("BTC/USDT"));
  assert.ok(screen.getByText("ETH/USDT"));
  assert.equal(screen.getAllByRole("columnheader").length, 3);
});

test("shows a loading skeleton (not stale/fabricated rows) when loading=true, even if rows were previously populated", () => {
  const { rerender } = render(
    h(DataTable, { columns: COLUMNS, rows: ROWS, getRowKey, renderCell })
  );
  assert.ok(screen.getByText("BTC/USDT"));

  rerender(
    h(DataTable, {
      columns: COLUMNS,
      rows: ROWS,
      getRowKey,
      renderCell,
      loading: true,
    })
  );

  assert.equal(screen.queryByText("BTC/USDT"), null);
  assert.ok(screen.getAllByRole("status").length > 0);
});

test("shows ErrorState with Retry only when onRetry is provided, and error takes priority over rows", () => {
  let retried = false;
  render(
    h(DataTable, {
      columns: COLUMNS,
      rows: ROWS,
      getRowKey,
      renderCell,
      error: "Network request failed",
      onRetry: () => (retried = true),
    })
  );

  assert.equal(screen.queryByText("BTC/USDT"), null);
  assert.ok(screen.getByText("Network request failed"));

  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  assert.equal(retried, true);
});

test("shows the caller-supplied EmptyState title/description when rows is genuinely empty (no fabricated rows)", () => {
  render(
    h(DataTable, {
      columns: COLUMNS,
      rows: [],
      getRowKey,
      renderCell,
      emptyTitle: "No open orders",
      emptyDescription: "Orders you place will appear here.",
    })
  );

  assert.ok(screen.getByText("No open orders"));
  assert.ok(screen.getByText("Orders you place will appear here."));
  assert.equal(screen.queryByRole("row", { name: /BTC/ }), null);
});

test("clicking a sortable column header calls onSortChange with the column key and toggled direction", () => {
  let sortArgs;
  const { rerender } = render(
    h(DataTable, {
      columns: COLUMNS,
      rows: ROWS,
      getRowKey,
      renderCell,
      onSortChange: (key, dir) => (sortArgs = [key, dir]),
    })
  );

  fireEvent.click(screen.getByRole("button", { name: "Amount" }));
  assert.deepEqual(sortArgs, ["amount", "asc"]);

  rerender(
    h(DataTable, {
      columns: COLUMNS,
      rows: ROWS,
      getRowKey,
      renderCell,
      sortKey: "amount",
      sortDirection: "asc",
      onSortChange: (key, dir) => (sortArgs = [key, dir]),
    })
  );

  fireEvent.click(screen.getByRole("button", { name: /Amount/ }));
  assert.deepEqual(sortArgs, ["amount", "desc"]);
});

test("non-sortable columns render as plain text headers, not buttons", () => {
  render(
    h(DataTable, { columns: COLUMNS, rows: ROWS, getRowKey, renderCell })
  );

  assert.equal(screen.queryByRole("button", { name: "Pair" }), null);
  assert.ok(screen.getByText("Pair"));
});

test("row click handler fires with the real row object when onRowClick is provided", () => {
  let clickedRow;
  render(
    h(DataTable, {
      columns: COLUMNS,
      rows: ROWS,
      getRowKey,
      renderCell,
      onRowClick: (row) => (clickedRow = row),
    })
  );

  fireEvent.click(screen.getByText("BTC/USDT").closest("tr"));
  assert.equal(clickedRow.id, "1");
});

test("rowActions renders per-row custom content in an extra actions column", () => {
  render(
    h(DataTable, {
      columns: COLUMNS,
      rows: ROWS,
      getRowKey,
      renderCell,
      rowActions: (row) =>
        h("button", { key: "cancel" }, `Cancel ${row.pair}`),
    })
  );

  assert.ok(screen.getByRole("button", { name: "Cancel BTC/USDT" }));
  assert.ok(screen.getByRole("button", { name: "Cancel ETH/USDT" }));
});
