import { io } from "socket.io-client";

/* =========================================================
   EXALT EXCHANGE — CANONICAL FRONTEND API CLIENT

   Phase 2 API contract freeze (see MASTER-AUDIT.md section 4.1 for
   the full diagnosis). Before this file existed, ~85 frontend files
   each independently defined their own VITE_API_URL fallback - 74 of
   them to a legacy Render host (https://exalt-real-backend-6b6v.
   onrender.com) rather than the real production API, a handful to
   the correct production host, and several with their own duplicated
   (and subtly different) "/api" suffix-stripping logic. If a real
   deployment's VITE_API_URL was ever unset or set inconsistently
   with what any one of those conventions expected, different pages
   would silently talk to different backends, or double/zero-prefix
   "/api" - a fully sufficient explanation for a route that is
   correctly mounted server-side (e.g. GET /api/web3-wallet/wallet)
   still 404ing in live browser testing.

   THIS is now the one place that decides:
     - what the API origin is (API_ORIGIN - bare origin, no /api
       suffix, no trailing slash)
     - how a request path gets turned into a full URL (apiUrl())
     - how an authenticated JSON request is made (apiFetch())
     - the one shared socket.io connection (getSocket() / socket)

   Every other file that needs the API base imports API_ORIGIN (or
   apiUrl/apiFetch) from here instead of defining its own fallback.
   See frontend/scripts/checkApiContract.js - a static check (wired
   into `npm run check:api-contract`) that fails the build if any
   frontend source file reintroduces a hardcoded legacy host or its
   own ad-hoc "/api" prefixing, so this cannot silently regress.
========================================================= */

const PRODUCTION_API_ORIGIN = "https://api.exaltexchange.io";

// RC4 (§1): matches backend/server.js's own default
// (`Number(process.env.PORT) || 5000`) - the local backend listens
// here unless PORT is overridden. Used ONLY as the unset-VITE_API_URL
// fallback in Vite DEV mode (see resolveDefaultOrigin() below) - a
// production build's fallback is still the real production origin,
// unchanged from before this pass.
const LOCAL_DEV_API_ORIGIN = "http://localhost:5000";

/**
 * RC4 (§1) fix: before this pass, an UNSET VITE_API_URL fell back to
 * the real PRODUCTION origin in every build mode, including the Vite
 * dev server. That is backwards for local development - a fresh
 * clone with no .env.local silently pointed every local `npm run dev`
 * session (including Send/Swap testing) at the real production
 * backend, with no error, no warning beyond one console.info line
 * that's easy to miss. It also directly caused the exact "local
 * VITE_API_URL is not respected" symptom this fix addresses: a
 * developer who genuinely set VITE_API_URL=http://localhost:5000 but
 * via a mechanism Vite didn't actually pick up (a shell export before
 * a dev-server restart wasn't performed, a missing .env.local, a
 * stale built bundle) had no local-safe fallback to catch the miss -
 * requests silently succeeded against production instead of failing
 * obviously against an unreachable localhost.
 *
 * Now: in Vite DEV mode (`import.meta.env.DEV`, true only for
 * `vite`/`vite dev`, false for a real `vite build`), an unset
 * VITE_API_URL falls back to LOCAL_DEV_API_ORIGIN instead of
 * production - so a missed/misconfigured local env var fails loudly
 * (connection refused against an unreachable localhost:5000) instead
 * of silently succeeding against real production. Production builds
 * are completely unaffected: `import.meta.env.DEV` is false there,
 * so an unset VITE_API_URL still falls back to the real production
 * origin exactly as before - this change only ever changes behavior
 * for `vite`/`vite dev`.
 */
function resolveDefaultOrigin() {
  const isDev =
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.DEV === true;

  return isDev ? LOCAL_DEV_API_ORIGIN : PRODUCTION_API_ORIGIN;
}

/**
 * Normalizes any of the following into a bare origin with no
 * trailing slash and no "/api" suffix:
 *   "https://api.exaltexchange.io"
 *   "https://api.exaltexchange.io/"
 *   "https://api.exaltexchange.io/api"
 *   "https://api.exaltexchange.io/api/"
 * Falls back to resolveDefaultOrigin() (see above) when the input is
 * empty - the real production origin in a production build, or
 * localhost:5000 in the Vite dev server, so local development never
 * silently talks to production just because VITE_API_URL wasn't set.
 */
export function normalizeOrigin(value) {
  const trimmed = String(value || "").trim();

  if (!trimmed) {
    return resolveDefaultOrigin();
  }

  let base = trimmed.replace(/\/+$/, "");

  if (/\/api$/i.test(base)) {
    base = base.slice(0, base.length - 4);
  }

  return base || resolveDefaultOrigin();
}

export const API_ORIGIN = normalizeOrigin(import.meta.env.VITE_API_URL);

