import { newIdempotencyKey } from "./earnedExaltState.js";

const canonicalRequest = async (path, options) => {
  const { apiFetch } = await import("../../lib/apiClient.js");
  return apiFetch(path, options);
};

const postOptions = (input) => ({
  method: "POST",
  body: JSON.stringify(input),
});

export function createEarnedExaltApi(request = canonicalRequest) {
  const ownerPost = (path, input, stepUpToken) =>
    request(path, {
      method: "POST",
      // A rejected step-up grant does not invalidate the Owner's login session.
      skipAuthRedirect: true,
      headers: {
        "Idempotency-Key": newIdempotencyKey("earned-exalt-owner"),
        "X-Owner-Step-Up": stepUpToken,
      },
      ...(input === undefined ? {} : { body: JSON.stringify(input) }),
    });

  return {
    loadEarnedExaltSummary: () => request("/api/earned-exalt/summary"),

    acceptEarnedExaltTerms: (input) =>
      request("/api/earned-exalt/terms/accept", postOptions(input)),

    claimEarnedExalt: (input) =>
      request("/api/earned-exalt/claim", {
        ...postOptions(input),
        headers: {
          "Idempotency-Key": newIdempotencyKey("earned-exalt-claim"),
        },
      }),

    loadEarnedExaltCampaigns: () =>
      request("/api/earned-exalt/admin/campaigns"),

    loadEarnedExaltAdminStatus: async () => {
      const result = await request("/api/exchange-settings/admin");
      if (!result || result.success === false || typeof result.data?.earnedExaltEnabled !== "boolean") {
        throw new Error("Earned EXALT status is unavailable.");
      }
      return result.data.earnedExaltEnabled;
    },

    requestOwnerStepUp: (input) =>
      request("/api/owner/step-up", postOptions(input)),

    createEarnedExaltCampaign: (input, stepUpToken) =>
      ownerPost("/api/earned-exalt/admin/campaigns", input, stepUpToken),

    activateEarnedExaltCampaign: (campaignId, stepUpToken) =>
      ownerPost(
        `/api/earned-exalt/admin/campaigns/${encodeURIComponent(campaignId)}/activate`,
        undefined,
        stepUpToken
      ),

    pauseEarnedExaltCampaign: (campaignId, stepUpToken) =>
      ownerPost(
        `/api/earned-exalt/admin/campaigns/${encodeURIComponent(campaignId)}/pause`,
        undefined,
        stepUpToken
      ),

    resumeEarnedExaltCampaign: (campaignId, stepUpToken) =>
      ownerPost(
        `/api/earned-exalt/admin/campaigns/${encodeURIComponent(campaignId)}/resume`,
        undefined,
        stepUpToken
      ),

    allocateEarnedExalt: (input, stepUpToken) =>
      ownerPost("/api/earned-exalt/admin/allocations", input, stepUpToken),

    setEarnedExaltStatus: (input, stepUpToken) =>
      ownerPost(
        "/api/earned-exalt/admin/status",
        typeof input === "boolean" ? { enabled: input } : input,
        stepUpToken
      ),
  };
}

export const {
  loadEarnedExaltSummary,
  acceptEarnedExaltTerms,
  claimEarnedExalt,
  loadEarnedExaltCampaigns,
  loadEarnedExaltAdminStatus,
  requestOwnerStepUp,
  createEarnedExaltCampaign,
  activateEarnedExaltCampaign,
  pauseEarnedExaltCampaign,
  resumeEarnedExaltCampaign,
  allocateEarnedExalt,
  setEarnedExaltStatus,
} = createEarnedExaltApi();
