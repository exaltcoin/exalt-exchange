import test from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { register } from "node:module";
import "./helpers/domTestSetup.js";
import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createEarnedExaltApi } from "../src/features/earnedExalt/earnedExaltApi.js";

process.env.TZ = "UTC";
register("./helpers/jsxLoader.mjs", import.meta.url);
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

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}
function response(body, { ok = true, status = 200 } = {}) {
  return { ok, status, json: async () => body };
}
async function renderDialog(props = {}) {
  const url = new URL("../src/features/earnedExalt/OwnerStepUpDialog.jsx", import.meta.url);
  assert.equal(await access(url).then(() => true, () => false), true, "Owner step-up dialog must exist");
  const Dialog = (await import(url)).default;
  return render(React.createElement(Dialog, { open: true, onCancel: () => {}, onVerified: () => {}, ...props }));
}
test.afterEach(() => cleanup());

test("verification accepts exactly six ASCII digits", async (context) => {
  context.mock.method(globalThis, "fetch", async () => { throw new Error("invalid codes must not reach the network"); });
  await renderDialog();
  const code = screen.getByLabelText("Authenticator code");
  const verify = screen.getByRole("button", { name: "Verify" });
  for (const value of ["", "12345", "1234567", "12345a", "12 345", "１２３４５６"]) {
    fireEvent.change(code, { target: { value } });
    assert.equal(verify.disabled, true, `${JSON.stringify(value)} must be rejected`);
  }
  fireEvent.change(code, { target: { value: "012345" } });
  assert.equal(verify.disabled, false);
});

test("typing each authenticator digit keeps keyboard focus on the code input", async () => {
  await renderDialog();
  const code = screen.getByLabelText("Authenticator code");
  code.focus();
  for (const value of ["1", "12", "123", "1234", "12345", "123456"]) {
    fireEvent.change(code, { target: { value } });
    assert.ok(document.activeElement === code, `focus must remain on the code after ${value.length} digits`);
  }
});

test("a valid code is posted once and the verified grant stays out of storage, logs and URLs", async (context) => {
  const request = deferred();
  const validExpiry = new Date(Date.now() + 300_000).toISOString();
  const calls = [], writes = [], logs = [], grants = [];
  const originalLocalStorage = globalThis.localStorage;
  const originalSessionStorage = globalThis.sessionStorage;
  globalThis.localStorage = { getItem: () => "owner-session-token", setItem: (...args) => writes.push(args), removeItem: (...args) => writes.push(args) };
  globalThis.sessionStorage = { getItem: () => null, setItem: (...args) => writes.push(args), removeItem: (...args) => writes.push(args) };
  for (const method of ["log", "info", "warn", "error", "debug"]) context.mock.method(console, method, (...args) => logs.push(args));
  context.mock.method(globalThis, "fetch", async (url, options) => { calls.push({ url: String(url), options }); return request.promise; });
  try {
    await renderDialog({ onVerified: (grant) => grants.push(grant) });
    const code = screen.getByLabelText("Authenticator code");
    const verify = screen.getByRole("button", { name: "Verify" });
    fireEvent.change(code, { target: { value: "123456" } });
    fireEvent.click(verify); fireEvent.click(verify);
    assert.equal(verify.disabled, true);
    assert.equal(verify.getAttribute("aria-busy"), "true");
    await waitFor(() => assert.equal(calls.length, 1));
    assert.match(calls[0].url, /\/api\/owner\/step-up$/);
    assert.doesNotMatch(calls[0].url, /123456|grant-secret/);
    assert.deepEqual(JSON.parse(calls[0].options.body), { token: "123456" });
    await act(async () => request.resolve(response({ success: true, stepUpToken: "grant-secret", scope: "earned_exalt", expiresAt: validExpiry })));
    await waitFor(() => assert.equal(grants.length, 1));
    assert.deepEqual(grants[0], { token: "grant-secret", scope: "earned_exalt", expiresAt: validExpiry });
    assert.equal(code.value, "");
    assert.deepEqual(writes, []);
    assert.equal(JSON.stringify(logs).includes("123456"), false);
    assert.equal(JSON.stringify(logs).includes("grant-secret"), false);
  } finally {
    globalThis.localStorage = originalLocalStorage;
    globalThis.sessionStorage = originalSessionStorage;
  }
});

