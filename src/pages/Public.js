import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import ABI from "../abi/TransparentService.json";
import Navbar from "../components/Navbar";
import "./Public.css";

const CONTRACT_ADDRESS = "0x0C179c4Ef979364b28F4A9d6531a00FD3aAEFb03";

export default function Public() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [connectedAccount, setConnectedAccount] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        
        if (!window.ethereum) {
          setError("MetaMask is required. Please install MetaMask extension and ensure you're connected to the correct network.");
          setLoading(false);
          return;
        }
        
        // Use MetaMask in read-only mode (without requesting accounts)
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        const code = await provider.getCode(CONTRACT_ADDRESS);
        if (!code || code === "0x") {
          setError("No contract found at this address. Please ensure you're connected to the correct blockchain network in MetaMask.");
          setLoading(false);
          return;
        }

        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
        const data = await contract.getAllRequests();
        
        // Fetch transaction hashes from RequestCreated events
        const filter = contract.filters.RequestCreated();
        const events = await contract.queryFilter(filter);
        
        // Create a map of request ID to transaction hash
        const txHashMap = {};
        events.forEach(event => {
          const requestId = Number(event.args.id);
          txHashMap[requestId] = event.transactionHash;
        });
        
        // Add transaction hashes to requests - properly extract fields
        const requestsWithTxHash = data.map(req => ({
          id: req.id,
          citizen: req.citizen,
          serviceType: req.serviceType,
          status: req.status,
          timestamp: req.timestamp,
          transactionHash: txHashMap[Number(req.id)] || null
        }));
        
        setRequests(requestsWithTxHash);
        setError(""); // Clear any previous errors
        
        // Check if wallet is already connected (without prompting)
        try {
          const accounts = await provider.send("eth_accounts", []);
          if (accounts.length > 0) {
            setConnectedAccount(accounts[0].toLowerCase());
          }
        } catch (err) {
          console.log("No wallet connected yet");
        }
      } catch (err) {
        console.error("Public load error:", err);
        setError("Failed to load blockchain data. Please ensure MetaMask is installed and connected to the correct network.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getStatusDisplay = (status) => {
    const statusNum = Number(status);
    switch (statusNum) {
      case 0:
        return { text: "Under review", icon: "🔵", class: "status-review" };
      case 1:
        return { text: "Completed", icon: "✅", class: "status-completed" };
      case 2:
        return { text: "Rejected", icon: "🔶", class: "status-unknown"}
      default:
        return { text: "Unknown", icon: "❓", class: "status-unknown" };
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const truncateAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${type} copied to clipboard!`);
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("Failed to copy to clipboard");
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    // Filter by "Only Mine"
   
    if (showOnlyMine && connectedAccount) {
  filtered = filtered.filter(req => 
    req.citizen && req.citizen.toLowerCase() === connectedAccount
  );
}

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(req => {
        const id = Number(req.id).toString();
        const citizen = (req.citizen || "").toLowerCase();
        const service = (req.serviceType || "").toLowerCase();
        const description = (req.description || "").toLowerCase();
        const txHash = (req.transactionHash || "").toLowerCase();
        
        return (
          id.includes(query) ||
          citizen.includes(query) ||
          service.includes(query) ||
          description.includes(query) ||
          txHash.includes(query)
        );
      });
    }

    return filtered;
  };

  const filteredRequests = filterRequests();

  return (
    <div className="public-page">
      <Navbar />
      
      <div className="public-container">
        <div className="records-section">
          <div className="section-header">
            <h2 className="section-title">RECORD</h2>
          </div>

          <div className="search-controls">
            <div className="search-bar">
              <input
                type="text"
                className="search-input"
                placeholder="Search by Request ID, Citizen Address, Service, or Transaction Hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  className="clear-search"
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="toggle-container">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={showOnlyMine}
                  onChange={async (e) => {
                    const checked = e.target.checked;
                    if (checked && !connectedAccount) {
                      // Request wallet connection when toggling on
                      try {
                        const provider = new ethers.BrowserProvider(window.ethereum);
                        const accounts = await provider.send("eth_requestAccounts", []);
                        if (accounts.length > 0) {
                          setConnectedAccount(accounts[0].toLowerCase());
                          setShowOnlyMine(true);
                        }
                      } catch (err) {
                        alert("Please connect your wallet to use 'Only Mine' filter");
                      }
                    } else {
                      setShowOnlyMine(checked);
                    }
                  }}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="toggle-label">Only Mine</span>
            </div>
          </div>

          {error && (
            <div className="error-banner">
              ⚠️ {error}
            </div>
          )}

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading blockchain records...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="empty-state">
              <p>{requests.length === 0 ? "No records found" : "No matching records found"}</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="records-table">
                <thead>
                  <tr>
                    <th>Request id</th>
                    <th>Citizen Address</th>
                    <th>Transaction Hash</th>
                    <th>Submitted time</th>
                    <th>Service</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request, index) => {
                    const statusInfo = getStatusDisplay(request.status);
                    return (
                      <tr key={Number(request.id)} className={index % 2 === 0 ? "row-even" : "row-odd"}>
                        <td className="cell-id">{Number(request.id)}</td>
                        <td className="cell-address" title={request.citizen}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{truncateAddress(request.citizen)}</span>
                            <button
                              onClick={() => copyToClipboard(request.citizen, "Address")}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                padding: '2px 6px',
                                opacity: 0.7,
                                transition: 'opacity 0.2s'
                              }}
                              onMouseEnter={(e) => e.target.style.opacity = 1}
                              onMouseLeave={(e) => e.target.style.opacity = 0.7}
                              title="Copy address"
                            >
                              📋
                            </button>
                          </div>
                        </td>
                        <td className="cell-hash" title={request.transactionHash || "N/A"}>
                          {request.transactionHash ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>{truncateAddress(request.transactionHash)}</span>
                              <button
                                onClick={() => copyToClipboard(request.transactionHash, "Transaction Hash")}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  padding: '2px 6px',
                                  opacity: 0.7,
                                  transition: 'opacity 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.opacity = 1}
                                onMouseLeave={(e) => e.target.style.opacity = 0.7}
                                title="Copy transaction hash"
                              >
                                📋
                              </button>
                            </div>
                          ) : "N/A"}
                        </td>
                        <td className="cell-time">{formatTime(request.timestamp)}</td>
                        <td className="cell-service">{request.serviceType}</td>
                        <td className="cell-status">
                          <span 
                            className={`status-badge ${statusInfo.class}`}
                            onClick={() => request.transactionHash && navigate(`/${request.transactionHash}`)}
                            style={{ cursor: request.transactionHash ? 'pointer' : 'default' }}
                            title={request.transactionHash ? 'Click to view transaction details' : 'No transaction hash available'}
                          >
                            <span className="status-icon">{statusInfo.icon}</span>
                            <span className="status-text">{statusInfo.text}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
