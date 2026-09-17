import test from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { register } from "node:module";
import "./helpers/domTestSetup.js";
import React from "react";
import { render, screen, fireEvent, waitFor, cleanup, within, act } from "@testing-library/react";

register("./helpers/jsxLoader.mjs", import.meta.url);
// Isolate the Vite-only translation loader; keep real components, capability
// gating, API wrappers and DOM events. Only network requests are controlled.
register(`data:text/javascript,${encodeURIComponent(`
export async function resolve(specifier, context, next) {
  if (specifier === 'socket.io-client') return { url: 'data:text/javascript,export const io = () => ({ disconnect() {} });', shortCircuit: true };
  if (/\\/i18n(?:\\/index\\.js)?$/.test(specifier)) return { url: 'data:text/javascript,export const useI18n = () => ({ t: (key, options) => options?.defaultValue || key });', shortCircuit: true };
  try { return await next(specifier, context); } catch (error) {
    if (specifier.startsWith('.') && !/\\.[a-z]+$/.test(specifier)) return next(specifier + '.js', context);
    throw error;
  }
}
export async function load(url, context, next) {
  const result = await next(url, context);
  if (url.endsWith('/lib/apiClient.js')) return { ...result, source: String(result.source).replaceAll('import.meta.env', '({})') };
  return result;
}`)}`, import.meta.url);

const panelUrl = new URL("../src/features/earnedExalt/EarnedExaltPanel.jsx", import.meta.url);
async function panel() {
  assert.equal(await access(panelUrl).then(() => true, () => false), true, "Earned EXALT panel must exist");
  return (await import(panelUrl)).default;
}

const summary = (accepted = false) => ({
  success: true,
  totalEarned: 103, totalLocked: 61, totalVested: 42, totalClaimed: 13, totalClaimable: 29,
  allocations: [{
    allocationId: "allocation-1", campaignId: "campaign-1", totalAmount: 103,
    lockedAmount: 61, vestedAmount: 42, claimedAmount: 13, claimableAmount: 29,
    startAt: "2026-01-01T00:00:00.000Z", cliffAt: "2026-02-01T00:00:00.000Z",
    endAt: "2027-01-01T00:00:00.000Z", intervalDays: 30, status: "active",
    campaign: { name: "Contributor grant", status: "active", termsVersion: "v3", termsContent: "Current campaign terms from the server.", termsAccepted: accepted },
  }],
});

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

async function renderPanel(request) {
  const Panel = await panel();
  return render(React.createElement(Panel, { api: createEarnedExaltApi(request) }));
}

test.afterEach(() => cleanup());

import {
  createEarnedExaltApi,
} from "../src/features/earnedExalt/earnedExaltApi.js";
import {
  isStepUpUsable,
  newIdempotencyKey,
  validateClaimAmount,
} from "../src/features/earnedExalt/earnedExaltState.js";

function recordingApi() {
  const calls = [];
  return {
    calls,
    request: async (path, options = {}) => {
      calls.push({ path, options });
      return { success: true };
    },
  };
}

test("user requests use canonical Earned EXALT paths and every claim gets a fresh request identity", async () => {
  const recorder = recordingApi();
  const api = createEarnedExaltApi(recorder.request);

  await api.loadEarnedExaltSummary();
  await api.acceptEarnedExaltTerms({
    campaignId: "campaign-1",
    termsVersion: 3,
  });
  await api.claimEarnedExalt({ allocationId: "allocation-1", amount: 2 });
  await api.claimEarnedExalt({ allocationId: "allocation-1", amount: 2 });
  await api.loadEarnedExaltCampaigns();

  assert.deepEqual(
    recorder.calls.map(({ path }) => path),
    [
      "/api/earned-exalt/summary",
      "/api/earned-exalt/terms/accept",
      "/api/earned-exalt/claim",
      "/api/earned-exalt/claim",
      "/api/earned-exalt/admin/campaigns",
    ]
  );
  assert.equal(recorder.calls[1].options.method, "POST");
  assert.deepEqual(JSON.parse(recorder.calls[1].options.body), {
    campaignId: "campaign-1",
    termsVersion: 3,
  });
  assert.deepEqual(JSON.parse(recorder.calls[2].options.body), {
    allocationId: "allocation-1",
    amount: 2,
  });

  const firstKey = recorder.calls[2].options.headers["Idempotency-Key"];
  const secondKey = recorder.calls[3].options.headers["Idempotency-Key"];
  assert.match(firstKey, /^earned-exalt-claim:/);
  assert.notEqual(firstKey, secondKey);
});