test("responses outside the earned_exalt scope are rejected", async (context) => {
  context.mock.method(globalThis, "fetch", async () => response({ success: true, stepUpToken: "wrong-scope-grant", scope: "other_scope", expiresAt: new Date(Date.now() + 300_000).toISOString() }));
  const grants = [];
  await renderDialog({ onVerified: (grant) => grants.push(grant) });
  fireEvent.change(screen.getByLabelText("Authenticator code"), { target: { value: "234567" } });
  fireEvent.click(screen.getByRole("button", { name: "Verify" }));
  await screen.findByRole("alert");
  assert.equal(grants.length, 0);
  assert.match(screen.getByRole("alert").textContent, /invalid step-up grant/i);
});

test("expired or invalid expiries are rejected", async (context) => {
  const expiries = [new Date(Date.now() - 1_000).toISOString(), "not-a-date"];
  context.mock.method(globalThis, "fetch", async () => response({ success: true, stepUpToken: "expired-grant", scope: "earned_exalt", expiresAt: expiries.shift() }));
  const grants = [];
  await renderDialog({ onVerified: (grant) => grants.push(grant) });
  const code = screen.getByLabelText("Authenticator code");
  for (const value of ["345678", "456789"]) {
    fireEvent.change(code, { target: { value } });
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));
    await waitFor(() => assert.equal(code.value, ""));
  }
  assert.equal(grants.length, 0);
  assert.match(screen.getByRole("alert").textContent, /invalid step-up grant/i);
});

test("server rejection is shown and clears the code without yielding a grant", async (context) => {
  context.mock.method(globalThis, "fetch", async () => response({ success: false, message: "Invalid 2FA code" }, { ok: false, status: 400 }));
  const grants = [];
  await renderDialog({ onVerified: (grant) => grants.push(grant) });
  const code = screen.getByLabelText("Authenticator code");
  fireEvent.change(code, { target: { value: "567890" } });
  fireEvent.click(screen.getByRole("button", { name: "Verify" }));
  assert.match((await screen.findByRole("alert")).textContent, /Invalid 2FA code/);
  assert.equal(code.value, "");
  assert.equal(screen.getByRole("button", { name: "Verify" }).disabled, true);
  assert.equal(grants.length, 0);
});

