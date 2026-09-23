import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../../design-system/Button.jsx";
import { FormField } from "../../design-system/FormField.jsx";
import { Input } from "../../design-system/Input.jsx";
import OwnerStepUpDialog from "./OwnerStepUpDialog.jsx";
import {
  loadEarnedExaltCampaigns, loadEarnedExaltAdminStatus,
  createEarnedExaltCampaign, activateEarnedExaltCampaign,
  pauseEarnedExaltCampaign, resumeEarnedExaltCampaign,
  allocateEarnedExalt, setEarnedExaltStatus,
} from "./earnedExaltApi.js";
import { isStepUpUsable } from "./earnedExaltState.js";
import "./OwnerEarnedExaltPanel.css";

const EMPTY_CAMPAIGN = {
  name: "", totalBudget: "", cliffDays: "0", durationDays: "90",
  intervalDays: "1", termsVersion: "", termsContent: "",
};
const EMPTY_ALLOCATION = { campaignId: "", userId: "", totalAmount: "", startAt: "" };
const positive = (value) => Number.isFinite(Number(value)) && Number(value) > 0;
const validDays = (value, minimum) => String(value).trim() !== "" && Number.isInteger(Number(value)) && Number(value) >= minimum && Number(value) <= 3650;

function Field({ label, value, onChange, ...props }) {
  return <FormField label={label} required>{(fieldProps) => (
    <Input {...fieldProps} {...props} value={value} onChange={(event) => onChange(event.target.value)} />
  )}</FormField>;
}

