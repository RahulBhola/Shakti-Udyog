import { useEffect, useState } from "react";
import { customerApi, type Profile } from "../../api/customerApi";
import { EmptyState, Loading } from "../../components/ui";
import { Panel } from "../shared";

export default function CompanyPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    customerApi.profile().then(setProfile).catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <EmptyState title="Company info unavailable" text={error} />;
  if (!profile) return <Loading label="Loading company info" />;
  if (!profile.company) return <EmptyState title="No company" text="Your account is not yet associated with an approved company." />;

  const c = profile.company;

  return (
    <>
      <h1>Company</h1>
      <div className="panel-grid panel-grid--2">
        <Panel title="Company profile">
          <div className="table-scroll"><table className="data-table"><tbody>
            <tr><th scope="row">Name</th><td>{c.name}</td></tr>
            <tr><th scope="row">Address</th><td>{c.addressLine1 ?? "—"}</td></tr>
            <tr><th scope="row">City</th><td>{c.city ?? "—"}</td></tr>
            <tr><th scope="row">State</th><td>{c.state ?? "—"}</td></tr>
            <tr><th scope="row">Postal code</th><td>{c.postalCode ?? "—"}</td></tr>
            <tr><th scope="row">Country</th><td>{c.country ?? "—"}</td></tr>
            <tr><th scope="row">GST</th><td>{c.gstNumber ?? "—"}</td></tr>
          </tbody></table></div>
          <p className="form__hint" style={{ marginTop: "var(--sp-3)" }}>Company master data is maintained by Shakti Udyog. Contact us for corrections.</p>
        </Panel>
        <Panel title="Delivery addresses">
          {c.deliveryAddresses ? (
            <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", color: "var(--c-ink-soft)", margin: 0 }}>{c.deliveryAddresses}</pre>
          ) : (
            <p className="placeholder-note">No delivery addresses on file.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