const campaignId = "507f1f77bcf86cd799439011";
const recipientId = "507f191e810c19729de860ea";
const campaignFixture = (status = "active") => ({
  _id: campaignId, name: "Contributor campaign", status, totalBudget: 1000,
  allocatedAmount: 125, cliffDays: 10, durationDays: 90, intervalDays: 1,
  termsVersion: "v1", termsContent: "Published campaign terms",
  activatedAt: status === "draft" ? null : "2026-09-01T00:00:00.000Z",
});
function ownerServer(context, { status = "active", intercept } = {}) {
  const calls = [];
  let campaign = campaignFixture(status);
  let enabled = false;
  context.mock.method(globalThis, "fetch", async (url, options = {}) => {
    const path = new URL(url).pathname;
    const call = { path, options };
    calls.push(call);
    const overridden = await intercept?.(call);
    if (overridden) return overridden;
    if (path === "/api/owner/step-up") return response({ success: true, stepUpToken: "owner-grant", scope: "earned_exalt", expiresAt: new Date(Date.now() + 300_000).toISOString() });
    if (path === "/api/exchange-settings/admin") return response({ success: true, data: { earnedExaltEnabled: enabled } });
    if (path === "/api/admin/revenue/dashboard") return response({ success: true, data: {} });
    if (path === "/api/exchange-settings/admin/services") return response({ success: true });
    if (options.method === "POST") {
      if (path.endsWith("/activate") || path.endsWith("/resume")) campaign = { ...campaign, status: "active", activatedAt: "2026-09-01T00:00:00.000Z" };
      if (path.endsWith("/pause")) campaign = { ...campaign, status: "paused" };
      if (path.endsWith("/status")) enabled = JSON.parse(options.body).enabled;
      if (path.endsWith("/allocations")) campaign = { ...campaign, allocatedAmount: 150 };
      return response({ success: true, campaign, earnedExaltEnabled: enabled });
    }
    if (path === "/api/earned-exalt/admin/campaigns") return response({ success: true, campaigns: [campaign] });
    throw new Error(`Unexpected test request: ${path}`);
  });
  return calls;
}
async function renderOwnerPanel() {
  const url = new URL("../src/features/earnedExalt/OwnerEarnedExaltPanel.jsx", import.meta.url);
  assert.equal(await access(url).then(() => true, () => false), true, "Owner administration panel must exist");
  const Panel = (await import(url)).default;
  render(React.createElement(Panel));
  await screen.findByRole("article", { name: "Contributor campaign" });
}
function setField(label, value) { fireEvent.change(screen.getByLabelText(label, { exact: false }), { target: { value } }); }
async function verifyOwner() {
  setField("Authenticator code", "123456");
  fireEvent.click(screen.getByRole("button", { name: "Verify", exact: true }));
  await waitFor(() => assert.equal(Boolean(screen.queryByRole("dialog")), false));
}
function fillAllocation() {
  setField("Allocation campaign", campaignId); setField("Recipient user ID", recipientId);
  setField("Allocation amount", "25"); setField("Start date", "2026-09-20T10:00");
}

test("admin status helper reads only an authoritative boolean and fails closed on malformed data", async () => {
  const paths = [];
  const api = createEarnedExaltApi(async (path) => { paths.push(path); return { success: true, data: { earnedExaltEnabled: true, unrelated: "private" } }; });
  assert.equal(typeof api.loadEarnedExaltAdminStatus, "function", "status read helper is required");
  assert.equal(await api.loadEarnedExaltAdminStatus(), true);
  assert.deepEqual(paths, ["/api/exchange-settings/admin"]);
  assert.equal(await createEarnedExaltApi(async () => ({ data: { earnedExaltEnabled: false } })).loadEarnedExaltAdminStatus(), false);
  for (const data of [null, {}, { data: { earnedExaltEnabled: "true" } }, { success: false, data: { earnedExaltEnabled: true } }]) {
    await assert.rejects(() => createEarnedExaltApi(async () => data).loadEarnedExaltAdminStatus(), /status/i);
  }
});

test("Owner mutations preserve bearer auth on step-up 401 while verification retains normal auth handling", async () => {
  const calls = [];
  const api = createEarnedExaltApi(async (_path, options) => { calls.push(options); return { success: true }; });
  await api.setEarnedExaltStatus(true, "grant"); await api.allocateEarnedExalt({}, "grant"); await api.requestOwnerStepUp({ token: "123456" });
  assert.equal(calls[0].skipAuthRedirect, true); assert.equal(calls[1].skipAuthRedirect, true);
  assert.notEqual(calls[2].skipAuthRedirect, true);
});

test("Owner panel loads real status and immutable campaign rules without balance-edit controls", async (context) => {
  const calls = ownerServer(context);
  await renderOwnerPanel();
  assert.match(screen.getByRole("region", { name: "Earned EXALT administration" }).textContent, /Disabled/);
  const campaign = screen.getByRole("article", { name: "Contributor campaign" });
  for (const text of [/1000/, /125/, /Published campaign terms/]) assert.match(campaign.textContent, text);
  assert.equal(within(campaign).queryAllByRole("textbox").length, 0);
  assert.equal(screen.queryByRole("button", { name: /edit balance|set balance|edit campaign/i }), null);
  assert(calls.some(({ path }) => path === "/api/earned-exalt/admin/campaigns"));
});

