import { useEffect, useState, type FormEvent } from "react";
import { apiGet, apiPut, apiPost } from "../../api/client";
import { Panel, formatDate } from "../shared";

export default function AdminJiraPage() {
  const [config, setConfig] = useState<any>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { apiGet<any>("/api/v1/admin/jira/configuration").then(setConfig).catch(() => {}); }, []);
  useEffect(() => { apiGet<any[]>("/api/v1/admin/jira/logs").then(setLogs).catch(() => {}); }, []);

  async function saveConfig(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    try { await apiPut("/api/v1/admin/jira/configuration", { jiraUrl: data.get("url"), projectKey: data.get("projectKey"), apiToken: data.get("apiToken"), email: data.get("email") }); alert("Saved."); } catch { alert("Failed."); }
    finally { setBusy(false); }
  }

  async function testConnection() { setTestResult(null); const r: any = await apiPost("/api/v1/admin/jira/test", {}); setTestResult(r.status); }
  async function runSync() { setSyncResult(null); await apiPost("/api/v1/admin/jira/sync", {}); setSyncResult("Sync started."); const r = await apiGet<any[]>("/api/v1/admin/jira/logs"); setLogs(r); }

  return (
    <>
      <h1>Jira Integration</h1>
      <div className="panel-grid panel-grid--2">
        <Panel title="Configuration">
          <form className="form" onSubmit={saveConfig}>
            <div className="form__field"><label>Jira URL *</label><input name="url" defaultValue={config?.jiraUrl ?? ""} placeholder="https://your-domain.atlassian.net" required /></div>
            <div className="form__field"><label>Project Key *</label><input name="projectKey" defaultValue={config?.projectKey ?? ""} placeholder="SUO" required /></div>
            <div className="form__field"><label>Email *</label><input name="email" defaultValue={config?.email ?? ""} placeholder="admin@company.com" required /></div>
            <div className="form__field"><label>API Token *</label><input name="apiToken" type="password" defaultValue={config?.apiToken ?? ""} required /></div>
            <div className="quick-actions">
              <button className="btn btn--primary" type="submit" disabled={busy}>{busy ? "Saving..." : "Save"}</button>
              <button className="btn btn--ghost" style={{ color: "var(--c-ink)" }} type="button" onClick={() => void testConnection()}>Test Connection</button>
              <button className="btn btn--ghost" style={{ color: "var(--c-ink)" }} type="button" onClick={() => void runSync()}>Run Sync</button>
            </div>
          </form>
          {testResult && <p className="form-status form-status--ok" style={{ marginTop: "var(--sp-3)" }}>Connection: {testResult}</p>}
          {syncResult && <p className="form-status form-status--ok" style={{ marginTop: "var(--sp-3)" }}>{syncResult}</p>}
        </Panel>
        <Panel title="Connection Info">
          {config?.isConnected ? <p className="form-status form-status--ok">Connected — last sync: {config.lastSyncAtUtc ? formatDate(config.lastSyncAtUtc) : "Never"}</p> : <p className="form-status form-status--error">Not connected</p>}
          <p className="placeholder-note">Configuration is stored encrypted. API tokens never leave this server.</p>
        </Panel>
      </div>
      <Panel title="Sync Logs">
        {logs.length === 0 ? <p className="placeholder-note">No sync jobs yet.</p> : (
          <div className="list-rows">
            {logs.map((log: any) => (
              <div key={log.id} className="list-row">
                <div className="list-row__main">
                  <div className="list-row__title">{log.jobType} — {log.status}</div>
                  <div className="list-row__meta">{log.itemsProcessed} processed, {log.itemsFailed} failed · {formatDate(log.startedAtUtc)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
