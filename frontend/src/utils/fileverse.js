/**
 * IPFS Upload Utility (via Pinata)
 * Uploads images to IPFS via Pinata pinning service
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

/**
 * Upload a file to Fileverse IPFS
 * @param {File} file - The file to upload
 * @returns {Promise<{success: boolean, ipfsHash: string, gatewayUrl: string}>}
 */
export async function uploadToFileverse(file) {
  if (!file) {
    throw new Error("No file provided");
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed.");
  }

  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("File too large. Maximum size is 10MB.");
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${BACKEND_URL}/upload`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Upload failed with status ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || "Upload failed");
    }

    return {
      success: true,
      ipfsHash: data.ipfsHash,
      gatewayUrl: data.gatewayUrl,
      originalName: data.originalName,
      size: data.size
    };
  } catch (error) {
    console.error("Fileverse upload error:", error);
    throw error;
  }
}

/**
 * Get the IPFS gateway URL for a hash
 * @param {string} ipfsHash - The IPFS hash/CID
 * @returns {string} The gateway URL
 */
export function getIpfsUrl(ipfsHash) {
  if (!ipfsHash) return "";
  // Remove ipfs:// prefix if present
  const hash = ipfsHash.replace(/^ipfs:\/\//, "");
  return `https://gateway.pinata.cloud/ipfs/${hash}`;
}

/**
 * Check if a string is an IPFS hash
 * @param {string} str - The string to check
 * @returns {boolean}
 */
export function isIpfsHash(str) {
  if (!str || typeof str !== "string") return false;
  // IPFS CIDv0 starts with Qm and is 46 characters
  // IPFS CIDv1 starts with b or other base encodings
  return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(str) || 
         /^b[a-z2-7]{58,}$/i.test(str) ||
         str.startsWith("ipfs://");
}

export default {
  uploadToFileverse,
  getIpfsUrl,
  isIpfsHash
};