test("required campaign fields, positive budget and valid schedule are checked before verification", async (context) => {
  const calls = ownerServer(context); await renderOwnerPanel();
  const form = screen.getByRole("form", { name: "Create campaign" });
  fireEvent.submit(form); assert(screen.getByRole("alert"));
  setField("Campaign name", "New campaign"); setField("Terms version", "v2"); setField("Terms content", "New campaign terms");
  for (const [budget, cliff, duration, interval] of [["0", "0", "90", "1"], ["10", "91", "90", "1"], ["10", "0", "0", "1"], ["10", "0", "90", "91"], ["10", "0", "90.5", "1"]]) {
    setField("Total budget", budget); setField("Cliff days", cliff); setField("Duration days", duration); setField("Interval days", interval);
    fireEvent.submit(form); assert(screen.getByRole("alert")); assert.equal(screen.queryByRole("dialog"), null);
  }
  assert.equal(calls.filter(({ options }) => options.method === "POST").length, 0);
  setField("Total budget", "500"); setField("Cliff days", "10"); setField("Duration days", "90"); setField("Interval days", "1");
  fireEvent.submit(form); await verifyOwner(); await screen.findByText("Campaign created.");
  const created = calls.find(({ path, options }) => path.endsWith("/campaigns") && options.method === "POST");
  assert.deepEqual(JSON.parse(created.options.body), { name: "New campaign", totalBudget: 500, cliffDays: 10, durationDays: 90, intervalDays: 1, termsVersion: "v2", termsContent: "New campaign terms" });
  assert.equal(created.options.headers["X-Owner-Step-Up"], "owner-grant");
});

test("allocation recipient, amount, active campaign and start date are validated before verification", async (context) => {
  const calls = ownerServer(context); await renderOwnerPanel();
  const form = screen.getByRole("form", { name: "Create allocation" }); fillAllocation();
  for (const [label, invalid, valid] of [["Recipient user ID", "invalid", recipientId], ["Allocation amount", "0", "25"], ["Allocation amount", "876", "25"], ["Start date", "", "2026-09-20T10:00"], ["Allocation campaign", "", campaignId]]) {
    setField(label, invalid); fireEvent.submit(form); assert(screen.getByRole("alert"));
    assert.equal(screen.queryByRole("dialog"), null); setField(label, valid);
  }
  assert.equal(calls.filter(({ options }) => options.method === "POST").length, 0);
});

test("lifecycle, allocation and status mutations reuse a valid grant and refresh authoritative data", async (context) => {
  const calls = ownerServer(context, { status: "draft" }); await renderOwnerPanel();
  fireEvent.click(screen.getByRole("button", { name: "Activate Contributor campaign" })); await verifyOwner(); await screen.findByText("Campaign activated.");
  fireEvent.click(screen.getByRole("button", { name: "Pause Contributor campaign" })); await screen.findByText("Campaign paused.");
  fireEvent.click(screen.getByRole("button", { name: "Resume Contributor campaign" })); await screen.findByText("Campaign resumed.");
  fillAllocation(); fireEvent.submit(screen.getByRole("form", { name: "Create allocation" })); await screen.findByText("Allocation created.");
  assert.match(screen.getByRole("article", { name: "Contributor campaign" }).textContent, /150/);
  fireEvent.click(screen.getByRole("button", { name: "Enable Earned EXALT" })); await screen.findByText("Earned EXALT enabled.");
  assert(screen.getByRole("button", { name: "Disable Earned EXALT" }));
  const mutations = calls.filter(({ path, options }) => options.method === "POST" && path.includes("/earned-exalt/"));
  assert.equal(mutations.length, 5); assert.equal(calls.filter(({ path }) => path === "/api/owner/step-up").length, 1);
  for (const { options } of mutations) assert.equal(options.headers["X-Owner-Step-Up"], "owner-grant");
  assert.equal(new Set(mutations.map(({ options }) => options.headers["Idempotency-Key"])).size, 5);
  assert.deepEqual(JSON.parse(mutations[3].options.body), { campaignId, userId: recipientId, totalAmount: 25, startAt: "2026-09-20T10:00:00.000Z" });
  assert.deepEqual(JSON.parse(mutations[4].options.body), { enabled: true });
  assert(calls.filter(({ path }) => path === "/api/earned-exalt/admin/campaigns").length >= 6);
});

