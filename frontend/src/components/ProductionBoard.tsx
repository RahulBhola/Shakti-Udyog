import { useCallback, useEffect, useRef, useState } from "react";
import { apiDelete, apiGet, apiPost, apiPut } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { formatDate } from "../portal/shared";
import { adminApi } from "../api/adminApi";

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface ProductionJob {
  id: string;
  jobNumber: string;
  castingName: string;
  currentStage: string;
  stagePosition: number;
  priority: string | null;
  partNumber: string | null;
  drawingNumber: string | null;
  patternNumber: string | null;
  materialGrade: string | null;
  castingWeight: number | null;
  quantity: number;
  companyName: string;
  targetDispatchDateUtc: string | null;
  progressPercent: number;
  status: string;
  isBlocked: boolean;
  assignedEngineer: string | null;
  assignedSupervisor: string | null;
  department: string | null;
  productionBatch: string | null;
  currentMachine: string | null;
  orderNumber: string | null;
  createdAtUtc: string;
}

interface BoardPreferences {
  visibleColumns: string | null;
  visibleCardFields: string | null;
  cardSize: string;
  displayMode: string;
  columnOrder: string | null;
}

/* ── Constants ─────────────────────────────────────────────────────────────── */

const WORKFLOW = [
  "Pending Advance", "Awaiting Approval", "Advance Paid", "Confirmed",
  "Pattern Development", "Production", "Quality Check", "Packed",
  "Ready to Dispatch", "Dispatched", "Delivered"
];

const STAGE_COLORS: Record<string, string> = {
  "Pending Advance": "#9ca3af", "Awaiting Approval": "#f59e0b", "Advance Paid": "#22c55e",
  "Confirmed": "#3b82f6", "Pattern Development": "#8b5cf6", "Production": "#6366f1",
  "Quality Check": "#a78bfa", "Packed": "#14b8a6",
  "Ready to Dispatch": "#06b6d4", "Dispatched": "#0ea5e9", "Delivered": "#10b981",
};

const PRIORITY_COLORS: Record<string, string> = {
  Critical: "#ef4444", High: "#f97316", Medium: "#eab308", Low: "#22c55e",
};

/** All available card fields with labels */
const CARD_FIELDS: { key: string; label: string }[] = [
  { key: "jobNumber", label: "Job Number" },
  { key: "companyName", label: "Customer Name" },
  { key: "castingName", label: "Casting Name" },
  { key: "currentStage", label: "Current Stage" },
  { key: "priority", label: "Priority" },
  { key: "partNumber", label: "Part Number" },
  { key: "drawingNumber", label: "Drawing Number" },
  { key: "patternNumber", label: "Pattern Number" },
  { key: "materialGrade", label: "Material Grade" },
  { key: "quantity", label: "Quantity" },
  { key: "castingWeight", label: "Weight" },
  { key: "assignedEngineer", label: "Assigned Engineer" },
  { key: "assignedSupervisor", label: "Assigned Supervisor" },
  { key: "department", label: "Department" },
  { key: "progressPercent", label: "Progress" },
  { key: "targetDispatchDateUtc", label: "Dispatch Date" },
  { key: "remainingDays", label: "Remaining Days" },
  { key: "currentMachine", label: "Machine" },
  { key: "productionBatch", label: "Production Batch" },
  { key: "orderNumber", label: "Order Number" },
];

/** Default visible fields per display mode */
const DISPLAY_MODE_FIELDS: Record<string, string[]> = {
  Compact: ["jobNumber", "companyName", "priority"],
  Standard: ["jobNumber", "companyName", "castingName", "priority", "materialGrade", "progressPercent", "targetDispatchDateUtc"],
  Detailed: CARD_FIELDS.map((f) => f.key),
};

/** Card size CSS class mapping */
const CARD_SIZE_CLASSES: Record<string, string> = {
  Compact: "prod-board__card--compact",
  Standard: "",
  Large: "prod-board__card--large",
};

/* ── Helpers ───────────────────────────────────────────────────────────────── */

function parseCsv(val: string | null): string[] | null {
  if (!val || val.trim() === "") return null;
  return val.split(",").map((s) => s.trim()).filter(Boolean);
}

function toCsv(arr: string[] | null): string | null {
  if (!arr || arr.length === 0) return null;
  return arr.join(",");
}

function statusToStage(s: string): string {
  const map: Record<string, string> = {
    pending_advance: "Pending Advance", awaiting_approval: "Awaiting Approval",
    advance_paid: "Advance Paid", confirmed: "Confirmed",
    pattern_development: "Pattern Development", production: "Production",
    quality_check: "Quality Check", packed: "Packed",
    ready_to_dispatch: "Ready to Dispatch", dispatched: "Dispatched", delivered: "Delivered",
  };
  return map[s] || "Confirmed";
}

function stageToStatus(stage: string): string {
  const map: Record<string, string> = {
    "Pending Advance": "pending_advance", "Awaiting Approval": "awaiting_approval",
    "Advance Paid": "advance_paid", "Confirmed": "confirmed",
    "Pattern Development": "pattern_development", "Production": "production",
    "Quality Check": "quality_check", "Packed": "packed",
    "Ready to Dispatch": "ready_to_dispatch", "Dispatched": "dispatched", "Delivered": "delivered",
  };
  return map[stage] || "confirmed";
}

