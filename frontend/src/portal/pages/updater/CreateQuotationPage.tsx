import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { updaterApi } from "../../../api/updaterApi";
import { Panel } from "../../shared";

export default function CreateQuotationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rfqIdParam = searchParams.get("rfqId") ?? "";
  const companyNameParam = searchParams.get("companyName") ?? "";

  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setStatus("saving");
    try {
      const { id } = await updaterApi.createQuotation({
        rfqId: (data.get("rfqId") as string).trim(),
        companyId: (data.get("companyId") as string).trim(),
        currency: "INR",
        subtotal: Number(data.get("subtotal")),
        tax: Number(data.get("tax")),
        discount: Number(data.get("discount")),
        total: Number(data.get("total")),
        validUntilUtc: (data.get("validUntil") as string) || undefined,
        paymentTerms: (data.get("paymentTerms") as string) || undefined,
        deliveryTerms: (data.get("deliveryTerms") as string) || undefined,
        freight: (data.get("freight") as string) || undefined,
        packing: (data.get("packing") as string) || undefined,
        remarks: (data.get("remarks") as string) || undefined,
        items: [],
      });
      navigate(`/admin/quotations/${id}`);
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <h1>Create Quotation</h1>
      {rfqIdParam && (
        <div style={{ padding: "0.75rem 1rem", marginBottom: "1rem", borderRadius: "var(--radius)", background: "rgba(15,21,36,0.55)", border: "1px solid var(--c-line)", color: "var(--c-ink)" }}>
          Generating quotation for <strong>RFQ: {rfqIdParam}</strong>{companyNameParam ? ` — ${companyNameParam}` : ""}
        </div>
      )}
      <Panel>
        <form className="form" onSubmit={submit}>
          <div className="form__field">
            <label htmlFor="rfqId">RFQ ID *</label>
            <input id="rfqId" name="rfqId" defaultValue={rfqIdParam} required />
          </div>
          <div className="form__field">
            <label htmlFor="companyId">Company ID *</label>
            <input id="companyId" name="companyId" placeholder="Enter company GUID" required />
          </div>
          <div className="form__field">
            <label htmlFor="subtotal">Subtotal *</label>
            <input id="subtotal" name="subtotal" type="number" step="0.01" required />
          </div>
          <div className="form__field">
            <label htmlFor="tax">Tax *</label>
            <input id="tax" name="tax" type="number" step="0.01" required />
          </div>
          <div className="form__field">
            <label htmlFor="discount">Discount *</label>
            <input id="discount" name="discount" type="number" step="0.01" required />
          </div>
          <div className="form__field">
            <label htmlFor="total">Total *</label>
            <input id="total" name="total" type="number" step="0.01" required />
          </div>
          <div className="form__field">
            <label htmlFor="validUntil">Valid until</label>
            <input id="validUntil" name="validUntil" type="date" />
          </div>
          <div className="form__field">
            <label htmlFor="paymentTerms">Payment terms</label>
            <input id="paymentTerms" name="paymentTerms" placeholder="e.g. 30% advance, 70% on delivery" />
          </div>
          <div className="form__field">
            <label htmlFor="deliveryTerms">Delivery terms</label>
            <input id="deliveryTerms" name="deliveryTerms" placeholder="e.g. FOB Ludhiana" />
          </div>
          <div className="form__field">
            <label htmlFor="freight">Freight</label>
            <input id="freight" name="freight" />
          </div>
          <div className="form__field">
            <label htmlFor="packing">Packing</label>
            <input id="packing" name="packing" />
          </div>
          <div className="form__field">
            <label htmlFor="remarks">Remarks</label>
            <textarea id="remarks" name="remarks" rows={3} />
          </div>
          {status === "error" && <p className="form-status form-status--error" role="alert">Creation failed. Check the RFQ is approved and IDs are correct.</p>}
          <button className="btn btn--primary" type="submit" disabled={status === "saving"}>
            {status === "saving" ? "Creating…" : "Create Quotation"}
          </button>
        </form>
      </Panel>
    </>
  );
}
