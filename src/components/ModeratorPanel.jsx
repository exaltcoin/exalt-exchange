import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../i18n";
import "./ModeratorPanel.css";

const API_FALLBACK =
  "https://exalt-real-backend-6b6v.onrender.com";

const TABS = [
  ["overview", "Overview", "📊"],
  ["support", "Support", "🎧"],
  ["community", "Community", "👥"],
  ["reports", "Reports", "🚩"],
  ["content", "Content", "📝"],
];

const readStoredUser = () => {
  try {
    return JSON.parse(
      localStorage.getItem("user") || "{}"
    );
  } catch {
    return {};
  }
};

function ModeratorPanel({ setPage }) {
  const { t } = useI18n();

  const API_BASE =
    import.meta.env.VITE_API_URL || API_FALLBACK;

  const API = API_BASE.endsWith("/api")
    ? API_BASE.replace("/api", "")
    : API_BASE;

  const [currentUser, setCurrentUser] =
    useState(readStoredUser);

  const [activeTab, setActiveTab] =
    useState("overview");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [supportTickets, setSupportTickets] =
    useState([]);

  const [communityReports, setCommunityReports] =
    useState([]);

  const [contentItems, setContentItems] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [summary, setSummary] = useState({
    openTickets: 0,
    resolvedTickets: 0,
    pendingReports: 0,
    reviewedReports: 0,
    pendingContent: 0,
  });

  const token =
    localStorage.getItem("token");

  const role =
    String(currentUser?.role || "")
      .trim()
      .toLowerCase();

  const hasAccess =
    role === "moderator" ||
    role === "admin" ||
    role === "super_admin" ||
    role === "owner" ||
    currentUser?.isAdmin === true ||
    currentUser?.isOwner === true;

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const translate = (
    key,
    fallback
  ) => {
    try {
      const value = t(key, {
        defaultValue: fallback,
        ns: "settings",
      });

      return value && value !== key
        ? value
        : fallback;
    } catch {
      return fallback;
    }
  };

  const showSuccess = (text) => {
    setErrorMessage("");
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 4000);
  };

  const showError = (text) => {
    setMessage("");
    setErrorMessage(text);

    window.setTimeout(() => {
      setErrorMessage("");
    }, 5000);
  };

  const fetchJson = async (
    url,
    options = {}
  ) => {
    const response = await fetch(
      url,
      options
    );

    const data = await response
      .json()
      .catch(() => ({}));

    if (
      !response.ok ||
      data?.success === false
    ) {
      throw new Error(
        data?.message ||
          `Request failed with status ${response.status}`
      );
    }

    return data;
  };

  const safeRequest = async (
    url,
    options = {}
  ) => {
    try {
      return await fetchJson(
        url,
        options
      );
    } catch (error) {
      console.error(
        "Moderator request failed:",
        url,
        error
      );

      return null;
    }
  };

  const normalizeArray = (
    data,
    preferredKeys = []
  ) => {
    for (const key of preferredKeys) {
      if (Array.isArray(data?.[key])) {
        return data[key];
      }
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    if (Array.isArray(data)) {
      return data;
    }

    return [];
  };

  const loadDashboard = async () => {
    if (!token || !hasAccess) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [
        supportData,
        reportsData,
        contentData,
      ] = await Promise.all([
        safeRequest(
          `${API}/api/support-ticket/admin/all`,
          {
            headers: authHeaders,
          }
        ),

        safeRequest(
          `${API}/api/social/admin/reports`,
          {
            headers: authHeaders,
          }
        ),

        safeRequest(
          `${API}/api/social/admin/content`,
          {
            headers: authHeaders,
          }
        ),
      ]);

      const nextTickets = normalizeArray(
        supportData,
        [
          "tickets",
          "requests",
        ]
      );

      const nextReports = normalizeArray(
        reportsData,
        [
          "reports",
          "items",
        ]
      );

      const nextContent = normalizeArray(
        contentData,
        [
          "content",
          "posts",
          "items",
        ]
      );

      setSupportTickets(nextTickets);
      setCommunityReports(nextReports);
      setContentItems(nextContent);

      const openTickets =
        nextTickets.filter(
          (item) =>
            ![
              "closed",
              "resolved",
            ].includes(
              String(
                item?.status || ""
              ).toLowerCase()
            )
        ).length;

      const resolvedTickets =
        nextTickets.filter(
          (item) =>
            [
              "closed",
              "resolved",
            ].includes(
              String(
                item?.status || ""
              ).toLowerCase()
            )
        ).length;

      const pendingReports =
        nextReports.filter(
          (item) =>
            String(
              item?.status || "pending"
            ).toLowerCase() ===
            "pending"
        ).length;

      const reviewedReports =
        nextReports.filter(
          (item) =>
            [
              "reviewed",
              "resolved",
              "dismissed",
              "actioned",
            ].includes(
              String(
                item?.status || ""
              ).toLowerCase()
            )
        ).length;

      const pendingContent =
        nextContent.filter(
          (item) =>
            [
              "pending",
              "flagged",
              "review",
            ].includes(
              String(
                item?.status || ""
              ).toLowerCase()
            )
        ).length;

      setSummary({
        openTickets,
        resolvedTickets,
        pendingReports,
        reviewedReports,
        pendingContent,
      });
    } catch (error) {
      console.error(
        "Moderator dashboard load failed:",
        error
      );

      showError(
        error.message ||
          "Failed to load moderator dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setCurrentUser(readStoredUser());
    loadDashboard();
  }, []);

  const refreshDashboard = async () => {
    setRefreshing(true);
    await loadDashboard();
  };

  const updateTicketStatus = async (
    id,
    status
  ) => {
    try {
      await fetchJson(
        `${API}/api/support-ticket/admin/${id}/status`,
        {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({
            status,
          }),
        }
      );

      showSuccess(
        `Support ticket marked ${status}.`
      );

      await loadDashboard();
    } catch (error) {
      showError(error.message);
    }
  };

  const updateReportStatus = async (
    id,
    status,
    note = ""
  ) => {
    try {
      await fetchJson(
        `${API}/api/social/admin/reports/${id}`,
        {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({
            status,
            note,
          }),
        }
      );

      showSuccess(
        `Community report marked ${status}.`
      );

      await loadDashboard();
    } catch (error) {
      showError(error.message);
    }
  };

  const updateContentStatus = async (
    id,
    status
  ) => {
    try {
      await fetchJson(
        `${API}/api/social/admin/content/${id}`,
        {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({
            status,
          }),
        }
      );

      showSuccess(
        `Content marked ${status}.`
      );

      await loadDashboard();
    } catch (error) {
      showError(error.message);
    }
  };

  const formatDate = (value) => {
    if (!value) return "N/A";

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "N/A";
    }

    return date.toLocaleString();
  };

  const filteredTickets = useMemo(() => {
    const q =
      search.trim().toLowerCase();

    return supportTickets.filter(
      (item) => {
        const status =
          String(
            item?.status || "open"
          ).toUpperCase();

        const matchStatus =
          statusFilter === "ALL" ||
          status === statusFilter;

        const matchSearch =
          !q ||
          String(
            item?.subject ||
              item?.title ||
              ""
          )
            .toLowerCase()
            .includes(q) ||
          String(
            item?.email ||
              item?.userId?.email ||
              ""
          )
            .toLowerCase()
            .includes(q);

        return (
          matchStatus &&
          matchSearch
        );
      }
    );
  }, [
    supportTickets,
    search,
    statusFilter,
  ]);

  const filteredReports = useMemo(() => {
    const q =
      search.trim().toLowerCase();

    return communityReports.filter(
      (item) => {
        const status =
          String(
            item?.status || "pending"
          ).toUpperCase();

        const matchStatus =
          statusFilter === "ALL" ||
          status === statusFilter;

        const matchSearch =
          !q ||
          String(
            item?.reason ||
              item?.description ||
              item?.category ||
              ""
          )
            .toLowerCase()
            .includes(q) ||
          String(
            item?.reportedUser?.email ||
              item?.userId?.email ||
              ""
          )
            .toLowerCase()
            .includes(q);

        return (
          matchStatus &&
          matchSearch
        );
      }
    );
  }, [
    communityReports,
    search,
    statusFilter,
  ]);

  const filteredContent = useMemo(() => {
    const q =
      search.trim().toLowerCase();

    return contentItems.filter(
      (item) => {
        const status =
          String(
            item?.status || "pending"
          ).toUpperCase();

        const matchStatus =
          statusFilter === "ALL" ||
          status === statusFilter;

        const matchSearch =
          !q ||
          String(
            item?.content ||
              item?.text ||
              item?.title ||
              ""
          )
            .toLowerCase()
            .includes(q) ||
          String(
            item?.userId?.email ||
              item?.author?.email ||
              ""
          )
            .toLowerCase()
            .includes(q);

        return (
          matchStatus &&
          matchSearch
        );
      }
    );
  }, [
    contentItems,
    search,
    statusFilter,
  ]);

  if (!hasAccess) {
    return (
      <div className="moderator-page">
        <div className="moderator-access-card">
          <div className="moderator-access-icon">
            🔒
          </div>

          <h1>
            {translate(
              "moderatorAccessRequired",
              "Moderator Access Required"
            )}
          </h1>

          <p>
            This panel is restricted to
            authorized moderators and
            management accounts.
          </p>

          <button
            type="button"
            onClick={() =>
              setPage &&
              setPage("dashboard")
            }
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="moderator-page">
        <div className="moderator-loading-card">
          <div className="moderator-loader" />

          <h2>
            Loading Moderator Panel
          </h2>

          <p>
            Loading support, community
            reports and content review
            data.
          </p>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <>
      <div className="moderator-hero">
        <div>
          <span className="moderator-eyebrow">
            COMMUNITY OPERATIONS
          </span>

          <h1>
            Exalt Exchange Moderator
          </h1>

          <p>
            Community, support and content
            moderation without access to
            financial or owner controls.
          </p>
        </div>

        <button
          type="button"
          className="moderator-primary-btn"
          disabled={refreshing}
          onClick={refreshDashboard}
        >
          {refreshing
            ? "Refreshing..."
            : "Refresh Dashboard"}
        </button>
      </div>

      <div className="moderator-stat-grid">
        <div className="moderator-stat-card">
          <span>Open Tickets</span>
          <strong>
            {summary.openTickets}
          </strong>
          <p>
            Support requests requiring
            attention.
          </p>
        </div>

        <div className="moderator-stat-card">
          <span>
            Resolved Tickets
          </span>
          <strong>
            {summary.resolvedTickets}
          </strong>
          <p>
            Support cases completed by
            the team.
          </p>
        </div>

        <div className="moderator-stat-card">
          <span>
            Pending Reports
          </span>
          <strong>
            {summary.pendingReports}
          </strong>
          <p>
            Community reports awaiting
            review.
          </p>
        </div>

        <div className="moderator-stat-card">
          <span>
            Reviewed Reports
          </span>
          <strong>
            {summary.reviewedReports}
          </strong>
          <p>
            Reports already reviewed or
            resolved.
          </p>
        </div>

        <div className="moderator-stat-card">
          <span>
            Pending Content
          </span>
          <strong>
            {summary.pendingContent}
          </strong>
          <p>
            Flagged or pending content
            requiring review.
          </p>
        </div>
      </div>

      <div className="moderator-dashboard-grid">
        <div className="moderator-panel">
          <div className="moderator-panel-head">
            <div>
              <h2>
                Quick Moderator Actions
              </h2>

              <p>
                Open community and support
                tools.
              </p>
            </div>
          </div>

          <div className="moderator-quick-grid">
            {TABS.slice(1).map(
              ([
                key,
                label,
                icon,
              ]) => (
                <button
                  type="button"
                  key={key}
                  onClick={() =>
                    setActiveTab(key)
                  }
                >
                  <span>{icon}</span>
                  {label}
                </button>
              )
            )}
          </div>
        </div>

        <div className="moderator-panel">
          <div className="moderator-panel-head">
            <div>
              <h2>
                Permission Boundary
              </h2>

              <p>
                Moderator access is limited
                to community operations.
              </p>
            </div>
          </div>

          <div className="moderator-security-list">
            <div>
              <span>
                User Funds
              </span>
              <strong>
                No Access
              </strong>
            </div>

            <div>
              <span>
                Deposit Approval
              </span>
              <strong>
                No Access
              </strong>
            </div>

            <div>
              <span>
                Withdrawal Approval
              </span>
              <strong>
                No Access
              </strong>
            </div>

            <div>
              <span>
                Exchange Settings
              </span>
              <strong>
                No Access
              </strong>
            </div>

            <div>
              <span>
                Community Support
              </span>
              <strong>
                Allowed
              </strong>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderTools = () => (
    <div className="moderator-tools">
      <input
        placeholder="Search records..."
        value={search}
        onChange={(event) =>
          setSearch(
            event.target.value
          )
        }
      />

      <select
        value={statusFilter}
        onChange={(event) =>
          setStatusFilter(
            event.target.value
          )
        }
      >
        <option value="ALL">
          All Statuses
        </option>

        <option value="OPEN">
          Open
        </option>

        <option value="PENDING">
          Pending
        </option>

        <option value="RESOLVED">
          Resolved
        </option>

        <option value="CLOSED">
          Closed
        </option>

        <option value="REVIEWED">
          Reviewed
        </option>

        <option value="DISMISSED">
          Dismissed
        </option>
      </select>
    </div>
  );

  const renderSupport = () => (
    <div className="moderator-panel">
      <div className="moderator-panel-head">
        <div>
          <h2>
            Support Tickets
          </h2>

          <p>
            Review and resolve user
            support requests.
          </p>
        </div>

        <button
          type="button"
          className="moderator-primary-btn"
          onClick={() =>
            setPage &&
            setPage("support")
          }
        >
          Open Full Support
        </button>
      </div>

      {renderTools()}

      <div className="moderator-list">
        {filteredTickets.length === 0 ? (
          <div className="moderator-empty">
            No support tickets found.
          </div>
        ) : (
          filteredTickets.map(
            (item) => (
              <div
                className="moderator-item"
                key={
                  item._id ||
                  item.id
                }
              >
                <div>
                  <strong>
                    {item.subject ||
                      item.title ||
                      "Support Ticket"}
                  </strong>

                  <span>
                    {item.userId?.email ||
                      item.email ||
                      "N/A"}
                  </span>

                  <small>
                    {formatDate(
                      item.createdAt
                    )}
                  </small>
                </div>

                <div>
                  <span
                    className={`moderator-badge ${String(
                      item.status ||
                        "open"
                    ).toLowerCase()}`}
                  >
                    {String(
                      item.status ||
                        "open"
                    ).toUpperCase()}
                  </span>

                  {![
                    "closed",
                    "resolved",
                  ].includes(
                    String(
                      item.status || ""
                    ).toLowerCase()
                  ) && (
                    <div className="moderator-actions">
                      <button
                        type="button"
                        className="review"
                        onClick={() =>
                          updateTicketStatus(
                            item._id ||
                              item.id,
                            "in_progress"
                          )
                        }
                      >
                        In Progress
                      </button>

                      <button
                        type="button"
                        className="resolve"
                        onClick={() =>
                          updateTicketStatus(
                            item._id ||
                              item.id,
                            "resolved"
                          )
                        }
                      >
                        Resolve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  );

  const renderCommunity = () => (
    <div className="moderator-panel">
      <div className="moderator-panel-head">
        <div>
          <h2>
            Community Operations
          </h2>

          <p>
            Monitor community activity and
            direct users to support.
          </p>
        </div>
      </div>

      <div className="moderator-community-grid">
        <div className="moderator-community-card">
          <span>💬</span>
          <h3>
            Community Guidance
          </h3>
          <p>
            Help users understand exchange
            features and official channels.
          </p>
        </div>

        <div className="moderator-community-card">
          <span>🛡️</span>
          <h3>
            Scam Prevention
          </h3>
          <p>
            Identify impersonation,
            phishing and suspicious
            community activity.
          </p>
        </div>

        <div className="moderator-community-card">
          <span>📢</span>
          <h3>
            Official Updates
          </h3>
          <p>
            Share only approved Exalt
            Exchange announcements.
          </p>
        </div>

        <div className="moderator-community-card">
          <span>🎧</span>
          <h3>
            Support Escalation
          </h3>
          <p>
            Escalate account or financial
            issues to authorized admins.
          </p>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="moderator-panel">
      <div className="moderator-panel-head">
        <div>
          <h2>
            Community Reports
          </h2>

          <p>
            Review user-submitted reports
            and moderation cases.
          </p>
        </div>
      </div>

      {renderTools()}

      <div className="moderator-list">
        {filteredReports.length === 0 ? (
          <div className="moderator-empty">
            No community reports found.
          </div>
        ) : (
          filteredReports.map(
            (item) => (
              <div
                className="moderator-item"
                key={
                  item._id ||
                  item.id
                }
              >
                <div>
                  <strong>
                    {item.category ||
                      item.reason ||
                      "Community Report"}
                  </strong>

                  <span>
                    {item.description ||
                      "No description provided."}
                  </span>

                  <small>
                    {formatDate(
                      item.createdAt
                    )}
                  </small>
                </div>

                <div>
                  <span
                    className={`moderator-badge ${String(
                      item.status ||
                        "pending"
                    ).toLowerCase()}`}
                  >
                    {String(
                      item.status ||
                        "pending"
                    ).toUpperCase()}
                  </span>

                  {String(
                    item.status ||
                      "pending"
                  ).toLowerCase() ===
                    "pending" && (
                    <div className="moderator-actions">
                      <button
                        type="button"
                        className="review"
                        onClick={() =>
                          updateReportStatus(
                            item._id ||
                              item.id,
                            "reviewed"
                          )
                        }
                      >
                        Mark Reviewed
                      </button>

                      <button
                        type="button"
                        className="resolve"
                        onClick={() =>
                          updateReportStatus(
                            item._id ||
                              item.id,
                            "resolved"
                          )
                        }
                      >
                        Resolve
                      </button>

                      <button
                        type="button"
                        className="dismiss"
                        onClick={() =>
                          updateReportStatus(
                            item._id ||
                              item.id,
                            "dismissed"
                          )
                        }
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  );

  const renderContent = () => (
    <div className="moderator-panel">
      <div className="moderator-panel-head">
        <div>
          <h2>
            Content Review
          </h2>

          <p>
            Review flagged community
            posts and content.
          </p>
        </div>
      </div>

      {renderTools()}

      <div className="moderator-list">
        {filteredContent.length === 0 ? (
          <div className="moderator-empty">
            No content records found.
          </div>
        ) : (
          filteredContent.map(
            (item) => (
              <div
                className="moderator-item"
                key={
                  item._id ||
                  item.id
                }
              >
                <div>
                  <strong>
                    {item.title ||
                      "Community Content"}
                  </strong>

                  <span>
                    {String(
                      item.content ||
                        item.text ||
                        ""
                    ).slice(0, 220) ||
                      "No content preview."}
                  </span>

                  <small>
                    {formatDate(
                      item.createdAt
                    )}
                  </small>
                </div>

                <div>
                  <span
                    className={`moderator-badge ${String(
                      item.status ||
                        "pending"
                    ).toLowerCase()}`}
                  >
                    {String(
                      item.status ||
                        "pending"
                    ).toUpperCase()}
                  </span>

                  <div className="moderator-actions">
                    <button
                      type="button"
                      className="resolve"
                      onClick={() =>
                        updateContentStatus(
                          item._id ||
                            item.id,
                          "approved"
                        )
                      }
                    >
                      Approve
                    </button>

                    <button
                      type="button"
                      className="dismiss"
                      onClick={() =>
                        updateContentStatus(
                          item._id ||
                            item.id,
                          "hidden"
                        )
                      }
                    >
                      Hide
                    </button>
                  </div>
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  );

  const renderActiveTab = () => {
    if (activeTab === "overview") {
      return renderOverview();
    }

    if (activeTab === "support") {
      return renderSupport();
    }

    if (activeTab === "community") {
      return renderCommunity();
    }

    if (activeTab === "reports") {
      return renderReports();
    }

    if (activeTab === "content") {
      return renderContent();
    }

    return renderOverview();
  };

  return (
    <div className="moderator-page">
      <div className="moderator-top">
        <div>
          <span>
            EXALT EXCHANGE
          </span>

          <h1>
            Moderator Operations
          </h1>
        </div>

        <div className="moderator-profile-chip">
          <div>🛡️</div>

          <div>
            <strong>
              {currentUser?.name ||
                "Moderator"}
            </strong>

            <span>
              {currentUser?.email ||
                "Community Account"}
            </span>
          </div>
        </div>
      </div>

      {message && (
        <div className="moderator-alert success">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="moderator-alert error">
          {errorMessage}
        </div>
      )}

      <div className="moderator-tabs">
        {TABS.map(
          ([
            key,
            label,
            icon,
          ]) => (
            <button
              type="button"
              key={key}
              className={
                activeTab === key
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab(key)
              }
            >
              <span>{icon}</span>
              {label}
            </button>
          )
        )}
      </div>

      {renderActiveTab()}
    </div>
  );
}

export default ModeratorPanel;