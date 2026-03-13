const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const cors = require("cors");

const app = express();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

// Pinata IPFS for decentralized file storage
const PINATA_API_KEY = process.env.PINATA_API_KEY || "77bbde013250c58ee995";
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY || "1bf223262cb3c7383fa2b14eafe89910d9c541a247b708909e2cab6c98ea96eb";

app.use(cors({ origin: ["http://localhost:3000", "http://127.0.0.1:3000"] }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Upload image to Pinata IPFS
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }

  const form = new FormData();
  form.append("file", req.file.buffer, {
    filename: req.file.originalname,
    contentType: req.file.mimetype
  });

  try {
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      form,
      {
        headers: {
          ...form.getHeaders(),
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    const ipfsHash = response.data.IpfsHash;
    console.log("Uploaded to IPFS:", ipfsHash);

    res.json({
      success: true,
      ipfsHash: ipfsHash,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
    });

  } catch (error) {
    console.log("Upload error:", error.response?.data || error.message);
    res.status(500).json({ error: "Upload failed", message: error.message });
  }
});

app.listen(3001, () => console.log("IPFS upload server running on port 3001"));