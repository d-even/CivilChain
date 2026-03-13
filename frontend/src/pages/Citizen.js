import { useContext, useState, useEffect, useCallback } from "react";
import { Web3Context } from "../context/Web3Context";
import Navbar from "../components/Navbar";
import RequestForm from "../components/RequestForm";
import RequestCard from "../components/RequestCard";

import "./Citizen.css";

export default function Citizen() {
  const { connectWallet, ensureConnected, account, contract, error } = useContext(Web3Context);
  const [loading, setLoading] = useState(false);
  const [myRequests, setMyRequests] = useState([]);

  const loadMyRequests = useCallback(async () => {
    try {
      const allRequests = await contract.getAllRequests();
      const filtered = allRequests.filter(
        (r) => r.citizen.toLowerCase() === account.toLowerCase()
      );
      
      // Add rejection reasons from localStorage
      const rejectionReasons = JSON.parse(localStorage.getItem("rejectionReasons") || "{}");
      const enrichedRequests = filtered.map(req => ({
        ...req,
        rejectionReason: rejectionReasons[Number(req.id)] || ""
      }));
      
      setMyRequests(enrichedRequests);
    } catch (err) {
      console.error("Failed to load requests:", err);
    }
  }, [contract, account]);

  useEffect(() => {
    if (contract && account) {
      loadMyRequests();
    }
  }, [contract, account, loadMyRequests]);

  const handleSubmit = async (serviceType, userDoc) => {
    try {
      setLoading(true);
      
      // Ensure wallet is properly authorized before transaction
      const freshContract = await ensureConnected();
      if (!freshContract) {
        alert("Failed to authorize wallet. Please reconnect MetaMask.");
        setLoading(false);
        return;
      }
      
      // serviceType, userDoc (data URL or URI)
      const tx = await freshContract.createRequest(serviceType, userDoc || "");
      await tx.wait();
      alert("Request submitted successfully to blockchain!");
      await loadMyRequests();
    } catch (err) {
      console.error(err);
      alert("Transaction failed: " + (err?.reason || err?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Navbar />
      <div className="content-wrapper">
        {!account ? (
          <div className="connect-section">
            <div className="connect-card">
              <h2>Connect Your Wallet</h2>
              <p>Connect your MetaMask wallet to submit and track service requests</p>
              {error && <p className="error-message">{error}</p>}
              <button onClick={connectWallet} className="connect-btn">
                Connect Wallet
              </button>
            </div>
          </div>
        ) : (
          <div className="citizen-content">
            <div className="wallet-info">
              <span className="wallet-label">Connected Wallet:</span>
              <span className="wallet-address">{account}</span>
            </div>

            {error && <p className="error-message">{error}</p>}
            {!contract && !error && (
              <p className="error-message">
                Contract not found. Please switch MetaMask to Sepolia testnet.
              </p>
            )}

            <RequestForm onSubmit={handleSubmit} loading={loading} />

            {/* My Requests Section */}
            {myRequests.length > 0 && (
              <div className="my-requests-section">
                <h2 className="section-title">📋 My Requests</h2>
                <div className="requests-grid">
                  {myRequests.map((request) => (
                    <div key={Number(request.id)} className="request-card">
                      <RequestCard 
                        request={request} 
                        showActions={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
