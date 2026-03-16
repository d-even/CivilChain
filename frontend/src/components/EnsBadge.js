import { useState, useEffect } from "react";
import "./EnsBadge.css";
import { lookupEnsName } from "../utils/ens";
import { ethers } from "ethers";

export default function EnsBadge({ className = "" }) {
  const [account, setAccount] = useState(null);
  const [ensName, setEnsName] = useState(null);

  useEffect(() => {
    checkIfWalletConnected();
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, []);

  useEffect(() => {
    if (!account) { setEnsName(null); return; }
    const provider = window.ethereum
      ? new ethers.BrowserProvider(window.ethereum)
      : null;
    lookupEnsName(provider, account).then(setEnsName);
  }, [account]);

  const checkIfWalletConnected = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      } catch (error) {
        console.log("Error checking wallet:", error);
      }
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
    } else {
      setAccount(null);
      setEnsName(null);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not installed. Please install it to continue.");
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setEnsName(null);
  };

  const displayAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!account) {
    return (
      <button
        onClick={connectWallet}
        className={`ens-badge connect-btn ${className}`.trim()}
      >
        <span className="ens-badge-icon">🔌</span>
        <span className="ens-badge-text">Connect Wallet</span>
      </button>
    );
  }

  return (
    <div className={`ens-badge connected ${className}`.trim()}>
      <span className="ens-badge-icon">✓</span>
      <span className="ens-badge-text">{ensName || displayAddress(account)}</span>
      <button
        onClick={disconnectWallet}
        className="disconnect-btn"
        title="Disconnect wallet"
      >
        ✕
      </button>
    </div>
  );
}
