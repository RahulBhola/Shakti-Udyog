import { useEffect, useState } from "react";
import { updaterApi, type UpdaterMe } from "../../../api/updaterApi";
import { EmptyState, Loading } from "../../../components/ui";
import { formatDate, formatTime } from "../../shared";
import "../erpListView.css";

/** Engineer self-service "Employee Detail" — shows their own profile info. */
export default function EmployeeDetailPage() {
  const [me, setMe] = useState<UpdaterMe | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    updaterApi.me().then(setMe).catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <EmptyState title="Employee details unavailable" text={error} />;
  if (!me) return <div className="inv-status"><Loading label="Loading your details" /></div>;

  return (
    <div className="inv-page">
      <div className="inv-header">
        <div>
          <h1 className="inv-header__title">Employee Detail</h1>
          <p className="inv-header__subtitle">Your account and staff information.</p>
        </div>
      </div>

      <div className="inv-card" style={{ maxWidth: 640, border: "1px solid var(--border-default)" }}>
        <div className="inv-card__body">
          <div className="inv-form-field">
            <span className="inv-form-label">Full name</span>
            <div className="inv-customer__name" style={{ fontSize: 15 }}>{me.fullName || "—"}</div>
          </div>
          <div className="inv-form-field">
            <span className="inv-form-label">Email</span>
            <div className="inv-customer__name" style={{ fontSize: 15 }}>{me.email || "—"}</div>
          </div>
          <div className="inv-form-field">
            <span className="inv-form-label">Phone</span>
            <div className="inv-customer__name" style={{ fontSize: 15 }}>{me.phoneNumber || "—"}</div>
          </div>
          <div className="inv-form-field">
            <span className="inv-form-label">Role</span>
            <span className="inv-badge inv-badge--blue">{me.role}</span>
          </div>
          <div className="inv-form-field">
            <span className="inv-form-label">Last login</span>
            <div className="inv-customer__name" style={{ fontSize: 15 }}>
              {me.lastLoginAtUtc ? `${formatDate(me.lastLoginAtUtc)} · ${formatTime(me.lastLoginAtUtc)}` : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}