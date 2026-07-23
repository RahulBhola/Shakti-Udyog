import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet, apiPost, apiPut } from "../api/client";
import { formatDate } from "../portal/shared";

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
  "New RFQs", "Engineering Review", "Quotation Sent", "Customer Approval",
  "Order Confirmed", "Pattern Design", "Pattern Making", "Material Planning",
  "Raw Material Ready", "Core Making", "Moulding", "Furnace Charging",
  "Melting", "Pouring", "Cooling", "Shakeout", "Fettling", "Shot Blasting",
  "Machining", "Heat Treatment", "Surface Finishing", "Quality Inspection",
  "Packing", "Ready for Dispatch", "Dispatched",
];

const STAGE_COLORS: Record<string, string> = {
  "New RFQs": "#6366f1", "Engineering Review": "#8b5cf6", "Quotation Sent": "#a78bfa",
  "Customer Approval": "#c4b5fd", "Order Confirmed": "#22c55e", "Pattern Design": "#14b8a6",
  "Pattern Making": "#06b6d4", "Material Planning": "#0ea5e9", "Raw Material Ready": "#3b82f6",
  "Core Making": "#f97316", "Moulding": "#f59e0b", "Furnace Charging": "#ef4444",
  "Melting": "#dc2626", "Pouring": "#b91c1c", "Cooling": "#64748b",
  "Shakeout": "#78716c", "Fettling": "#a8a29e", "Shot Blasting": "#57534e",
  "Machining": "#6366f1", "Heat Treatment": "#d946ef", "Surface Finishing": "#ec4899",
  "Quality Inspection": "#eab308", "Packing": "#84cc16",
  "Ready for Dispatch": "#22c55e", "Dispatched": "#10b981",
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
  const [prefs, setPrefs] = useState<BoardPreferences>({
    visibleColumns: null, visibleCardFields: null,
    cardSize: "Standard", displayMode: "Standard", columnOrder: null,
  });
  const [showCustomize, setShowCustomize] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; field: string } | null>(null);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const viewMenuRef = useRef<HTMLDivElement>(null);

  // Load jobs + preferences
  useEffect(() => {
    apiGet<ProductionJob[]>("/api/v1/admin/production-board/jobs")
      .then(setJobs)
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
    apiGet<BoardPreferences>("/api/v1/admin/production-board/preferences")
      .then(setPrefs)
      .catch(() => {});
  }, []);

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
  const handleDragStart = useCallback((jobId: string) => setDraggedJob(jobId), []);

  const handleDrop = useCallback(async (targetStage: string) => {
    if (!draggedJob) return;
    const job = jobs.find((j) => j.id === draggedJob);
    if (!job || job.currentStage === targetStage) { setDraggedJob(null); return; }
    setJobs((prev) => prev.map((j) => j.id === draggedJob ? { ...j, currentStage: targetStage } : j));
    try {
      await apiPut(`/api/v1/admin/production-board/jobs/${draggedJob}/stage`, { toStage: targetStage, remarks: null });
    } catch {
      setJobs((prev) => prev.map((j) => j.id === draggedJob ? { ...j, currentStage: job.currentStage } : j));
    }
    setDraggedJob(null);
  }, [draggedJob, jobs]);

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
        <h2>Manufacturing Board</h2>
        <div className="prod-board__header-actions">
          <span className="prod-board__count">{filteredJobs.length} jobs</span>

          {/* View dropdown */}
          <div className="prod-board__view-dropdown" ref={viewMenuRef}>
            <button className="btn btn--ghost" onClick={() => setShowViewMenu((v) => !v)}>
              View: {prefs.displayMode} / {prefs.cardSize}
            </button>
            {showViewMenu && (
              <div className="prod-board__dropdown-menu">
                <div className="prod-board__dropdown-section">
                  <span className="prod-board__dropdown-label">Card Display</span>
                  {["Compact", "Standard", "Detailed"].map((mode) => (
                    <button key={mode} className={`prod-board__dropdown-item ${prefs.displayMode === mode ? "prod-board__dropdown-item--active" : ""}`}
                      onClick={() => { savePrefs({ displayMode: mode, visibleCardFields: toCsv(DISPLAY_MODE_FIELDS[mode]) }); setShowViewMenu(false); }}>
                      {mode === "Compact" ? "  Compact" : mode === "Standard" ? "  Standard" : "  Detailed"}
                    </button>
                  ))}
                </div>
                <div className="prod-board__dropdown-divider" />
                <div className="prod-board__dropdown-section">
                  <span className="prod-board__dropdown-label">Card Size</span>
                  {["Compact", "Standard", "Large"].map((size) => (
                    <button key={size} className={`prod-board__dropdown-item ${prefs.cardSize === size ? "prod-board__dropdown-item--active" : ""}`}
                      onClick={() => { savePrefs({ cardSize: size }); setShowViewMenu(false); }}>
                      {size === "Compact" ? "  Compact" : size === "Standard" ? "  Standard" : "  Large"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button className="btn btn--ghost" onClick={() => setShowCustomize(true)}>Customize</button>
          <button className="btn btn--primary" onClick={openCreateModal}>+ New Job</button>
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
                  onContextMenu={(e, field) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, field }); }}
                />
              ))}
            </div>
          </div>
        ))}
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
        <ProductionJobDetailPanel job={selectedJob} onClose={() => setSelectedJob(null)} />
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
      className={`prod-board__card ${sizeClass} ${dragClass} ${blockedClass}`}
      draggable onDragStart={onDragStart} onClick={onClick}
      onContextMenu={(e) => onContextMenu(e, "castingName")}
    >
      {visibleFields.includes("jobNumber") && (
        <div className="prod-board__card-header" onContextMenu={(e) => onContextMenu(e, "jobNumber")}>
          <span className="prod-board__card-key">{job.jobNumber}</span>
          {visibleFields.includes("priority") && job.priority && (
            <span className="prod-board__card-priority" style={{ color: PRIORITY_COLORS[job.priority] || "#6b7280" }}
              onContextMenu={(e) => onContextMenu(e, "priority")}>
              {job.priority === "Critical" ? " !!!" : job.priority === "High" ? " !!" : job.priority === "Medium" ? " !" : ""}
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
  rfqId: string | null; rfqProductType: string | null;
  quotationId: string | null; quotationNumber: string | null;
  createdAtUtc: string; updatedAtUtc: string | null;
  stageHistory: Array<{ id: string; fromStage: string; toStage: string; changedByName: string | null; remarks: string | null; occurredAtUtc: string; }>;
  qualityInspections: Array<{ id: string; inspectionStatus: string; acceptedQuantity: number; rejectedQuantity: number; reworkQuantity: number; hardnessTest: boolean; chemicalAnalysis: boolean; dimensionalInspection: boolean; visualInspection: boolean; ndtResult: string | null; inspector: string | null; inspectionDateUtc: string | null; remarks: string | null; createdAtUtc: string; }>;
  comments: Array<{ id: string; authorName: string; authorRole: string | null; message: string; commentType: string | null; createdAtUtc: string; }>;
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
              {tab === "comments" && <CommentsTab detail={detail} />}
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
        {detail.rfqProductType && <div className="prod-detail__field"><span>RFQ:</span><strong>{detail.rfqProductType}</strong></div>}
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

function CommentsTab({ detail }: { detail: JobDetailFull }) {
  if (detail.comments.length === 0) return <p className="placeholder-note">No comments yet.</p>;
  return (
    <div className="prod-detail__comments-list">
      {detail.comments.map((c) => (
        <div key={c.id} className="prod-detail__comment-card">
          <div className="prod-detail__comment-header">
            <strong>{c.authorName}</strong>
            {c.commentType && <span className="prod-detail__comment-type">{c.commentType}</span>}
            <span className="prod-detail__comment-date">{formatDate(c.createdAtUtc)}</span>
          </div>
          <p className="prod-detail__comment-message">{c.message}</p>
        </div>
      ))}
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
