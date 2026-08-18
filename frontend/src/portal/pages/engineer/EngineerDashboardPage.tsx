import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../../api/client";
import { useAuth } from "../../../auth/AuthContext";
import { Loading } from "../../../components/ui";
import { formatDate } from "../../shared";
import {
  Factory, ClipboardList, FileText, ShoppingCart, ArrowRight,
  Clock, CheckCircle2, RefreshCw, Activity,
} from "lucide-react";
import "../erpListView.css";

interface EngineerOrder {
  id: string;
  orderNumber: string;
  companyName: string | null;
  productType: string | null;
  totalQuantity: number;
  manufacturingStage: string;
  placedAtUtc: string;
  stageUpdatedAt: string | null;
}

interface SummaryStats {
  totalAssignedOrders: number;
  inPatternDev: number;
  inProduction: number;
  inQualityCheck: number;
  readyToDispatch: number;
}

export default function EngineerDashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<EngineerOrder[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiGet<EngineerOrder[]>("/api/v1/engineer/orders")
      .then(setOrders)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { void load(); }, [load]);

  const stats: SummaryStats = useMemo(() => {
    const list = orders ?? [];
    return {
      totalAssignedOrders: list.length,
      inPatternDev: list.filter((o) => o.manufacturingStage === "pattern_development").length,
      inProduction: list.filter((o) => o.manufacturingStage === "production").length,
      inQualityCheck: list.filter((o) => o.manufacturingStage === "quality_check").length,
      readyToDispatch: list.filter((o) => o.manufacturingStage === "ready_to_dispatch" || o.manufacturingStage === "packed").length,
    };
  }, [orders]);

  const displayName = user?.fullName ?? user?.email ?? "Engineer";

  if (loading) return <div className="inv-status"><Loading label="Loading engineer dashboard..." /></div>;

  return (
    <div className="inv-page">
      {/* Header Banner */}
      <div
        className="inv-header"
        style={{
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)",
          padding: "20px 24px",
          borderRadius: 16,
          border: "1px border var(--border-default)",
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span
              className="inv-badge inv-badge--orange"
              style={{ padding: "3px 10px", fontSize: 11, textTransform: "uppercase", fontWeight: 700 }}
            >
              Engineer Portal
            </span>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
          <h1 className="inv-header__title" style={{ fontSize: 24, fontWeight: 800 }}>
            Welcome back, {displayName}! 👋
          </h1>
          <p className="inv-header__subtitle">
            Here is your live shop-floor status and technical manufacturing operations overview.
          </p>
        </div>

        <Link
          to="/admin/production"
          className="inv-btn inv-btn--primary"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px" }}
        >
          <Factory size={18} /> Launch Manufacturing Kanban <ArrowRight size={16} />
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="inv-kpi-grid">
        <div
          className="inv-kpi"
          style={
            {
              "--inv-kpi-color": "#6366f1",
              "--inv-kpi-bg": "rgba(99, 102, 241, 0.12)",
              "--inv-kpi-glow": "rgba(99, 102, 241, 0.25)",
            } as CSSProperties
          }
        >
          <span className="inv-kpi__icon"><ShoppingCart size={20} /></span>
          <span className="inv-kpi__value">{stats.totalAssignedOrders}</span>
          <span className="inv-kpi__label">Assigned Orders</span>
          <span className="inv-kpi__hint">Under your technical supervision</span>
        </div>

        <div
          className="inv-kpi"
          style={
            {
              "--inv-kpi-color": "#8b5cf6",
              "--inv-kpi-bg": "rgba(139, 92, 246, 0.12)",
              "--inv-kpi-glow": "rgba(139, 92, 246, 0.25)",
            } as CSSProperties
          }
        >
          <span className="inv-kpi__icon"><Clock size={20} /></span>
          <span className="inv-kpi__value">{stats.inPatternDev}</span>
          <span className="inv-kpi__label">Pattern Development</span>
          <span className="inv-kpi__hint">Tooling & pattern setup</span>
        </div>

        <div
          className="inv-kpi"
          style={
            {
              "--inv-kpi-color": "#3b82f6",
              "--inv-kpi-bg": "rgba(59, 130, 246, 0.12)",
              "--inv-kpi-glow": "rgba(59, 130, 246, 0.25)",
            } as CSSProperties
          }
        >
          <span className="inv-kpi__icon"><Factory size={20} /></span>
          <span className="inv-kpi__value">{stats.inProduction}</span>
          <span className="inv-kpi__label">In Production</span>
          <span className="inv-kpi__hint">Casting & pouring on floor</span>
        </div>

        <div
          className="inv-kpi"
          style={
            {
              "--inv-kpi-color": "#a78bfa",
              "--inv-kpi-bg": "rgba(167, 139, 250, 0.12)",
              "--inv-kpi-glow": "rgba(167, 139, 250, 0.25)",
            } as CSSProperties
          }
        >
          <span className="inv-kpi__icon"><Activity size={20} /></span>
          <span className="inv-kpi__value">{stats.inQualityCheck}</span>
          <span className="inv-kpi__label">Quality Check (QC)</span>
          <span className="inv-kpi__hint">Testing & inspection</span>
        </div>

        <div
          className="inv-kpi"
          style={
            {
              "--inv-kpi-color": "#14b8a6",
              "--inv-kpi-bg": "rgba(20, 184, 166, 0.12)",
              "--inv-kpi-glow": "rgba(20, 184, 166, 0.25)",
            } as CSSProperties
          }
        >
          <span className="inv-kpi__icon"><CheckCircle2 size={20} /></span>
          <span className="inv-kpi__value">{stats.readyToDispatch}</span>
          <span className="inv-kpi__label">Packed / Dispatch Ready</span>
          <span className="inv-kpi__hint">Completed & ready to ship</span>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 28 }}>
        <Link
          to="/admin/production"
          className="no-underline"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: 18,
            borderRadius: 14,
            backgroundColor: "var(--bg-card)",
            border: "1px border var(--border-default)",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ padding: 10, borderRadius: 10, backgroundColor: "rgba(99, 102, 241, 0.1)", color: "#6366f1" }}>
              <Factory size={22} />
            </span>
            <ArrowRight size={18} style={{ color: "var(--text-secondary)" }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Manufacturing Board</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
              Drag-and-drop Kanban workflow for updating job stages in real-time.
            </div>
          </div>
        </Link>

        <Link
          to="/admin/enquiries"
          className="no-underline"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: 18,
            borderRadius: 14,
            backgroundColor: "var(--bg-card)",
            border: "1px border var(--border-default)",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ padding: 10, borderRadius: 10, backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}>
              <ClipboardList size={22} />
            </span>
            <ArrowRight size={18} style={{ color: "var(--text-secondary)" }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Enquiries</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
              Review customer requirements, specs, and casting drawings.
            </div>
          </div>
        </Link>

        <Link
          to="/admin/quotations"
          className="no-underline"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: 18,
            borderRadius: 14,
            backgroundColor: "var(--bg-card)",
            border: "1px border var(--border-default)",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ padding: 10, borderRadius: 10, backgroundColor: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6" }}>
              <FileText size={22} />
            </span>
            <ArrowRight size={18} style={{ color: "var(--text-secondary)" }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Quotations</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
              Prepare cost estimates, line items, and pricing terms for quotes.
            </div>
          </div>
        </Link>

        <Link
          to="/admin/orders"
          className="no-underline"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: 18,
            borderRadius: 14,
            backgroundColor: "var(--bg-card)",
            border: "1px border var(--border-default)",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ padding: 10, borderRadius: 10, backgroundColor: "rgba(20, 184, 166, 0.1)", color: "#14b8a6" }}>
              <ShoppingCart size={22} />
            </span>
            <ArrowRight size={18} style={{ color: "var(--text-secondary)" }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Assigned Orders</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
              Monitor order schedules, milestone progress, and delivery targets.
            </div>
          </div>
        </Link>
      </div>

      {/* Active Orders List */}
      <div style={{ backgroundColor: "var(--bg-card)", borderRadius: 16, border: "1px border var(--border-default)", padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Active Assigned Orders
            </h2>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Orders currently assigned to you for production management
            </span>
          </div>
          <button className="inv-btn inv-btn--icon" onClick={load} title="Refresh orders">
            <RefreshCw size={16} />
          </button>
        </div>

        {error && (
          <div style={{ padding: 12, color: "var(--color-danger)", backgroundColor: "rgba(239, 68, 68, 0.1)", borderRadius: 8, fontSize: 13 }}>
            {error}
          </div>
        )}

        {orders && orders.length === 0 && (
          <div className="inv-status">No active orders assigned to you currently.</div>
        )}

        {orders && orders.length > 0 && (
          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Company</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Current Stage</th>
                  <th>Updated</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{o.orderNumber}</span>
                    </td>
                    <td>{o.companyName ?? "—"}</td>
                    <td>{o.productType ?? "Casting Component"}</td>
                    <td>{o.totalQuantity.toLocaleString()} pcs</td>
                    <td>
                      <span className="inv-badge inv-badge--blue" style={{ textTransform: "capitalize" }}>
                        {o.manufacturingStage.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td>
                      <span className="inv-date">{formatDate(o.stageUpdatedAt ?? o.placedAtUtc)}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Link
                        to="/admin/production"
                        className="inv-btn"
                        style={{ fontSize: 12, padding: "4px 10px", textDecoration: "none" }}
                      >
                        Update Stage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
