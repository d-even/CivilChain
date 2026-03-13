import { useState } from "react";
import { uploadToFileverse, getIpfsUrl } from "../utils/fileverse";
import "./RequestForm.css";

export default function RequestForm({ onSubmit, loading }) {
  const [serviceType, setServiceType] = useState("");
  const [description, setDescription] = useState("");
  const [filePreviewUrl, setFilePreviewUrl] = useState("");
  const [ipfsHash, setIpfsHash] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

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

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadError("");
    setUploading(true);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => setFilePreviewUrl(reader.result);
    reader.readAsDataURL(file);

    try {
      // Upload to Fileverse IPFS
      const result = await uploadToFileverse(file);
      setIpfsHash(result.ipfsHash);
      console.log("File uploaded to IPFS:", result);
    } catch (error) {
      setUploadError(error.message || "Failed to upload file");
      setIpfsHash("");
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!serviceType.trim()) {
      alert("Please select a service type");
      return;
    }
    // Store the IPFS hash on-chain (points to the file in Fileverse)
    await onSubmit(serviceType, ipfsHash);
    setServiceType("");
    setDescription("");
    setFilePreviewUrl("");
    setIpfsHash("");
    setUploadError("");
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
            disabled={loading || uploading}
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
        <div className="form-group">
          <label htmlFor="description" className="form-label">
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="form-textarea"
            disabled={loading || uploading}
            rows={4}
            placeholder="Add any additional details about your request..."
          />
        </div>
        <div className="form-group">
          <label htmlFor="userDoc" className="form-label">
            Upload Document (Image)
          </label>
          <input
            id="userDoc"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            disabled={loading || uploading}
            onChange={handleFileChange}
          />
          {uploading && (
            <div className="upload-status">
              <span className="spinner"></span>
              Uploading to IPFS via Fileverse...
            </div>
          )}
          {uploadError && (
            <div className="upload-error">
              ❌ {uploadError}
            </div>
          )}
          {filePreviewUrl && !uploadError && (
            <div className="preview">
              <img src={filePreviewUrl} alt="preview" className="preview-img" />
              {ipfsHash && (
                <div className="hash-info">
                  <small>
                    ✅ Stored on IPFS: 
                    <a 
                      href={getIpfsUrl(ipfsHash)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ipfs-link"
                    >
                      {ipfsHash.slice(0, 12)}...{ipfsHash.slice(-6)}
                    </a>
                  </small>
                </div>
              )}
            </div>
          )}
        </div>
        <button
          type="submit"
          className="submit-btn"
          disabled={loading || uploading || !serviceType}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Processing...
            </>
          ) : uploading ? (
            <>
              <span className="spinner"></span>
              Uploading...
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
