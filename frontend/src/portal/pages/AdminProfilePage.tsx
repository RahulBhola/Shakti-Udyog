import { useState, type FormEvent, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import { apiGet, apiPatch, apiPost } from "../../api/client";
import {
  User, Mail, ShieldCheck, KeyRound, CheckCircle2,
  AlertCircle, Building2, Eye, EyeOff, Save,
  Layers, BadgeCheck,
} from "lucide-react";
import { DevicesSessionsCard } from "../components/DevicesSessionsCard";
import { ProfileCompletionCard } from "../components/ProfileCompletion";
import "./erpListView.css";

interface ProfileData {
  id: string;
  email: string;
  fullName: string | null;
  phoneNumber: string | null;
  isActive: boolean;
  createdAtUtc: string;
  lastLoginAtUtc: string | null;
  companyName: string | null;
  roles: string[];
}

export default function AdminProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [, setLoading] = useState(true);

  // Form states
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<"general" | "security" | "permissions">("general");

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await apiGet<ProfileData>("/api/v1/admin/profile");
        setProfile(data);
        setFullName(data.fullName || "");
        setPhoneNumber(data.phoneNumber || "");
      } catch {
        // Fallback to AuthContext user if dedicated endpoint is not reached
        if (user) {
          setProfile({
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            phoneNumber: "",
            isActive: true,
            createdAtUtc: new Date().toISOString(),
            lastLoginAtUtc: new Date().toISOString(),
            companyName: "Shakti Udyog",
            roles: user.roles,
          });
          setFullName(user.fullName || "");
        }
      } finally {
        setLoading(false);
      }
    }
    void loadProfile();
  }, [user]);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setUpdatingProfile(true);

    try {
      await apiPatch("/api/v1/admin/profile", {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
      });
      setProfileSuccess("Personal details updated successfully.");
      if (profile) {
        setProfile({ ...profile, fullName, phoneNumber });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile.";
      setProfileError(msg);
    } finally {
      setUpdatingProfile(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    setUpdatingPassword(true);
    try {
      await apiPost("/api/v1/admin/profile/change-password", {
        currentPassword,
        newPassword,
      });
      setPasswordSuccess("Password updated successfully. Other active sessions have been signed out.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change password.";
      setPasswordError(msg);
    } finally {
      setUpdatingPassword(false);
    }
  }

  const roleLabel =
    user?.roles.includes("Admin") ? "Master Administrator"
    : user?.roles.includes("Engineer") ? "Lead Staff Engineer"
    : "Staff Member";

  const initials = (profile?.fullName || user?.fullName || user?.email || "Admin")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="inv-page" style={{ maxWidth: 1080, margin: "0 auto" }}>
      {/* Header */}
      <div className="inv-header">
        <div>
          <h1 className="inv-header__title">Administrator Profile</h1>
          <p className="inv-header__subtitle">
            Manage your personal credentials, contact information, and system privileges.
          </p>
        </div>
      </div>

      {/* Hero Profile Card */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-default)",
          borderRadius: 20,
          padding: "24px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 20,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span
            className="inv-avatar"
            style={{
              width: 68,
              height: 68,
              fontSize: 24,
              boxShadow: "0 0 24px rgba(59, 130, 246, 0.2)",
            }}
          >
            {initials}
          </span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                {profile?.fullName || user?.fullName || "Staff Administrator"}
              </h2>
              <span className="inv-badge inv-badge--blue" style={{ fontSize: 12 }}>
                <ShieldCheck size={13} /> {roleLabel}
              </span>
              <span className="inv-badge inv-badge--green" style={{ fontSize: 11 }}>
                <span className="inv-dot" /> Active Account
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Mail size={14} style={{ color: "var(--color-primary)" }} /> {user?.email}
              </span>
              <span style={{ fontSize: 13, color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Building2 size={14} /> Shakti Udyog Ludhiana
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div
            style={{
              padding: "10px 16px",
              borderRadius: 12,
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
              Access Level
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)", marginTop: 2 }}>
              Tier-1 System Admin
            </div>
          </div>
        </div>
      </div>

      {/* Profile Completion Status Bar */}
      <ProfileCompletionCard
        profileData={profile || user}
        onNavigateTab={(tabKey) => {
          if (tabKey === "personal") setActiveTab("general");
          else if (tabKey === "company") setActiveTab("permissions");
          else if (tabKey === "contacts") setActiveTab("general");
        }}
      />

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--border-default)", paddingBottom: 2 }}>
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`inv-btn ${activeTab === "general" ? "inv-btn--primary" : ""}`}
          style={{ borderRadius: "10px 10px 0 0" }}
        >
          <User size={15} /> Personal Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`inv-btn ${activeTab === "security" ? "inv-btn--primary" : ""}`}
          style={{ borderRadius: "10px 10px 0 0" }}
        >
          <KeyRound size={15} /> Password & Security
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("permissions")}
          className={`inv-btn ${activeTab === "permissions" ? "inv-btn--primary" : ""}`}
          style={{ borderRadius: "10px 10px 0 0" }}
        >
          <Layers size={15} /> Assigned Roles & Rights
        </button>
      </div>

      {/* TAB 1: General Details */}
      {activeTab === "general" && (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            borderRadius: 16,
            padding: 28,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px", color: "var(--text-primary)" }}>
            Personal Information
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 24px" }}>
            Update your public staff display name and direct phone number.
          </p>

          <form onSubmit={handleProfileSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <div className="inv-field">
                <label className="inv-field__label">Full Name</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    className="inv-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Bhola"
                    required
                  />
                </div>
              </div>

              <div className="inv-field">
                <label className="inv-field__label">Work Email Address</label>
                <input
                  type="email"
                  className="inv-input"
                  value={user?.email || ""}
                  disabled
                  style={{ background: "var(--bg-surface)", opacity: 0.75, cursor: "not-allowed" }}
                  title="Work email address cannot be modified directly"
                />
                <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                  Managed by company directory
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <div className="inv-field">
                <label className="inv-field__label">Direct Phone Number</label>
                <input
                  type="tel"
                  className="inv-input"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="inv-field">
                <label className="inv-field__label">Organization / Plant</label>
                <input
                  type="text"
                  className="inv-input"
                  value="Shakti Udyog Main Foundry (Ludhiana Plant 1)"
                  disabled
                  style={{ background: "var(--bg-surface)", opacity: 0.75 }}
                />
              </div>
            </div>

            {profileSuccess && (
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(34, 197, 94, 0.12)", color: "#22C55E", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={16} />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239, 68, 68, 0.12)", color: "#EF4444", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <AlertCircle size={16} />
                <span>{profileError}</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <button
                type="submit"
                className="inv-btn inv-btn--primary"
                disabled={updatingProfile}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Save size={15} />
                <span>{updatingProfile ? "Saving Changes…" : "Save Changes"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: Security & Password */}
      {activeTab === "security" && (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            borderRadius: 16,
            padding: 28,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px", color: "var(--text-primary)" }}>
            Change Password
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 24px" }}>
            Ensure your account uses a secure password with at least 8 characters.
          </p>

          <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 540 }}>
            <div className="inv-field">
              <label className="inv-field__label">Current Password *</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showCurrentPw ? "text" : "password"}
                  className="inv-input"
                  style={{ paddingRight: 40 }}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw((v) => !v)}
                  className="inv-icon-btn"
                  style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", width: 28, height: 28 }}
                >
                  {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="inv-field">
              <label className="inv-field__label">New Password *</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showNewPw ? "text" : "password"}
                  className="inv-input"
                  style={{ paddingRight: 40 }}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw((v) => !v)}
                  className="inv-icon-btn"
                  style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", width: 28, height: 28 }}
                >
                  {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="inv-field">
              <label className="inv-field__label">Confirm New Password *</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirmPw ? "text" : "password"}
                  className="inv-input"
                  style={{ paddingRight: 40 }}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw((v) => !v)}
                  className="inv-icon-btn"
                  style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", width: 28, height: 28 }}
                >
                  {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {passwordSuccess && (
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(34, 197, 94, 0.12)", color: "#22C55E", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={16} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239, 68, 68, 0.12)", color: "#EF4444", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <AlertCircle size={16} />
                <span>{passwordError}</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 6 }}>
              <button
                type="submit"
                className="inv-btn inv-btn--primary"
                disabled={updatingPassword}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <KeyRound size={15} />
                <span>{updatingPassword ? "Updating Password…" : "Update Password"}</span>
              </button>
            </div>
          </form>

          <DevicesSessionsCard />
        </div>
      )}

      {/* TAB 3: Permissions & Roles */}
      {activeTab === "permissions" && (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            borderRadius: 16,
            padding: 28,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px", color: "var(--text-primary)" }}>
            Assigned Capabilities & Permissions
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 20px" }}>
            The following permissions are assigned to your staff credentials.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            {[
              { title: "User & Role Management", desc: "Create, view, and manage customer and staff accounts.", enabled: user?.roles.includes("Admin") },
              { title: "Enquiry & Quotation Approval", desc: "Review customer enquiries, generate formal quotations, and issue to clients.", enabled: true },
              { title: "Order & Milestone Tracking", desc: "Oversee production stages, assign engineers, and update milestones.", enabled: true },
              { title: "Invoice & Financial Records", desc: "Generate tax invoices, record payment receipts, and verify advances.", enabled: user?.roles.includes("Admin") },
              { title: "Production Kanban Board", desc: "Drag-and-drop manufacturing jobs across 25 production stages.", enabled: true },
              { title: "Audit Trail & Activity Logs", desc: "Access immutable logs of all administrative and operational changes.", enabled: user?.roles.includes("Admin") },
            ].map((perm) => (
              <div
                key={perm.title}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{perm.title}</span>
                  {perm.enabled ? (
                    <span className="inv-badge inv-badge--green" style={{ fontSize: 10 }}>
                      <BadgeCheck size={12} /> Enabled
                    </span>
                  ) : (
                    <span className="inv-badge inv-badge--gray" style={{ fontSize: 10 }}>
                      Restricted
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>
                  {perm.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
