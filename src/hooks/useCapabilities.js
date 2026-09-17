import { useEffect, useState } from "react";
import { API_ORIGIN } from "../lib/apiClient";

/*
  Real-Service Audit: the one real frontend consumer of the backend's
  authoritative capability registry (routes/capabilityRoutes.js).
  Per the explicit requirement ("frontend and Android-compatible UI
  must obtain module status from the backend - not from hardcoded
  client flags"), this is the ONLY source any component should use
  to decide whether to show a module as available - never a local
  env var or hardcoded boolean.

  This does not replace the backend's own enforcement
  (requireModuleLive middleware) - a client that ignores this hook
  entirely and calls a gated endpoint directly is still blocked
  server-side. This hook exists so the UI can show an honest,
  graceful status *before* a request is even attempted, rather than
  only discovering unavailability from a failed network call.
*/

const CACHE_TTL_MS = 30000;
let cachedRegistry = null;
let cachedAt = 0;
let inFlightRequest = null;

async function fetchCapabilities(apiOrigin) {
  const now = Date.now();

  if (cachedRegistry && now - cachedAt < CACHE_TTL_MS) {
    return cachedRegistry;
  }

  if (inFlightRequest) {
    return inFlightRequest;
  }

  inFlightRequest = (async () => {
    try {
      const response = await fetch(`${apiOrigin}/api/capabilities`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to load capability status");
      }

      cachedRegistry = data.capabilities;
      cachedAt = Date.now();
      return cachedRegistry;
    } finally {
      inFlightRequest = null;
    }
  })();

  return inFlightRequest;
}

export function useCapabilities() {
  const [capabilities, setCapabilities] = useState(cachedRegistry);
  const [loadState, setLoadState] = useState(
    cachedRegistry ? "ready" : "loading"
  );

  useEffect(() => {
    let cancelled = false;

    fetchCapabilities(API_ORIGIN)
      .then((registry) => {
        if (!cancelled) {
          setCapabilities(registry);
          setLoadState("ready");
        }
      })
      .catch((error) => {
        console.error("Failed to load capability registry:", error);
        if (!cancelled) {
          setLoadState("unavailable");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { capabilities, loadState };
}

/*
  Convenience hook for a single module - the common case. Returns
  the real module entry ({status, reason, evidence}) or null while
  loading/unavailable, so a component can render its own honest
  loading/unavailable state without duplicating the fetch logic.
*/
export function useModuleCapability(moduleKey) {
  const { capabilities, loadState } = useCapabilities();
  return {
    module: capabilities ? capabilities[moduleKey] || null : null,
    loadState,
  };
}

export default useCapabilities;
