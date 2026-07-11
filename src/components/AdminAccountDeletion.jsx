import { useCallback, useEffect, useMemo, useState } from "react";
import "./AdminAccountDeletion.css";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://exalt-real-backend-6b6v.onrender.com";

const API = API_BASE.endsWith("/api")
  ? API_BASE.replace(/\/api$/, "")
  : API_BASE.replace(/\/+$/, "");

const STATUS_OPTIONS = [
  "all",
  "pending",
  "under_review",
  "approved",
  "rejected",
  "completed",
  "cancelled",
];

const STATUS_LABELS = {
  all: "All Requests",
  pending: "Pending",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
  cancelled: "Cancelled",
};

function AdminAccountDeletion() {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const token = localStorage.getItem("token");

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });

    window.setTimeout(() => {
      setMessage({ type: "", text: "" });
    }, 5000);
  }, []);

  const handleUnauthorizedResponse = (response) => {
    if (response.status === 401) {
      throw new Error(
        "Admin session expired. Please log in again."
      );
    }

    if (response.status === 403) {
      throw new Error(
        "Access denied. Only administrators can manage deletion requests."
      );
    }
  };

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);

      if (!token) {
        throw new Error("Admin login token is missing.");
      }

      const response = await fetch(
        `${API}/api/account-deletion/admin/requests`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      handleUnauthorizedResponse(response);

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load account deletion requests."
        );
      }

      const loadedRequests = Array.isArray(data.requests)
        ? data.requests
        : Array.isArray(data.data)
        ? data.data
        : [];

      setRequests(loadedRequests);
    } catch (error) {
      console.error("Account deletion load error:", error);
      setRequests([]);
      showMessage(
        "error",
        error.message ||
          "Unable to load account deletion requests."
      );
    } finally {
      setLoading(false);
    }
  }, [token, showMessage]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    const closeModalWithEscape = (event) => {
      if (event.key === "Escape" && selectedRequest) {
        setSelectedRequest(null);
        setAdminNote("");
        setRejectionReason("");
      }
    };

    window.addEventListener("keydown", closeModalWithEscape);

    return () => {
      window.removeEventListener(
        "keydown",
        closeModalWithEscape
      );
    };
  }, [selectedRequest]);

  const stats = useMemo(() => {
    const result = {
      all: requests.length,
      pending: 0,
      under_review: 0,
      approved: 0,
      rejected: 0,
      completed: 0,
      cancelled: 0,
    };

    requests.forEach((request) => {
      const status = String(
        request.status || "pending"
      ).toLowerCase();

      if (
        Object.prototype.hasOwnProperty.call(result, status)
      ) {
        result[status] += 1;
      }
    });

    return result;
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase();

    return requests.filter((request) => {
      const requestStatus = String(
        request.status || "pending"
      ).toLowerCase();

      const statusMatches =
        statusFilter === "all" ||
        requestStatus === statusFilter;

      const user = request.user || {};

      const searchableText = [
        user.name,
        user.email,
        user._id,
        request.fullName,
        request.email,
        request.userId,
        request.reason,
        request.details,
        request.status,
        request.requestSource,
        request.adminNote,
        request.rejectionReason,
      ]
        .filter(Boolean)
        .map((value) =>
          typeof value === "object"
            ? JSON.stringify(value)
            : String(value)
        )
        .join(" ")
        .toLowerCase();

      const searchMatches =
        !normalizedSearch ||
        searchableText.includes(normalizedSearch);

      return statusMatches && searchMatches;
    });
  }, [requests, searchTerm, statusFilter]);

  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatAmount = (value) => {
    const number = Number(value || 0);

    if (!Number.isFinite(number)) {
      return "0";
    }

    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 8,
    }).format(number);
  };

  const formatStatus = (status) => {
    const normalizedStatus = String(
      status || "pending"
    ).toLowerCase();

    return (
      STATUS_LABELS[normalizedStatus] ||
      normalizedStatus
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) =>
          letter.toUpperCase()
        )
    );
  };

  const formatSource = (source) => {
    return String(source || "web")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const getRequestUser = (request) => {
    return request?.user || {};
  };

  const getRequestUserId = (request) => {
    const user = getRequestUser(request);

    if (user?._id) return user._id;

    if (
      request?.userId &&
      typeof request.userId === "object"
    ) {
      return request.userId._id || "N/A";
    }

    return request?.userId || "N/A";
  };

  const getRequestUserName = (request) => {
    const user = getRequestUser(request);

    return (
      user?.name ||
      request?.fullName ||
      request?.name ||
      "Unknown User"
    );
  };

  const getRequestUserEmail = (request) => {
    const user = getRequestUser(request);

    return (
      user?.email ||
      request?.email ||
      "No email available"
    );
  };

  const openDetails = async (request) => {
    try {
      setSelectedRequest(request);
      setAdminNote(request.adminNote || "");
      setRejectionReason(
        request.rejectionReason || ""
      );
      setDetailsLoading(true);

      if (!token || !request?._id) {
        return;
      }

      const response = await fetch(
        `${API}/api/account-deletion/admin/${request._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      handleUnauthorizedResponse(response);

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load full request details."
        );
      }

      const fullRequest = data.request || data.data;

      if (fullRequest) {
        setSelectedRequest(fullRequest);
        setAdminNote(fullRequest.adminNote || "");
        setRejectionReason(
          fullRequest.rejectionReason || ""
        );
      }
    } catch (error) {
      console.error(
        "Account deletion details error:",
        error
      );

      showMessage(
        "error",
        error.message ||
          "Unable to load request details."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedRequest(null);
    setAdminNote("");
    setRejectionReason("");
    setDetailsLoading(false);
  };

  const updateRequestStatus = async (
    requestId,
    status
  ) => {
    const statusName =
      STATUS_LABELS[status] || formatStatus(status);

    if (
      status === "rejected" &&
      !rejectionReason.trim() &&
      !adminNote.trim()
    ) {
      showMessage(
        "error",
        "Please enter a rejection reason or admin note."
      );
      return;
    }

    if (
      status === "completed" &&
      selectedRequest?.complianceHold
    ) {
      showMessage(
        "error",
        "This request has a compliance hold and cannot be completed until the hold is removed."
      );
      return;
    }

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
            rejectionReason:
              rejectionReason.trim(),
          }),
        }
      );

      handleUnauthorizedResponse(response);

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to update deletion request."
        );
      }

      const updatedRequest =
        data.request || data.data;

      setRequests((current) =>
        current.map((request) =>
          request._id === requestId
            ? updatedRequest || {
                ...request,
                status,
                adminNote: adminNote.trim(),
                rejectionReason:
                  rejectionReason.trim(),
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
          rejectionReason:
            rejectionReason.trim(),
        }));
      }

      setAdminNote(
        updatedRequest?.adminNote || ""
      );

      setRejectionReason(
        updatedRequest?.rejectionReason || ""
      );

      showMessage(
        "success",
        `Request successfully marked as ${statusName}.`
      );
    } catch (error) {
      console.error(
        "Account deletion update error:",
        error
      );

      showMessage(
        "error",
        error.message ||
          "Unable to update deletion request."
      );
    } finally {
      setActionLoading("");
    }
  };

  const isActionBusy = Boolean(actionLoading);

  return (
    <div className="admin-deletion-page">
      <div className="admin-deletion-header">
        <div>
          <span className="admin-deletion-eyebrow">
            Account Security &amp; Compliance
          </span>

          <h1>Account Deletion Requests</h1>

          <p>
            Review deletion requests, verify balances,
            liabilities, open activity and compliance
            requirements before approving account closure.
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
            onClick={() =>
              setStatusFilter(status)
            }
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
            placeholder="Search by name, email, user ID, reason or status..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
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

            <p>
              Please wait while account requests are
              retrieved.
            </p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="admin-deletion-empty">
            <span>🗑️</span>

            <h3>No deletion requests found</h3>

            <p>
              There are currently no requests matching the
              selected search and status filters.
            </p>
          </div>
        ) : (
          <div className="admin-deletion-table-wrapper">
            <table className="admin-deletion-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Reason</th>
                  <th>Risk Review</th>
                  <th>Source</th>
                  <th>Requested</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredRequests.map((request) => {
                  const user =
                    getRequestUser(request);

                  const status = String(
                    request.status || "pending"
                  ).toLowerCase();

                  const userName =
                    getRequestUserName(request);

                  return (
                    <tr key={request._id}>
                      <td>
                        <div className="admin-deletion-user">
                          <div className="admin-deletion-avatar">
                            {userName
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>{userName}</strong>

                            <span>
                              {getRequestUserEmail(
                                request
                              )}
                            </span>

                            <small>
                              ID:{" "}
                              {getRequestUserId(
                                request
                              )}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong className="admin-deletion-reason">
                          {request.reason ||
                            "Not provided"}
                        </strong>

                        <p className="admin-deletion-details-preview">
                          {request.details ||
                            "No additional details"}
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
                                request.totalBalance ??
                                  user.balance ??
                                  0
                              )}
                            </b>
                          </span>

                          <span>
                            Hold:{" "}
                            <b>
                              {request.complianceHold
                                ? "Yes"
                                : "No"}
                            </b>
                          </span>
                        </div>
                      </td>

                      <td>
                        {formatSource(
                          request.requestSource
                        )}
                      </td>

                      <td>
                        {formatDate(request.createdAt)}
                      </td>

                      <td>
                        <span
                          className={`admin-deletion-status ${status}`}
                        >
                          {formatStatus(status)}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="admin-deletion-view-btn"
                          onClick={() =>
                            openDetails(request)
                          }
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
            if (
              event.target === event.currentTarget
            ) {
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
                  {getRequestUserName(
                    selectedRequest
                  )}
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
              {detailsLoading && (
                <div className="admin-deletion-message success">
                  Loading complete request details...
                </div>
              )}

              <section className="admin-deletion-modal-section">
                <h3>User Information</h3>

                <div className="admin-deletion-info-grid">
                  <div>
                    <span>Name</span>

                    <strong>
                      {getRequestUserName(
                        selectedRequest
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Email</span>

                    <strong>
                      {getRequestUserEmail(
                        selectedRequest
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>User ID</span>

                    <strong>
                      {getRequestUserId(
                        selectedRequest
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Account Status</span>

                    <strong>
                      {selectedRequest.user
                        ?.accountStatus ||
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
                    <span>User Role</span>

                    <strong>
                      {selectedRequest.user?.role ||
                        "user"}
                    </strong>
                  </div>

                  <div>
                    <span>Registered At</span>

                    <strong>
                      {formatDate(
                        selectedRequest.user
                          ?.createdAt
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Last Login</span>

                    <strong>
                      {formatDate(
                        selectedRequest.user
                          ?.lastLoginAt
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Request Source</span>

                    <strong>
                      {formatSource(
                        selectedRequest.requestSource
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Request Date</span>

                    <strong>
                      {formatDate(
                        selectedRequest.createdAt
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Requested IP</span>

                    <strong>
                      {selectedRequest.requestedIp ||
                        "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>Current Status</span>

                    <strong>
                      {formatStatus(
                        selectedRequest.status
                      )}
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
                      {selectedRequest.reason ||
                        "Not provided"}
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
                <h3>Financial &amp; Risk Review</h3>

                <div className="admin-deletion-risk-grid">
                  <div>
                    <span>Total Balance</span>

                    <strong>
                      {formatAmount(
                        selectedRequest.totalBalance ??
                          selectedRequest.user
                            ?.balance ??
                          0
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Positive Balance</span>

                    <strong>
                      {selectedRequest.hasPositiveBalance
                        ? "Yes"
                        : "No"}
                    </strong>
                  </div>

                  <div>
                    <span>Open Orders</span>

                    <strong>
                      {selectedRequest.hasOpenOrders
                        ? "Yes"
                        : "No"}
                    </strong>
                  </div>

                  <div>
                    <span>Open P2P Orders</span>

                    <strong>
                      {selectedRequest.hasOpenP2POrders
                        ? "Yes"
                        : "No"}
                    </strong>
                  </div>

                  <div>
                    <span>Pending Withdrawals</span>

                    <strong>
                      {selectedRequest.hasPendingWithdrawals
                        ? "Yes"
                        : "No"}
                    </strong>
                  </div>

                  <div>
                    <span>Open Futures</span>

                    <strong>
                      {selectedRequest.hasOpenFutures
                        ? "Yes"
                        : "No"}
                    </strong>
                  </div>

                  <div>
                    <span>Identity Verified</span>

                    <strong>
                      {selectedRequest.identityVerified
                        ? "Yes"
                        : "No"}
                    </strong>
                  </div>

                  <div>
                    <span>2FA Verified</span>

                    <strong>
                      {selectedRequest.twoFactorVerified
                        ? "Yes"
                        : "No"}
                    </strong>
                  </div>

                  <div>
                    <span>Compliance Hold</span>

                    <strong>
                      {selectedRequest.complianceHold
                        ? "Yes"
                        : "No"}
                    </strong>
                  </div>
                </div>
              </section>

              <section className="admin-deletion-modal-section">
                <h3>
                  Data Retention &amp; Compliance
                </h3>

                <div className="admin-deletion-request-box">
                  <div>
                    <span>Retention Required</span>

                    <strong>
                      {selectedRequest.retentionRequired
                        ? "Yes"
                        : "No"}
                    </strong>
                  </div>

                  <div>
                    <span>Retention Reason</span>

                    <p>
                      {selectedRequest.retentionReason ||
                        "No retention reason provided."}
                    </p>
                  </div>

                  <div>
                    <span>
                      Scheduled Deletion Date
                    </span>

                    <strong>
                      {formatDate(
                        selectedRequest.deleteAfter
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Approved At</span>

                    <strong>
                      {formatDate(
                        selectedRequest.approvedAt
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Reviewed At</span>

                    <strong>
                      {formatDate(
                        selectedRequest.reviewedAt
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Completed At</span>

                    <strong>
                      {formatDate(
                        selectedRequest.completedAt
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Cancelled At</span>

                    <strong>
                      {formatDate(
                        selectedRequest.cancelledAt
                      )}
                    </strong>
                  </div>
                </div>
              </section>

              {Array.isArray(
                selectedRequest.auditTrail
              ) &&
                selectedRequest.auditTrail.length >
                  0 && (
                  <section className="admin-deletion-modal-section">
                    <h3>Audit Trail</h3>

                    <div className="admin-deletion-request-box">
                      {selectedRequest.auditTrail
                        .slice()
                        .reverse()
                        .map((entry, index) => (
                          <div
                            key={
                              entry._id ||
                              `${entry.createdAt}-${index}`
                            }
                          >
                            <span>
                              {formatDate(
                                entry.createdAt
                              )}
                            </span>

                            <strong>
                              {entry.action ||
                                "Request updated"}
                            </strong>

                            <p>
                              Status:{" "}
                              {formatStatus(
                                entry.statusFrom
                              )}{" "}
                              →{" "}
                              {formatStatus(
                                entry.statusTo
                              )}
                            </p>

                            {entry.note && (
                              <p>
                                Note: {entry.note}
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  </section>
                )}

              <section className="admin-deletion-modal-section">
                <h3>Admin Note</h3>

                <textarea
                  placeholder="Add internal review notes, verification results or compliance instructions..."
                  value={adminNote}
                  onChange={(event) =>
                    setAdminNote(
                      event.target.value
                    )
                  }
                />
              </section>

              <section className="admin-deletion-modal-section">
                <h3>Rejection Reason</h3>

                <textarea
                  placeholder="Required when rejecting unless an admin note already explains the reason..."
                  value={rejectionReason}
                  onChange={(event) =>
                    setRejectionReason(
                      event.target.value
                    )
                  }
                />
              </section>

              <section className="admin-deletion-modal-section">
                <h3>Admin Actions</h3>

                <div className="admin-deletion-action-grid">
                  <button
                    type="button"
                    className="under-review"
                    disabled={isActionBusy}
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
                    disabled={isActionBusy}
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
                    disabled={isActionBusy}
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
                    disabled={
                      isActionBusy ||
                      selectedRequest.complianceHold
                    }
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
                <strong>Important:</strong> Do not
                permanently remove financial, KYC, AML,
                fraud-prevention, tax, dispute or
                regulatory records that must legally be
                retained. Account deletion must only be
                completed after balances, open orders,
                withdrawals and compliance restrictions
                have been reviewed.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAccountDeletion;