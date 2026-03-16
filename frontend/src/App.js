import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ethers } from "ethers";
import Public from "./pages/Public";
import Citizen from "./pages/Citizen";
import Gov from "./pages/Gov.js";
import TransactionDetails from "./pages/TransactionDetails";
import { Web3Provider } from "./context/Web3Context";

function EnsLookupPanel() {
	const [ensInput, setEnsInput] = useState("");
	const [result, setResult] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const lookupEns = async () => {
		const name = ensInput.trim().toLowerCase();
		if (!name) {
			setError("Please enter an ENS name.");
			setResult("");
			return;
		}

		if (!name.endsWith(".eth")) {
			setError("Enter a valid ENS name ending with .eth");
			setResult("");
			return;
		}

		try {
			setLoading(true);
			setError("");

			// Always use Sepolia first (lupa.eth is registered on Sepolia ENS).
			// Falls back to mainnet if not found on Sepolia.
			const sepoliaProvider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
			const mainnetProvider = new ethers.JsonRpcProvider("https://ethereum-rpc.publicnode.com");

			let resolvedAddress = await sepoliaProvider.resolveName(name);
			if (!resolvedAddress) {
				resolvedAddress = await mainnetProvider.resolveName(name);
			}

			if (!resolvedAddress) {
				setResult("");
				setError("No address found for this ENS name.");
				return;
			}

			setResult(`${name} -> ${resolvedAddress}`);
		} catch (err) {
			setResult("");
			setError(err?.message || "ENS lookup failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div style={{ padding: "12px 16px", borderBottom: "1px solid #2f2f2f", background: "#111" }}>
			<div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
				<input
					type="text"
					value={ensInput}
					onChange={(e) => setEnsInput(e.target.value)}
					placeholder="Enter ENS name (e.g. lupa.eth)"
					style={{ minWidth: 260, padding: "8px 10px", borderRadius: 8, border: "1px solid #555", background: "#1b1b1b", color: "#fff" }}
				/>
				<button
					type="button"
					onClick={lookupEns}
					disabled={loading}
					style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #666", background: "#2a2a2a", color: "#fff", cursor: "pointer" }}
				>
					{loading ? "Looking up..." : "Show ENS"}
				</button>
			</div>
			{result && <p style={{ margin: "10px 0 0", color: "#7ee787" }}>{result}</p>}
			{error && <p style={{ margin: "10px 0 0", color: "#ff7b72" }}>{error}</p>}
		</div>
	);
}

export default function App() {
	return (
		<Web3Provider>
			<BrowserRouter>
				<EnsLookupPanel />
				<Routes>
					<Route path="/" element={<Public />} />
					<Route path="/citizen" element={<Citizen />} />
					<Route path="/admin" element={<Gov />} />
					<Route path="/gov" element={<Gov />} />
					<Route path="/:txHash" element={<TransactionDetails />} />
				</Routes>
			</BrowserRouter>
		</Web3Provider>
	);
}
