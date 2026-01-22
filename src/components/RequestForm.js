import { useState } from "react";
import "./RequestForm.css";

export default function RequestForm({ onSubmit, loading }) {
  const [serviceType, setServiceType] = useState("");
  const [description, setDescription] = useState("");

  const serviceOptions = [
    "Birth Certificate",
    "Marriage Certificate",
    "Death Certificate",
    "Business License",
    "Building Permit",
    "Tax Clearance",
    "Identity Card",
    "Passport",
    "Other"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!serviceType.trim()) {
      alert("Please select a service type");
      return;
    }
    await onSubmit(serviceType);
    setServiceType("");
    setDescription("");
  };

  return (
    <div className="request-form-container">
      <h2 className="form-title">📝 Submit New Service Request</h2>
      <form onSubmit={handleSubmit} className="request-form">
        <div className="form-group">
          <label htmlFor="serviceType" className="form-label">
            Service Type *
          </label>
          <select
            id="serviceType"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="form-select"
            disabled={loading}
            required
          >
            <option value="">-- Select a service --</option>
            {serviceOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="submit-btn"
          disabled={loading || !serviceType}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Processing...
            </>
          ) : (
            <>
              Submit to Blockchain
            </>
          )}
        </button>
      </form>
    </div>
  );
}