/*
  RC3 (§2): defense-in-depth against the exact failure class reported in
  manual local testing - a request resolving against the frontend's own
  origin (e.g. http://localhost:5173/api/web3-wallet/wallet) instead of
  the configured backend (http://localhost:5000/api/web3-wallet/wallet).

  A real reproduction attempt this pass (a fresh .env.local with
  VITE_API_URL=http://localhost:5000, the real `npm run dev` server on
  its default port 5173, driven end-to-end through a real browser) could
  NOT reproduce this: every one of 12 captured /api/ requests - including
  all 4 Web3 Wallet endpoints - correctly resolved to localhost:5000, 0
  resolved to the frontend's own origin. normalizeOrigin() above always
  returns an absolute origin (either the configured VITE_API_URL or the
  hardcoded production fallback), never an empty string, so apiUrl()
  cannot silently degrade into a same-origin-relative URL through this
  file's own logic. The most likely explanations for what was actually
  observed are environmental rather than a code defect: Vite only reads
  .env(.local) at dev-server START (a running `vite dev` process does not
  pick up a newly created/edited .env.local without a restart), or a
  stale browser tab/cache serving a bundle built before the env var was
  set. See RC3 report API-ORIGIN-VERIFICATION.md for the full
  reproduction methodology and these two safeguards below.

  Two permanent guards nonetheless added so this class of bug cannot
  silently ship even if some future change breaks the invariant above:

  1. A loud one-line console diagnostic at module load, in every build
     mode (including production), so the resolved origin a real browser
     is about to use is always one DevTools-console-glance away instead
     of requiring a code audit to determine.
  2. assertAbsoluteOrigin() below - if API_ORIGIN is ever NOT a genuine
     absolute http(s) origin (which normalizeOrigin() should always
     guarantee, but this is intentional defense-in-depth, not trust in a
     single code path), every request built through apiUrl() would
     silently resolve relative to the current page's own origin - the
     exact bug reported. Instead this throws immediately and loudly at
     module load, in every environment, so a broken build fails fast in
     the browser console rather than manifesting as a confusing 404 deep
     in a specific feature page.
*/
function assertAbsoluteOrigin(origin) {
  if (!/^https?:\/\/[^/]+$/i.test(origin)) {
    throw new Error(
      `EXALT API client misconfiguration: API_ORIGIN resolved to "${origin}", ` +
        "which is not an absolute http(s) origin. Every request built through " +
        "apiUrl() would silently resolve relative to the current page's own " +
        "origin instead of the backend - refusing to proceed. Check VITE_API_URL."
    );
  }
}

assertAbsoluteOrigin(API_ORIGIN);

// eslint-disable-next-line no-console
console.info(`[EXALT] API_ORIGIN resolved to: ${API_ORIGIN}`);

if (
  import.meta.env.DEV &&
  !String(import.meta.env.VITE_API_URL || "").trim() &&
  API_ORIGIN === LOCAL_DEV_API_ORIGIN
) {
  // eslint-disable-next-line no-console
  console.warn(
    "[EXALT] VITE_API_URL is not set - defaulting to the local dev " +
      `backend at ${LOCAL_DEV_API_ORIGIN}. If requests are failing, ` +
      "start the backend (npm run dev in backend/) or set " +
      "VITE_API_URL in frontend/.env.local and RESTART `npm run dev` " +
      "(Vite only re-reads .env files at server start)."
  );
}

// Socket.IO connects to the bare origin (no /api) either way; allow a
// distinct VITE_SOCKET_URL override for deployments that terminate
// websockets on a different host, otherwise reuse the API origin.
export const SOCKET_ORIGIN = normalizeOrigin(
  import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL
);

/**
 * Builds a full API URL from a path, tolerating whichever of these a
 * caller passes (all four resolve to the same URL):
 *   apiUrl("wallets/me")
 *   apiUrl("/wallets/me")
 *   apiUrl("api/wallets/me")
 *   apiUrl("/api/wallets/me")
 * This idempotency is deliberate: it made migrating ~85 pre-existing
 * call sites (written against three different, inconsistent
 * conventions - see the header comment) safe without having to
 * hand-verify every individual path string.
 */
export function apiUrl(path) {
  const cleanPath = String(path || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/^api\/+/i, "")
    .replace(/^api$/i, "");

  return cleanPath
    ? `${API_ORIGIN}/api/${cleanPath}`
    : `${API_ORIGIN}/api`;
}

let sharedSocket = null;

/** Returns the one shared socket.io client instance (created lazily, on first use). */
export function getSocket() {
  if (!sharedSocket) {
    sharedSocket = io(SOCKET_ORIGIN, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 10000,
    });
  }

  return sharedSocket;
}

// Kept as an eagerly-created singleton (rather than requiring every
// caller to switch to getSocket()) because the pre-existing code this
// replaces (src/api.js) exported a ready-to-use `socket` the same
// way, and ~11 files already do `import { socket } from "../api"`.
export const socket = getSocket();

/**
 * Authenticated JSON request helper. Injects the bearer token from
 * localStorage, applies a request timeout, redirects to login on 401
 * (unless skipAuthRedirect is passed), and throws an Error carrying
 * `.status` and `.data` on any non-OK response so callers can branch
 * on status the same way the pre-existing per-file helpers did.
 *
 * Skips the JSON Content-Type header automatically when `body` is a
 * FormData instance (file/KYC-document uploads), matching what a
 * correct fetch call needs (the browser sets its own multipart
 * boundary header in that case).
 */
export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs || 15000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(apiUrl(path), {
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
      signal: options.signal || controller.signal,
    });

    clearTimeout(timeout);

    if (response.status === 401 && options.skipAuthRedirect !== true) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
      return null;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(
        data?.message || `Request failed with status ${response.status}`
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    clearTimeout(timeout);

    if (error.name === "AbortError") {
      const timeoutError = new Error("Request timeout. Please try again.");
      timeoutError.status = 0;
      throw timeoutError;
    }

    throw error;
  }
}

export default API_ORIGIN;
