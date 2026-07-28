import { useState } from "react";
import { ProductionBoard } from "../../components/ProductionBoard";
import { ProductionDashboard } from "../../components/ProductionDashboard";

type ViewMode = "board" | "dashboard";

export default function AdminProductionPage() {
  const [view, setView] = useState<ViewMode>("board");

  return (
    <>
      <div style={{display:"flex",gap:"8px",marginBottom:"16px"}}>
        <button style={{padding:"6px 16px",borderRadius:"8px",fontSize:"12px",fontWeight:600,border:"1px solid #e5e7eb",background:view === "board" ? "#2563eb" : "#fff",color:view === "board" ? "#fff" : "#374151",cursor:"pointer"}} onClick={() => setView("board")}>Board</button>
        <button style={{padding:"6px 16px",borderRadius:"8px",fontSize:"12px",fontWeight:600,border:"1px solid #e5e7eb",background:view === "dashboard" ? "#2563eb" : "#fff",color:view === "dashboard" ? "#fff" : "#374151",cursor:"pointer"}} onClick={() => setView("dashboard")}>Dashboard</button>
      </div>
      {view === "board" && <ProductionBoard />}
      {view === "dashboard" && <ProductionDashboard />}
    </>
  );
}
