import { useState } from "react";
import { ProductionBoard } from "../../components/ProductionBoard";
import { ProductionDashboard } from "../../components/ProductionDashboard";
import { KanbanSquare, BarChart3 } from "lucide-react";
import "../erpListView.css";

type ViewMode = "board" | "dashboard";

export default function AdminProductionPage() {
  const [view, setView] = useState<ViewMode>("board");

  return (
    <div className="inv-page">
      {/* Header */}
      <div className="inv-header">
        <div>
          <h1 className="inv-header__title">Production</h1>
          <p className="inv-header__subtitle">Track production jobs, stages, and manufacturing output.</p>
        </div>
        <div className="inv-segmented" style={{ display: "flex", gap: 8 }}>
          <button className={view === "board" ? "inv-btn inv-btn--primary" : "inv-btn"} onClick={() => setView("board")}>
            <KanbanSquare size={15} /> Board
          </button>
          <button className={view === "dashboard" ? "inv-btn inv-btn--primary" : "inv-btn"} onClick={() => setView("dashboard")}>
            <BarChart3 size={15} /> Dashboard
          </button>
        </div>
      </div>

      {/* View */}
      {view === "board" ? <ProductionBoard /> : <ProductionDashboard />}
    </div>
  );
}
