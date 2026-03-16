import { createContext, useState } from "react";
import { ethers } from "ethers";
import ABI from "../abi/TransparentService.json";
import { lookupEnsName, resolveAddressOrEns, autoResolveEnsForAddress } from "../utils/ens";

export const Web3Context = createContext();

const CONTRACT_ADDRESS = "0xe8C91E7AD5d6a6E05FcceD98A611fa72425498fE";
const MAIN_ADMIN_INPUT =
  process.env.REACT_APP_MAIN_ADMIN ||
  "0x30e77463369433E6D3d33873C1CCD965ca308440";

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [error, setError] = useState("");
  const [network, setNetwork] = useState(null);
  const [officerAddress, setOfficerAddress] = useState(MAIN_ADMIN_INPUT);
  const [officerVerified, setOfficerVerified] = useState(false);
  const [mainAdmin, setMainAdmin] = useState(null);
  const [web3Provider, setWeb3Provider] = useState(null);

  const resolveEnsName = async (address) => {
    return lookupEnsName(web3Provider, address);
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError("Wallet not detected. Please install MetaMask.");
        return;
      }

      // Explicitly request account access first
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const provider = new ethers.BrowserProvider(window.ethereum);
      setWeb3Provider(provider);
      const net = await provider.getNetwork();
      setNetwork({ chainId: Number(net.chainId), name: net.name });

      const signer = await provider.getSigner();
      const addr = await signer.getAddress();

      let contractInstance = null;
      try {
        const code = await provider.getCode(CONTRACT_ADDRESS);
        if (!code || code === "0x") {
          setError(
            "No contract found at this address on the selected network. Contract-dependent features may be disabled."
          );
        } else {
          contractInstance = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
          setError("");

          try {
            // Read main admin
            try {
              const ma = await contractInstance.mainAdmin();
              setMainAdmin(ma);
            } catch (maErr) {
              const fallbackAdmin = await resolveAddressOrEns(provider, MAIN_ADMIN_INPUT);
              setMainAdmin(fallbackAdmin);
            }

            // Check whether connected address is a verified officer
            const isVerified = await contractInstance.isVerifiedOfficer(addr);
            setOfficerVerified(Boolean(isVerified));
            // keep officerAddress as the connected address for display
            setOfficerAddress(addr);
          } catch (officerErr) {
            console.warn("Failed to read officer status from contract:", officerErr);
            setOfficerVerified(false);
          }
        }
      } catch (e) {
        console.warn("getCode failed:", e);
      }

      // Auto-detect ENS name via forward resolution (works without Primary Name set).
      await autoResolveEnsForAddress(addr);

      setAccount(addr);
      setContract(contractInstance);

      if (!mainAdmin) {
        const fallbackAdmin = await resolveAddressOrEns(provider, MAIN_ADMIN_INPUT);
        setMainAdmin(fallbackAdmin);
      }
      return contractInstance;
    } catch (err) {
      console.error("connectWallet error:", err);
      setError(err?.reason || err?.message || "Unknown error");
      return null;
    }
  };

  // Ensure wallet is properly connected and authorized before transactions
  const ensureConnected = async () => {
    try {
      if (!window.ethereum) {
        setError("Wallet not detected. Please install MetaMask.");
        return null;
      }

      // Re-request account access to ensure authorization
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const provider = new ethers.BrowserProvider(window.ethereum);
      setWeb3Provider(provider);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();

      // If account changed or contract not set, reconnect
      if (!contract || addr.toLowerCase() !== account?.toLowerCase()) {
        return await connectWallet();
      }

      // Re-create contract with fresh signer to ensure authorization
      const freshContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      setContract(freshContract);
      return freshContract;
    } catch (err) {
      console.error("ensureConnected error:", err);
      setError(err?.reason || err?.message || "Authorization failed");
      return null;
    }
  };

  return (
    <Web3Context.Provider value={{
      connectWallet,
      ensureConnected,
      resolveEnsName,
      account,
      contract,
      OFFICER_ADDRESS: officerAddress,
      officerVerified,
      mainAdmin,
      error,
      network
    }}>
      {children}
    </Web3Context.Provider>
  );
};
