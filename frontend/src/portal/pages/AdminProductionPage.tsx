import { useState } from "react";
import EngineerBoardPage from "./EngineerBoardPage";
import { ProductionBoard } from "../../components/ProductionBoard";
import { ProductionDashboard } from "../../components/ProductionDashboard";
import { GitPullRequest, KanbanSquare, BarChart3 } from "lucide-react";
import "./erpListView.css";

type ViewMode = "pipeline" | "jobs" | "dashboard";

export default function AdminProductionPage() {
  const [view, setView] = useState<ViewMode>("pipeline");

  return (
    <div className="inv-page">
      {/* Header */}
      <div className="inv-header">
        <div>
          <h1 className="inv-header__title">Production &amp; Manufacturing</h1>
          <p className="inv-header__subtitle">
            Manage factory order pipelines, shopfloor jobs, and manufacturing analytics.
          </p>
        </div>
        <div className="inv-segmented" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className={view === "pipeline" ? "inv-btn inv-btn--primary" : "inv-btn"}
            onClick={() => setView("pipeline")}
          >
            <GitPullRequest size={15} /> Order Pipeline
          </button>
          <button
            className={view === "jobs" ? "inv-btn inv-btn--primary" : "inv-btn"}
            onClick={() => setView("jobs")}
          >
            <KanbanSquare size={15} /> Shopfloor Jobs
          </button>
          <button
            className={view === "dashboard" ? "inv-btn inv-btn--primary" : "inv-btn"}
            onClick={() => setView("dashboard")}
          >
            <BarChart3 size={15} /> Analytics
          </button>
        </div>
      </div>

      {/* View */}
      {view === "pipeline" && <EngineerBoardPage />}
      {view === "jobs" && <ProductionBoard />}
      {view === "dashboard" && <ProductionDashboard />}
    </div>
  );
}

