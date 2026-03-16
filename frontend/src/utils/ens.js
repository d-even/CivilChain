import { ethers } from "ethers";

const ensNameCache = new Map();

// Sepolia first because lupa.eth resolves correctly there.
// Mainnet is secondary for wallets that have ENS on mainnet.
const SEPOLIA_RPC = "https://ethereum-sepolia-rpc.publicnode.com";
const MAINNET_RPC = "https://ethereum-rpc.publicnode.com";
const fallbackProviders = [
  new ethers.JsonRpcProvider(SEPOLIA_RPC),
  new ethers.JsonRpcProvider(MAINNET_RPC),
];

export const isEnsName = (value = "") => {
  return value.trim().toLowerCase().endsWith(".eth");
};

export const formatAddress = (address = "") => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const displayEns = (ensName) => {
  return ensName || "No ENS set";
};


export const autoResolveEnsForAddress = async (address) => {
  if (!address || typeof window === "undefined") return null;

  const rawNames = process.env.REACT_APP_ENS_NAMES || "";
  const names = rawNames
    .split(",")
    .map((n) => n.trim().toLowerCase())
    .filter((n) => n.endsWith(".eth"));

  if (names.length === 0) return null;

  const key = address.toLowerCase();

  // Forward-resolve each configured name on Sepolia, then mainnet.
  for (const provider of fallbackProviders) {
    for (const name of names) {
      try {
        const resolved = await provider.resolveName(name);
        if (resolved && resolved.toLowerCase() === key) {
          ensNameCache.set(key, name);
          return name;
        }
      } catch (err) {
        // try next
      }
    }
  }

  return null;
};

export const lookupEnsName = async (provider, address) => {
  if (!provider || !address || !ethers.isAddress(address)) {
    return null;
  }

  const key = address.toLowerCase();
  if (ensNameCache.has(key)) {
    return ensNameCache.get(key);
  }

  try {
    let name = await provider.lookupAddress(address);

    if (!name) {
      for (const fallbackProvider of fallbackProviders) {
        try {
          name = await fallbackProvider.lookupAddress(address);
          if (name) break;
        } catch (error) {
          // Try the next provider.
        }
      }
    }

    const normalized = name || null;
    ensNameCache.set(key, normalized);
    return normalized;
  } catch (error) {
    ensNameCache.set(key, null);
    return null;
  }
};

export const resolveAddressOrEns = async (provider, addressOrEns) => {
  if (!addressOrEns) return null;

  const value = addressOrEns.trim();
  if (!value) return null;

  if (ethers.isAddress(value)) {
    return ethers.getAddress(value);
  }

  if (!provider || !isEnsName(value)) {
    return null;
  }

  try {
    const resolved = await provider.resolveName(value);
    return resolved ? ethers.getAddress(resolved) : null;
  } catch (error) {
    return null;
  }
};
