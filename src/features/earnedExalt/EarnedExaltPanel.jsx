import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../../design-system/Button.jsx";
import { Dialog } from "../../design-system/Dialog.jsx";
import { Alert } from "../../design-system/Alert.jsx";
import { loadEarnedExaltSummary, acceptEarnedExaltTerms, claimEarnedExalt } from "./earnedExaltApi.js";
import { validateClaimAmount } from "./earnedExaltState.js";
import "./EarnedExaltPanel.css";

const defaultApi = { loadEarnedExaltSummary, acceptEarnedExaltTerms, claimEarnedExalt };
const TOTALS = [
  ["totalEarned", "Total earned"], ["totalLocked", "Locked"],
  ["totalVested", "Vested"], ["totalClaimed", "Claimed"],
  ["totalClaimable", "Claimable"],
];
const amountText = (value) => typeof value === "number" && Number.isFinite(value)
  ? `${value.toLocaleString(undefined, { maximumFractionDigits: 8 })} EXALT`
  : "Unavailable";
const dateText = (value) => value && Number.isFinite(new Date(value).getTime())
  ? new Date(value).toLocaleDateString()
  : "Unavailable";

// CapabilityGate owns module availability. This panel owns only the real
// summary/request states; balances are never computed or changed locally.
export default function EarnedExaltPanel({ api = defaultApi }) {
  const [loadState, setLoadState] = useState("loading");
  const [summary, setSummary] = useState(null);
  const [amounts, setAmounts] = useState({});
  const [terms, setTerms] = useState(null);
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const busy = useRef(false);
  const mounted = useRef(false);
  const requestVersion = useRef(0);

  const reload = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoadState("loading");
    setSummary(null);
    try {
      const result = await api.loadEarnedExaltSummary();
      if (!result?.success || !Array.isArray(result.allocations) ||
          TOTALS.some(([key]) => typeof result[key] !== "number" || !Number.isFinite(result[key]))) {
        throw new Error("Invalid Earned EXALT summary");
      }
      if (!mounted.current || version !== requestVersion.current) return;
      setSummary(result);
      setLoadState(result.allocations.length ? "ready" : "empty");
    } catch {
      if (mounted.current && version === requestVersion.current) setLoadState("unavailable");
    }
  }, [api]);

  useEffect(() => {
    mounted.current = true;
    reload();
    return () => { mounted.current = false; requestVersion.current += 1; };
  }, [reload]);

  const closeTerms = useCallback(() => {
    if (busy.current) return;
    setTerms(null);
    setConsent(false);
    setError("");
  }, []);

  const acceptTerms = async (event) => {
    event.preventDefault();
    if (busy.current || !terms || !consent) return;
    busy.current = true;
    setPending("terms");
    setError("");
    setNotice("");
    try {
      const result = await api.acceptEarnedExaltTerms({ campaignId: terms.campaignId, termsVersion: terms.campaign.termsVersion });
      if (!result?.success) throw new Error(result?.message || "Terms acceptance failed.");
      if (!mounted.current) return;
      setTerms(null);
      setConsent(false);
      await reload();
    } catch (failure) {
      if (mounted.current) setError(failure.message || "Terms acceptance failed.");
    } finally {
      busy.current = false;
      if (mounted.current) setPending(null);
    }
  };

  const claim = async (event, allocation) => {
    event.preventDefault();
    const validation = validateClaimAmount(amounts[allocation.allocationId], allocation.claimableAmount);
    if (busy.current || !validation.valid || allocation.campaign?.termsAccepted !== true ||
        allocation.campaign?.status !== "active" || allocation.status !== "active") return;
    busy.current = true;
    setPending(allocation.allocationId);
    setError("");
    setNotice("");
    try {
      const result = await api.claimEarnedExalt({ allocationId: allocation.allocationId, amount: validation.amount });
      if (!result?.success) throw new Error(result?.message || "Claim failed.");
      if (!mounted.current) return;
      setAmounts({});
      setNotice(Number.isFinite(result.amount)
        ? `Claim confirmed by the server. ${amountText(result.amount)} credited to your available EXALT balance.`
        : "Claim confirmed by the server. Credited amount unavailable.");
      await reload();
    } catch (failure) {
      if (mounted.current) setError(failure.message || "Claim failed. Please try again.");
    } finally {
      busy.current = false;
      if (mounted.current) setPending(null);
    }
  };

  return (
    <section className="earned-exalt" aria-label="Earned EXALT" aria-busy={loadState === "loading" || Boolean(pending)}>
      <header className="earned-exalt__intro">
        <h2>Earned EXALT</h2>
        <p>Track your allocations and claim released EXALT.</p>
        <p>Locked EXALT is unavailable for withdrawal or transfer. Only released, claimable EXALT can be claimed to your wallet.</p>
      </header>
      {notice && <Alert tone="success">{notice}{loadState === "loading" && " Reloading your Earned EXALT summary."}</Alert>}
      {error && !terms && <Alert tone="danger">{error}</Alert>}
      {loadState === "loading" && <p role="status">Loading Earned EXALT…</p>}
      {loadState === "unavailable" && (
        <Alert tone="warning" title="Unable to load Earned EXALT">
          <p>Current balances are unavailable. Refresh the summary before taking another action.</p>
          <Button variant="outline" onClick={reload} disabled={Boolean(pending)}>Retry</Button>
        </Alert>
      )}
      {summary && (
        <>
          <section aria-label="Earned EXALT totals">
            <dl className="earned-exalt__totals">
              {TOTALS.map(([key, label]) => <div className="earned-exalt__total" key={key}><dt>{label}</dt><dd>{amountText(summary[key])}</dd></div>)}
            </dl>
          </section>
          {loadState === "empty" && <p role="status">No Earned EXALT allocations yet.</p>}
          <div className="earned-exalt__allocations">
            {summary.allocations.map((allocation) => {
              const campaign = allocation.campaign;
              const id = allocation.allocationId;
              const validation = validateClaimAmount(amounts[id] ?? "", allocation.claimableAmount);
              const active = campaign?.status === "active" && allocation.status === "active";
              const accepted = campaign?.termsAccepted === true;
              return (
                <article className="earned-exalt__allocation" key={id} aria-labelledby={`earned-allocation-${id}`}>
                  <h3 id={`earned-allocation-${id}`}>{campaign?.name || "Campaign unavailable"}</h3>
                  <p className="earned-exalt__muted">Campaign: {campaign?.status || "unavailable"} · Allocation: {allocation.status}</p>
                  <dl className="earned-exalt__details">
                    {[["Allocated", allocation.totalAmount], ["Locked", allocation.lockedAmount], ["Vested", allocation.vestedAmount], ["Claimed", allocation.claimedAmount], ["Claimable", allocation.claimableAmount]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{amountText(value)}</dd></div>)}
                    <div><dt>Starts</dt><dd>{dateText(allocation.startAt)}</dd></div>
                    <div><dt>Cliff</dt><dd>{dateText(allocation.cliffAt)}</dd></div>
                    <div><dt>Ends</dt><dd>{dateText(allocation.endAt)}</dd></div>
                    <div><dt>Release interval</dt><dd>{allocation.intervalDays == null ? "Unavailable" : `${allocation.intervalDays} days`}</dd></div>
                  </dl>
                  {accepted ? <p>Current terms accepted · {campaign.termsVersion}</p> : (
                    <div className="earned-exalt__terms-prompt">
                      <p>Accept the current campaign terms before claiming.</p>
                      <Button variant="outline" disabled={Boolean(pending) || !campaign?.termsVersion || !campaign?.termsContent} onClick={() => { setTerms(allocation); setConsent(false); setError(""); }}>Review terms</Button>
                    </div>
                  )}
                  {!active && <p>Claims are unavailable while this campaign or allocation is not active.</p>}
                  <form className="earned-exalt__claim" onSubmit={(event) => claim(event, allocation)}>
                    <label htmlFor={`earned-amount-${id}`}>Claim amount (EXALT)</label>
                    <input id={`earned-amount-${id}`} type="number" inputMode="decimal" min="0" max={allocation.claimableAmount} step="any" value={amounts[id] ?? ""} disabled={Boolean(pending) || !accepted || !active} aria-describedby={`earned-amount-help-${id}`} aria-invalid={Boolean(amounts[id]) && !validation.valid} onChange={(event) => setAmounts((previous) => ({ ...previous, [id]: event.target.value }))} />
                    <p id={`earned-amount-help-${id}`} className="earned-exalt__muted">{amounts[id] && !validation.valid ? validation.message : `Available to claim: ${amountText(allocation.claimableAmount)}. Partial claims are supported.`}</p>
                    <Button type="submit" disabled={Boolean(pending) || !accepted || !active || !validation.valid} loading={pending === id}>Claim EXALT</Button>
                  </form>
                </article>
              );
            })}
          </div>
        </>
      )}
      <Dialog open={Boolean(terms)} onClose={closeTerms} title="Earned EXALT campaign terms" dismissOnEscape={!pending} dismissOnBackdrop={!pending} className="earned-exalt__dialog">
        {terms && <form onSubmit={acceptTerms}>
          <p>{terms.campaign.name} · Version {terms.campaign.termsVersion}</p>
          <div className="earned-exalt__terms-content">{terms.campaign.termsContent}</div>
          <label className="earned-exalt__consent"><input type="checkbox" checked={consent} disabled={Boolean(pending)} onChange={(event) => setConsent(event.target.checked)} />I have read and accept these current campaign terms.</label>
          {error && <Alert tone="danger">{error}</Alert>}
          <Button type="submit" disabled={!consent || Boolean(pending)} loading={pending === "terms"}>Accept terms</Button>
        </form>}
      </Dialog>
    </section>
  );
}
