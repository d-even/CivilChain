# CivilChain  
### Transparent & Accountable Public Service Delivery Using Blockchain

CivilChain is a blockchain-based platform designed to improve **transparency, accountability, and trust** in public service delivery.  
It records every service request and government action on an immutable blockchain ledger, enabling citizens and the public to independently verify the process.

---

## Problem Statement

Public service delivery systems often suffer from:
- Lack of transparency
- Delays with no accountability
- Manual manipulation of records
- Low citizen trust

Citizens usually have no clear visibility into:
- Who is handling their request
- When a decision was made

---

## Solution Overview

CivilChain solves this by using **blockchain as a single source of truth**.

- Citizens submit service requests using a crypto wallet
- Government officers approve or reject requests on-chain
- Every action is timestamped, immutable, and publicly verifiable
- Transaction hashes provide cryptographic proof of actions

No centralized database. No hidden changes.

---

## How It Works (Workflow)

1. **Citizen submits request**
   - Connects wallet (MetaMask)
   - Selects service type (e.g., Birth Certificate)
   - Request is stored on blockchain with status `SUBMITTED`

2. **Public transparency**
   - Anyone can view all requests
   - No login required
   - Data fetched directly from blockchain

3. **Officer verification**
   - Officer connects using an authorized wallet (Nightly)
   - Approves or rejects request
   - Provides rejection reason if rejected

4. **Verification**
   - Each action generates a transaction hash
   - Anyone can verify it on Etherscan

---

##  Authentication Model

Public -> No authentication 
Citizen -> Wallet-based 
Officer -> Authorized wallet 

> Identity is decentralized and wallet-based — no passwords or databases.

---

## Data Stored On-Chain

- Request ID
- Citizen wallet address
- Service type
- Status (Submitted / Approved / Rejected)
- Timestamp
- Officer action (via wallet)
- Transaction hashes (via events)

❌ No personal or sensitive data stored on-chain

---

## Tech Stack

- **Blockchain:** Ethereum Sepolia Testnet
- **Smart Contracts:** Solidity
- **Frontend:** React
- **Wallets:** MetaMask (Citizen), Nightly (Officer)
- **Blockchain Library:** Ethers.js
- **Verification:** Etherscan

---

## Example Use Case

**Birth Certificate Application**

- Citizen submits request
- Officer verifies documents offline
- Officer approves request on-chain
- Public can verify approval using transaction hash

This ensures:
- No denial of responsibility
- No record manipulation
- Full transparency

---

## Why Blockchain?

Traditional databases can be:
- Edited
- Deleted
- Controlled by admins

Blockchain ensures:
- **Immutability**
- **Public verifiability**
- **Accountability**
- **Trust by design**

---

## Future Enhancements

- SLA-based delay tracking
- Document hash verification
- Analytics dashboard for governance
- NFT-based digital certificates
- QR-based public verification

---

## Impact

CivilChain helps:
- Reduce corruption
- Improve service efficiency
- Increase citizen trust
- Enable public audits

It can be extended to:
- Certificates
- Licenses
- Permits
- Subsidies
- Tax services

---