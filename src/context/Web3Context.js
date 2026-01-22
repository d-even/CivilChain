import { createContext, useState } from "react";
import { ethers } from "ethers";
import ABI from "../abi/TransparentService.json";

export const Web3Context = createContext();

const CONTRACT_ADDRESS = "0x0C179c4Ef979364b28F4A9d6531a00FD3aAEFb03";
const OFFICER_ADDRESS = "0x1F926A6cBf8a77C3faA98ef7C82c503d5349d985";

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [error, setError] = useState("");
  const [network, setNetwork] = useState(null);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError("Wallet not detected. Please install MetaMask.");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const net = await provider.getNetwork();
      setNetwork({ chainId: Number(net.chainId), name: net.name });

      const code = await provider.getCode(CONTRACT_ADDRESS);
      if (!code || code === "0x") {
        setError("No contract found at this address on the selected network.");
        return;
      }

      const signer = await provider.getSigner();
      const addr = await signer.getAddress();

      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        ABI,
        signer
      );

      setAccount(addr);
      setContract(contractInstance);
      setError("");
    } catch (err) {
      console.error("connectWallet error:", err);
      setError(err?.reason || err?.message || "Unknown error");
    }
  };

  return (
    <Web3Context.Provider value={{
      connectWallet,
      account,
      contract,
      OFFICER_ADDRESS,
      error,
      network
    }}>
      {children}
    </Web3Context.Provider>
  );
};