test("Owner mutations receive step-up tokens as arguments and send them only in request headers", async () => {
  const recorder = recordingApi();
  const api = createEarnedExaltApi(recorder.request);
  const writes = [];
  const previousLocalStorage = globalThis.localStorage;
  const previousSessionStorage = globalThis.sessionStorage;
  globalThis.localStorage = { setItem: (...args) => writes.push(args) };
  globalThis.sessionStorage = { setItem: (...args) => writes.push(args) };

  try {
    await api.createEarnedExaltCampaign({ name: "Launch" }, "grant-123");
    await api.activateEarnedExaltCampaign("campaign/1", "grant-123");
    await api.pauseEarnedExaltCampaign("campaign/1", "grant-123");
    await api.resumeEarnedExaltCampaign("campaign/1", "grant-123");
    await api.allocateEarnedExalt(
      { campaignId: "campaign-1", userId: "user-1", totalAmount: 5 },
      "grant-123"
    );
    await api.setEarnedExaltStatus(true, "grant-123");
  } finally {
    globalThis.localStorage = previousLocalStorage;
    globalThis.sessionStorage = previousSessionStorage;
  }

  assert.deepEqual(
    recorder.calls.map(({ path }) => path),
    [
      "/api/earned-exalt/admin/campaigns",
      "/api/earned-exalt/admin/campaigns/campaign%2F1/activate",
      "/api/earned-exalt/admin/campaigns/campaign%2F1/pause",
      "/api/earned-exalt/admin/campaigns/campaign%2F1/resume",
      "/api/earned-exalt/admin/allocations",
      "/api/earned-exalt/admin/status",
    ]
  );

  for (const { options } of recorder.calls) {
    assert.equal(options.method, "POST");
    assert.equal(options.headers["X-Owner-Step-Up"], "grant-123");
    assert.match(options.headers["Idempotency-Key"], /^earned-exalt-owner:/);
    assert.doesNotMatch(options.body || "", /grant-123/);
  }
  assert.deepEqual(JSON.parse(recorder.calls.at(-1).options.body), {
    enabled: true,
  });
  assert.deepEqual(writes, []);
});

test("Owner step-up verification uses the canonical security endpoint", async () => {
  const recorder = recordingApi();
  const api = createEarnedExaltApi(recorder.request);

  await api.requestOwnerStepUp({ token: "123456" });

  assert.deepEqual(recorder.calls, [
    {
      path: "/api/owner/step-up",
      options: {
        method: "POST",
        body: JSON.stringify({ token: "123456" }),
      },
    },
  ]);
});

test("claim validation accepts only positive finite amounts within the server claimable limit", () => {
  assert.equal(validateClaimAmount("2", 5).valid, true);
  assert.equal(validateClaimAmount("6", 5).valid, false);
  assert.equal(validateClaimAmount("0", 5).valid, false);
  assert.equal(validateClaimAmount("not-a-number", 5).valid, false);
});

test("step-up grants are usable only before their server-provided expiry", () => {
  const now = new Date("2026-09-15T12:00:00.000Z");
  const future = new Date("2026-09-15T12:04:00.000Z").toISOString();
  const expired = new Date("2026-09-15T12:00:00.000Z").toISOString();

  assert.equal(isStepUpUsable({ expiresAt: future }, now), true);
  assert.equal(isStepUpUsable({ expiresAt: expired }, now), false);
  assert.equal(isStepUpUsable({ expiresAt: "invalid" }, now), false);
});

