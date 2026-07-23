import { useState } from "react";
import { ProductionBoard } from "../../components/ProductionBoard";
import { ProductionDashboard } from "../../components/ProductionDashboard";

type ViewMode = "board" | "dashboard";

export default function AdminProductionPage() {
  const [view, setView] = useState<ViewMode>("board");

  return (
    <>
      <div className="prod-page__header">
        <h1>Manufacturing</h1>
        <div className="prod-page__tabs">
          <button
            className={`prod-page__tab ${view === "board" ? "prod-page__tab--active" : ""}`}
            onClick={() => setView("board")}
          >
            Board
          </button>
          <button
            className={`prod-page__tab ${view === "dashboard" ? "prod-page__tab--active" : ""}`}
            onClick={() => setView("dashboard")}
          >
            Dashboard
          </button>
        </div>
      </div>
      {view === "board" && <ProductionBoard />}
      {view === "dashboard" && <ProductionDashboard />}
    </>
  );
}
