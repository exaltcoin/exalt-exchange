import { useCallback, useEffect, useMemo, useState } from "react";
import "./Certificates.css";

const DEFAULT_API = "https://exalt-real-backend-6b6v.onrender.com";
const normalizeApi = (value) => String(value || DEFAULT_API).replace(/\/+$/, "").replace(/\/api$/, "");

export default function Certificates({ mode = "my", currentUser = {}, setPage }) {
  const API = useMemo(() => normalizeApi(import.meta.env.VITE_API_URL), []);
  const token = localStorage.getItem("token");
  const [items, setItems] = useState([]);
  const [verification, setVerification] = useState(null);
  const [code, setCode] = useState(() => new URLSearchParams(window.location.search).get("code") || "");
  const [form, setForm] = useState({ userId: "", title: "", description: "", category: "Learn & Earn", expiresAt: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const role = String(currentUser?.role || "").toLowerCase();
  const canAdminister = ["admin", "super_admin", "owner"].includes(role) || currentUser?.isAdmin || currentUser?.isOwner;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const request = useCallback(async (url, options = {}) => {
    const response = await fetch(`${API}${url}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) throw new Error(data.message || `Request failed (${response.status})`);
    return data;
  }, [API, token]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = mode === "public" ? "/api/certificates/public" : canAdminister || role === "moderator" ? "/api/certificates/admin/all" : "/api/certificates/my";
      const data = await request(endpoint);
      setItems(data.certificates || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, [mode, canAdminister, role, request]);

  const verifyCode = useCallback(async () => {
    if (!code.trim()) return;
    try {
      const data = await request(`/api/certificates/verify/${encodeURIComponent(code.trim())}`);
      setVerification(data);
      setMessage("");
    } catch (error) {
      setVerification({ verified: false });
      setMessage(error.message);
    }
  }, [code, request]);

  useEffect(() => {
    if (mode === "verify") verifyCode(); else load();
  }, [mode]);

  const issue = async (event) => {
    event.preventDefault();
    try {
      await request("/api/certificates/admin/issue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setForm({ userId: "", title: "", description: "", category: "Learn & Earn", expiresAt: "" });
      setMessage("Certificate issued successfully.");
      await load();
    } catch (error) { setMessage(error.message); }
  };

  const revoke = async (publicId) => {
    const reason = window.prompt("Revocation reason:", "Administrative revocation");
    if (reason === null) return;
    try {
      await request(`/api/certificates/admin/${encodeURIComponent(publicId)}/revoke`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
      await load();
    } catch (error) { setMessage(error.message); }
  };

  const showQr = async (publicId) => {
    try {
      const data = await request(`/api/certificates/my/${encodeURIComponent(publicId)}/qr`);
      const popup = window.open("", "certificate-qr", "width=420,height=520");
      if (popup) popup.document.write(`<title>Certificate QR</title><main style="font-family:sans-serif;text-align:center;padding:24px"><h2>${publicId}</h2><img alt="Verification QR" src="${data.qrDataUrl}" style="max-width:320px"><p>Scan to verify</p></main>`);
    } catch (error) { setMessage(error.message); }
  };

  return <section className="certificates-page">
    <header><div><span>EXALT EXCHANGE</span><h1>{mode === "public" ? "Public Certificate Directory" : mode === "verify" ? "Verify Certificate" : "My Certificates"}</h1><p>Authentic, privacy-safe credentials with public verification.</p></div>{setPage && <button onClick={() => setPage("dashboard")}>Dashboard</button>}</header>
    {message && <div className="certificate-message">{message}</div>}
    {mode === "verify" ? <div className="certificate-verify-box"><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Verification code"/><button onClick={verifyCode}>Verify</button>{verification && <div className={verification.verified ? "valid" : "invalid"}><h2>{verification.verified ? "Valid Certificate" : "Not Valid"}</h2>{verification.certificate && <><strong>{verification.certificate.title}</strong><p>{verification.certificate.recipientName}</p><small>{verification.certificate.publicId}</small></>}</div>}</div> : <>
      {canAdminister && mode !== "public" && <form className="certificate-issue" onSubmit={issue}><h2>Issue Certificate</h2><input required placeholder="User ID" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}/><input required placeholder="Certificate title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}/><input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}/><input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}/><textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}/><button type="submit">Issue</button></form>}
      {loading ? <p>Loading certificates...</p> : <div className="certificate-grid">{items.map((item) => <article key={item.publicId} className={`certificate-card ${item.status}`}><span>{item.category}</span><h2>{item.title}</h2><h3>{item.recipientName}</h3><p>{item.description}</p><small>{item.publicId} · {new Date(item.issuedAt).toLocaleDateString()}</small><div><a href={`/certificates/verify?code=${encodeURIComponent(item.publicId)}`}>Verify</a>{mode === "my" && <button onClick={() => showQr(item.publicId)}>QR</button>}{canAdminister && item.status === "issued" && <button className="danger" onClick={() => revoke(item.publicId)}>Revoke</button>}</div></article>)}{!items.length && <p>No certificates found.</p>}</div>}
    </>}
  </section>;
}
