import React, { useEffect, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://exalt-real-backend-6b6v.onrender.com";

const API = API_BASE.endsWith("/api")
  ? API_BASE.replace(/\/api$/, "")
  : API_BASE.replace(/\/+$/, "");

function AdminKycPanel() {
  const token = localStorage.getItem("token");

  const [kycList, setKycList] = useState([]);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const [details, setDetails] = useState({});
  const [detailLoadingId, setDetailLoadingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token || ""}`,
  });

  const loadKyc = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });

      if (filter !== "all") {
        params.set("status", filter);
      }

      const res = await fetch(
        `${API}/api/kyc/admin/all?${params.toString()}`,
        {
          headers: getAuthHeaders(),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.message ||
            `Failed to load KYC requests (${res.status})`
        );
      }

      setKycList(
        Array.isArray(data.kycList)
          ? data.kycList
          : []
      );

      setStats({
        total: Number(data.counts?.total || 0),
        pending: Number(data.counts?.pending || 0),
        approved: Number(data.counts?.approved || 0),
        rejected: Number(data.counts?.rejected || 0),
      });

      setPagination({
        page: Number(data.pagination?.page || 1),
        limit: Number(data.pagination?.limit || 20),
        total: Number(data.pagination?.total || 0),
        totalPages: Math.max(
          1,
          Number(data.pagination?.totalPages || 1)
        ),
      });
    } catch (err) {
      console.error("KYC load failed:", err);
      setKycList([]);
      setError(
        err?.message || "Failed to load KYC requests."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKyc();
  }, [page, filter]);

  const changeFilter = (nextFilter) => {
    setFilter(nextFilter);
    setPage(1);
  };

  const toggleDocuments = async (id) => {
    if (details[id]) {
      setDetails((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      return;
    }

    setDetailLoadingId(id);

    try {
      const res = await fetch(
        `${API}/api/kyc/admin/${id}`,
        {
          headers: getAuthHeaders(),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.message ||
            `Failed to load KYC documents (${res.status})`
        );
      }

      setDetails((current) => ({
        ...current,
        [id]: data.kyc || null,
      }));
    } catch (err) {
      console.error("KYC document load failed:", err);
      alert(
        err?.message || "Failed to load KYC documents."
      );
    } finally {
      setDetailLoadingId(null);
    }
  };

  const updateKyc = async (id, status) => {
    const action =
      status === "approved" ? "approve" : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this KYC request?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const res = await fetch(
        `${API}/api/kyc/admin/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.message ||
            `KYC update failed (${res.status})`
        );
      }

      alert(
        status === "approved"
          ? "KYC approved successfully."
          : "KYC rejected successfully."
      );

      setDetails((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });

      await loadKyc();
    } catch (err) {
      console.error("KYC update failed:", err);
      alert(
        err?.message || "KYC update failed."
      );
    }
  };

  return (
    <div className="panel">
      <h2>KYC Requests</h2>

      <div className="kyc-stats">
        <div onClick={() => changeFilter("all")}>
          Total: {stats.total}
        </div>

        <div onClick={() => changeFilter("pending")}>
          Pending: {stats.pending}
        </div>

        <div onClick={() => changeFilter("approved")}>
          Approved: {stats.approved}
        </div>

        <div onClick={() => changeFilter("rejected")}>
          Rejected: {stats.rejected}
        </div>
      </div>

      {error && (
        <div className="admin-error">
          <p>{error}</p>
          <button type="button" onClick={loadKyc}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <p>Loading KYC requests...</p>
      ) : !error && kycList.length === 0 ? (
        <p>No KYC requests found.</p>
      ) : (
        kycList.map((kyc) => {
          const detail = details[kyc._id];

          return (
            <div
              className="admin-card"
              key={kyc._id}
            >
              <h3>
                {kyc.fullName ||
                  kyc.userId?.name ||
                  "Unknown User"}
              </h3>

              <p>
                <b>Email:</b>{" "}
                {kyc.email ||
                  kyc.userId?.email ||
                  "N/A"}
              </p>

              <p>
                <b>User ID:</b>{" "}
                <span className="admin-kyc-user-uid">
                  {kyc.userId?._id ||
                    kyc.userId ||
                    "N/A"}
                </span>
              </p>

              <p>
                <b>Submitted:</b>{" "}
                {kyc.createdAt
                  ? new Date(
                      kyc.createdAt
                    ).toLocaleString()
                  : "N/A"}
              </p>

              <p>
                <b>Phone:</b>{" "}
                {kyc.phone || "N/A"}
              </p>

              <p>
                <b>Country:</b>{" "}
                {kyc.country || "N/A"}
              </p>

              <p>
                <b>ID Type:</b>{" "}
                {kyc.idType || "N/A"}
              </p>

              <p>
                <b>ID Number:</b>{" "}
                {kyc.idNumber || "N/A"}
              </p>

              <p>
                <b>Status:</b>{" "}
                <span
                  className={`kyc-status-badge ${kyc.status}`}
                >
                  {kyc.status === "approved"
                    ? "Approved"
                    : kyc.status === "rejected"
                    ? "Rejected"
                    : "Pending"}
                </span>
              </p>

              <button
                type="button"
                onClick={() =>
                  toggleDocuments(kyc._id)
                }
                disabled={
                  detailLoadingId === kyc._id
                }
              >
                {detailLoadingId === kyc._id
                  ? "Loading Documents..."
                  : detail
                  ? "Hide Documents"
                  : "View Documents"}
              </button>

              {detail && (
                <div className="kyc-documents">
                  {detail.cnicFront && (
                    <p>
                      <a
                        href={detail.cnicFront}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View CNIC Front
                      </a>
                    </p>
                  )}

                  {detail.cnicBack && (
                    <p>
                      <a
                        href={detail.cnicBack}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View CNIC Back
                      </a>
                    </p>
                  )}

                  {detail.passportImage && (
                    <p>
                      <a
                        href={detail.passportImage}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View Passport / National ID
                      </a>
                    </p>
                  )}

                  {detail.selfieImage && (
                    <p>
                      <a
                        href={detail.selfieImage}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View Selfie
                      </a>
                    </p>
                  )}

                  {!detail.cnicFront &&
                    !detail.cnicBack &&
                    !detail.passportImage &&
                    !detail.selfieImage && (
                      <p>No documents available.</p>
                    )}
                </div>
              )}

              <div className="kyc-actions">
                {kyc.status === "pending" ? (
                  <>
                    <button
                      className="kyc-approve-btn"
                      title="Approve this KYC request"
                      onClick={() =>
                        updateKyc(
                          kyc._id,
                          "approved"
                        )
                      }
                    >
                      Approve KYC
                    </button>

                    <button
                      className="kyc-reject-btn"
                      title="Reject this KYC request"
                      onClick={() =>
                        updateKyc(
                          kyc._id,
                          "rejected"
                        )
                      }
                    >
                      Reject KYC
                    </button>
                  </>
                ) : (
                  <span
                    className={`kyc-status-badge ${kyc.status}`}
                  >
                    {kyc.status === "approved"
                      ? "Approved"
                      : "Rejected"}
                  </span>
                )}
              </div>
            </div>
          );
        })
      )}

      {!loading &&
        !error &&
        pagination.totalPages > 1 && (
          <div className="kyc-pagination">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() =>
                setPage((current) =>
                  Math.max(1, current - 1)
                )
              }
            >
              Previous
            </button>

            <span>
              Page {pagination.page} of{" "}
              {pagination.totalPages}
            </span>

            <button
              type="button"
              disabled={
                page >= pagination.totalPages
              }
              onClick={() =>
                setPage((current) =>
                  current + 1
                )
              }
            >
              Next
            </button>
          </div>
        )}
    </div>
  );
}

export default AdminKycPanel;
