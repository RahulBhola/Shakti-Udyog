import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { customerApi, type RfqDetail } from "../../api/customerApi";
import { rfqProductTypes } from "../../api/publicApi";
import { EmptyState, Loading } from "../../components/ui";
import { Panel } from "../shared";

export default function RfqEditPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [rfq, setRfq] = useState<RfqDetail | null>(null);
  const [missing, setMissing] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  useEffect(() => {
    customerApi.rfq(id).then(setRfq).catch(() => setMissing(true));
  }, [id]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const get = (name: string) => (data.get(name) as string | null)?.trim() ?? "";

    const payload: Record<string, string> = {};
    const productType = get("productType");
    const materialGrade = get("materialGrade");
    const quantity = get("quantity");
    const deliveryLocation = get("deliveryLocation");
    const requirementDetails = get("requirementDetails");

    if (productType) payload.productType = productType;
    if (materialGrade) payload.materialGrade = materialGrade;
    if (quantity) payload.quantity = quantity;
    if (deliveryLocation) payload.deliveryLocation = deliveryLocation;
    if (requirementDetails) payload.requirementDetails = requirementDetails;

    setStatus("saving");
    try {
      await customerApi.updateRfq(id, payload);
      navigate(`/customer/rfqs/${id}`);
    } catch {
      setStatus("error");
    }
  }

  if (missing) return <EmptyState title="RFQ not found" />;
  if (!rfq) return <Loading label="Loading RFQ" />;
  if (!rfq.isDraft || rfq.status !== "Draft") {
    return <EmptyState title="Cannot edit" text="This RFQ has already been submitted and cannot be edited." />;
  }

  const busy = status === "saving";

  return (
    <>
      <h1>Edit Draft RFQ</h1>
      <Panel>
        <form className="form" onSubmit={submit} noValidate>
          <div className="form__field">
            <label htmlFor="e-productType">Requirement</label>
            <select id="e-productType" name="productType" defaultValue={rfq.productType}>
              {rfqProductTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form__field">
            <label htmlFor="e-materialGrade">Material Grade / Standard</label>
            <input id="e-materialGrade" name="materialGrade" defaultValue={rfq.materialGrade ?? ""} />
          </div>
          <div className="form__field">
            <label htmlFor="e-quantity">Required Quantity</label>
            <input id="e-quantity" name="quantity" defaultValue={rfq.quantity} />
          </div>
          <div className="form__field">
            <label htmlFor="e-deliveryLocation">Delivery Location</label>
            <input id="e-deliveryLocation" name="deliveryLocation" defaultValue={rfq.deliveryLocation ?? ""} />
          </div>
          <div className="form__field">
            <label htmlFor="e-details">Part / Application Details</label>
            <textarea id="e-details" name="requirementDetails" defaultValue={rfq.requirementDetails} />
          </div>

          {status === "error" && (
            <p className="form-status form-status--error" role="alert">
              Could not save changes. Please try again.
            </p>
          )}

          <div className="quick-actions">
            <button className="btn btn--primary" type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </button>
            <Link className="btn btn--ghost" style={{ color: "var(--c-ink)" }} to={`/customer/rfqs/${id}`}>
              Cancel
            </Link>
          </div>
        </form>
      </Panel>
    </>
  );
}