test("idempotency keys preserve the operation prefix and are unique", () => {
  const first = newIdempotencyKey("earned-exalt-test");
  const second = newIdempotencyKey("earned-exalt-test");

  assert.match(first, /^earned-exalt-test:/);
  assert.notEqual(first, second);
});

test("panel renders all five authoritative totals and explains locked restrictions", async () => {
  await renderPanel(async () => summary());
  await screen.findByText("Contributor grant");
  const totals = screen.getByRole("region", { name: "Earned EXALT totals" });
  for (const [label, value] of [["Total earned", "103"], ["Locked", "61"], ["Vested", "42"], ["Claimed", "13"], ["Claimable", "29"]]) {
    const term = within(totals).getByText(label);
    assert.equal(term.nextElementSibling.textContent, `${value} EXALT`);
  }
  assert.match(screen.getByText(/unavailable for withdrawal or transfer/i).textContent, /locked/i);
  assert.equal(screen.getByRole("button", { name: "Claim EXALT" }).disabled, true);
});

test("terms require explicit consent to current version and reload before unlocking claims", async () => {
  const calls = [];
  const acceptance = deferred();
  let accepted = false;
  await renderPanel(async (path, options) => {
    calls.push({ path, options });
    if (path.endsWith("/terms/accept")) { await acceptance.promise; accepted = true; return { success: true }; }
    return summary(accepted);
  });
  fireEvent.click(await screen.findByRole("button", { name: "Review terms" }));
  const dialog = screen.getByRole("dialog");
  assert.match(dialog.textContent, /v3/);
  assert.match(dialog.textContent, /Current campaign terms from the server/);
  const submit = within(dialog).getByRole("button", { name: "Accept terms" });
  assert.equal(submit.disabled, true);
  fireEvent.click(within(dialog).getByRole("checkbox"));
  fireEvent.click(submit);
  fireEvent.click(submit);
  assert.equal(submit.disabled, true);
  assert.equal(calls.filter(({ path }) => path.endsWith("/terms/accept")).length, 1);
  assert.deepEqual(JSON.parse(calls.at(-1).options.body), { campaignId: "campaign-1", termsVersion: "v3" });
  await act(async () => acceptance.resolve());
  await waitFor(() => assert.equal(screen.queryByRole("dialog"), null));
  assert.equal(calls.filter(({ path }) => path.endsWith("/summary")).length, 2);
  assert.ok(screen.getByText(/current terms accepted/i));
});

test("terms consent changes keep keyboard focus on the checkbox", async () => {
  await renderPanel(async () => summary());
  fireEvent.click(await screen.findByRole("button", { name: "Review terms" }));
  const checkbox = within(screen.getByRole("dialog")).getByRole("checkbox");
  checkbox.focus();
  fireEvent.click(checkbox);
  assert.equal(checkbox.checked, true);
  assert.ok(document.activeElement === checkbox, "focus must remain on consent after checking");
  fireEvent.click(checkbox);
  assert.equal(checkbox.checked, false);
  assert.ok(document.activeElement === checkbox, "focus must remain on consent after unchecking");
});