test("expired grants require new verification and cancelling discards the pending action", async (context) => {
  const calls = ownerServer(context); await renderOwnerPanel();
  fireEvent.click(screen.getByRole("button", { name: "Enable Earned EXALT" })); await verifyOwner(); await screen.findByText("Earned EXALT enabled.");
  const expiredNow = Date.now() + 300_001; context.mock.method(Date, "now", () => expiredNow);
  fireEvent.click(screen.getByRole("button", { name: "Disable Earned EXALT" })); assert(screen.getByRole("dialog"));
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  fireEvent.click(screen.getByRole("button", { name: "Pause Contributor campaign" })); await verifyOwner(); await screen.findByText("Campaign paused.");
  assert.equal(calls.filter(({ path }) => path.endsWith("/admin/status")).length, 1);
  assert.equal(calls.filter(({ path }) => path === "/api/owner/step-up").length, 2);
});

test("idle expiry discards the raw grant even if the wall clock moves back before the next action", async (context) => {
  const now = Date.now(); context.mock.method(Date, "now", () => now);
  const originalSetTimeout = globalThis.setTimeout;
  let expire, expiryTimer;
  context.mock.method(globalThis, "setTimeout", (callback, delay, ...args) => {
    const timer = originalSetTimeout(callback, delay, ...args);
    if (delay === 300_000) { expire = callback; expiryTimer = timer; }
    return timer;
  });
  const calls = ownerServer(context); await renderOwnerPanel();
  fireEvent.click(screen.getByRole("button", { name: "Enable Earned EXALT" })); await verifyOwner(); await screen.findByText("Earned EXALT enabled.");
  assert.equal(typeof expire, "function", "verification must schedule idle expiry cleanup");
  clearTimeout(expiryTimer); await act(async () => expire());
  // The wall clock remains before expiry: only discarding the secret prevents reuse.
  fireEvent.click(screen.getByRole("button", { name: "Disable Earned EXALT" }));
  assert(screen.queryByRole("dialog"), "an expired idle grant must require fresh verification");
  await act(async () => {});
  assert.equal(calls.filter(({ path }) => path.endsWith("/admin/status")).length, 1);
});

test("unmount cancels the scheduled grant expiry cleanup", async (context) => {
  const now = Date.now(); context.mock.method(Date, "now", () => now);
  const originalSetTimeout = globalThis.setTimeout, originalClearTimeout = globalThis.clearTimeout;
  let expiryTimer;
  const cancelled = [];
  context.mock.method(globalThis, "setTimeout", (callback, delay, ...args) => {
    const timer = originalSetTimeout(callback, delay, ...args);
    if (delay === 300_000) expiryTimer = timer;
    return timer;
  });
  context.mock.method(globalThis, "clearTimeout", (timer) => { cancelled.push(timer); originalClearTimeout(timer); });
  ownerServer(context); await renderOwnerPanel();
  fireEvent.click(screen.getByRole("button", { name: "Enable Earned EXALT" })); await verifyOwner(); await screen.findByText("Earned EXALT enabled.");
  assert.ok(expiryTimer, "a grant expiry timer must exist while mounted");
  cleanup(); assert.ok(cancelled.includes(expiryTimer), "unmount must cancel the outstanding timer");
});

