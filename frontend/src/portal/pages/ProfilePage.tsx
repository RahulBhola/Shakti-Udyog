import { useEffect, useState, type FormEvent } from "react";
import { customerApi, type Profile } from "../../api/customerApi";
import { EmptyState, Loading } from "../../components/ui";
import { Panel } from "../shared";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    customerApi.profile().then(setProfile).catch((e: Error) => setError(e.message));
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const result = await customerApi.updateProfile({
        fullName: (data.get("fullName") as string).trim() || undefined,
        phoneNumber: (data.get("phoneNumber") as string).trim() || undefined,
        deliveryAddresses: (data.get("deliveryAddresses") as string).trim() || undefined,
      });
      setProfileMessage(result.message);
      setProfile(await customerApi.profile());
    } catch {
      setProfileMessage("Could not update the profile. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    try {
      const result = await customerApi.changePassword(
        data.get("currentPassword") as string,
        data.get("newPassword") as string,
      );
      setPasswordMessage({ ok: true, text: result.message });
      form.reset();
    } catch (e) {
      setPasswordMessage({
        ok: false,
        text: e instanceof Error && e.message ? e.message : "Password change failed. Check the current password and policy (12+ chars, mixed).",
      });
    } finally {
      setBusy(false);
    }
  }

  if (error) return <EmptyState title="Profile unavailable" text={error} />;
  if (!profile) return <Loading label="Loading profile" />;

  return (
    <>
      <h1>Profile</h1>

      <div className="panel-grid panel-grid--2">
        <Panel title="Your details">
          {profileMessage && <p className="form-status form-status--ok" role="status">{profileMessage}</p>}
          <form className="form" onSubmit={saveProfile}>
            <div className="form__field">
              <label htmlFor="pr-email">Email</label>
              <input id="pr-email" value={profile.email} disabled />
              <span className="form__hint">Email changes require Shakti Udyog support.</span>
            </div>
            <div className="form__field">
              <label htmlFor="pr-fullName">Full name</label>
              <input id="pr-fullName" name="fullName" defaultValue={profile.fullName ?? ""} />
            </div>
            <div className="form__field">
              <label htmlFor="pr-phone">Phone</label>
              <input id="pr-phone" name="phoneNumber" defaultValue={profile.phoneNumber ?? ""} />
            </div>
            <div className="form__field">
              <label htmlFor="pr-addresses">Delivery addresses (one per line)</label>
              <textarea id="pr-addresses" name="deliveryAddresses" defaultValue={profile.company?.deliveryAddresses ?? ""} />
            </div>
            <button className="btn btn--primary" type="submit" disabled={busy}>Save changes</button>
          </form>
        </Panel>

        <div style={{ display: "grid", gap: "var(--sp-5)", alignContent: "start" }}>
          <Panel title="Company">
            {profile.company ? (
              <div className="table-scroll">
                <table className="data-table">
                  <tbody>
                    <tr><th scope="row">Name</th><td>{profile.company.name}</td></tr>
                    <tr><th scope="row">Address</th><td>{profile.company.addressLine1 ?? "—"}</td></tr>
                    <tr><th scope="row">City</th><td>{[profile.company.city, profile.company.state, profile.company.postalCode].filter(Boolean).join(", ") || "—"}</td></tr>
                    <tr><th scope="row">GST</th><td>{profile.company.gstNumber ?? "—"}</td></tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="placeholder-note">No approved company on this account.</p>
            )}
            <p className="form__hint">Company master data is maintained by Shakti Udyog; contact us for corrections.</p>
          </Panel>

          <Panel title="Change password">
            {passwordMessage && (
              <p className={`form-status ${passwordMessage.ok ? "form-status--ok" : "form-status--error"}`} role={passwordMessage.ok ? "status" : "alert"}>
                {passwordMessage.text}
              </p>
            )}
            <form className="form" onSubmit={changePassword}>
              <div className="form__field">
                <label htmlFor="pw-current">Current password *</label>
                <input id="pw-current" name="currentPassword" type="password" autoComplete="current-password" required />
              </div>
              <div className="form__field">
                <label htmlFor="pw-new">New password *</label>
                <input id="pw-new" name="newPassword" type="password" autoComplete="new-password" required minLength={12} />
                <span className="form__hint">12+ characters with upper, lower, digit, and symbol. Other sessions are signed out.</span>
              </div>
              <button className="btn btn--primary" type="submit" disabled={busy}>Change password</button>
            </form>
          </Panel>

          <Panel title="Security">
            <p className="placeholder-note">
              [Multi-factor authentication — coming in a later milestone.]
            </p>
            <p className="placeholder-note">
              [Active session management — view and revoke sessions, coming in a later milestone.]
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
