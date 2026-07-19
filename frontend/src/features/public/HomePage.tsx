import { useEffect, useState } from "react";
import { apiGet } from "../../api/client";

interface MetaResponse {
  name: string;
  apiVersion: string;
  environment: string;
}

/**
 * Public homepage placeholder. Real marketing content (per
 * docs/shakti-udyog-requirements.md §3) is built in Milestone 3.
 * The API status panel verifies frontend↔backend connectivity during setup.
 */
export function HomePage() {
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<MetaResponse>("/api/v1/meta")
      .then(setMeta)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <main className="page">
      <h1>Shakti Udyog</h1>
      <p>Precision Iron Castings for Demanding Industries</p>
      <p className="placeholder-note">
        [Placeholder site — public website content arrives in Milestone 3]
      </p>
      <section aria-label="API status">
        <h2>API status</h2>
        {meta && (
          <p>
            Connected to {meta.name} ({meta.apiVersion}, {meta.environment})
          </p>
        )}
        {error && <p role="alert">API not reachable: {error}</p>}
        {!meta && !error && <p>Checking…</p>}
      </section>
    </main>
  );
}