for (const failedPath of ["/api/earned-exalt/admin/campaigns", "/api/exchange-settings/admin"]) {
  test(`a committed Owner action survives failed ${failedPath} refresh without replay`, async (context) => {
    let mutations = 0, failRefresh = true;
    const calls = ownerServer(context, { intercept: ({ path }) => {
      if (path.endsWith("/admin/status")) mutations += 1;
      if (path === failedPath && mutations && failRefresh) return response({ success: false, message: "Read temporarily unavailable" }, { ok: false, status: 503 });
    } });
    await renderOwnerPanel();
    fireEvent.click(screen.getByRole("button", { name: "Enable Earned EXALT" })); await verifyOwner();
    await waitFor(() => assert.match(screen.getByRole("alert").textContent, /action completed.*refresh failed.*do not repeat/i));
    assert(screen.getByText("Earned EXALT enabled."));
    for (const name of ["Enable Earned EXALT", "Pause Contributor campaign", "Create campaign", "Create allocation"]) assert.equal(screen.getByRole("button", { name, exact: true }).disabled, true);
    assert.equal(mutations, 1);
    failRefresh = false; fireEvent.click(screen.getByRole("button", { name: "Refresh", exact: true }));
    await waitFor(() => assert.equal(screen.getByRole("button", { name: "Disable Earned EXALT" }).disabled, false));
    assert.equal(screen.queryByRole("alert"), null); assert(screen.getByText("Earned EXALT enabled."));
    assert.equal(mutations, 1, "manual refresh must not replay the completed action");
    assert.equal(calls.filter(({ path }) => path === "/api/owner/step-up").length, 1);
  });
}

test("step-up rejection clears the grant and re-authenticates without replaying a rejected allocation", async (context) => {
  let attempts = 0;
  const calls = ownerServer(context, { intercept: ({ path }) => {
    if (path.endsWith("/allocations") && ++attempts === 1) return response({ success: false, message: "Invalid or expired Owner step-up verification" }, { ok: false, status: 401 });
  } });
  localStorage.setItem("token", "owner-session-token"); await renderOwnerPanel();
  fillAllocation(); fireEvent.submit(screen.getByRole("form", { name: "Create allocation" }));
  setField("Authenticator code", "123456"); fireEvent.click(screen.getByRole("button", { name: "Verify", exact: true }));
  await waitFor(() => assert.match(screen.getByRole("alert").textContent, /not retried|not replayed/i));
  assert.equal(localStorage.getItem("token"), "owner-session-token");
  await verifyOwner(); await act(async () => {});
  assert.equal(attempts, 1, "verification must not automatically replay rejected financial actions");
  fireEvent.submit(screen.getByRole("form", { name: "Create allocation" })); await screen.findByText("Allocation created.");
  assert.equal(attempts, 2); assert.equal(calls.filter(({ path }) => path === "/api/owner/step-up").length, 2);
});

test("OwnerControl gates the tab and preserves generic exchange service PATCH without Earned EXALT", async (context) => {
  const calls = ownerServer(context);
  const OwnerControl = (await import("../src/components/OwnerControl.jsx")).default;
  localStorage.setItem("token", "owner-session-token");
  for (const user of [{ role: "admin", isOwner: false }, { role: "owner", isOwner: false }]) {
    localStorage.setItem("user", JSON.stringify(user)); render(React.createElement(OwnerControl));
    assert(screen.getByText("Owner Access Required")); assert.equal(screen.queryByRole("button", { name: /Earned EXALT/ }), null); cleanup();
  }
  assert.equal(calls.length, 0);
  localStorage.setItem("user", JSON.stringify({ role: "owner", isOwner: true })); render(React.createElement(OwnerControl));
  fireEvent.click(await screen.findByRole("button", { name: /Earned EXALT/ })); await screen.findByRole("article", { name: "Contributor campaign" });
  fireEvent.click(screen.getByRole("button", { name: /Exchange Controls/ })); fireEvent.click(screen.getByRole("button", { name: /Save.*Control/i }));
  await waitFor(() => assert(calls.some(({ options }) => options.method === "PATCH")));
  assert.equal(Object.hasOwn(JSON.parse(calls.find(({ options }) => options.method === "PATCH").options.body), "earnedExaltEnabled"), false);
});