function remainingDays(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/* ── ProductionBoard ──────────────────────────────────────────────────────── */

export function ProductionBoard() {
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<ProductionJob | null>(null);
  const [draggedJob, setDraggedJob] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);

  // Preferences state
  const [viewMode, setViewMode] = useState<"orders" | "production">("orders");
  const [prefs, setPrefs] = useState<BoardPreferences>({
    visibleColumns: null, visibleCardFields: null,
    cardSize: "Standard", displayMode: "Standard", columnOrder: null,
  });
  const [showCustomize, setShowCustomize] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; field: string; jobId?: string } | null>(null);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const viewMenuRef = useRef<HTMLDivElement>(null);

  // Load data based on view mode
  useEffect(() => {
    if (viewMode === "orders") {
      apiGet<any>("/api/v1/engineer/orders").then((all) => {
        const items = Array.isArray(all) ? all : (all?.items || []);
        const mapped = items.map((o: any) => ({
          id: o.id, jobNumber: o.orderNumber, castingName: o.productType || o.orderNumber,
          currentStage: statusToStage(o.status), stagePosition: 0,
          priority: "Medium", quantity: o.totalQuantity || 0,
          companyName: o.companyName || "", targetDispatchDateUtc: o.promisedDispatchDateUtc || null,
          progressPercent: 50, status: "Active", isBlocked: false,
          partNumber: null, materialGrade: null, drawingNumber: null, patternNumber: null,
          castingWeight: null, assignedEngineer: null, assignedSupervisor: null,
          department: null, productionBatch: null, currentMachine: null,
          orderNumber: o.orderNumber, createdAtUtc: o.placedAtUtc,
        }));
        setJobs(mapped);
      }).catch(() => setJobs([])).finally(() => setLoading(false));
    } else {
      apiGet<ProductionJob[]>("/api/v1/admin/production-board/jobs")
        .then(setJobs)
        .catch(() => setJobs([]))
        .finally(() => setLoading(false));
    }
    apiGet<BoardPreferences>("/api/v1/admin/production-board/preferences")
      .then(setPrefs)
      .catch(() => {});
  }, [viewMode]);

  // Resolve visible columns — always sorted by WORKFLOW order
  const visibleColumns = parseCsv(prefs.visibleColumns) ?? WORKFLOW;
  const orderedColumns = WORKFLOW.filter((stage) => visibleColumns.includes(stage));

  // Resolve visible card fields
  const visibleCardFields = parseCsv(prefs.visibleCardFields) ?? DISPLAY_MODE_FIELDS[prefs.displayMode] ?? DISPLAY_MODE_FIELDS.Standard;

  const filteredJobs = jobs.filter((job) => {
    if (job.status !== "Active") return false;
    const matchesSearch = !search ||
      job.jobNumber.toLowerCase().includes(search.toLowerCase()) ||
      job.castingName.toLowerCase().includes(search.toLowerCase()) ||
      job.companyName.toLowerCase().includes(search.toLowerCase()) ||
      (job.partNumber?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesPriority = !filterPriority || job.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  // Count jobs per stage for ALL workflow stages (used by Customize drawer)
  const allJobsByStage = WORKFLOW.reduce<Record<string, number>>((acc, stage) => {
    acc[stage] = filteredJobs.filter((j) => j.currentStage === stage).length;
    return acc;
  }, {});

  // Jobs grouped by visible stages only (used by the board)
  const jobsByStage = orderedColumns.reduce<Record<string, ProductionJob[]>>((acc, stage) => {
    acc[stage] = filteredJobs.filter((j) => j.currentStage === stage);
    return acc;
  }, {});

  // Drag & drop
  const dragRef = useRef<string | null>(null);
  const handleDragStart = useCallback((jobId: string) => { setDraggedJob(jobId); dragRef.current = jobId; }, []);

  const handleDrop = useCallback(async (targetStage: string) => {
    if (!draggedJob) return;
    const job = jobs.find((j) => j.id === draggedJob);
    if (!job || job.currentStage === targetStage) { setDraggedJob(null); return; }
    setJobs((prev) => prev.map((j) => j.id === draggedJob ? { ...j, currentStage: targetStage } : j));
    try {
      if (viewMode === "orders") { await adminApi.updateOrderStage(draggedJob, stageToStatus(targetStage)); } else { await apiPut(`/api/v1/admin/production-board/jobs/${draggedJob}/stage`, { toStage: targetStage, remarks: null }); };
    } catch {
      setJobs((prev) => prev.map((j) => j.id === draggedJob ? { ...j, currentStage: job.currentStage } : j));
    }
    setDraggedJob(null);
  }, [draggedJob, jobs, viewMode]);

  // Save preferences
  const savePrefs = useCallback(async (partial: Partial<BoardPreferences>) => {
    setPrefs((prev) => ({ ...prev, ...partial }));
    try {
      await apiPut("/api/v1/admin/production-board/preferences", partial);
    } catch { /* ignore */ }
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (contextMenu) setContextMenu(null);
      if (showViewMenu && viewMenuRef.current && !viewMenuRef.current.contains(e.target as Node)) {
        setShowViewMenu(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [contextMenu, showViewMenu]);

  const openCreateModal = useCallback(() => {
    setShowCreateModal(true);
    apiGet<{ id: string; name: string }[]>("/api/v1/admin/companies").then(setCompanies).catch(() => setCompanies([]));
  }, []);

  if (loading) return <div className="prod-board__loading"><div className="spinner" /></div>;

  return (
    <div className="prod-board">
      {/* Header */}
            <div className="prod-board__header">
        <div className="prod-board__header-left">
          <h1>Manufacturing Board</h1>
          <p>Track and manage manufacturing jobs from order to dispatch.</p>
        </div>
        <div className="prod-board__header-right">
          <div className="prod-board__kpi">
            <div className="prod-board__kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M2 12h20"/><path d="M12 2v20"/></svg></div>
            <div><div className="prod-board__kpi-value">{filteredJobs.length}</div><div className="prod-board__kpi-label">Total Jobs</div></div>
          </div>
          <div className="prod-board__segments">
            <button className={"prod-board__seg-btn" + (viewMode === "orders" ? " prod-board__seg-btn--active" : "")} onClick={() => setViewMode("orders")}>Orders</button>
            <button className={"prod-board__seg-btn" + (viewMode === "production" ? " prod-board__seg-btn--active" : "")} onClick={() => setViewMode("production")}>Production</button>
          </div>
          <button className="prod-board__btn-ghost" onClick={() => setShowCustomize(true)}>Customize</button>
          <button className="prod-board__btn-primary" onClick={openCreateModal}>+ New Job</button>
        </div>
      </div>

      {/* Filters */}
      <div className="prod-board__filters">
        <input className="prod-board__search" type="text"
          placeholder="Search by job #, casting, customer, part..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="prod-board__priority-chips">
          {["Critical", "High", "Medium", "Low"].map((p) => (
            <button key={p} className={`prod-board__chip ${filterPriority === p ? "prod-board__chip--active" : ""}`}
              style={{ borderColor: PRIORITY_COLORS[p] }}
              onClick={() => setFilterPriority(filterPriority === p ? null : p)}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Columns */}
      <div className="prod-board__columns">
        {orderedColumns.map((stage) => (
          <div key={stage}
            className={`prod-board__column ${draggedJob ? "prod-board__column--droppable" : ""}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(stage)}>
            <div className="prod-board__column-header">
              <span className="prod-board__column-dot" style={{ backgroundColor: STAGE_COLORS[stage] || "#6b7280" }} />
              <span className="prod-board__column-title">{stage}</span>
              <span className="prod-board__column-count">{jobsByStage[stage]?.length ?? 0}</span>
            </div>
            <div className="prod-board__cards">
              {(jobsByStage[stage] ?? []).map((job) => (
                <ProductionCard
                  key={job.id}
                  job={job}
                  visibleFields={visibleCardFields}
                  cardSize={prefs.cardSize}
                  isDragging={draggedJob === job.id}
                  onDragStart={() => handleDragStart(job.id)}
                  onClick={() => setSelectedJob(job)}
                  onContextMenu={(e, jobId) => { e.preventDefault(); const stageIdx = WORKFLOW.indexOf(job.currentStage); setContextMenu({ x: e.clientX, y: e.clientY, field: stageIdx > 0 ? "revert" : "none", jobId }); }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

            {/* Bottom Bar */}
      <div className="prod-board__bottom">
        <span className="prod-board__bottom-count">Showing {filteredJobs.length} Jobs</span>
        <div className="prod-board__bottom-legend">
          <span className="prod-board__legend-item"><span className="prod-board__legend-dot" style={{background:"#dc2626"}}></span>Critical</span>
          <span className="prod-board__legend-item"><span className="prod-board__legend-dot" style={{background:"#f97316"}}></span>High</span>
          <span className="prod-board__legend-item"><span className="prod-board__legend-dot" style={{background:"#ca8a04"}}></span>Medium</span>
          <span className="prod-board__legend-item"><span className="prod-board__legend-dot" style={{background:"#16a34a"}}></span>Low</span>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div className="prod-board__context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
          {visibleCardFields.includes(contextMenu.field) ? (
            <button onClick={() => {
              const next = visibleCardFields.filter((f) => f !== contextMenu.field);
              savePrefs({ visibleCardFields: toCsv(next) });
              setContextMenu(null);
            }}>Hide "{CARD_FIELDS.find((f) => f.key === contextMenu.field)?.label}"</button>
          ) : (
            <button onClick={() => {
              const next = [...visibleCardFields, contextMenu.field];
              savePrefs({ visibleCardFields: toCsv(next) });
              setContextMenu(null);
            }}>Show "{CARD_FIELDS.find((f) => f.key === contextMenu.field)?.label}"</button>
          )}
          <button onClick={() => {
            const defaults = DISPLAY_MODE_FIELDS[prefs.displayMode] ?? DISPLAY_MODE_FIELDS.Standard;
            savePrefs({ visibleCardFields: toCsv(defaults) });
            setContextMenu(null);
          }}>Reset to Default</button>
        </div>
      )}

      {/* Customize Drawer */}
      {showCustomize && (
        <CustomizeDrawer
          visibleColumns={visibleColumns}
          visibleCardFields={visibleCardFields}
          jobCounts={allJobsByStage}
          onSave={(colPrefs) => {
            savePrefs(colPrefs);
            setShowCustomize(false);
          }}
          onClose={() => setShowCustomize(false)}
        />
      )}

      {/* Create Job Modal */}
      {showCreateModal && (
        <CreateJobModal companies={companies}
          onClose={() => setShowCreateModal(false)}
          onCreated={(newJob) => { setJobs((prev) => [newJob, ...prev]); setShowCreateModal(false); }} />
      )}

      {/* Detail Panel */}
      {selectedJob && (
        viewMode === "orders" ? (
          <OrderDetailPanel job={selectedJob} onClose={() => setSelectedJob(null)} onMaximize={() => { window.location.href = "/admin/orders/" + selectedJob.id; }} />
        ) : (
          <ProductionJobDetailPanel job={selectedJob} onClose={() => setSelectedJob(null)} />
        )
      )}
    </div>
  );
}

/* ── ProductionCard ───────────────────────────────────────────────────────── */

function ProductionCard({
  job, visibleFields, cardSize, isDragging, onDragStart, onClick, onContextMenu,
}: {
  job: ProductionJob;
  visibleFields: string[];
  cardSize: string;
  isDragging: boolean;
  onDragStart: () => void;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent, field: string) => void;
}) {
  const sizeClass = CARD_SIZE_CLASSES[cardSize] || "";
  const dragClass = isDragging ? "prod-board__card--dragging" : "";
  const blockedClass = job.isBlocked ? "prod-board__card--blocked" : "";
  const rd = remainingDays(job.targetDispatchDateUtc);

  return (
    <div
      className={`prod-board__card ${sizeClass} ${dragClass} ${blockedClass}`} data-priority={job.priority || "Medium"}
      draggable onDragStart={onDragStart} onClick={onClick}
      onContextMenu={(e) => onContextMenu(e, job.id)}
    >
      {visibleFields.includes("jobNumber") && (
        <div className="prod-board__card-header" onContextMenu={(e) => onContextMenu(e, "jobNumber")}>
          <span className="prod-board__card-key">{job.jobNumber}</span>
          {visibleFields.includes("priority") && job.priority && (
            <span className="prod-board__card-priority" style={{ color: PRIORITY_COLORS[job.priority] || "#6b7280" }}
              onContextMenu={(e) => onContextMenu(e, "priority")}>
              {job.priority}
            </span>
          )}
        </div>
      )}

      {visibleFields.includes("castingName") && (
        <div className="prod-board__card-casting" onContextMenu={(e) => onContextMenu(e, "castingName")}>{job.castingName}</div>
      )}

      {visibleFields.includes("companyName") && (
        <div className="prod-board__card-customer" onContextMenu={(e) => onContextMenu(e, "companyName")}>{job.companyName}</div>
      )}

      {visibleFields.includes("partNumber") && job.partNumber && (
        <div className="prod-board__card-part" onContextMenu={(e) => onContextMenu(e, "partNumber")}>PN: {job.partNumber}</div>
      )}

      {visibleFields.includes("drawingNumber") && job.drawingNumber && (
        <div className="prod-board__card-part" onContextMenu={(e) => onContextMenu(e, "drawingNumber")}>DWG: {job.drawingNumber}</div>
      )}

      {visibleFields.includes("patternNumber") && job.patternNumber && (
        <div className="prod-board__card-part" onContextMenu={(e) => onContextMenu(e, "patternNumber")}>PAT: {job.patternNumber}</div>
      )}

      {visibleFields.includes("materialGrade") && job.materialGrade && (
        <div className="prod-board__card-material" onContextMenu={(e) => onContextMenu(e, "materialGrade")}>{job.materialGrade}</div>
      )}

      {visibleFields.includes("quantity") && (
        <div className="prod-board__card-meta" onContextMenu={(e) => onContextMenu(e, "quantity")}>
          <span>Qty: {job.quantity}</span>
          {visibleFields.includes("castingWeight") && job.castingWeight && <span>{job.castingWeight} kg</span>}
        </div>
      )}

      {visibleFields.includes("assignedEngineer") && job.assignedEngineer && (
        <div className="prod-board__card-assignee" onContextMenu={(e) => onContextMenu(e, "assignedEngineer")}>
           {job.assignedEngineer}
        </div>
      )}

      {visibleFields.includes("assignedSupervisor") && job.assignedSupervisor && (
        <div className="prod-board__card-assignee" onContextMenu={(e) => onContextMenu(e, "assignedSupervisor")}>
           {job.assignedSupervisor}
        </div>
      )}

      {visibleFields.includes("department") && job.department && (
        <div className="prod-board__card-part" onContextMenu={(e) => onContextMenu(e, "department")}>{job.department}</div>
      )}

      {visibleFields.includes("currentMachine") && job.currentMachine && (
        <div className="prod-board__card-part" onContextMenu={(e) => onContextMenu(e, "currentMachine")}>Machine: {job.currentMachine}</div>
      )}

      {visibleFields.includes("productionBatch") && job.productionBatch && (
        <div className="prod-board__card-part" onContextMenu={(e) => onContextMenu(e, "productionBatch")}>Batch: {job.productionBatch}</div>
      )}

      {visibleFields.includes("orderNumber") && job.orderNumber && (
        <div className="prod-board__card-part" onContextMenu={(e) => onContextMenu(e, "orderNumber")}>Order: {job.orderNumber}</div>
      )}

      <div className="prod-board__card-bottom">
        {visibleFields.includes("targetDispatchDateUtc") && job.targetDispatchDateUtc && (
          <span className={`prod-board__card-due ${rd !== null && rd < 0 ? "prod-board__card-due--overdue" : ""}`}
            onContextMenu={(e) => onContextMenu(e, "targetDispatchDateUtc")}>
            Due: {formatDate(job.targetDispatchDateUtc)}
          </span>
        )}
        {visibleFields.includes("remainingDays") && rd !== null && (
          <span className={`prod-board__card-remaining ${rd < 0 ? "prod-board__card-due--overdue" : ""}`}
            onContextMenu={(e) => onContextMenu(e, "remainingDays")}>
            {rd < 0 ? `${Math.abs(rd)}d overdue` : `${rd}d left`}
          </span>
        )}
      </div>

      {visibleFields.includes("progressPercent") && (
        <div className="prod-board__card-progress" onContextMenu={(e) => onContextMenu(e, "progressPercent")}>
          <div className="prod-board__card-progress-bar" style={{ width: `${job.progressPercent}%` }} />
        </div>
      )}
    </div>
  );
}

/* ── Customize Drawer ─────────────────────────────────────────────────────── */

function CustomizeDrawer({
  visibleColumns, visibleCardFields, jobCounts, onSave, onClose,
}: {
  visibleColumns: string[];
  visibleCardFields: string[];
  jobCounts: Record<string, number>;
  onSave: (p: Partial<BoardPreferences>) => void;
  onClose: () => void;
}) {
  const [cols, setCols] = useState<string[]>(visibleColumns);
  const [fields, setFields] = useState<string[]>(visibleCardFields);

  const toggleCol = (col: string) => {
    setCols((prev) => prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]);
  };
  const toggleField = (key: string) => {
    setFields((prev) => prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]);
  };

  return (
    <div className="prod-board__detail-overlay" onClick={onClose}>
      <div className="prod-customize" onClick={(e) => e.stopPropagation()}>
        <div className="prod-customize__header">
          <h3>Customize Board</h3>
          <button className="prod-board__detail-close" onClick={onClose}>×</button>
        </div>
        <div className="prod-customize__content">
          {/* Column Visibility */}
          <div className="prod-customize__section">
            <h4>Visible Columns</h4>
            <div className="prod-customize__checks">
              {WORKFLOW.map((col) => (
                <label key={col} className="prod-customize__check">
                  <input type="checkbox" checked={cols.includes(col)} onChange={() => toggleCol(col)} />
                  <span>{col}</span>
                  {jobCounts[col] > 0 && (
                    <span className="prod-customize__badge">{jobCounts[col]}</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Card Fields */}
          <div className="prod-customize__section">
            <h4>Card Fields</h4>
            <div className="prod-customize__checks">
              {CARD_FIELDS.map((f) => (
                <label key={f.key} className="prod-customize__check">
                  <input type="checkbox" checked={fields.includes(f.key)} onChange={() => toggleField(f.key)} />
                  <span>{f.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="prod-customize__footer">
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={() => {
            // Always save columns in WORKFLOW order
            const sorted = WORKFLOW.filter((w) => cols.includes(w));
            onSave({ visibleColumns: toCsv(sorted), visibleCardFields: toCsv(fields) });
          }}>
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Create Job Modal ─────────────────────────────────────────────────────── */

function CreateJobModal({ companies, onClose, onCreated }: {
  companies: { id: string; name: string }[];
  onClose: () => void;
  onCreated: (job: ProductionJob) => void;
}) {
  const [form, setForm] = useState({
    companyId: "", castingName: "", quantity: "", partNumber: "", drawingNumber: "",
    materialGrade: "", castingWeight: "", priority: "Medium", targetDispatchDateUtc: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyId || !form.castingName || !form.quantity) {
      setError("Company, Casting Name, and Quantity are required."); return;
    }
    setSubmitting(true); setError("");
    try {
      const newJob = await apiPost<ProductionJob>("/api/v1/admin/production-board/jobs", {
        companyId: form.companyId, castingName: form.castingName,
        quantity: parseInt(form.quantity, 10),
        partNumber: form.partNumber || null, drawingNumber: form.drawingNumber || null,
        materialGrade: form.materialGrade || null,
        castingWeight: form.castingWeight ? parseFloat(form.castingWeight) : null,
        priority: form.priority, targetDispatchDateUtc: form.targetDispatchDateUtc || null,
      });
      onCreated(newJob);
    } catch { setError("Failed to create job."); } finally { setSubmitting(false); }
  };

  return (
    <div className="prod-board__detail-overlay" onClick={onClose}>
      <div className="prod-board__detail-panel" style={{ width: "480px" }} onClick={(e) => e.stopPropagation()}>
        <div className="prod-board__detail-header">
          <div><span className="prod-board__detail-key">New Production Job</span></div>
          <button className="prod-board__detail-close" onClick={onClose}>×</button>
        </div>
        <div className="prod-board__detail-content">
          <form onSubmit={handleSubmit} className="prod-create-form">
            {error && <div className="form-status form-status--error">{error}</div>}
            <div className="prod-create-form__field">
              <label>Company *</label>
              <select name="companyId" value={form.companyId} onChange={handleChange} required>
                <option value="">Select company...</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="prod-create-form__field">
              <label>Casting Name *</label>
              <input name="castingName" value={form.castingName} onChange={handleChange} placeholder="e.g. Brake Drum" required />
            </div>
            <div className="prod-create-form__row">
              <div className="prod-create-form__field">
                <label>Quantity *</label>
                <input name="quantity" type="number" min="1" value={form.quantity} onChange={handleChange} required />
              </div>
              <div className="prod-create-form__field">
                <label>Priority</label>
                <select name="priority" value={form.priority} onChange={handleChange}>
                  <option value="Low">Low</option><option value="Medium">Medium</option>
                  <option value="High">High</option><option value="Critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="prod-create-form__row">
              <div className="prod-create-form__field">
                <label>Part Number</label>
                <input name="partNumber" value={form.partNumber} onChange={handleChange} placeholder="e.g. BD-4521" />
              </div>
              <div className="prod-create-form__field">
                <label>Drawing Number</label>
                <input name="drawingNumber" value={form.drawingNumber} onChange={handleChange} />
              </div>
            </div>
            <div className="prod-create-form__row">
              <div className="prod-create-form__field">
                <label>Material Grade</label>
                <input name="materialGrade" value={form.materialGrade} onChange={handleChange} placeholder="e.g. FG260" />
              </div>
              <div className="prod-create-form__field">
                <label>Casting Weight (kg)</label>
                <input name="castingWeight" type="number" step="0.01" min="0" value={form.castingWeight} onChange={handleChange} />
              </div>
            </div>
            <div className="prod-create-form__field">
              <label>Target Dispatch Date</label>
              <input name="targetDispatchDateUtc" type="date" value={form.targetDispatchDateUtc} onChange={handleChange} />
            </div>
            <div className="prod-create-form__actions">
              <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn--primary" disabled={submitting}>
                {submitting ? "Creating..." : "Create Job"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ── Job Detail Panel (unchanged from before) ─────────────────────────────── */

interface JobDetailFull {
  id: string; jobNumber: string; castingName: string; currentStage: string;
  priority: string | null; partNumber: string | null; drawingNumber: string | null;
  patternNumber: string | null; materialGrade: string | null; castingWeight: number | null;
  quantity: number; progressPercent: number; productionBatch: string | null;
  targetDispatchDateUtc: string | null; estimatedCompletionUtc: string | null;
  currentMachine: string | null; currentOperator: string | null;
  assignedEngineer: string | null; assignedSupervisor: string | null;
  department: string | null; status: string; isBlocked: boolean; blockReason: string | null;
  companyId: string; companyName: string; orderId: string | null; orderNumber: string | null;
  enquiryId: string | null; enquiryProductType: string | null;
  quotationId: string | null; quotationNumber: string | null;
  createdAtUtc: string; updatedAtUtc: string | null;
  stageHistory: Array<{ id: string; fromStage: string; toStage: string; changedByName: string | null; remarks: string | null; occurredAtUtc: string; }>;
  qualityInspections: Array<{ id: string; inspectionStatus: string; acceptedQuantity: number; rejectedQuantity: number; reworkQuantity: number; hardnessTest: boolean; chemicalAnalysis: boolean; dimensionalInspection: boolean; visualInspection: boolean; ndtResult: string | null; inspector: string | null; inspectionDateUtc: string | null; remarks: string | null; createdAtUtc: string; }>;
  comments: Array<{ id: string; authorId: string; authorName: string; authorRole: string | null; message: string; commentType: string | null; createdAtUtc: string; editedAtUtc: string | null; }>;
  timeline: Array<{ id: string; event: string; details: string | null; actorName: string | null; occurredAtUtc: string; }>;
}

type TabKey = "overview" | "quality" | "comments" | "timeline";

function ProductionJobDetailPanel({ job, onClose }: { job: ProductionJob; onClose: () => void }) {
  const [detail, setDetail] = useState<JobDetailFull | null>(null);
  const [tab, setTab] = useState<TabKey>("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<JobDetailFull>(`/api/v1/admin/production-board/jobs/${job.id}`)
      .then(setDetail).catch(() => setDetail(null)).finally(() => setLoading(false));
  }, [job.id]);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Overview" }, { key: "quality", label: "Quality" },
    { key: "comments", label: "Comments" }, { key: "timeline", label: "Timeline" },
  ];

  return (
    <div className="prod-board__detail-overlay" onClick={onClose}>
      <div className="prod-board__detail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="prod-board__detail-header">
          <div>
            <span className="prod-board__detail-key">{job.jobNumber}</span>
            <span className="prod-board__detail-casting">{job.castingName}</span>
          </div>
          <button className="prod-board__detail-close" onClick={onClose}>×</button>
        </div>
        <div className="prod-board__detail-tabs">
          {tabs.map((t) => (
            <button key={t.key} className={`prod-board__detail-tab ${tab === t.key ? "prod-board__detail-tab--active" : ""}`}
              onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </div>
        <div className="prod-board__detail-content">
          {loading ? <div className="prod-board__loading"><div className="spinner" /></div>
            : detail ? (<>
              {tab === "overview" && <OverviewTab detail={detail} />}
              {tab === "quality" && <QualityTab detail={detail} />}
              {tab === "comments" && <CommentsTab jobId={job.id} detail={detail} onRefresh={() => {
                apiGet<JobDetailFull>(`/api/v1/admin/production-board/jobs/${job.id}`).then(setDetail).catch(() => {});
              }} />}
              {tab === "timeline" && <TimelineTab detail={detail} />}
            </>) : <p className="placeholder-note">Failed to load details.</p>}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ detail }: { detail: JobDetailFull }) {
  return (
    <div className="prod-detail__overview">
      <div className="prod-detail__field-group">
        <h4>Casting Details</h4>
        <div className="prod-detail__field"><span>Casting Name:</span><strong>{detail.castingName}</strong></div>
        {detail.partNumber && <div className="prod-detail__field"><span>Part Number:</span><strong>{detail.partNumber}</strong></div>}
        {detail.drawingNumber && <div className="prod-detail__field"><span>Drawing:</span><strong>{detail.drawingNumber}</strong></div>}
        {detail.patternNumber && <div className="prod-detail__field"><span>Pattern:</span><strong>{detail.patternNumber}</strong></div>}
        {detail.materialGrade && <div className="prod-detail__field"><span>Material Grade:</span><strong>{detail.materialGrade}</strong></div>}
        {detail.castingWeight && <div className="prod-detail__field"><span>Weight:</span><strong>{detail.castingWeight} kg</strong></div>}
        <div className="prod-detail__field"><span>Quantity:</span><strong>{detail.quantity}</strong></div>
      </div>
      <div className="prod-detail__field-group">
        <h4>Production</h4>
        <div className="prod-detail__field"><span>Current Stage:</span><strong>{detail.currentStage}</strong></div>
        <div className="prod-detail__field"><span>Priority:</span><strong>{detail.priority ?? "Medium"}</strong></div>
        <div className="prod-detail__field"><span>Status:</span><strong>{detail.status}</strong></div>
        <div className="prod-detail__field"><span>Progress:</span><strong>{detail.progressPercent}%</strong></div>
        {detail.department && <div className="prod-detail__field"><span>Department:</span><strong>{detail.department}</strong></div>}
        {detail.assignedEngineer && <div className="prod-detail__field"><span>Engineer:</span><strong>{detail.assignedEngineer}</strong></div>}
        {detail.assignedSupervisor && <div className="prod-detail__field"><span>Supervisor:</span><strong>{detail.assignedSupervisor}</strong></div>}
      </div>
      <div className="prod-detail__field-group">
        <h4>Business Links</h4>
        <div className="prod-detail__field"><span>Customer:</span><strong>{detail.companyName}</strong></div>
        {detail.orderNumber && <div className="prod-detail__field"><span>Order:</span><strong>{detail.orderNumber}</strong></div>}
        {detail.enquiryProductType && <div className="prod-detail__field"><span>Enquiry:</span><strong>{detail.enquiryProductType}</strong></div>}
      </div>
      <div className="prod-detail__field-group">
        <h4>Dates</h4>
        <div className="prod-detail__field"><span>Created:</span><strong>{formatDate(detail.createdAtUtc)}</strong></div>
        {detail.targetDispatchDateUtc && <div className="prod-detail__field"><span>Target Dispatch:</span><strong>{formatDate(detail.targetDispatchDateUtc)}</strong></div>}
      </div>
      {detail.isBlocked && <div className="prod-detail__blocked"><strong>BLOCKED:</strong> {detail.blockReason || "No reason specified"}</div>}
    </div>
  );
}

function QualityTab({ detail }: { detail: JobDetailFull }) {
  if (detail.qualityInspections.length === 0) return <p className="placeholder-note">No quality inspections recorded yet.</p>;
  return (
    <div className="prod-detail__quality-list">
      {detail.qualityInspections.map((q) => (
        <div key={q.id} className="prod-detail__quality-card">
          <div className="prod-detail__quality-header">
            <span className={`prod-detail__quality-status ${q.inspectionStatus === "Pass" ? "badge--ok" : q.inspectionStatus === "Fail" ? "badge--error" : "badge--warn"}`}>{q.inspectionStatus}</span>
            <span className="prod-detail__quality-date">{formatDate(q.createdAtUtc)}</span>
          </div>
          <div className="prod-detail__quality-stats">
            <span>Accepted: {q.acceptedQuantity}</span><span>Rejected: {q.rejectedQuantity}</span><span>Rework: {q.reworkQuantity}</span>
          </div>
          <div className="prod-detail__quality-tests">
            {q.hardnessTest && <span className="prod-detail__test-badge">Hardness</span>}
            {q.chemicalAnalysis && <span className="prod-detail__test-badge">Chemical</span>}
            {q.dimensionalInspection && <span className="prod-detail__test-badge">Dimensional</span>}
            {q.visualInspection && <span className="prod-detail__test-badge">Visual</span>}
          </div>
          {q.inspector && <div className="prod-detail__quality-inspector">Inspector: {q.inspector}</div>}
        </div>
      ))}
    </div>
  );
}

function CommentsTab({ jobId, detail, onRefresh }: { jobId: string; detail: JobDetailFull; onRefresh: () => void }) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [posting, setPosting] = useState(false);


  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);

  async function handlePost() {
    const text = message.trim();
    if (!text || posting) return;
    setPosting(true);
    try {
      await apiPost(`/api/v1/admin/production-board/jobs/${jobId}/comments`, { message: text });
      setMessage("");
      onRefresh();
    } catch { /* ignore */ }
    finally { setPosting(false); }
  }

  async function handleSaveEdit(commentId: string) {
    const text = editText.trim();
    if (!text || saving) return;
    setSaving(true);
    try {
      await apiPut(`/api/v1/admin/production-board/jobs/${jobId}/comments/${commentId}`, { message: text });
      setEditingId(null);
      onRefresh();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function handleDelete(commentId: string) {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await apiDelete(`/api/v1/admin/production-board/jobs/${jobId}/comments/${commentId}`);
      onRefresh();
    } catch { /* ignore */ }
  }

  function startEdit(c: JobDetailFull["comments"][number]) {
    setEditingId(c.id);
    setEditText(c.message);
  }

  return (
    <div className="prod-detail__comments-section">
      {detail.comments.length === 0 && <p className="placeholder-note">No comments yet.</p>}
      <div className="prod-detail__comments-list">
        {detail.comments.map((c) => (
          <div key={c.id} className="prod-detail__comment-card">
            <div className="prod-detail__comment-header">
              <strong>{c.authorName}</strong>
              {c.editedAtUtc && <span className="prod-detail__comment-edited">(edited)</span>}
              <span className="prod-detail__comment-date">{formatDate(c.createdAtUtc)}</span>
              {user?.id === c.authorId && (
                <div className="prod-detail__comment-actions">
                  <button className="prod-detail__comment-action-btn" title="Edit" onClick={() => startEdit(c)}>✎</button>
                  <button className="prod-detail__comment-action-btn prod-detail__comment-action-btn--danger" title="Delete" onClick={() => void handleDelete(c.id)}>✕</button>
                </div>
              )}
            </div>
            {editingId === c.id ? (
              <div className="prod-detail__comment-edit">
                <textarea
                  className="prod-detail__comment-textarea"
                  rows={2}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void handleSaveEdit(c.id); if (e.key === "Escape") setEditingId(null); }}
                />
                <div className="prod-detail__comment-edit-btns">
                  <button className="btn btn--ghost btn--sm" onClick={() => setEditingId(null)}>Cancel</button>
                  <button className="btn btn--primary btn--sm" disabled={!editText.trim() || saving} onClick={() => void handleSaveEdit(c.id)}>
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="prod-detail__comment-message">{c.message}</p>
            )}
          </div>
        ))}
      </div>
      <div className="prod-detail__comment-form">
        <textarea
          className="prod-detail__comment-textarea"
          placeholder="Write a comment…"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void handlePost(); }}
        />
        <div className="prod-detail__comment-form-row">
          <button className="btn btn--primary btn--sm" disabled={!message.trim() || posting} onClick={() => void handlePost()}>
            {posting ? "Posting…" : "Add Comment"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Order Detail Panel ────────────────────────────────────────────────── */
function OrderDetailPanel({ job, onClose, onMaximize }: { job: ProductionJob; onClose: () => void; onMaximize: () => void }) {
  const stageIdx = WORKFLOW.indexOf(job.currentStage);
  const [comments, setComments] = useState<{authorRole: string; message: string; createdAtUtc: string}[]>([]);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    apiGet<any>(`/api/v1/engineer/orders/${job.id}/comments`).then(setComments).catch(() => {});
  }, [job.id]);

  async function handlePostComment() {
    if (!newComment.trim() || posting) return;
    setPosting(true);
    try {
      await apiPost(`/api/v1/engineer/orders/${job.id}/comments`, { message: newComment.trim() });
      setComments(prev => [...prev, {authorRole: "Admin", message: newComment.trim(), createdAtUtc: new Date().toISOString()}]);
      setNewComment("");
    } catch {}
    setPosting(false);
  }
  return (
    <div className="prod-board__detail-overlay" onClick={onClose}>
      <div className="prod-board__detail-panel" onClick={(e) => e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 24px",borderBottom:"1px solid #f1f5f9"}}>
          <div>
            <h2 style={{fontSize:"16px",fontWeight:700,margin:0,color:"#111827"}}>{job.jobNumber}</h2>
            <p style={{fontSize:"13px",color:"#6b7280",margin:"4px 0 0"}}>{job.castingName}</p>
          </div>
          <button onClick={onClose} style={{width:"32px",height:"32px",borderRadius:"8px",border:"1px solid #e5e7eb",background:"#fff",cursor:"pointer",fontSize:"16px",display:"flex",alignItems:"center",justifyContent:"center",color:"#6b7280"}}>&times;</button>
        </div>
        <div style={{padding:"20px 24px"}}>
          {/* Status badge */}
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"20px"}}>
            <span style={{width:"10px",height:"10px",borderRadius:"50%",background:STAGE_COLORS[job.currentStage] || "#6b7280"}} />
            <span style={{fontSize:"13px",fontWeight:600,color:"#111827"}}>{job.currentStage}</span>
            <span style={{fontSize:"11px",color:"#9ca3af",marginLeft:"auto"}}>Stage {stageIdx + 1} of {WORKFLOW.length}</span>
          </div>

          {/* Progress bar */}
          <div style={{height:"4px",background:"#f1f5f9",borderRadius:"2px",marginBottom:"24px",overflow:"hidden"}}>
            <div style={{height:"100%",width:Math.round((stageIdx + 1) / WORKFLOW.length * 100) + "%",background:"#2563eb",borderRadius:"2px"}} />
          </div>

          {/* Details grid */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",marginBottom:"24px"}}>
            <div><span style={{fontSize:"10px",textTransform:"uppercase",letterSpacing:"0.5px",color:"#9ca3af",fontWeight:600}}>Customer</span><p style={{fontSize:"13px",fontWeight:600,color:"#111827",margin:"4px 0 0"}}>{job.companyName || "—"}</p></div>
            <div><span style={{fontSize:"10px",textTransform:"uppercase",letterSpacing:"0.5px",color:"#9ca3af",fontWeight:600}}>Quantity</span><p style={{fontSize:"13px",fontWeight:600,color:"#111827",margin:"4px 0 0"}}>{job.quantity} pcs</p></div>
            <div><span style={{fontSize:"10px",textTransform:"uppercase",letterSpacing:"0.5px",color:"#9ca3af",fontWeight:600}}>Priority</span><p style={{fontSize:"13px",fontWeight:600,color:"#111827",margin:"4px 0 0"}}>{job.priority || "Medium"}</p></div>
            <div><span style={{fontSize:"10px",textTransform:"uppercase",letterSpacing:"0.5px",color:"#9ca3af",fontWeight:600}}>Weight</span><p style={{fontSize:"13px",fontWeight:600,color:"#111827",margin:"4px 0 0"}}>{job.castingWeight ? job.castingWeight + " kg" : "—"}</p></div>
            {job.targetDispatchDateUtc && <div><span style={{fontSize:"10px",textTransform:"uppercase",letterSpacing:"0.5px",color:"#9ca3af",fontWeight:600}}>Target Dispatch</span><p style={{fontSize:"13px",fontWeight:600,color:"#111827",margin:"4px 0 0"}}>{formatDate(job.targetDispatchDateUtc)}</p></div>}
          </div>

          {/* Status progression timeline */}
          <div style={{borderTop:"1px solid #f1f5f9",paddingTop:"20px",marginBottom:"20px"}}>
            <h4 style={{fontSize:"11px",textTransform:"uppercase",letterSpacing:"0.5px",color:"#9ca3af",margin:"0 0 12px",fontWeight:600}}>Order Progress</h4>
            <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              {WORKFLOW.slice(0, stageIdx + 1).map((s, i) => (
                <div key={s} style={{display:"flex",alignItems:"center",gap:"10px"}}>
                  <div style={{width:"8px",height:"8px",borderRadius:"50%",background:STAGE_COLORS[s] || "#6b7280",flexShrink:0}} />
                  <span style={{fontSize:"12px",color:i === stageIdx ? "#111827" : "#6b7280",fontWeight:i === stageIdx ? 600 : 400}}>{s}</span>
                  {i === stageIdx && <span style={{fontSize:"10px",color:"#2563eb",fontWeight:600,marginLeft:"auto"}}>Current</span>}
                </div>
              ))}
            </div>
          </div>
        {/* Comments section */}
          <div style={{borderTop:"1px solid #f1f5f9",paddingTop:"20px",marginBottom:"12px"}}>
            <h4 style={{fontSize:"11px",textTransform:"uppercase",letterSpacing:"0.5px",color:"#9ca3af",margin:"0 0 12px",fontWeight:600}}>Activity & Comments</h4>
            {comments.length === 0 && <p style={{fontSize:"12px",color:"#9ca3af",margin:"0 0 12px"}}>No comments yet.</p>}
            {comments.map((c, i) => (
              <div key={i} style={{display:"flex",gap:"10px",marginBottom:"10px"}}>
                <div style={{width:"28px",height:"28px",borderRadius:"8px",background:"#eef2ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:700,color:"#4f46e5",flexShrink:0}}>{c.authorRole.charAt(0)}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                    <span style={{fontSize:"12px",fontWeight:600,color:"#111827"}}>{c.authorRole}</span>
                    <span style={{fontSize:"10px",color:"#9ca3af"}}>{new Date(c.createdAtUtc).toLocaleString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</span>
                  </div>
                  <p style={{fontSize:"12px",color:"#6b7280",margin:"2px 0 0"}}>{c.message}</p>
                </div>
              </div>
            ))}
            <div style={{display:"flex",gap:"8px",marginTop:"8px"}}>
              <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handlePostComment(); } }}
                style={{flex:1,height:"36px",borderRadius:"8px",border:"1px solid #e5e7eb",padding:"0 12px",fontSize:"12px",outline:"none",fontFamily:"inherit"}} />
              <button onClick={handlePostComment} disabled={!newComment.trim() || posting}
                style={{height:"36px",padding:"0 12px",borderRadius:"8px",border:"none",background:newComment.trim() ? "#2563eb" : "#e5e7eb",color:newComment.trim() ? "#fff" : "#9ca3af",fontSize:"12px",fontWeight:600,cursor:newComment.trim() ? "pointer" : "default"}}>Send</button>
            </div>
          </div>
        </div>
        <div style={{padding:"12px 24px",borderTop:"1px solid #f1f5f9",display:"flex",gap:"8px"}}>
          <button className="prod-board__btn-ghost" onClick={onMaximize} style={{flex:1}}>View Full Details</button>
        </div>
      </div>
    </div>
  );
}

function TimelineTab({ detail }: { detail: JobDetailFull }) {
  if (detail.timeline.length === 0) return <p className="placeholder-note">No timeline events yet.</p>;
  return (
    <div className="prod-detail__timeline">
      {detail.timeline.map((t) => (
        <div key={t.id} className="prod-detail__timeline-item">
          <div className="prod-detail__timeline-dot" />
          <div className="prod-detail__timeline-content">
            <div className="prod-detail__timeline-event">{t.event}</div>
            {t.details && <div className="prod-detail__timeline-details">{t.details}</div>}
            <div className="prod-detail__timeline-meta">
              {t.actorName && <span>{t.actorName}</span>}
              <span>{formatDate(t.occurredAtUtc)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
