import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../i18n";
import "./SuperAdminPanel.css";

const API_FALLBACK =
  "https://exalt-real-backend-6b6v.onrender.com";

const TABS = [
  ["overview", "Overview", "📊"],
  ["users", "Users", "👥"],
  ["kyc", "KYC", "🪪"],
  ["deposits", "Deposits", "💳"],
  ["withdrawals", "Withdrawals", "💸"],
  ["p2p", "P2P", "🌍"],
  ["listings", "Listings", "📌"],
  ["support", "Support", "🎧"],
  ["reports", "Reports", "📈"],
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

function SuperAdminPanel({ setPage }) {
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

  const [summary, setSummary] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingKyc: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    p2pDisputes: 0,
    pendingListings: 0,
    openTickets: 0,
  });

  const [users, setUsers] = useState([]);
  const [kycRequests, setKycRequests] =
    useState([]);
  const [deposits, setDeposits] =
    useState([]);
  const [withdrawals, setWithdrawals] =
    useState([]);
  const [p2pItems, setP2pItems] =
    useState([]);
  const [listings, setListings] =
    useState([]);
  const [tickets, setTickets] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const token =
    localStorage.getItem("token");

  const isSuperAdmin =
    currentUser?.role === "super_admin";

  const hasAccess =
    isSuperAdmin ||
    currentUser?.role === "owner" ||
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
        "Super Admin request failed:",
        url,
        error
      );

      return null;
    }
  };

  const loadDashboard = async () => {
    if (!token || !hasAccess) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [
        usersData,
        kycData,
        depositsData,
        withdrawalsData,
        p2pData,
        listingsData,
        supportData,
      ] = await Promise.all([
        safeRequest(
          `${API}/api/admin/users`,
          {
            headers: authHeaders,
          }
        ),

        safeRequest(
          `${API}/api/kyc/admin/all`,
          {
            headers: authHeaders,
          }
        ),

        safeRequest(
          `${API}/api/deposit-request`,
          {
            headers: authHeaders,
          }
        ),

        safeRequest(
          `${API}/api/withdrawals/admin/all`,
          {
            headers: authHeaders,
          }
        ),

        safeRequest(
          `${API}/api/p2p/admin/all`,
          {
            headers: authHeaders,
          }
        ),

        safeRequest(
          `${API}/api/listings`,
          {
            headers: authHeaders,
          }
        ),

        safeRequest(
          `${API}/api/support-ticket/admin/all`,
          {
            headers: authHeaders,
          }
        ),
      ]);

      const nextUsers =
        usersData?.users ||
        usersData?.data ||
        [];

      const nextKyc =
        kycData?.requests ||
        kycData?.kycRequests ||
        kycData?.data ||
        [];

      const nextDeposits =
        depositsData?.requests ||
        depositsData?.deposits ||
        depositsData?.data ||
        [];

      const nextWithdrawals =
        withdrawalsData?.withdrawals ||
        withdrawalsData?.requests ||
        withdrawalsData?.data ||
        [];

      const nextP2p =
        p2pData?.orders ||
        p2pData?.trades ||
        p2pData?.data ||
        [];

      const nextListings =
        listingsData?.listings ||
        listingsData?.requests ||
        listingsData?.data ||
        [];

      const nextTickets =
        supportData?.tickets ||
        supportData?.requests ||
        supportData?.data ||
        [];

      setUsers(
        Array.isArray(nextUsers)
          ? nextUsers
          : []
      );

      setKycRequests(
        Array.isArray(nextKyc)
          ? nextKyc
          : []
      );

      setDeposits(
        Array.isArray(nextDeposits)
          ? nextDeposits
          : []
      );

      setWithdrawals(
        Array.isArray(nextWithdrawals)
          ? nextWithdrawals
          : []
      );

      setP2pItems(
        Array.isArray(nextP2p)
          ? nextP2p
          : []
      );

      setListings(
        Array.isArray(nextListings)
          ? nextListings
          : []
      );

      setTickets(
        Array.isArray(nextTickets)
          ? nextTickets
          : []
      );

      const activeUsers =
        Array.isArray(nextUsers)
          ? nextUsers.filter(
              (user) =>
                user?.isActive !== false &&
                user?.isBlocked !== true
            ).length
          : 0;

      const pendingKyc =
        Array.isArray(nextKyc)
          ? nextKyc.filter(
              (item) =>
                String(
                  item?.status ||
                    item?.kycStatus ||
                    ""
                ).toLowerCase() ===
                "pending"
            ).length
          : 0;

      const pendingDeposits =
        Array.isArray(nextDeposits)
          ? nextDeposits.filter(
              (item) =>
                String(
                  item?.status || ""
                ).toLowerCase() ===
                "pending"
            ).length
          : 0;

      const pendingWithdrawals =
        Array.isArray(nextWithdrawals)
          ? nextWithdrawals.filter(
              (item) =>
                String(
                  item?.status || ""
                ).toLowerCase() ===
                "pending"
            ).length
          : 0;

      const p2pDisputes =
        Array.isArray(nextP2p)
          ? nextP2p.filter(
              (item) =>
                Boolean(
                  item?.isDisputed
                ) ||
                String(
                  item?.status || ""
                ).toLowerCase() ===
                  "disputed"
            ).length
          : 0;

      const pendingListings =
        Array.isArray(nextListings)
          ? nextListings.filter(
              (item) =>
                String(
                  item?.status || ""
                ).toLowerCase() ===
                "pending"
            ).length
          : 0;

      const openTickets =
        Array.isArray(nextTickets)
          ? nextTickets.filter(
              (item) =>
                ![
                  "closed",
                  "resolved",
                ].includes(
                  String(
                    item?.status || ""
                  ).toLowerCase()
                )
            ).length
          : 0;

      setSummary({
        totalUsers:
          Array.isArray(nextUsers)
            ? nextUsers.length
            : 0,

        activeUsers,
        pendingKyc,
        pendingDeposits,
        pendingWithdrawals,
        p2pDisputes,
        pendingListings,
        openTickets,
      });
    } catch (error) {
      console.error(
        "Super Admin dashboard load failed:",
        error
      );

      showError(
        error.message ||
          "Failed to load Super Admin dashboard."
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

  const updateKycStatus = async (
    id,
    status
  ) => {
    try {
      await fetchJson(
        `${API}/api/kyc/admin/update/${id}`,
        {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({
            status,
          }),
        }
      );

      showSuccess(
        `KYC request ${status.toLowerCase()} successfully.`
      );

      await loadDashboard();
    } catch (error) {
      showError(error.message);
    }
  };

  const updateDepositStatus = async (
    id,
    status
  ) => {
    try {
      await fetchJson(
        `${API}/api/deposit-request/status`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            id,
            status,
          }),
        }
      );

      showSuccess(
        `Deposit ${status} successfully.`
      );

      await loadDashboard();
    } catch (error) {
      showError(error.message);
    }
  };

  const updateWithdrawalStatus =
    async (
      id,
      status
    ) => {
      try {
        await fetchJson(
          `${API}/api/withdrawals/admin/${id}/status`,
          {
            method: "PATCH",
            headers: authHeaders,
            body: JSON.stringify({
              status,
            }),
          }
        );

        showSuccess(
          `Withdrawal ${status} successfully.`
        );

        await loadDashboard();
      } catch (error) {
        showError(error.message);
      }
    };

  const updateListingStatus = async (
    id,
    status
  ) => {
    try {
      await fetchJson(
        `${API}/api/listings/${id}/status`,
        {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({
            status,
          }),
        }
      );

      showSuccess(
        `Listing ${status} successfully.`
      );

      await loadDashboard();
    } catch (error) {
      showError(error.message);
    }
  };

  const filteredUsers =
    useMemo(() => {
      const q =
        search.trim().toLowerCase();

      return users.filter(
        (user) => {
          const matchSearch =
            !q ||
            String(
              user?.name || ""
            )
              .toLowerCase()
              .includes(q) ||
            String(
              user?.email || ""
            )
              .toLowerCase()
              .includes(q) ||
            String(
              user?.uid || ""
            )
              .toLowerCase()
              .includes(q);

          const normalizedStatus =
            user?.isBlocked
              ? "BLOCKED"
              : user?.isActive ===
                false
              ? "INACTIVE"
              : "ACTIVE";

          const matchStatus =
            statusFilter ===
              "ALL" ||
            normalizedStatus ===
              statusFilter;

          return (
            matchSearch &&
            matchStatus
          );
        }
      );
    }, [
      users,
      search,
      statusFilter,
    ]);

  const formatDate = (value) => {
    if (!value) return "N/A";

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "N/A";
    }

    return date.toLocaleString();
  };

  const formatAmount = (
    value
  ) =>
    Number(
      value || 0
    ).toLocaleString(undefined, {
      maximumFractionDigits: 8,
    });

  if (!hasAccess) {
    return (
      <div className="super-admin-page">
        <div className="super-admin-access-card">
          <div className="super-admin-access-icon">
            🔒
          </div>

          <h1>
            {translate(
              "superAdminAccessRequired",
              "Super Admin Access Required"
            )}
          </h1>

          <p>
            This panel is restricted to the
            verified Owner or Super Admin.
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
      <div className="super-admin-page">
        <div className="super-admin-loading-card">
          <div className="super-admin-loader" />

          <h2>
            Loading Super Admin Panel
          </h2>

          <p>
            Loading users, KYC,
            deposits, withdrawals and
            operational data.
          </p>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <>
      <div className="super-admin-hero">
        <div>
          <span className="super-admin-eyebrow">
            OPERATIONS MANAGEMENT
          </span>

          <h1>
            Exalt Exchange Super Admin
          </h1>

          <p>
            Daily operational control
            for users, KYC, deposits,
            withdrawals, P2P, listings
            and support.
          </p>
        </div>

        <button
          type="button"
          className="super-admin-primary-btn"
          disabled={refreshing}
          onClick={refreshDashboard}
        >
          {refreshing
            ? "Refreshing..."
            : "Refresh Dashboard"}
        </button>
      </div>

      <div className="super-admin-stat-grid">
        <div className="super-admin-stat-card">
          <span>Total Users</span>
          <strong>
            {summary.totalUsers}
          </strong>
          <p>
            Registered exchange
            accounts.
          </p>
        </div>

        <div className="super-admin-stat-card">
          <span>Active Users</span>
          <strong>
            {summary.activeUsers}
          </strong>
          <p>
            Active and unblocked
            accounts.
          </p>
        </div>

        <div className="super-admin-stat-card">
          <span>Pending KYC</span>
          <strong>
            {summary.pendingKyc}
          </strong>
          <p>
            KYC reviews requiring
            action.
          </p>
        </div>

        <div className="super-admin-stat-card">
          <span>
            Pending Deposits
          </span>
          <strong>
            {summary.pendingDeposits}
          </strong>
          <p>
            Deposit requests requiring
            approval.
          </p>
        </div>

        <div className="super-admin-stat-card">
          <span>
            Pending Withdrawals
          </span>
          <strong>
            {
              summary.pendingWithdrawals
            }
          </strong>
          <p>
            Withdrawal requests requiring
            review.
          </p>
        </div>

        <div className="super-admin-stat-card">
          <span>P2P Disputes</span>
          <strong>
            {summary.p2pDisputes}
          </strong>
          <p>
            Active P2P dispute cases.
          </p>
        </div>

        <div className="super-admin-stat-card">
          <span>
            Pending Listings
          </span>
          <strong>
            {
              summary.pendingListings
            }
          </strong>
          <p>
            Listing requests awaiting
            review.
          </p>
        </div>

        <div className="super-admin-stat-card">
          <span>Open Tickets</span>
          <strong>
            {summary.openTickets}
          </strong>
          <p>
            Support cases requiring
            attention.
          </p>
        </div>
      </div>

      <div className="super-admin-dashboard-grid">
        <div className="super-admin-panel">
          <div className="super-admin-panel-head">
            <div>
              <h2>
                Quick Operations
              </h2>

              <p>
                Open daily management
                modules.
              </p>
            </div>
          </div>

          <div className="super-admin-quick-grid">
            {TABS.slice(1, 8).map(
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

        <div className="super-admin-panel">
          <div className="super-admin-panel-head">
            <div>
              <h2>
                Role Boundary
              </h2>

              <p>
                Super Admin manages
                operations, not owner
                funds.
              </p>
            </div>
          </div>

          <div className="super-admin-security-list">
            <div>
              <span>
                Exchange Master Switch
              </span>
              <strong>
                Owner Only
              </strong>
            </div>

            <div>
              <span>
                Fee Configuration
              </span>
              <strong>
                Owner Only
              </strong>
            </div>

            <div>
              <span>
                Liquidity Movement
              </span>
              <strong>
                Owner Only
              </strong>
            </div>

            <div>
              <span>
                Revenue Withdrawal
              </span>
              <strong>
                Owner Only
              </strong>
            </div>

            <div>
              <span>
                Daily Operations
              </span>
              <strong>
                Super Admin
              </strong>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderUsers = () => (
    <div className="super-admin-panel">
      <div className="super-admin-panel-head">
        <div>
          <h2>User Management</h2>
          <p>
            Search and monitor exchange
            accounts.
          </p>
        </div>
      </div>

      <div className="super-admin-tools">
        <input
          placeholder="Search name, email or UID..."
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

          <option value="ACTIVE">
            Active
          </option>

          <option value="BLOCKED">
            Blocked
          </option>

          <option value="INACTIVE">
            Inactive
          </option>
        </select>
      </div>

      <div className="super-admin-table-wrap">
        <table className="super-admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>UID</th>
              <th>Role</th>
              <th>KYC</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.length ===
            0 ? (
              <tr>
                <td colSpan="6">
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map(
                (user) => (
                  <tr
                    key={
                      user._id ||
                      user.id
                    }
                  >
                    <td>
                      <strong>
                        {user.name ||
                          "User"}
                      </strong>

                      <span>
                        {user.email ||
                          "N/A"}
                      </span>
                    </td>

                    <td>
                      {user.uid ||
                        "N/A"}
                    </td>

                    <td>
                      {String(
                        user.role ||
                          "user"
                      ).toUpperCase()}
                    </td>

                    <td>
                      {String(
                        user.kycStatus ||
                          "not_submitted"
                      ).toUpperCase()}
                    </td>

                    <td>
                      <span
                        className={`super-admin-badge ${
                          user.isBlocked
                            ? "danger"
                            : user.isActive ===
                              false
                            ? "warning"
                            : "success"
                        }`}
                      >
                        {user.isBlocked
                          ? "BLOCKED"
                          : user.isActive ===
                            false
                          ? "INACTIVE"
                          : "ACTIVE"}
                      </span>
                    </td>

                    <td>
                      {formatDate(
                        user.createdAt
                      )}
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderKyc = () => (
    <div className="super-admin-panel">
      <div className="super-admin-panel-head">
        <div>
          <h2>KYC Requests</h2>
          <p>
            Review and process pending
            identity verification.
          </p>
        </div>
      </div>

      <div className="super-admin-list">
        {kycRequests.length === 0 ? (
          <div className="super-admin-empty">
            No KYC requests found.
          </div>
        ) : (
          kycRequests.map(
            (item) => (
              <div
                className="super-admin-item"
                key={
                  item._id ||
                  item.id
                }
              >
                <div>
                  <strong>
                    {item.userId?.name ||
                      item.name ||
                      "User"}
                  </strong>

                  <span>
                    {item.userId?.email ||
                      item.email ||
                      "N/A"}
                  </span>

                  <small>
                    Submitted:{" "}
                    {formatDate(
                      item.createdAt
                    )}
                  </small>
                </div>

                <div>
                  <span
                    className={`super-admin-badge ${
                      String(
                        item.status ||
                          item.kycStatus
                      ).toLowerCase()
                    }`}
                  >
                    {String(
                      item.status ||
                        item.kycStatus ||
                        "pending"
                    ).toUpperCase()}
                  </span>

                  {String(
                    item.status ||
                      item.kycStatus ||
                      ""
                  ).toLowerCase() ===
                    "pending" && (
                    <div className="super-admin-actions">
                      <button
                        type="button"
                        className="approve"
                        onClick={() =>
                          updateKycStatus(
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
                        className="reject"
                        onClick={() =>
                          updateKycStatus(
                            item._id ||
                              item.id,
                            "rejected"
                          )
                        }
                      >
                        Reject
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

  const renderDeposits = () => (
    <div className="super-admin-panel">
      <div className="super-admin-panel-head">
        <div>
          <h2>Deposit Requests</h2>
          <p>
            Review and approve user
            deposit submissions.
          </p>
        </div>
      </div>

      <div className="super-admin-list">
        {deposits.length === 0 ? (
          <div className="super-admin-empty">
            No deposit requests found.
          </div>
        ) : (
          deposits.map(
            (item) => (
              <div
                className="super-admin-item"
                key={
                  item._id ||
                  item.id
                }
              >
                <div>
                  <strong>
                    {item.userId?.name ||
                      item.senderName ||
                      "User"}
                  </strong>

                  <span>
                    {formatAmount(
                      item.amount
                    )}{" "}
                    {item.coin ||
                      "USDT"}
                  </span>

                  <small>
                    {item.network ||
                      "N/A"}{" "}
                    •{" "}
                    {formatDate(
                      item.createdAt
                    )}
                  </small>
                </div>

                <div>
                  <span
                    className={`super-admin-badge ${String(
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
                      ""
                  ).toLowerCase() ===
                    "pending" && (
                    <div className="super-admin-actions">
                      <button
                        type="button"
                        className="approve"
                        onClick={() =>
                          updateDepositStatus(
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
                        className="reject"
                        onClick={() =>
                          updateDepositStatus(
                            item._id ||
                              item.id,
                            "rejected"
                          )
                        }
                      >
                        Reject
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

  const renderWithdrawals = () => (
    <div className="super-admin-panel">
      <div className="super-admin-panel-head">
        <div>
          <h2>
            Withdrawal Requests
          </h2>
          <p>
            Review withdrawal requests
            before release.
          </p>
        </div>
      </div>

      <div className="super-admin-list">
        {withdrawals.length === 0 ? (
          <div className="super-admin-empty">
            No withdrawal requests found.
          </div>
        ) : (
          withdrawals.map(
            (item) => (
              <div
                className="super-admin-item"
                key={
                  item._id ||
                  item.id
                }
              >
                <div>
                  <strong>
                    {item.userId?.name ||
                      item.accountName ||
                      "User"}
                  </strong>

                  <span>
                    {formatAmount(
                      item.amount
                    )}{" "}
                    {item.coin ||
                      "USDT"}
                  </span>

                  <small>
                    {item.network ||
                      item.paymentMethod ||
                      "N/A"}{" "}
                    •{" "}
                    {formatDate(
                      item.createdAt
                    )}
                  </small>
                </div>

                <div>
                  <span
                    className={`super-admin-badge ${String(
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
                      ""
                  ).toLowerCase() ===
                    "pending" && (
                    <div className="super-admin-actions">
                      <button
                        type="button"
                        className="approve"
                        onClick={() =>
                          updateWithdrawalStatus(
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
                        className="reject"
                        onClick={() =>
                          updateWithdrawalStatus(
                            item._id ||
                              item.id,
                            "rejected"
                          )
                        }
                      >
                        Reject
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

  const renderP2P = () => (
    <div className="super-admin-panel">
      <div className="super-admin-panel-head">
        <div>
          <h2>P2P Operations</h2>
          <p>
            Monitor P2P trades and
            dispute cases.
          </p>
        </div>

        <button
          type="button"
          className="super-admin-primary-btn"
          onClick={() =>
            setPage &&
            setPage("admin-p2p")
          }
        >
          Open Full P2P Panel
        </button>
      </div>

      <div className="super-admin-list">
        {p2pItems.length === 0 ? (
          <div className="super-admin-empty">
            No P2P records found.
          </div>
        ) : (
          p2pItems
            .slice(0, 25)
            .map((item) => (
              <div
                className="super-admin-item"
                key={
                  item._id ||
                  item.id
                }
              >
                <div>
                  <strong>
                    {item.coin ||
                      item.asset ||
                      "USDT"}{" "}
                    P2P
                  </strong>

                  <span>
                    {formatAmount(
                      item.amount
                    )}
                  </span>

                  <small>
                    {formatDate(
                      item.createdAt
                    )}
                  </small>
                </div>

                <div>
                  <span
                    className={`super-admin-badge ${String(
                      item.status ||
                        "pending"
                    ).toLowerCase()}`}
                  >
                    {String(
                      item.status ||
                        "pending"
                    ).toUpperCase()}
                  </span>

                  {Boolean(
                    item.isDisputed
                  ) && (
                    <span className="super-admin-badge danger">
                      DISPUTED
                    </span>
                  )}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );

  const renderListings = () => (
    <div className="super-admin-panel">
      <div className="super-admin-panel-head">
        <div>
          <h2>Listing Requests</h2>
          <p>
            Review token listing
            submissions.
          </p>
        </div>
      </div>

      <div className="super-admin-list">
        {listings.length === 0 ? (
          <div className="super-admin-empty">
            No listing requests found.
          </div>
        ) : (
          listings.map(
            (item) => (
              <div
                className="super-admin-item"
                key={
                  item._id ||
                  item.id
                }
              >
                <div>
                  <strong>
                    {item.coinName ||
                      item.name ||
                      "Token"}
                  </strong>

                  <span>
                    {item.symbol ||
                      "N/A"}{" "}
                    •{" "}
                    {item.chain ||
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
                    className={`super-admin-badge ${String(
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
                      ""
                  ).toLowerCase() ===
                    "pending" && (
                    <div className="super-admin-actions">
                      <button
                        type="button"
                        className="approve"
                        onClick={() =>
                          updateListingStatus(
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
                        className="reject"
                        onClick={() =>
                          updateListingStatus(
                            item._id ||
                              item.id,
                            "rejected"
                          )
                        }
                      >
                        Reject
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

  const renderSupport = () => (
    <div className="super-admin-panel">
      <div className="super-admin-panel-head">
        <div>
          <h2>Support Operations</h2>
          <p>
            Monitor user support
            requests.
          </p>
        </div>

        <button
          type="button"
          className="super-admin-primary-btn"
          onClick={() =>
            setPage &&
            setPage("support")
          }
        >
          Open Support
        </button>
      </div>

      <div className="super-admin-list">
        {tickets.length === 0 ? (
          <div className="super-admin-empty">
            No support tickets found.
          </div>
        ) : (
          tickets
            .slice(0, 30)
            .map((item) => (
              <div
                className="super-admin-item"
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
                    className={`super-admin-badge ${String(
                      item.status ||
                        "open"
                    ).toLowerCase()}`}
                  >
                    {String(
                      item.status ||
                        "open"
                    ).toUpperCase()}
                  </span>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="super-admin-panel">
      <div className="super-admin-panel-head">
        <div>
          <h2>
            Operational Reports
          </h2>
          <p>
            Current operational workload
            summary.
          </p>
        </div>
      </div>

      <div className="super-admin-report-grid">
        {Object.entries(
          summary
        ).map(
          ([key, value]) => (
            <div
              className="super-admin-report-card"
              key={key}
            >
              <span>
                {key
                  .replace(
                    /([A-Z])/g,
                    " $1"
                  )
                  .replace(/^./, (char) =>
                    char.toUpperCase()
                  )}
              </span>

              <strong>
                {value}
              </strong>
            </div>
          )
        )}
      </div>
    </div>
  );

  const renderActiveTab = () => {
    if (
      activeTab === "overview"
    ) {
      return renderOverview();
    }

    if (
      activeTab === "users"
    ) {
      return renderUsers();
    }

    if (
      activeTab === "kyc"
    ) {
      return renderKyc();
    }

    if (
      activeTab === "deposits"
    ) {
      return renderDeposits();
    }

    if (
      activeTab === "withdrawals"
    ) {
      return renderWithdrawals();
    }

    if (
      activeTab === "p2p"
    ) {
      return renderP2P();
    }

    if (
      activeTab === "listings"
    ) {
      return renderListings();
    }

    if (
      activeTab === "support"
    ) {
      return renderSupport();
    }

    if (
      activeTab === "reports"
    ) {
      return renderReports();
    }

    return renderOverview();
  };

  return (
    <div className="super-admin-page">
      <div className="super-admin-top">
        <div>
          <span>
            EXALT EXCHANGE
          </span>

          <h1>
            Super Admin Operations
          </h1>
        </div>

        <div className="super-admin-profile-chip">
          <div>🛡️</div>

          <div>
            <strong>
              {currentUser?.name ||
                "Super Admin"}
            </strong>

            <span>
              {currentUser?.email ||
                "Operations Account"}
            </span>
          </div>
        </div>
      </div>

      {message && (
        <div className="super-admin-alert success">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="super-admin-alert error">
          {errorMessage}
        </div>
      )}

      <div className="super-admin-tabs">
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

export default SuperAdminPanel;