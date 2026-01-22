import { useState } from "react";
import "./RequestCard.css";

export default function RequestCard({ request, onApprove, onReject, loading, showActions = false }) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const getStatusInfo = (status) => {
    const statusNum = Number(status);
    const statuses = {
      0: { text: "PENDING", class: "status-pending", icon: "⏳" },
      1: { text: "APPROVED", class: "status-approved", icon: "✅" },
      2: { text: "REJECTED", class: "status-rejected", icon: "❌" }
    };
    return statuses[statusNum] || statuses[0];
  };

  const formatTime = (timestamp) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString('en-US', { 
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const truncateAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  const statusInfo = getStatusInfo(request.status);
  const isPending = Number(request.status) === 0;
  const requestId = Number(request.id);

  const handleRejectClick = () => {
    setShowRejectForm(true);
  };

  const handleRejectSubmit = () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }
    onReject(requestId, rejectionReason);
    setShowRejectForm(false);
    setRejectionReason("");
  };

  const handleRejectCancel = () => {
    setShowRejectForm(false);
    setRejectionReason("");
  };

  return (
   <>
      <div className="card-header-section">
        <div className="card-title-row">
          <span className="card-request-id">Request #{requestId}</span>
          <span className={`card-status-badge ${statusInfo.class}`}>
            <span className="badge-icon">{statusInfo.icon}</span>
            <span className="badge-text">{statusInfo.text}</span>
          </span>
        </div>
      </div>

      <div className="card-content">
        <div className="card-info-grid">
          <div className="info-item">
            <span className="info-label">Citizen:</span>
            <span className="info-value">{truncateAddress(request.citizen)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Service:</span>
            <span className="info-value">{request.serviceType}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Description:</span>
            <span className="info-value description">{request.description}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Submitted:</span>
            <span className="info-value">{formatTime(request.timestamp)}</span>
          </div>
        </div>

        {!showActions && request.rejectionReason && Number(request.status) === 2 && (
          <div className="rejection-reason-display">
            <label className="rejection-reason-label">Rejection Reason:</label>
            <p className="rejection-reason-text">{request.rejectionReason}</p>
          </div>
        )}

        {showActions && isPending && !showRejectForm && (
          <div className="card-actions">
            <button
              className="action-button approve-button"
              onClick={() => onApprove(requestId)}
              disabled={loading}
            >
              <span className="button-icon">✅</span>
              <span>Approve</span>
            </button>
            <button
              className="action-button reject-button"
              onClick={handleRejectClick}
              disabled={loading}
            >
              <span className="button-icon">❌</span>
              <span>Reject</span>
            </button>
          </div>
        )}

        {showActions && isPending && showRejectForm && (
          <div className="rejection-form">
            <label className="rejection-label">Reason for Rejection *</label>
            <textarea
              className="rejection-textarea"
              placeholder="Provide a detailed reason for rejecting this request..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows="4"
              disabled={loading}
            />
            <div className="rejection-actions">
              <button
                className="action-button confirm-reject-button"
                onClick={handleRejectSubmit}
                disabled={loading || !rejectionReason.trim()}
              >
                <span className="button-icon">❌</span>
                <span>Confirm Rejection</span>
              </button>
              <button
                className="action-button cancel-button"
                onClick={handleRejectCancel}
                disabled={loading}
              >
                <span>Cancel</span>
              </button>
            </div>
          </div>
        )}

        {showActions && !isPending && (
          <div className="processed-indicator">
            <span className="processed-icon">{statusInfo.icon}</span>
            <span className="processed-text">Processed</span>
          </div>
        )}
      </div>
</>
  );
}
