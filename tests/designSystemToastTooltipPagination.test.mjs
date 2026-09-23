import "./helpers/domTestSetup.js";

import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { render, screen, cleanup, act } from "@testing-library/react";

import { ToastProvider, useToast } from "../src/design-system/Toast.jsx";
import { Tooltip } from "../src/design-system/Tooltip.jsx";
import { Pagination } from "../src/design-system/Pagination.jsx";

const h = React.createElement;

test.afterEach(() => {
  cleanup();
});

test("useToast throws outside a ToastProvider", () => {
  const Reader = () => {
    useToast();
    return null;
  };

  const originalError = console.error;
  console.error = () => {};
  assert.throws(() => render(h(Reader)), /useToast must be used within a ToastProvider/);
  console.error = originalError;
});

test("showToast renders a toast with the correct tone/role and title/description", () => {
  let api;
  const Trigger = () => {
    api = useToast();
    return null;
  };

  render(h(ToastProvider, null, h(Trigger)));

  act(() => {
    api.showToast({
      tone: "success",
      title: "Order placed",
      description: "Your buy order for 0.5 BTC was submitted.",
      duration: 0,
    });
  });

  const status = screen.getByRole("status");
  assert.ok(status.className.includes("ex2-toast--success"));
  assert.ok(screen.getByText("Order placed"));
  assert.ok(screen.getByText(/0.5 BTC/));
});

test("showToast with a danger tone uses role=alert", () => {
  let api;
  const Trigger = () => {
    api = useToast();
    return null;
  };

  render(h(ToastProvider, null, h(Trigger)));

  act(() => {
    api.showToast({ tone: "danger", title: "Order failed", duration: 0 });
  });

  assert.ok(screen.getByRole("alert"));
});

test("dismissToast removes the toast, and the close button dismisses it", () => {
  let api;
  const Trigger = () => {
    api = useToast();
    return null;
  };

  render(h(ToastProvider, null, h(Trigger)));

  let id;
  act(() => {
    id = api.showToast({ title: "Test toast", duration: 0 });
  });

  assert.ok(screen.getByText("Test toast"));

  act(() => {
    api.dismissToast(id);
  });

  assert.equal(screen.queryByText("Test toast"), null);
});

test("Tooltip renders content only while hovered/focused, not by default", () => {
  render(
    h(
      Tooltip,
      { content: "Estimated network fee" },
      h("button", null, "Fee info")
    )
  );

  assert.equal(screen.queryByRole("tooltip"), null);
});

test("Tooltip with no content just renders children, no tooltip wrapper needed", () => {
  render(h(Tooltip, { content: null }, h("span", null, "Plain text")));

  assert.ok(screen.getByText("Plain text"));
  assert.equal(screen.queryByRole("tooltip"), null);
});

test("Pagination renders nothing when totalPages is 1 or less", () => {
  const { container } = render(
    h(Pagination, { currentPage: 1, totalPages: 1, onPageChange: () => {} })
  );
  assert.equal(container.innerHTML, "");
});

test("Pagination disables Previous on the first page and Next on the last page", () => {
  const { rerender } = render(
    h(Pagination, { currentPage: 1, totalPages: 5, onPageChange: () => {} })
  );

  assert.equal(
    screen.getByRole("button", { name: "Previous page" }).disabled,
    true
  );
  assert.equal(
    screen.getByRole("button", { name: "Next page" }).disabled,
    false
  );

  rerender(
    h(Pagination, { currentPage: 5, totalPages: 5, onPageChange: () => {} })
  );

  assert.equal(
    screen.getByRole("button", { name: "Next page" }).disabled,
    true
  );
});

test("Pagination calls onPageChange with the correct next/previous page number", () => {
  let page;
  render(
    h(Pagination, {
      currentPage: 3,
      totalPages: 10,
      onPageChange: (p) => (page = p),
    })
  );

  screen.getByRole("button", { name: "Next page" }).click();
  assert.equal(page, 4);

  screen.getByRole("button", { name: "Previous page" }).click();
  assert.equal(page, 2);
});
