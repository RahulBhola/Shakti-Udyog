import { Panel } from "../shared";

export default function AdminSettingsPage() {
  return (
    <>
      <h1>Settings</h1>
      <div className="panel-grid panel-grid--2">
        <Panel title="Application">
          <p className="placeholder-note">Company settings, business rules, and master data management — coming in a later milestone.</p>
        </Panel>
        <Panel title="Security">
          <p className="placeholder-note">Feature flags, authentication policies, and session management — coming in a later milestone.</p>
        </Panel>
      </div>
    </>
  );
}
