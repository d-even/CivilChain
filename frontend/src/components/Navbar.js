import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
       
          <span className="logo-text">CivilChain</span>
        </Link>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link
              to="/"
              className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
            >
              Home
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/citizen"
              className={`nav-link ${location.pathname === "/citizen" ? "active" : ""}`}
            >
              Citizen
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/admin"
              className={`nav-link ${location.pathname === "/admin" ? "active" : ""}`}
            >
              Main Admin
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/gov"
              className={`nav-link ${location.pathname === "/gov" ? "active" : ""}`}
            >
              Officer
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}



// import React, { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { ethers } from "ethers";
// import { SelfQRcodeWrapper, SelfAppBuilder } from "@selfxyz/qrcode";
// import { v4 as uuidv4 } from "uuid";
// import "./Navbar.css";

// const SELF_SCOPE = "zk-self-login";
// const rawSelfEndpoint = (process.env.REACT_APP_SELF_ENDPOINT || "").trim();
// const SELF_ENDPOINT = rawSelfEndpoint.endsWith("/verify")
//   ? rawSelfEndpoint
//   : `${rawSelfEndpoint.replace(/\/$/, "")}/verify`;
// const isScopeValid = SELF_SCOPE.length > 0 && SELF_SCOPE.length <= 31;

// function Navbar() {
//   const navigate = useNavigate();
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [wallet, setWallet] = useState("");
//   const [status, setStatus] = useState("");
//   const [step, setStep] = useState(1);
//   const [userId, setUserId] = useState("");

//   useEffect(() => {
//     setUserId(uuidv4());
//   }, []);

//   const selfApp = useMemo(() => {
//     if (!userId || !isScopeValid || !SELF_ENDPOINT) {
//       return null;
//     }

//     return new SelfAppBuilder({
//       appName: "ZK Self Login",
//       scope: SELF_SCOPE,
//       endpoint: SELF_ENDPOINT,
//       userId,
//       disclosures: {
//         name: true,
//         date_of_birth: true,
//         minimumAge: 18,
//       },
//     }).build();
//   }, [userId]);

//   const connectWallet = async () => {
//     if (!window.ethereum) {
//       setStatus("MetaMask not detected.");
//       return;
//     }

//     try {
//       const provider = new ethers.BrowserProvider(window.ethereum);
//       const accounts = await provider.send("eth_requestAccounts", []);
//       const account = accounts?.[0] || "";
//       setWallet(account);
//       setStep(2);
//       setStatus("");
//     } catch (error) {
//       setStatus(`Wallet connection failed: ${error.message}`);
//     }
//   };

//   const handleSelfSuccess = async () => {
//     setStep(3);
//     setStatus("Verification successful. Redirecting...");
//     setTimeout(() => {
//       closeModal();
//       navigate("/dashboard");
//     }, 1200);
//   };

//   const handleSelfError = (error) => {
//     const errorMessage =
//       error?.message ||
//       "Self verification failed. Check your app scope/circuit settings.";
//     setStatus(errorMessage);
//     setStep(2);
//   };

//   const openModal = async () => {
//     setIsMenuOpen(false);
//     setIsModalOpen(true);
//     setStatus("");
//     setStep(1);
//     await connectWallet();
//   };

//   const closeModal = () => {
//     setIsModalOpen(false);
//     setStep(1);
//     setStatus("");
//   };

//   return (
//     <>
//       <nav className="civil-navbar">
//         <div className="civil-navbar__inner">
//           <a className="civil-navbar__brand" href="/">
//             CIVIL-CHAIN
//           </a>

//           <div className="wallet-menu">
//             <button
//               type="button"
//               className="civil-navbar__wallet-btn"
//               aria-haspopup="menu"
//               aria-expanded={isMenuOpen}
//               onClick={() => setIsMenuOpen((prev) => !prev)}
//             >
//               CONNECT WALLET
//             </button>

//             {isMenuOpen && (
//               <ul className="wallet-menu__list" role="menu">
//                 <li role="none">
//                   <button type="button" role="menuitem" onClick={() => setIsMenuOpen(false)}>
//                     Main Admin
//                   </button>
//                 </li>
//                 <li role="none">
//                   <button type="button" role="menuitem" onClick={openModal}>
//                     Officers
//                   </button>
//                 </li>
//                 <li role="none">
//                   <button type="button" role="menuitem" onClick={() => setIsMenuOpen(false)}>
//                     Citizens
//                   </button>
//                 </li>
//               </ul>
//             )}
//           </div>
//         </div>
//       </nav>

//       {isModalOpen && (
//         <div className="civil-modal" role="dialog" aria-modal="true" aria-labelledby="walletModalTitle">
//           <div className="civil-modal__backdrop" onClick={closeModal} />
//           <div className="civil-modal__panel">
//             <div className="civil-modal__header">
//               <h2 id="walletModalTitle">Verified as Officer</h2>
//               <button type="button" className="civil-modal__close" onClick={closeModal} aria-label="Close popup">
//                 x
//               </button>
//             </div>

//             <div className="civil-modal__body">
//               {step === 1 && (
//                 <>
//                   <p>Connect your wallet to continue.</p>
//                   <button type="button" className="civil-modal__btn civil-modal__btn--primary" onClick={connectWallet}>
//                     Connect Wallet
//                   </button>
//                 </>
//               )}

//               {step === 2 && (
//                 <>
//                   <p className="wallet-address">
//                     Wallet: {wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "Not connected"}
//                   </p>
//                   {selfApp ? (
//                     <div className="qr-container">
//                       <SelfQRcodeWrapper
//                         selfApp={selfApp}
//                         onSuccess={handleSelfSuccess}
//                         onError={handleSelfError}
//                         size={220}
//                       />
//                     </div>
//                   ) : (
//                     <p>Set `REACT_APP_SELF_ENDPOINT` to enable ZK scan.</p>
//                   )}
//                 </>
//               )}

//               {step === 3 && <p>Processing zero-knowledge proof...</p>}

//               {status && <p className="status-text">{status}</p>}
//             </div>

//             <div className="civil-modal__footer">
//               <button type="button" className="civil-modal__btn" onClick={closeModal}>
//                 Cancel
//               </button>
//               <button
//                 type="button"
//                 className="civil-modal__btn civil-modal__btn--primary"
//                 onClick={step === 1 ? connectWallet : closeModal}
//               >
//                 Connect
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
     
//   );
// }

// export default Navbar;
    