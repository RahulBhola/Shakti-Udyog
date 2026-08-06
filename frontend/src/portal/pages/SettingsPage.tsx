import { Panel } from "../shared";

export default function SettingsPage() {
  return (
    <>
      <h1>Settings</h1>
      <div className="panel-grid panel-grid--2">
        <Panel title="Security">
          <p className="placeholder-note">Multi-factor authentication — coming in a later milestone.</p>
          <p className="placeholder-note" style={{ marginTop: "var(--sp-3)" }}>
            Active session management — view and revoke active sessions, coming later.
          </p>
        </Panel>
        <Panel title="Preferences">
          <p className="placeholder-note">
            Notification preferences, theme settings, and language selection will appear here.
          </p>
        </Panel>
      </div>
    </>
  );
}