test("claim confirmation reports only the server credited amount and preserves it after refresh", async () => {
  const refresh = deferred();
  let loads = 0;
  await renderPanel(async (path) => {
    if (path.endsWith("/claim")) return { success: true, amount: 6.25 };
    return ++loads === 1 ? summary(true) : refresh.promise;
  });
  fireEvent.change(await screen.findByRole("spinbutton"), { target: { value: "7" } });
  fireEvent.click(screen.getByRole("button", { name: "Claim EXALT" }));
  await screen.findByText(/6\.25 EXALT.*credited/i);
  assert.equal(screen.queryByRole("region", { name: "Earned EXALT totals" }), null, "no optimistic totals during reload");
  await act(async () => refresh.resolve({ ...summary(true), totalClaimable: 20, totalClaimed: 22 }));
  assert(screen.getByText(/6\.25 EXALT.*credited/i));
  const totals = screen.getByRole("region", { name: "Earned EXALT totals" });
  assert.equal(within(totals).getByText("Claimable").nextElementSibling.textContent, "20 EXALT");
  assert.equal(within(totals).getByText("Claimed").nextElementSibling.textContent, "22 EXALT");
});

test("partial claims validate server limits, block repeats, and render only the refreshed server totals", async () => {
  const calls = [];
  const mutation = deferred();
  const refresh = deferred();
  let loads = 0;
  await renderPanel(async (path, options) => {
    calls.push({ path, options });
    if (path.endsWith("/claim")) { await mutation.promise; return { success: true, amount: 7 }; }
    loads += 1;
    return loads === 1 ? summary(true) : refresh.promise;
  });
  const input = await screen.findByRole("spinbutton", { name: /claim amount/i });
  const claim = screen.getByRole("button", { name: "Claim EXALT" });
  for (const amount of ["", "0", "-1", "30"]) {
    fireEvent.change(input, { target: { value: amount } });
    assert.equal(claim.disabled, true);
  }
  fireEvent.change(input, { target: { value: "7" } });
  assert.equal(claim.disabled, false);
  fireEvent.click(claim);
  fireEvent.click(claim);
  assert.equal(claim.disabled, true);
  assert.equal(calls.filter(({ path }) => path.endsWith("/claim")).length, 1);
  assert.deepEqual(JSON.parse(calls.at(-1).options.body), { allocationId: "allocation-1", amount: 7 });
  await act(async () => mutation.resolve());
  assert.equal(loads, 2);
  assert.equal(screen.queryByText("22 EXALT"), null, "no client subtraction during refresh");
  await act(async () => refresh.resolve({ ...summary(true), totalClaimable: 21, totalClaimed: 21 }));
  const totals = screen.getByRole("region", { name: "Earned EXALT totals" });
  assert.equal(within(totals).getByText("Claimable").nextElementSibling.textContent, "21 EXALT");
});

test("loading, empty, unavailable and failed refresh do not fabricate balances or success", async () => {
  const pending = deferred();
  await renderPanel(async () => pending.promise);
  assert.ok(screen.getByText(/loading earned exalt/i));
  assert.equal(screen.queryByRole("region", { name: "Earned EXALT totals" }), null);
  await act(async () => pending.resolve({ success: true, totalEarned: 0, totalLocked: 0, totalVested: 0, totalClaimed: 0, totalClaimable: 0, allocations: [] }));
  assert.ok(screen.getByText(/no earned exalt allocations/i));
  cleanup();
  let loadCount = 0;
  await renderPanel(async (path) => {
    if (path.endsWith("/claim")) return { success: true };
    if (++loadCount === 1) return summary(true);
    throw new Error("Summary offline");
  });
  fireEvent.change(await screen.findByRole("spinbutton"), { target: { value: "1" } });
  fireEvent.click(screen.getByRole("button", { name: "Claim EXALT" }));
  await screen.findByText(/unable to load earned exalt/i);
  assert.equal(screen.queryByRole("region", { name: "Earned EXALT totals" }), null);
  assert.ok(screen.getByRole("button", { name: "Retry" }));
});

test("failed claims retain server balances, show the error and never reload or report success", async () => {
  let loads = 0;
  await renderPanel(async (path) => {
    if (path.endsWith("/claim")) throw new Error("Current campaign terms must be accepted");
    loads += 1;
    return summary(true);
  });
  fireEvent.change(await screen.findByRole("spinbutton"), { target: { value: "1" } });
  fireEvent.click(screen.getByRole("button", { name: "Claim EXALT" }));
  await screen.findByText("Current campaign terms must be accepted");
  assert.equal(loads, 1);
  assert.equal(within(screen.getByRole("region", { name: "Earned EXALT totals" })).getByText("Claimable").nextElementSibling.textContent, "29 EXALT");
});

