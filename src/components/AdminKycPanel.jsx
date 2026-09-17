import React, { useEffect, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://api.exaltexchange.io";
const API = API_BASE.endsWith("/api")
  ? API_BASE.replace(/\/api$/, "")
  : API_BASE.replace(/\/+$/, "");

function AdminKycPanel() {
  const token = localStorage.getItem("token");
  const [kycList, setKycList] = useState([]);
  const [filter, setFilter] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  /*
    Production bug fix: loadState distinguishes a genuinely empty
    result from a request failure. Before this fix, `loadKyc` did
    `data.kycList || data.kyc || data.requests || []`, which
    silently turned ANY failed response (a 500 from the backend's
    memory-limit crash, a network error, anything) into the exact
    same empty array a real zero-record success would produce -
    "Total: 0 / No KYC requests found" either way, with no way to
    tell them apart. loadState is the fix: "error" now renders a
    real error message with a Retry action; only "ready" with an
    empty kycList renders "No KYC requests found".
  */
  const [loadState, setLoadState] = useState("loading");
  const [loadErrorMessage, setLoadErrorMessage] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /*
    Document images are no longer part of the list response (see
    the backend fix in kycRoutes.js - GET /api/kyc/admin/all now
    excludes cnicFront/cnicBack/passportImage/selfieImage entirely,
    which is the actual fix for the production memory-limit crash).
    They're fetched on demand, per record, only when an admin
    actually opens a specific submission - keyed by kyc id.
  */
  const [expandedId, setExpandedId] = useState(null);
  const [documentsById, setDocumentsById] = useState({});
  const [documentLoadStateById, setDocumentLoadStateById] = useState({});

  const loadKyc = async (targetPage = page) => {
    setLoadState("loading");
    setLoadErrorMessage("");

    try {
      const res = await fetch(
        `${API}/api/kyc/admin/all?page=${targetPage}&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        setLoadState("error");
        setLoadErrorMessage(
          data?.message ||
            "Unable to load KYC requests right now."
        );
        return;
      }

      const list = Array.isArray(data.kycList) ? data.kycList : [];
      const aggregateCounts =
        data.statusCounts || data.counts || {};

      setKycList(list);

      setTotalPages(
        Math.max(
          1,
          Number(
            data.pagination?.totalPages ??
              data.totalPages ??
              1
          )
        )
      );

      setPage(
        Number(
          data.pagination?.page ??
            data.page ??
            targetPage
        )
      );

      setStats({
        total: Number(aggregateCounts.total || 0),
        pending: Number(aggregateCounts.pending || 0),
        approved: Number(aggregateCounts.approved || 0),
        rejected: Number(aggregateCounts.rejected || 0),
      });

      setLoadState("ready");
    } catch (err) {
      console.error(err);
      setLoadState("error");
      setLoadErrorMessage("Unable to load KYC requests right now.");
    }
  };

  const loadDocuments = async (id) => {
    setDocumentLoadStateById((prev) => ({ ...prev, [id]: "loading" }));

    try {
      const res = await fetch(`${API}/api/kyc/admin/${id}`, {
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        setDocumentLoadStateById((prev) => ({ ...prev, [id]: "error" }));
        return;
      }

      setDocumentsById((prev) => ({ ...prev, [id]: data.kyc }));
      setDocumentLoadStateById((prev) => ({ ...prev, [id]: "ready" }));
    } catch (err) {
      console.error(err);
      setDocumentLoadStateById((prev) => ({ ...prev, [id]: "error" }));
    }
  };

  const toggleDocuments = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(id);

    if (!documentsById[id] && documentLoadStateById[id] !== "loading") {
      loadDocuments(id);
    }
  };

  const updateKyc = async (id, status) => {
    try {
      const actionText = status === "approved" ? "approve" : "reject";

      const confirmAction = window.confirm(
        `Are you sure you want to ${actionText} this KYC request?`
      );

      if (!confirmAction) return;

      const res = await fetch(`${API}/api/kyc/admin/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        throw new Error(
          data?.message ||
            `KYC update failed (${res.status})`
        );
      }

      if (status === "approved") {
        alert(
          "✅ KYC Approved Successfully.\n\nThe user has been verified and notified."
        );
      } else {
        alert("❌ KYC Rejected.\n\nThe verification request has been declined.");
      }

      await loadKyc(page);
    } catch (err) {
      console.error("KYC update failed:", err);
      alert(err?.message || "KYC update failed");
    }
  };

  useEffect(() => {
    loadKyc(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredKyc =
    filter === "all"
      ? kycList
      : kycList.filter((item) => item.status === filter);

  return (
    <div className="panel">
      <h2>KYC Requests</h2>

      <div className="kyc-stats">
        <div onClick={() => setFilter("all")}>Total: {stats.total}</div>
        <div onClick={() => setFilter("pending")}>
          Pending: {stats.pending}
        </div>
        <div onClick={() => setFilter("approved")}>
          Approved: {stats.approved}
        </div>
        <div onClick={() => setFilter("rejected")}>
          Rejected: {stats.rejected}
        </div>
      </div>

      {loadState === "loading" ? (
        <p>Loading KYC requests...</p>
      ) : loadState === "error" ? (
        <div className="kyc-load-error" role="alert">
          <p>{loadErrorMessage || "Unable to load KYC requests right now."}</p>
          <button type="button" onClick={() => loadKyc(page)}>
            Retry
          </button>
        </div>
      ) : filteredKyc.length === 0 ? (
        <p>No KYC requests found.</p>
      ) : (
        <>
          {filteredKyc.map((kyc) => (
            <div className="admin-card" key={kyc._id}>
              <h3>{kyc.fullName || kyc.name || kyc.userId?.name || "Unknown User"}</h3>
              <p>
                <b>Email:</b> {kyc.email || kyc.userId?.email || "N/A"}
              </p>
              <p>
                <b>User ID:</b>{" "}
                <span className="admin-kyc-user-uid">
                  {kyc.uid || kyc.userUid || kyc.user?.uid || kyc.userId?._id || kyc.userId || "N/A"}
                </span>
              </p>
              <p>
                <b>Submitted:</b>{" "}
                {kyc.createdAt
                  ? new Date(kyc.createdAt).toLocaleString()
                  : "N/A"}
              </p>
              <p>
                <b>Phone:</b> {kyc.phone || "N/A"}
              </p>
              <p>
                <b>Country:</b> {kyc.country || "N/A"}
              </p>
              <p>
                <b>ID Type:</b> {kyc.idType || "N/A"}
              </p>
              <p>
                <b>ID Number:</b> {kyc.idNumber || "N/A"}
              </p>
              <p>
                <b>Status:</b>
                <span className={`kyc-status-badge ${kyc.status}`}>
                  {kyc.status === "approved"
                    ? "🟢 Approved"
                    : kyc.status === "rejected"
                      ? "🔴 Rejected"
                      : "🟡 Pending"}
                </span>
              </p>

              <button
                type="button"
                className="kyc-view-documents-btn"
                onClick={() => toggleDocuments(kyc._id)}
              >
                {expandedId === kyc._id
                  ? "Hide Documents"
                  : "View Documents"}
              </button>

              {expandedId === kyc._id ? (
                documentLoadStateById[kyc._id] === "loading" ? (
                  <p>Loading documents...</p>
                ) : documentLoadStateById[kyc._id] === "error" ? (
                  <div role="alert">
                    <p>Unable to load documents right now.</p>
                    <button
                      type="button"
                      onClick={() => loadDocuments(kyc._id)}
                    >
                      Retry
                    </button>
                  </div>
                ) : documentsById[kyc._id] ? (
                  <div className="kyc-documents">
                    {documentsById[kyc._id].cnicFront && (
                      <p>
                        <a
                          href={documentsById[kyc._id].cnicFront}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View CNIC Front
                        </a>
                      </p>
                    )}
                    {documentsById[kyc._id].selfieImage && (
                      <p>
                        <a
                          href={documentsById[kyc._id].selfieImage}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View Selfie
                        </a>
                      </p>
                    )}
                    {documentsById[kyc._id].cnicBack && (
                      <p>
                        <a
                          href={documentsById[kyc._id].cnicBack}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View CNIC Back
                        </a>
                      </p>
                    )}
                    {documentsById[kyc._id].passportImage && (
                      <p>
                        <a
                          href={documentsById[kyc._id].passportImage}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View Passport / National ID
                        </a>
                      </p>
                    )}
                  </div>
                ) : null
              ) : null}

              <div className="kyc-actions">
                {kyc.status === "pending" ? (
                  <>
                    <button
                      className="kyc-approve-btn"
                      title="Approve this KYC request"
                      onClick={() => updateKyc(kyc._id, "approved")}
                    >
                      ✅ Approve KYC
                    </button>

                    <button
                      className="kyc-reject-btn"
                      title="Reject this KYC request"
                      onClick={() => updateKyc(kyc._id, "rejected")}
                    >
                      ❌ Reject KYC
                    </button>
                  </>
                ) : (
                  <span className={`kyc-status-badge ${kyc.status}`}>
                    {kyc.status === "approved" ? "Approved" : "Rejected"}
                  </span>
                )}
              </div>
            </div>
          ))}

          {totalPages > 1 ? (
            <div className="kyc-pagination">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => loadKyc(page - 1)}
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => loadKyc(page + 1)}
              >
                Next
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export default AdminKycPanel;
