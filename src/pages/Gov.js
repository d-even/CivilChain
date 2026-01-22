import { useCallback, useContext, useEffect, useState } from "react";
import { Web3Context } from "../context/Web3Context";
import Navbar from "../components/Navbar";
import RequestCard from "../components/RequestCard";
import "./Gov.css";

export default function Gov() {
  const { connectWallet, account, contract, OFFICER_ADDRESS, error } =
    useContext(Web3Context);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("pending");

  const load = useCallback(async () => {
    if (!contract || !account) return;
    try {
      const data = await contract.getAllRequests();
      setRequests(data);
    } catch (err) {
      console.error("Failed to load requests:", err);
    }
  }, [contract, account]);

  useEffect(() => {
    load();
  }, [load]);

  const update = async (id, status, reason = "") => {
    try {
      setLoading(true);
      const tx = await contract.updateStatus(id, status);
      const receipt = await tx.wait();
      
      // Store rejection reason in localStorage for citizen to see
      if (status === 2 && reason) {
        const rejectionReasons = JSON.parse(localStorage.getItem("rejectionReasons") || "{}");
        rejectionReasons[id] = reason;
        localStorage.setItem("rejectionReasons", JSON.stringify(rejectionReasons));
      }
      
      const statusText = status === 1 ? "approved" : "rejected";
      alert(
        `Request #${id} ${statusText} successfully!\n\n` +
        `Transaction Hash:\n${receipt.hash}\n\n` +
        `Block Number: ${receipt.blockNumber}`
      );
      await load();
    } catch (err) {
      console.error(err);
      alert("Transaction failed: " + (err?.reason || err?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filter === "all") return true;
    if (filter === "pending") return Number(r.status) === 0;
    return Number(r.status) === parseInt(filter);
  });

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => Number(r.status) === 0).length,
    approved: requests.filter((r) => Number(r.status) === 1).length,
    rejected: requests.filter((r) => Number(r.status) === 2).length
  };

  // Role check (frontend-level only)
  if (account && account.toLowerCase() !== OFFICER_ADDRESS.toLowerCase()) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="content-wrapper">
          <div className="access-denied" style={{color: "grey"}}>
            
            <h2>Access Denied</h2>
            <p>Only authorized government officers can access this dashboard.</p>
            <p className="officer-address">
              Expected Officer Address: <code>{OFFICER_ADDRESS}</code>
            </p>
            <p className="current-address">
              Your Address: <code>{account}</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />
      <div className="content-wrapper">
        <div className="page-header">
          <h1 className="page-title" style={{ color: "white" }}>Officer dashboard</h1>
          
        </div>

        {!account ? (
          <div className="connect-section">
            <div className="connect-card">
              <h2>Connect Officer Wallet</h2>
              <p>Connect your authorized government wallet to manage requests</p>
              {error && <p className="error-message">{error}</p>}
              <button onClick={connectWallet} className="connect-btn">
                Connect Wallet
              </button>
            </div>
          </div>
        ) : (
          <div className="gov-content">
            <div className="officer-info">
             
              <span className="officer-address">{account}</span>
            </div>

            <div className="stats-container">
              <div className="stat-card">
                <div className="stat-icon"></div>
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Total Requests</div>
              </div>
              <div className="stat-card pending">
                <div className="stat-icon"></div>
                <div className="stat-value">{stats.pending}</div>
                <div className="stat-label">Awaiting Review</div>
              </div>
              <div className="stat-card approved">
                <div className="stat-icon"></div>
                <div className="stat-value">{stats.approved}
                  </div>
                <div className="stat-label">Approved</div>
              </div>
              <div className="stat-card rejected">
                <div className="stat-icon"></div>
                <div className="stat-value">{stats.rejected}</div>
                <div className="stat-label">Rejected</div>
              </div>
            </div>

            <div className="filter-section">
              <label className="filter-label">Filter Requests:</label>
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${filter === "pending" ? "active" : ""}`}
                  onClick={() => setFilter("pending")}
                >
                  Pending ({stats.pending})
                </button>
                <button
                  className={`filter-btn ${filter === "all" ? "active" : ""}`}
                  onClick={() => setFilter("all")}
                >
                  All
                </button>
                <button
                  className={`filter-btn ${filter === "1" ? "active" : ""}`}
                  onClick={() => setFilter("1")}
                >
                  Approved
                </button>
                <button
                  className={`filter-btn ${filter === "2" ? "active" : ""}`}
                  onClick={() => setFilter("2")}
                >
                  Rejected
                </button>
              </div>
            </div>

            <div className="requests-section">
              {filteredRequests.length === 0 ? (
                <div className="no-requests">
                  <p>No {filter === "all" ? "" : filter} requests found</p>
                </div>
              ) : (
                <div className="gov-requests-list">
                  {filteredRequests.map((r) => (
                    <RequestCard
                      key={Number(r.id)}
                      request={r}
                      onApprove={(id) => update(id, 1)}
                      onReject={(id, reason) => update(id, 2, reason)}
                      loading={loading}
                      showActions={true}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
