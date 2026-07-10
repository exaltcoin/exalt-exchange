import { useCallback, useEffect, useMemo, useState } from "react";
import "./AdminAccountDeletion.css";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://exalt-real-backend-6b6v.onrender.com";

const API = API_BASE.endsWith("/api")
  ? API_BASE.replace("/api", "")
  : API_BASE;

const STATUS_OPTIONS = [
  "all",
  "pending",
  "under_review",
  "approved",
  "rejected",
  "completed",
];

const STATUS_LABELS = {
  all: "All Requests",
  pending: "Pending",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

function AdminAccountDeletion() {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const token = localStorage.getItem("token");

  const showMessage = (type, text) => {
    setMessage({ type, text });

    window.setTimeout(() => {
      setMessage({ type: "", text: "" });
    }, 5000);
  };

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API}/api/account-deletion/admin/requests`,
        {
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load account deletion requests"
        );
      }

      setRequests(
        Array.isArray(data.requests)
          ? data.requests
          : Array.isArray(data.data)
          ? data.data
          : []
      );
    } catch (error) {
      console.error("Account deletion load error:", error);
      setRequests([]);
      showMessage("error", error.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const stats = useMemo(() => {
    const result = {
      all: requests.length,
      pending: 0,
      under_review: 0,
      approved: 0,
      rejected: 0,
      completed: 0,
    };

    requests.forEach((request) => {
      const status = request.status || "pending";

      if (Object.prototype.hasOwnProperty.call(result, status)) {
        result[status] += 1;
      }
    });

    return result;
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return requests.filter((request) => {
      const statusMatches =
        statusFilter === "all" ||
        (request.status || "pending") === statusFilter;

      const searchableText = [
        request.user?.name,
        request.user?.email,
        request.user?._id,
        request.email,
        request.userId,
        request.reason,
        request.details,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const searchMatches =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      return statusMatches && searchMatches;
    });
  }, [requests, searchTerm, statusFilter]);

  const updateRequestStatus = async (requestId, status) => {
    const statusName = STATUS_LABELS[status] || status;

    const confirmed = window.confirm(
      `Are you sure you want to mark this request as "${statusName}"?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(`${requestId}-${status}`);

      const response = await fetch(
        `${API}/api/account-deletion/admin/${requestId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token || ""}`,
          },
          body: JSON.stringify({
            status,
            adminNote: adminNote.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to update deletion request"
        );
      }

      const updatedRequest = data.request || data.data;

      setRequests((current) =>
        current.map((request) =>
          request._id === requestId
            ? updatedRequest || {
                ...request,
                status,
                adminNote: adminNote.trim(),
                updatedAt: new Date().toISOString(),
              }
            : request
        )
      );

      if (selectedRequest?._id === requestId) {
        setSelectedRequest((current) => ({
          ...current,
          ...(updatedRequest || {}),
          status,
          adminNote: adminNote.trim(),
        }));
      }

      setAdminNote("");
      showMessage(
        "success",
        `Request successfully marked as ${statusName}.`
      );
    } catch (error) {
      console.error("Account deletion update error:", error);
      showMessage("error", error.message);
    } finally {
      setActionLoading("");
    }
  };

  const openDetails = (request) => {
    setSelectedRequest(request);
    setAdminNote(request.adminNote || "");
  };

  const closeDetails = () => {
    setSelectedRequest(null);
    setAdminNote("");
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatAmount = (value) => {
    const number = Number(value || 0);

    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 8,
    }).format(number);
  };

  return (
    <div className="admin-deletion-page">
      <div className="admin-deletion-header">
        <div>
          <span className="admin-deletion-eyebrow">
            Account Security & Compliance
          </span>

          <h1>Account Deletion Requests</h1>

          <p>
            Review deletion requests, verify user liabilities and complete
            account closure safely.
          </p>
        </div>

        <button
          type="button"
          className="admin-deletion-refresh"
          onClick={loadRequests}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {message.text && (
        <div
          className={`admin-deletion-message ${message.type}`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      <div className="admin-deletion-stats">
        {STATUS_OPTIONS.map((status) => (
          <button
            type="button"
            key={status}
            className={`admin-deletion-stat-card ${status} ${
              statusFilter === status ? "active" : ""
            }`}
            onClick={() => setStatusFilter(status)}
          >
            <span>{STATUS_LABELS[status]}</span>
            <strong>{stats[status] || 0}</strong>
          </button>
        ))}
      </div>

      <div className="admin-deletion-toolbar">
        <div className="admin-deletion-search">
          <span>⌕</span>

          <input
            type="search"
            placeholder="Search by name, email, user ID or reason..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-deletion-content">
        {loading ? (
          <div className="admin-deletion-empty">
            <div className="admin-deletion-spinner" />
            <h3>Loading deletion requests</h3>
            <p>Please wait while account requests are retrieved.</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="admin-deletion-empty">
            <span>🗑️</span>
            <h3>No deletion requests found</h3>
            <p>
              There are currently no requests matching the selected filters.
            </p>
          </div>
        ) : (
          <div className="admin-deletion-table-wrapper">
            <table className="admin-deletion-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Reason</th>
                  <th>Account Risk</th>
                  <th>Requested</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredRequests.map((request) => {
                  const user = request.user || {};
                  const status = request.status || "pending";

                  return (
                    <tr key={request._id}>
                      <td>
                        <div className="admin-deletion-user">
                          <div className="admin-deletion-avatar">
                            {(user.name ||
                              request.name ||
                              request.email ||
                              "U")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {user.name ||
                                request.name ||
                                "Unknown User"}
                            </strong>

                            <span>
                              {user.email ||
                                request.email ||
                                "No email"}
                            </span>

                            <small>
                              ID:{" "}
                              {user._id ||
                                request.userId ||
                                "Unavailable"}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong className="admin-deletion-reason">
                          {request.reason || "Not provided"}
                        </strong>

                        <p className="admin-deletion-details-preview">
                          {request.details || "No additional details"}
                        </p>
                      </td>

                      <td>
                        <div className="admin-deletion-risk">
                          <span>
                            KYC:{" "}
                            <b>
                              {user.kycStatus ||
                                request.kycStatus ||
                                "Unknown"}
                            </b>
                          </span>

                          <span>
                            Balance:{" "}
                            <b>
                              {formatAmount(
                                request.totalBalance ||
                                  user.balance
                              )}
                            </b>
                          </span>
                        </div>
                      </td>

                      <td>{formatDate(request.createdAt)}</td>

                      <td>
                        <span
                          className={`admin-deletion-status ${status}`}
                        >
                          {STATUS_LABELS[status] || status}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="admin-deletion-view-btn"
                          onClick={() => openDetails(request)}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedRequest && (
        <div
          className="admin-deletion-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDetails();
            }
          }}
        >
          <div
            className="admin-deletion-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Account deletion request details"
          >
            <div className="admin-deletion-modal-header">
              <div>
                <span>Deletion Request Review</span>
                <h2>
                  {selectedRequest.user?.name ||
                    selectedRequest.name ||
                    "Account Request"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeDetails}
                aria-label="Close request details"
              >
                ×
              </button>
            </div>

            <div className="admin-deletion-modal-body">
              <section className="admin-deletion-modal-section">
                <h3>User Information</h3>

                <div className="admin-deletion-info-grid">
                  <div>
                    <span>Name</span>
                    <strong>
                      {selectedRequest.user?.name ||
                        selectedRequest.name ||
                        "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>Email</span>
                    <strong>
                      {selectedRequest.user?.email ||
                        selectedRequest.email ||
                        "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>User ID</span>
                    <strong>
                      {selectedRequest.user?._id ||
                        selectedRequest.userId ||
                        "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>Account Status</span>
                    <strong>
                      {selectedRequest.user?.accountStatus ||
                        selectedRequest.accountStatus ||
                        "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>KYC Status</span>
                    <strong>
                      {selectedRequest.user?.kycStatus ||
                        selectedRequest.kycStatus ||
                        "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>Request Date</span>
                    <strong>
                      {formatDate(selectedRequest.createdAt)}
                    </strong>
                  </div>
                </div>
              </section>

              <section className="admin-deletion-modal-section">
                <h3>Request Details</h3>

                <div className="admin-deletion-request-box">
                  <div>
                    <span>Reason</span>
                    <strong>
                      {selectedRequest.reason || "Not provided"}
                    </strong>
                  </div>

                  <div>
                    <span>Additional Details</span>
                    <p>
                      {selectedRequest.details ||
                        "No additional details were provided."}
                    </p>
                  </div>
                </div>
              </section>

              <section className="admin-deletion-modal-section">
                <h3>Financial & Risk Review</h3>

                <div className="admin-deletion-risk-grid">
                  <div>
                    <span>Total Balance</span>
                    <strong>
                      {formatAmount(
                        selectedRequest.totalBalance ||
                          selectedRequest.user?.balance
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Open Orders</span>
                    <strong>
                      {selectedRequest.openOrdersCount || 0}
                    </strong>
                  </div>

                  <div>
                    <span>Open P2P Orders</span>
                    <strong>
                      {selectedRequest.openP2PCount || 0}
                    </strong>
                  </div>

                  <div>
                    <span>Pending Withdrawals</span>
                    <strong>
                      {selectedRequest.pendingWithdrawalsCount || 0}
                    </strong>
                  </div>

                  <div>
                    <span>Open Futures</span>
                    <strong>
                      {selectedRequest.openFuturesCount || 0}
                    </strong>
                  </div>

                  <div>
                    <span>Compliance Hold</span>
                    <strong>
                      {selectedRequest.complianceHold ? "Yes" : "No"}
                    </strong>
                  </div>
                </div>
              </section>

              <section className="admin-deletion-modal-section">
                <h3>Admin Note</h3>

                <textarea
                  placeholder="Add internal review notes, verification results or rejection reason..."
                  value={adminNote}
                  onChange={(event) =>
                    setAdminNote(event.target.value)
                  }
                />
              </section>

              <section className="admin-deletion-modal-section">
                <h3>Admin Actions</h3>

                <div className="admin-deletion-action-grid">
                  <button
                    type="button"
                    className="under-review"
                    disabled={Boolean(actionLoading)}
                    onClick={() =>
                      updateRequestStatus(
                        selectedRequest._id,
                        "under_review"
                      )
                    }
                  >
                    {actionLoading ===
                    `${selectedRequest._id}-under_review`
                      ? "Updating..."
                      : "Mark Under Review"}
                  </button>

                  <button
                    type="button"
                    className="approve"
                    disabled={Boolean(actionLoading)}
                    onClick={() =>
                      updateRequestStatus(
                        selectedRequest._id,
                        "approved"
                      )
                    }
                  >
                    {actionLoading ===
                    `${selectedRequest._id}-approved`
                      ? "Updating..."
                      : "Approve Request"}
                  </button>

                  <button
                    type="button"
                    className="reject"
                    disabled={Boolean(actionLoading)}
                    onClick={() =>
                      updateRequestStatus(
                        selectedRequest._id,
                        "rejected"
                      )
                    }
                  >
                    {actionLoading ===
                    `${selectedRequest._id}-rejected`
                      ? "Updating..."
                      : "Reject Request"}
                  </button>

                  <button
                    type="button"
                    className="complete"
                    disabled={Boolean(actionLoading)}
                    onClick={() =>
                      updateRequestStatus(
                        selectedRequest._id,
                        "completed"
                      )
                    }
                  >
                    {actionLoading ===
                    `${selectedRequest._id}-completed`
                      ? "Updating..."
                      : "Mark Completed"}
                  </button>
                </div>
              </section>

              <div className="admin-deletion-compliance-note">
                <strong>Important:</strong> Do not permanently remove
                financial, KYC, AML, fraud-prevention, tax or regulatory
                records that must legally be retained.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAccountDeletion;