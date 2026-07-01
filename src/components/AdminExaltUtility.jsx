import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AdminExaltUtility.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://exalt-real-backend-6b6v.onrender.com";
export default function AdminExaltUtility() {
  const [stats, setStats] = useState({});
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchUtilityAdmin = async () => {
    try {
      setLoading(true);

      const [statsRes, toolsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/exalt-utility/admin/stats`, authHeaders),
        axios.get(`${API_BASE}/api/exalt-utility/admin/tools`, authHeaders),
      ]);

      setStats(statsRes.data?.stats || {});
      setTools(toolsRes.data?.tools || []);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (tool) => {
    await axios.put(
      `${API_BASE}/api/exalt-utility/admin/tool/${tool._id}`,
      {
        status: tool.status === "Active" ? "Paused" : "Active",
        featured: tool.featured,
        adminNote: "Updated by admin",
      },
      authHeaders
    );

    fetchUtilityAdmin();
  };

  const deleteTool = async (id) => {
    const ok = window.confirm("Delete this utility tool?");
    if (!ok) return;

    await axios.delete(`${API_BASE}/api/exalt-utility/admin/tool/${id}`, authHeaders);
    fetchUtilityAdmin();
  };

  useEffect(() => {
    fetchUtilityAdmin();
  }, []);

  if (loading) {
    return <div className="admin-utility-page">Loading Exalt Utility Admin...</div>;
  }

  return (
    <div className="admin-utility-page">
      <div className="admin-utility-header">
        <div>
          <h2>Exalt Utility Center Admin</h2>
          <p>Manage tools, access type, EXALT holder requirements and utility status.</p>
        </div>

        <button onClick={fetchUtilityAdmin}>Refresh</button>
      </div>

      <div className="admin-utility-cards">
        <div><span>Total Tools</span><strong>{stats.total || 0}</strong></div>
        <div><span>Active</span><strong>{stats.active || 0}</strong></div>
        <div><span>Premium</span><strong>{stats.premium || 0}</strong></div>
        <div><span>Free</span><strong>{stats.free || 0}</strong></div>
        <div><span>EXALT Holder</span><strong>{stats.exaltHolder || 0}</strong></div>
        <div><span>Featured</span><strong>{stats.featured || 0}</strong></div>
      </div>

      <div className="admin-utility-table-box">
        <h3>Utility Tools</h3>

        <table className="admin-utility-table">
          <thead>
            <tr>
              <th>Tool</th>
              <th>Category</th>
              <th>Access</th>
              <th>Required EXALT</th>
              <th>Status</th>
              <th>Featured</th>
              <th>Usage</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {tools.length === 0 ? (
              <tr>
                <td colSpan="8">No utility tools found</td>
              </tr>
            ) : (
              tools.map((tool) => (
                <tr key={tool._id}>
                  <td>
                    <strong>{tool.name}</strong>
                    <small>{tool.description}</small>
                  </td>

                  <td>{tool.category}</td>
                  <td>{tool.accessType}</td>
                  <td>{Number(tool.requiredExalt || 0).toLocaleString()} EXALT</td>

                  <td>
                    <span className={`admin-utility-status ${tool.status?.toLowerCase().replace(" ", "-")}`}>
                      {tool.status}
                    </span>
                  </td>

                  <td>{tool.featured ? "Yes" : "No"}</td>
                  <td>{tool.usageCount || 0}</td>

                  <td>
                    <div className="admin-utility-actions">
                      <button onClick={() => toggleStatus(tool)}>
                        {tool.status === "Active" ? "Pause" : "Activate"}
                      </button>

                      <button className="danger" onClick={() => deleteTool(tool._id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}