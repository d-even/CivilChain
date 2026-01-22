import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import ABI from "../abi/TransparentService.json";
import Navbar from "../components/Navbar";
import TransactionCard from "../components/TransactionCard";
import StatusBadge from "../components/StatusBadge";
import CopyButton from "../components/CopyButton";
import { formatTime } from "../utils/formatters";
import "./TransactionDetails.css";

const CONTRACT_ADDRESS = "0x0C179c4Ef979364b28F4A9d6531a00FD3aAEFb03";

export default function TransactionDetails() {
  const { txHash } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTransactionDetails = async () => {
      try {
        setLoading(true);

        if (!window.ethereum) {
          setError("MetaMask is required.");
          setLoading(false);
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

        // Get all RequestCreated events to find the matching request
        const createFilter = contract.filters.RequestCreated();
        const createEvents = await contract.queryFilter(createFilter);
        
        const matchingEvent = createEvents.find(event => event.transactionHash === txHash);
        
        if (!matchingEvent) {
          setError("Transaction not found");
          setLoading(false);
          return;
        }

        const requestId = Number(matchingEvent.args.id);
        const citizenAddress = matchingEvent.args.citizen;
        const serviceType = matchingEvent.args.serviceType;

        // Get status update events for this request ID
        const updateFilter = contract.filters.StatusUpdated();
        const updateEvents = await contract.queryFilter(updateFilter);
        
        const requestUpdates = updateEvents.filter(event => Number(event.args.id) === requestId);
        
        // Get the latest status update transaction hash (destination tx)
        const destinationTx = requestUpdates.length > 0 
          ? requestUpdates[requestUpdates.length - 1].transactionHash 
          : null;

        // Get destination transaction timestamp if it exists
        let destinationTimestamp = null;
        if (destinationTx) {
          const destinationTxReceipt = await provider.getTransaction(destinationTx);
          if (destinationTxReceipt && destinationTxReceipt.blockNumber) {
            const block = await provider.getBlock(destinationTxReceipt.blockNumber);
            destinationTimestamp = block.timestamp;
          }
        }

        // Get current request data for status
        const allRequests = await contract.getAllRequests();
        const currentRequest = allRequests.find(req => Number(req.id) === requestId);
        
        setDetails({
          requestId,
          citizenAddress,
          serviceType,
          status: currentRequest ? Number(currentRequest.status) : 0,
          sourceTx: txHash,
          destinationTx,
          timestamp: currentRequest ? Number(currentRequest.timestamp) : 0,
          destinationTimestamp
        });

        setError("");
      } catch (err) {
        console.error("Error loading transaction details:", err);
        setError("Failed to load transaction details");
      } finally {
        setLoading(false);
      }
    };

    loadTransactionDetails();
  }, [txHash]);

  const getStatusDisplay = (status) => {
    switch (status) {
      case 0:
        return { text: "Under review", icon: "🔵", class: "status-review" };
      case 1:
        return { text: "Completed", icon: "✅", class: "status-completed" };
      case 2:
        return { text: "Rejected", icon: "🔶", class: "status-rejected" };
      default:
        return { text: "Unknown", icon: "❓", class: "status-unknown" };
    }
  };

  if (loading) {
    return (
      <div className="tx-details-page">
        <Navbar />
        <div className="tx-details-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading transaction details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="tx-details-page">
        <Navbar />
        <div className="tx-details-container">
          <div className="error-state">
            <h2>{error || "Transaction not found"}</h2>
            <button onClick={() => navigate("/")} className="back-button">
                <span>{"<"} Back</span>
            
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Source transaction card badge
  const sourceStatusBadge = (
    <span className="token-badge">
      <span className="token-icon">🔵</span>
      <span>REQUEST CREATED</span>
    </span>
  );

  // Destination transaction card badge
  const destStatusBadge = <StatusBadge status={details.status} uppercase={true} />;

  // Source transaction card details
  const sourceCardRows = [
    {
      label: "TXN HASH",
      render: () => (
        <div className="transaction-detail-value-wrapper">
          <span className="transaction-detail-value">{details.sourceTx}</span>
          <CopyButton text={details.sourceTx} label="Source Transaction Hash" />
          <a 
            href={`https://sepolia.etherscan.io/tx/${details.sourceTx}`}
            target="_blank"
            rel="noopener noreferrer"
            className="external-link-btn"
            title="View on Etherscan"
          >
            🔗
          </a>
        </div>
      )
    },
    {
      label: "REQUEST ID",
      value: details.requestId
    },
    {
      label: "SENDER ADDRESS",
      render: () => (
        <div className="transaction-detail-value-wrapper">
          <span className="transaction-detail-value">{details.citizenAddress}</span>
          <CopyButton text={details.citizenAddress} label="Citizen Address" />
        </div>
      )
    },
    {
      label: "TIME STAMP",
      value: formatTime(details.timestamp)
    }
  ];

  // Destination transaction card details
  const destinationCardRows = [
    {
      label: "TXN HASH",
      render: () => details.destinationTx ? (
        <div className="transaction-detail-value-wrapper">
          <span className="transaction-detail-value">{details.destinationTx}</span>
          <CopyButton text={details.destinationTx} label="Destination Transaction Hash" />
          <a 
            href={`https://sepolia.etherscan.io/tx/${details.destinationTx}`}
            target="_blank"
            rel="noopener noreferrer"
            className="external-link-btn"
            title="View on Etherscan"
          >
            🔗
          </a>
        </div>
      ) : (
        <span className="transaction-detail-value">No updates yet</span>
      )
    },
    {
      label: "SERVICE TYPE",
      value: details.serviceType
    },
    {
      label: "RECEIVER ADDRESS",
      render: () => (
        <div className="transaction-detail-value-wrapper">
          <span className="transaction-detail-value">{CONTRACT_ADDRESS}</span>
          <CopyButton text={CONTRACT_ADDRESS} label="Contract Address" />
        </div>
      )
    },
    {
      label: "TIME STAMP",
      value: details.destinationTimestamp ? formatTime(details.destinationTimestamp) : "Pending"
    }
  ];

  return (
    <div className="tx-details-page">
      <Navbar />
      <div className="tx-details-container">
        <div className="tx-header">
          <button onClick={() => navigate("/")} className="back-button">
            <span>{"<"} Back</span>
          </button>
        </div>

        <div className="summary-table-section">
          <div className="summary-table-container">
            <table className="summary-table">
              
              <tbody>
                <tr>
                  <td>Request ID</td>
                  <td>{details.requestId}</td>
                </tr>
                <tr>
                  <td>Citizen Address</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{details.citizenAddress}</span>
                      <CopyButton text={details.citizenAddress} label="Citizen Address" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>Service Type</td>
                  <td>{details.serviceType}</td>
                </tr>
                <tr>
                  <td>Status</td>
                  <td>
                    <StatusBadge status={details.status} />
                  </td>
                </tr>
                <tr>
                  <td>Created At</td>
                  <td>{formatTime(details.timestamp)}</td>
                </tr>
                <tr>
                  <td>Source Transaction</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <a 
                        href={`https://sepolia.etherscan.io/tx/${details.sourceTx}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tx-link"
                      >
                        {details.sourceTx}
                      </a>
                      <CopyButton text={details.sourceTx} label="Source Transaction Hash" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>Destination Transaction</td>
                  <td>
                    {details.destinationTx ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <a 
                          href={`https://sepolia.etherscan.io/tx/${details.destinationTx}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tx-link"
                        >
                          {details.destinationTx}
                        </a>
                        <CopyButton text={details.destinationTx} label="Destination Transaction Hash" />
                      </div>
                    ) : (
                      <span>No updates yet</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td>Last Updated</td>
                  <td>{details.destinationTimestamp ? formatTime(details.destinationTimestamp) : "Not updated yet"}</td>
                </tr>
              </tbody>
            </table>
            
          </div>
          
        </div>
        <br />
        <div className="token-cards-container">
          <TransactionCard 
            title="SOURCE TRANSACTION:"
            statusBadge={sourceStatusBadge}
            detailRows={sourceCardRows}
          />

          <TransactionCard 
            title="DESTINATION TRANSACTION:"
            statusBadge={destStatusBadge}
            detailRows={destinationCardRows}
          />
        </div>
      </div>
    </div>
  );
}