export default function OwnerEarnedExaltPanel() {
  const [campaigns, setCampaigns] = useState([]);
  const [enabled, setEnabled] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [campaignForm, setCampaignForm] = useState(EMPTY_CAMPAIGN);
  const [allocationForm, setAllocationForm] = useState(EMPTY_ALLOCATION);
  // Sensitive grants and the single explicit pending action live in memory only.
  const grant = useRef(null);
  const grantExpiryTimer = useRef(null);
  const pendingAction = useRef(null);
  const busy = useRef(false);
  const mounted = useRef(false);

  const discardGrant = useCallback(() => {
    clearTimeout(grantExpiryTimer.current);
    grantExpiryTimer.current = null;
    grant.current = null;
  }, []);

  const refresh = async () => {
    setLoading(true);
    setReady(false);
    try {
      const [result, status] = await Promise.all([
        loadEarnedExaltCampaigns(), loadEarnedExaltAdminStatus(),
      ]);
      if (!result || result.success === false || !Array.isArray(result.campaigns)) {
        throw new Error("Campaign data is unavailable.");
      }
      if (mounted.current) {
        setCampaigns(result.campaigns);
        setEnabled(status);
        setReady(true);
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    mounted.current = true;
    refresh().catch((failure) => {
      if (mounted.current) setError(failure.message || "Unable to load Earned EXALT administration.");
    });
    return () => {
      mounted.current = false;
      discardGrant();
      pendingAction.current = null;
    };
  }, [discardGrant]);

  const execute = async (action) => {
    if (!mounted.current || busy.current) return;
    if (!isStepUpUsable(grant.current)) {
      discardGrant();
      pendingAction.current = action;
      busy.current = true;
      setVerificationOpen(true);
      return;
    }
    busy.current = true;
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const result = await action(grant.current.token);
      if (!result || result.success !== true) {
        throw new Error(result?.message || "The server did not confirm this action. Check the current state before trying again.");
      }
      if (!mounted.current) return;
      // The financial action is committed. A read failure must never replay it.
      try {
        await refresh();
      } catch (failure) {
        if (mounted.current) setError(`Action completed, but refresh failed. Do not repeat it; refresh the data. ${failure.message}`);
      }
    } catch (failure) {
      if (!mounted.current) return;
      pendingAction.current = null;
      if (failure.status === 401 || failure.status === 403 || /step.up/i.test(failure.message || "")) {
        discardGrant();
        setError("Owner verification was rejected. The action was not retried. Verify again, review the details, then explicitly submit the action.");
        setVerificationOpen(true);
      } else {
        setError(failure.message || "Action failed. Review the current state before trying again.");
      }
    } finally {
      busy.current = false;
      if (mounted.current) setSubmitting(false);
    }
  };

  const requestAction = (action) => {
    if (busy.current || verificationOpen || !ready || loading) return;
    setError("");
    setMessage("");
    void execute(action);
  };

  const verified = (nextGrant) => {
    if (!mounted.current || !isStepUpUsable(nextGrant)) return;
    discardGrant();
    grant.current = nextGrant;
    // Discard the raw secret while idle, not just when another action occurs.
    // Server-side grant validation remains authoritative for every mutation.
    grantExpiryTimer.current = setTimeout(discardGrant, Math.min(
      new Date(nextGrant.expiresAt).getTime() - Date.now(), 300_000,
    ));
    const action = pendingAction.current;
    pendingAction.current = null;
    busy.current = false;
    setVerificationOpen(false);
    // Re-authentication after rejection has no queued financial action.
    if (action) void execute(action);
  };

  const commit = async (request, successMessage, reset) => {
    const result = await request();
    if (result?.success === true && mounted.current) {
      setMessage(successMessage);
      reset?.();
    }
    return result;
  };

  const createCampaign = (event) => {
    event.preventDefault();
    if (busy.current || verificationOpen) return;
    const { name, totalBudget, cliffDays, durationDays, intervalDays, termsVersion, termsContent } = campaignForm;
    if (!name.trim() || name.trim().length > 160 || !termsVersion.trim() || termsVersion.trim().length > 80 || !termsContent.trim() || termsContent.trim().length > 50000) {
      setError("Enter a campaign name, terms version, and terms content within the field limits.");
      return;
    }
    if (!positive(totalBudget)) { setError("Enter a positive total budget."); return; }
    if (!validDays(cliffDays, 0) || !validDays(durationDays, 1) || !validDays(intervalDays, 1) || Number(cliffDays) > Number(durationDays) || Number(intervalDays) > Number(durationDays)) {
      setError("Use whole-day schedules up to 3650 days: duration and interval must be positive, and cliff and interval cannot exceed duration.");
      return;
    }
    const input = { name: name.trim(), totalBudget: Number(totalBudget), cliffDays: Number(cliffDays), durationDays: Number(durationDays), intervalDays: Number(intervalDays), termsVersion: termsVersion.trim(), termsContent: termsContent.trim() };
    requestAction((token) => commit(() => createEarnedExaltCampaign(input, token), "Campaign created.", () => setCampaignForm(EMPTY_CAMPAIGN)));
  };

  const createAllocation = (event) => {
    event.preventDefault();
    if (busy.current || verificationOpen) return;
    const { campaignId, userId, totalAmount, startAt } = allocationForm;
    const campaign = campaigns.find((item) => item._id === campaignId && item.status === "active");
    if (!campaign) { setError("Choose an active allocation campaign."); return; }
    if (!/^[a-f\d]{24}$/i.test(userId.trim())) { setError("Enter a valid 24-character recipient user ID."); return; }
    if (!positive(totalAmount) || Number(totalAmount) > Number(campaign.totalBudget) - Number(campaign.allocatedAmount || 0)) {
      setError("Enter a positive allocation amount within the remaining campaign budget."); return;
    }
    const start = new Date(startAt);
    if (!startAt || !Number.isFinite(start.getTime())) { setError("Enter a valid allocation start date."); return; }
    const input = { campaignId, userId: userId.trim(), totalAmount: Number(totalAmount), startAt: start.toISOString() };
    requestAction((token) => commit(() => allocateEarnedExalt(input, token), "Allocation created.", () => setAllocationForm(EMPTY_ALLOCATION)));
  };

  const disabled = !ready || loading || submitting || verificationOpen;
  const updateCampaign = (field) => (value) => setCampaignForm((previous) => ({ ...previous, [field]: value }));
  const updateAllocation = (field) => (value) => setAllocationForm((previous) => ({ ...previous, [field]: value }));

  return (
    <section className="earned-owner" aria-label="Earned EXALT administration" aria-busy={loading || submitting}>
      <div className="earned-owner__header">
        <div><h2>Earned EXALT</h2><p>Owner-only campaign rules and locked allocations. Allocations do not directly change available balances.</p></div>
        <Button variant="outline" disabled={loading || submitting || verificationOpen} onClick={() => { setError(""); void refresh().catch((failure) => { if (mounted.current) setError(failure.message); }); }}>Refresh</Button>
      </div>
      {error && <p className="earned-owner__error" role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      {loading && <p role="status">Loading Earned EXALT administration…</p>}
      <div className="earned-owner__status">
        <p>System status: <strong>{ready ? (enabled ? "Enabled" : "Disabled") : "Unavailable"}</strong></p>
        <Button disabled={disabled} variant={enabled ? "danger" : "primary"} onClick={() => requestAction((token) => commit(() => setEarnedExaltStatus(!enabled, token), `Earned EXALT ${enabled ? "disabled" : "enabled"}.`))}>
          {enabled ? "Disable" : "Enable"} Earned EXALT
        </Button>
      </div>
      <h3>Campaigns</h3>
      {!loading && ready && campaigns.length === 0 && <p>No campaigns yet. Create a draft below.</p>}
      <div className="earned-owner__campaigns">
        {campaigns.map((campaign) => (
          <article key={campaign._id} aria-label={campaign.name} className="earned-owner__card">
            <h4>{campaign.name}</h4><p>Status: <strong>{campaign.status}</strong></p>
            <dl className="earned-owner__rules">
              <div><dt>Total budget</dt><dd>{campaign.totalBudget} EXALT</dd></div>
              <div><dt>Allocated</dt><dd>{campaign.allocatedAmount} EXALT</dd></div>
              <div><dt>Cliff</dt><dd>{campaign.cliffDays} days</dd></div>
              <div><dt>Duration</dt><dd>{campaign.durationDays} days</dd></div>
              <div><dt>Release interval</dt><dd>{campaign.intervalDays} days</dd></div>
              <div><dt>Terms version</dt><dd>{campaign.termsVersion}</dd></div>
            </dl>
            <details><summary>Campaign terms</summary><p className="earned-owner__terms">{campaign.termsContent}</p></details>
            {(campaign.activatedAt || campaign.status !== "draft") && <p>Activated campaign financial and terms rules are immutable.</p>}
            {campaign.status === "draft" && <Button disabled={disabled} aria-label={`Activate ${campaign.name}`} onClick={() => requestAction((token) => commit(() => activateEarnedExaltCampaign(campaign._id, token), "Campaign activated."))}>Activate</Button>}
            {campaign.status === "active" && <Button disabled={disabled} variant="outline" aria-label={`Pause ${campaign.name}`} onClick={() => requestAction((token) => commit(() => pauseEarnedExaltCampaign(campaign._id, token), "Campaign paused."))}>Pause</Button>}
            {campaign.status === "paused" && <Button disabled={disabled} aria-label={`Resume ${campaign.name}`} onClick={() => requestAction((token) => commit(() => resumeEarnedExaltCampaign(campaign._id, token), "Campaign resumed."))}>Resume</Button>}
          </article>
        ))}
      </div>
      <div className="earned-owner__forms">
        <form aria-label="Create campaign" onSubmit={createCampaign} noValidate className="earned-owner__card">
          <h3>Create campaign</h3><p>New campaigns start as drafts. Activation locks their rules and terms.</p>
          <fieldset disabled={disabled}><legend className="earned-owner__legend">Campaign details</legend>
            <Field label="Campaign name" value={campaignForm.name} onChange={updateCampaign("name")} maxLength={160} />
            <Field label="Total budget (EXALT)" value={campaignForm.totalBudget} onChange={updateCampaign("totalBudget")} type="number" min="0" step="any" />
            <div className="earned-owner__schedule">
              <Field label="Cliff days" value={campaignForm.cliffDays} onChange={updateCampaign("cliffDays")} type="number" min="0" max="3650" step="1" />
              <Field label="Duration days" value={campaignForm.durationDays} onChange={updateCampaign("durationDays")} type="number" min="1" max="3650" step="1" />
              <Field label="Interval days" value={campaignForm.intervalDays} onChange={updateCampaign("intervalDays")} type="number" min="1" max="3650" step="1" />
            </div>
            <Field label="Terms version" value={campaignForm.termsVersion} onChange={updateCampaign("termsVersion")} maxLength={80} />
            <FormField label="Terms content" required>{(fieldProps) => <textarea {...fieldProps} rows={5} maxLength={50000} value={campaignForm.termsContent} onChange={(event) => updateCampaign("termsContent")(event.target.value)} />}</FormField>
            <Button type="submit" disabled={disabled}>Create campaign</Button>
          </fieldset>
        </form>
        <form aria-label="Create allocation" onSubmit={createAllocation} noValidate className="earned-owner__card">
          <h3>Create allocation</h3><p>Allocate locked EXALT to a recipient under an active campaign’s release schedule.</p>
          <fieldset disabled={disabled}><legend className="earned-owner__legend">Allocation details</legend>
            <FormField label="Allocation campaign" required>{(fieldProps) => <select {...fieldProps} value={allocationForm.campaignId} onChange={(event) => updateAllocation("campaignId")(event.target.value)}><option value="">Choose an active campaign</option>{campaigns.filter((item) => item.status === "active").map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select>}</FormField>
            <Field label="Recipient user ID" value={allocationForm.userId} onChange={updateAllocation("userId")} maxLength={24} autoComplete="off" />
            <Field label="Allocation amount (EXALT)" value={allocationForm.totalAmount} onChange={updateAllocation("totalAmount")} type="number" min="0" step="any" />
            <Field label="Start date (local time)" value={allocationForm.startAt} onChange={updateAllocation("startAt")} type="datetime-local" />
            <Button type="submit" disabled={disabled}>Create allocation</Button>
          </fieldset>
        </form>
      </div>
      <OwnerStepUpDialog open={verificationOpen} onVerified={verified} onCancel={() => { pendingAction.current = null; busy.current = false; setVerificationOpen(false); }} />
    </section>
  );
}
