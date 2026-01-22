import { BrowserRouter, Routes, Route } from "react-router-dom";
import Public from "./pages/Public";
import Citizen from "./pages/Citizen";
import Gov from "./pages/Gov.js";
import TransactionDetails from "./pages/TransactionDetails";
import { Web3Provider } from "./context/Web3Context";

export default function App() {
  return (
    <Web3Provider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Public />} />
          <Route path="/citizen" element={<Citizen />} />
          <Route path="/gov" element={<Gov />} />
          <Route path="/:txHash" element={<TransactionDetails />} />
        </Routes>
      </BrowserRouter>
    </Web3Provider>
  );
}