test("Staking remains default and Earned EXALT is a distinct keyboard-accessible capability-gated tab", async () => {
  const axios = (await import("axios")).default;
  const previousGet = axios.get;
  const previousFetch = globalThis.fetch;
  let capabilityLoads = 0;
  let summaryLoads = 0;
  axios.get = async () => ({ data: { stakes: [] } });
  globalThis.fetch = async (url) => {
    if (String(url).endsWith("/api/capabilities")) {
      capabilityLoads += 1;
      return { ok: true, json: async () => ({ success: true, capabilities: { earnedExalt: { status: "DISABLED", reason: "Owner disabled Earned EXALT" } } }) };
    }
    if (String(url).endsWith("/api/staking/my-stakes")) {
      return { ok: true, json: async () => ({ stakes: [] }) };
    }
    if (String(url).endsWith("/api/earned-exalt/summary")) summaryLoads += 1;
    throw new Error(`Unexpected network request: ${url}`);
  };
  try {
    const Staking = (await import("../src/components/Staking.jsx")).default;
    render(React.createElement(Staking));
    const stakingTab = screen.getByRole("tab", { name: "Staking" });
    const earnedTab = screen.getByRole("tab", { name: "Earned EXALT" });
    assert.equal(stakingTab.getAttribute("aria-selected"), "true");
    assert.equal(capabilityLoads, 0);
    fireEvent.keyDown(stakingTab, { key: "ArrowRight" });
    assert.equal(earnedTab.getAttribute("aria-selected"), "true");
    const panelElement = document.getElementById(earnedTab.getAttribute("aria-controls"));
    assert.equal(panelElement?.getAttribute("aria-labelledby"), earnedTab.id);
    await screen.findByText("Owner disabled Earned EXALT");
    assert.equal(summaryLoads, 0);
    assert.equal(screen.queryByRole("button", { name: "Claim EXALT" }), null);
    fireEvent.click(stakingTab);
    assert.ok(screen.getByRole("combobox", { name: "coin" }));
  } finally {
    cleanup();
    axios.get = previousGet;
    globalThis.fetch = previousFetch;
  }
});

test("LIVE Earned EXALT tab fetches the real canonical summary only while selected", async (context) => {
  // Expire the existing capability hook cache rather than bypassing the hook.
  const now = Date.now();
  context.mock.method(Date, "now", () => now + 31000);
  const axios = (await import("axios")).default;
  context.mock.method(axios, "get", async () => ({ data: { stakes: [] } }));
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url) => {
    calls.push(String(url));
    const data = String(url).endsWith("/api/staking/my-stakes")
      ? { stakes: [] }
      : String(url).endsWith("/api/capabilities")
      ? { success: true, capabilities: { earnedExalt: { status: "LIVE", reason: "Ready" } } }
      : summary(true);
    return { ok: true, status: 200, json: async () => data };
  });
  const Staking = (await import("../src/components/Staking.jsx")).default;
  render(React.createElement(Staking));
  assert.equal(calls.filter((url) => url.endsWith("/api/earned-exalt/summary")).length, 0);
  assert.equal(calls.filter((url) => url.endsWith("/api/capabilities")).length, 0);
  fireEvent.click(screen.getByRole("tab", { name: "Earned EXALT" }));
  await screen.findByText("Contributor grant");
  assert.equal(calls.filter((url) => url.endsWith("/api/earned-exalt/summary")).length, 1);
  fireEvent.click(screen.getByRole("tab", { name: "Staking" }));
  assert.equal(screen.queryByRole("region", { name: "Earned EXALT" }), null);
});
