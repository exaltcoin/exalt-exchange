import "./helpers/domTestSetup.js";

import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";

import {
  PageContainer,
  Section,
  Toolbar,
  Stack,
  Grid,
  SplitPane,
  DesktopOnly,
  MobileOnly,
} from "../src/design-system/Layout.jsx";

const h = React.createElement;

test.afterEach(() => {
  cleanup();
});

test("PageContainer applies a configurable max-width via CSS variable and renders children", () => {
  const { container } = render(
    h(PageContainer, { maxWidth: "960px" }, h("p", null, "Content"))
  );

  assert.ok(screen.getByText("Content"));
  const el = container.querySelector(".ex2-page-container");
  assert.equal(el.style.getPropertyValue("--ex2-page-max-width"), "960px");
});

test("Section renders a title as a real heading element (accessible landmark structure), not a styled div", () => {
  render(h(Section, { title: "Recent Activity" }, h("p", null, "Nothing yet")));

  const heading = screen.getByRole("heading", { name: "Recent Activity" });
  assert.equal(heading.tagName, "H2");
});

test("Section supports an alternate heading level via the `as` prop", () => {
  render(h(Section, { title: "Sub Section", as: "h3" }, "Body"));

  const heading = screen.getByRole("heading", { name: "Sub Section" });
  assert.equal(heading.tagName, "H3");
});

test("Section renders no header row at all when neither title nor action is given (no empty wrapper)", () => {
  const { container } = render(h(Section, null, "Just content"));

  assert.equal(container.querySelector(".ex2-section__header"), null);
});

test("Section renders an optional action alongside the title", () => {
  render(
    h(
      Section,
      { title: "Open Orders", action: h("button", null, "View All") },
      "Body"
    )
  );

  assert.ok(screen.getByRole("heading", { name: "Open Orders" }));
  assert.ok(screen.getByRole("button", { name: "View All" }));
});

test("Toolbar renders its children in a wrapping row", () => {
  render(
    h(Toolbar, null, [
      h("button", { key: "a" }, "Filter"),
      h("button", { key: "b" }, "Export"),
    ])
  );

  assert.ok(screen.getByRole("button", { name: "Filter" }));
  assert.ok(screen.getByRole("button", { name: "Export" }));
});

test("Stack applies flex-direction and a token-based gap, defaulting to column", () => {
  const { container } = render(h(Stack, null, "Content"));
  const el = container.querySelector(".ex2-stack");
  assert.equal(el.style.flexDirection, "column");
  assert.equal(el.style.gap, "var(--ex2-space-3)");
});

test("Stack direction=row and a custom gap are applied", () => {
  const { container } = render(
    h(Stack, { direction: "row", gap: "2" }, "Content")
  );
  const el = container.querySelector(".ex2-stack");
  assert.equal(el.style.flexDirection, "row");
  assert.equal(el.style.gap, "var(--ex2-space-2)");
});

test("Grid applies an auto-fill grid-template-columns based on minItemWidth", () => {
  const { container } = render(
    h(Grid, { minItemWidth: "180px" }, h("div", null, "Item"))
  );
  const el = container.querySelector(".ex2-grid");
  assert.ok(el.style.gridTemplateColumns.includes("180px"));
});

test("SplitPane renders both start and end regions", () => {
  render(
    h(SplitPane, {
      start: h("div", null, "Chart"),
      end: h("div", null, "Trade Form"),
    })
  );

  assert.ok(screen.getByText("Chart"));
  assert.ok(screen.getByText("Trade Form"));
});

test("DesktopOnly and MobileOnly both render their children (actual show/hide is CSS-driven, not conditional rendering, so content stays in the DOM for either)", () => {
  render(h("div", null, [
    h(DesktopOnly, { key: "d" }, "Desktop content"),
    h(MobileOnly, { key: "m" }, "Mobile content"),
  ]));

  assert.ok(screen.getByText("Desktop content"));
  assert.ok(screen.getByText("Mobile content"));
});
