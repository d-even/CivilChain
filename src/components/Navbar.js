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
