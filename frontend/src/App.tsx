import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { HomePage } from "./features/public/HomePage";
import { PortalPlaceholder } from "./features/shared/PortalPlaceholder";
import "./App.css";

/**
 * Top-level routes. Portal routes are placeholders until their milestones;
 * role-based route guards are added with authentication in Milestone 2.
 */
function App() {
  return (
    <BrowserRouter>
      <nav aria-label="Main navigation" className="main-nav">
        <Link to="/">Home</Link>
        <Link to="/portal/customer">Customer Portal</Link>
        <Link to="/portal/updater">Data Updater Portal</Link>
        <Link to="/portal/admin">Admin Portal</Link>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/portal/customer"
          element={<PortalPlaceholder title="Customer Portal" milestone="Milestone 4" />}
        />
        <Route
          path="/portal/updater"
          element={<PortalPlaceholder title="Data Updater Portal" milestone="Milestone 5" />}
        />
        <Route
          path="/portal/admin"
          element={<PortalPlaceholder title="Admin Portal" milestone="Milestone 5" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
