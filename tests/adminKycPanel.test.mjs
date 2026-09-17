import "./helpers/domTestSetup.js";

import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";

import AdminKycPanel from "../src/components/AdminKycPanel.jsx";

const h = React.createElement;

test.beforeEach(() => {
  window.localStorage.setItem("token", "fake-admin-token");
});

test.afterEach(() => {
  cleanup();
  delete global.fetch;
  window.localStorage.clear();
});

const mockFetchOnce = (response, ok = true, status = 200) => {
  global.fetch = () =>
    Promise.resolve({
      ok,
      status,
      json: () => Promise.resolve(response),
    });
};

/*
  Production bug regression tests: the panel used to do
  `data.kycList || data.kyc || data.requests || []`, silently
  turning ANY failed response into the same empty-list UI a real
  zero-record success would show. These prove the fix distinguishes
  them for real.
*/

test("a successful response with zero records shows 'No KYC requests found', not an error", async () => {
  mockFetchOnce({
    success: true,
    kycList: [],
    page: 1,
    totalPages: 1,
    total: 0,
    statusCounts: { total: 0, pending: 0, approved: 0, rejected: 0 },
  });

  await act(async () => {
    render(h(AdminKycPanel));
    await new Promise((r) => setTimeout(r, 0));
  });

  assert.ok(screen.getByText("No KYC requests found."));
  assert.equal(screen.queryByRole("alert"), null);
});

test("a failed (500) response shows a real error state with Retry, never the empty-list state", async () => {
  mockFetchOnce(
    { success: false, message: "Sort exceeded memory limit" },
    false,
    500
  );

  await act(async () => {
    render(h(AdminKycPanel));
    await new Promise((r) => setTimeout(r, 0));
  });

  assert.ok(screen.getByRole("alert"));
  assert.ok(screen.getByText(/Sort exceeded memory limit/));
  assert.ok(screen.getByRole("button", { name: "Retry" }));
  assert.equal(screen.queryByText("No KYC requests found."), null);
});

test("a network-level failure (fetch throws) also shows the error state, not an empty list", async () => {
  global.fetch = () => Promise.reject(new Error("Network error"));

  await act(async () => {
    render(h(AdminKycPanel));
    await new Promise((r) => setTimeout(r, 0));
  });

  assert.ok(screen.getByRole("alert"));
  assert.equal(screen.queryByText("No KYC requests found."), null);
});

test("Retry re-issues the request", async () => {
  let callCount = 0;
  global.fetch = () => {
    callCount += 1;
    if (callCount === 1) {
      return Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ success: false, message: "fail" }),
      });
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          success: true,
          kycList: [],
          page: 1,
          totalPages: 1,
          total: 0,
          statusCounts: { total: 0, pending: 0, approved: 0, rejected: 0 },
        }),
    });
  };

  await act(async () => {
    render(h(AdminKycPanel));
    await new Promise((r) => setTimeout(r, 0));
  });

  assert.ok(screen.getByRole("alert"));

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await new Promise((r) => setTimeout(r, 0));
  });

  assert.ok(screen.getByText("No KYC requests found."));
  assert.equal(callCount, 2);
});

test("real records render with stats from the backend's aggregate statusCounts, not derived from the current page alone", async () => {
  mockFetchOnce({
    success: true,
    kycList: [
      {
        _id: "kyc1",
        fullName: "Jane Doe",
        email: "jane@example.com",
        status: "pending",
        country: "PK",
        idType: "CNIC",
        idNumber: "123",
      },
    ],
    page: 1,
    totalPages: 5,
    total: 100,
    statusCounts: { total: 100, pending: 40, approved: 50, rejected: 10 },
  });

  await act(async () => {
    render(h(AdminKycPanel));
    await new Promise((r) => setTimeout(r, 0));
  });

  assert.ok(screen.getByText("Jane Doe"));
  assert.ok(screen.getByText("Total: 100"));
  assert.ok(screen.getByText("Pending: 40"));
  assert.ok(screen.getByText("Page 1 of 5"));
});

test("documents are not fetched until 'View Documents' is clicked - not loaded upfront with the list", async () => {
  let detailFetchCount = 0;

  global.fetch = (url) => {
    if (String(url).includes("/admin/all")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            success: true,
            kycList: [
              {
                _id: "kyc1",
                fullName: "Jane Doe",
                email: "jane@example.com",
                status: "pending",
              },
            ],
            page: 1,
            totalPages: 1,
            total: 1,
            statusCounts: { total: 1, pending: 1, approved: 0, rejected: 0 },
          }),
      });
    }

    detailFetchCount += 1;
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          success: true,
          kyc: { cnicFront: "data:image/jpeg;base64,AAAA" },
        }),
    });
  };

  await act(async () => {
    render(h(AdminKycPanel));
    await new Promise((r) => setTimeout(r, 0));
  });

  assert.equal(detailFetchCount, 0);

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "View Documents" }));
    await new Promise((r) => setTimeout(r, 0));
  });

  assert.equal(detailFetchCount, 1);
  assert.ok(screen.getByRole("link", { name: "View CNIC Front" }));
});
