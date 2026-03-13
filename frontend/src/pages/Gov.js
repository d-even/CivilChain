import { useCallback, useContext, useEffect, useState } from "react";
import { Web3Context } from "../context/Web3Context";
import Navbar from "../components/Navbar";
import RequestCard from "../components/RequestCard";
import { uploadToFileverse } from "../utils/fileverse";
import "./Gov.css";

export default function Gov() {
  const { connectWallet, ensureConnected, account, contract, OFFICER_ADDRESS, officerVerified, mainAdmin, error } =
    useContext(Web3Context);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("pending");
  const [officerCandidates, setOfficerCandidates] = useState([]);

  const load = useCallback(async () => {
    if (!contract || !account) return;
    try {
      const data = await contract.getAllRequests();
      setRequests(data);
      // load officer candidates (if contract supports it)
      try {
        const list = await contract.getOfficerList();
        const enriched = await Promise.all(list.map(async (addr) => ({
          address: addr,
          verified: await contract.isVerifiedOfficer(addr)
        })));
        setOfficerCandidates(enriched);
      } catch (e) {
        // contract might not expose officer list on older deployments
      }
    } catch (err) {
      console.error("Failed to load requests:", err);
    }
  }, [contract, account]);

  useEffect(() => {
    load();
  }, [load]);

  const registerOfficer = async () => {
    try {
      const freshContract = await ensureConnected();
      if (!freshContract) {
        alert('Please reconnect your wallet to register.');
        return;
      }
      const tx = await freshContract.registerAsOfficer();
      await tx.wait();
      alert('Registered as officer candidate. Ask main admin to verify you.');
      await load();
    } catch (err) {
      console.error(err);
      alert('Registration failed: ' + (err?.reason || err?.message || 'Unknown error'));
    }
  };

  const verifyOfficer = async (addr, approve) => {
    try {
      const freshContract = await ensureConnected();
      if (!freshContract) {
        alert('Please reconnect your wallet to proceed.');
        return;
      }
      const tx = await freshContract.verifyOfficer(addr, approve);
      await tx.wait();
      alert(`Officer ${addr} ${approve ? 'approved' : 'rejected' } successfully.`);
      await load();
    } catch (err) {
      console.error(err);
      alert('Operation failed: ' + (err?.reason || err?.message || 'Unknown error'));
    }
  };

  const update = async (id, status, reason = "") => {
    try {
      setLoading(true);
      
      // Ensure wallet is properly authorized before transaction
      const freshContract = await ensureConnected();
      if (!freshContract) {
        alert("Failed to authorize wallet. Please reconnect MetaMask.");
        setLoading(false);
        return;
      }

      // Verify the connected wallet is a verified officer on-chain
      try {
        const isVerified = await freshContract.isVerifiedOfficer(account);
        if (!isVerified) {
          alert(`Transaction will fail: Your wallet (${account}) is not a verified officer.\n\nAsk the main admin to verify your registration.`);
          setLoading(false);
          return;
        }
      } catch (officerCheckErr) {
        console.warn("Could not verify officer status:", officerCheckErr);
      }

      if (status === 1) {
        // Approve -> perform verification and upload admin document to Fileverse IPFS
        const adminDocIpfsHash = await promptFileAndUpload();
        if (!adminDocIpfsHash) {
          alert("Verification cancelled: no document uploaded.");
          setLoading(false);
          return;
        }
        // Store the IPFS hash on-chain (points to the file in Fileverse)
        const tx = await freshContract.verifyRequest(id, adminDocIpfsHash);
        const receipt = await tx.wait();
        alert(`Request #${id} verified successfully!\n\nDocument stored on IPFS: ${adminDocIpfsHash}\nTransaction: ${receipt.hash}`);
      } else {
        // Reject or other status: updateStatus
        const tx = await freshContract.updateStatus(id, status);
        const receipt = await tx.wait();
        // Store rejection reason in localStorage for citizen to see
        if (status === 3 && reason) {
          const rejectionReasons = JSON.parse(localStorage.getItem("rejectionReasons") || "{}");
          rejectionReasons[id] = reason;
          localStorage.setItem("rejectionReasons", JSON.stringify(rejectionReasons));
        }
        alert(`Request #${id} updated successfully!\n\nTransaction: ${receipt.hash}`);
      }
      await load();
    } catch (err) {
      console.error(err);
      // Parse common revert reasons
      const errMsg = err?.reason || err?.message || "Unknown error";
      if (errMsg.includes("Only officer") || errMsg.includes("estimateGas")) {
        alert(`Transaction failed: Only the authorized officer can perform this action.\n\nMake sure you're connected with the correct wallet and on the right network (Sepolia).`);
      } else {
        alert("Transaction failed: " + errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper: prompt user to pick a file and upload to Fileverse IPFS
  const promptFileAndUpload = () => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      // Allow common image types
      input.accept = 'image/jpeg,image/jpg,image/png,image/gif,image/webp';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return resolve(null);

        try {
          // Show uploading message
          alert('Uploading document to IPFS via Fileverse...');
          
          // Upload to Fileverse IPFS
          const result = await uploadToFileverse(file);
          console.log('Admin document uploaded to IPFS:', result);
          
          // Return the IPFS hash
          resolve(result.ipfsHash);
        } catch (error) {
          alert('Failed to upload document: ' + error.message);
          resolve(null);
        }
      };
      input.click();
    });
  };

  const filteredRequests = requests.filter((r) => {
    if (filter === "all") return true;
    if (filter === "pending") return Number(r.status) === 0;
    if (filter === "verified") return Number(r.status) === 2;
    if (filter === "rejected") return Number(r.status) === 3;
    return true;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => Number(r.status) === 0).length,
    approved: requests.filter((r) => Number(r.status) === 2).length,
    rejected: requests.filter((r) => Number(r.status) === 3).length
  };

  const isMainAdmin =
    account && mainAdmin && account.toLowerCase() === mainAdmin.toLowerCase();

  // Role check (frontend-level only) — allow verified officer or main admin
  if (account && !officerVerified && !isMainAdmin) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="content-wrapper">
          <div className="access-denied" style={{color: "grey"}}>
            <h2>Access Denied</h2>
              <p>Only verified government officers or the main admin can access this dashboard.</p>
            <p className="current-address">
              Your Address: <code>{account}</code>
            </p>
            <p>If you're an officer, click below to register as a candidate; the main admin must verify you.</p>
            <button onClick={registerOfficer} className="connect-btn">Register as Officer</button>
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
                <div className="stat-value">{stats.approved}</div>
                <div className="stat-label">Verified</div>
              </div>
              <div className="stat-card rejected">
                <div className="stat-icon"></div>
                <div className="stat-value">{stats.rejected}</div>
                <div className="stat-label">Rejected</div>
              </div>
            </div>

              {/* If the connected account is the main admin, show officer candidate management */}
              {account && account.toLowerCase() === (OFFICER_ADDRESS || '').toLowerCase() ? null : null}
              <div className="officer-management">
                {account && account.toLowerCase() === (mainAdmin || '').toLowerCase() ? (
                  <div className="admin-panel">
                    <h3>Officer Candidates</h3>
                    {officerCandidates.length === 0 ? (
                      <p>No officer candidates registered.</p>
                    ) : (
                      <ul>
                        {officerCandidates.map((c) => (
                          <li key={c.address}>
                            <span>{c.address}</span>
                            <span style={{marginLeft: 12}}>{c.verified ? '(Verified)' : '(Pending)'}</span>
                            {!c.verified && (
                              <>
                                <button onClick={() => verifyOfficer(c.address, true)} style={{marginLeft:12}}>Approve</button>
                                <button onClick={() => verifyOfficer(c.address, false)} style={{marginLeft:6}}>Reject</button>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
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
                  className={`filter-btn ${filter === "verified" ? "active" : ""}`}
                  onClick={() => setFilter("verified")}
                >
                  Verified
                </button>
                <button
                  className={`filter-btn ${filter === "rejected" ? "active" : ""}`}
                  onClick={() => setFilter("rejected")}
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
                      onReject={(id, reason) => update(id, 3, reason)}
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
