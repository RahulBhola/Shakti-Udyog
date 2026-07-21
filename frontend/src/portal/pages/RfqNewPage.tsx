import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { customerApi } from "../../api/customerApi";
import { rfqProductTypes } from "../../api/publicApi";
import { Panel } from "../shared";

const allowedExtensions = ["pdf", "dwg", "dxf", "step", "stp", "iges", "igs", "jpg", "png", "zip"];

export default function RfqNewPage() {
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "uploading" | "error">("idle");
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  function handleFiles(list: FileList | null) {
    setFileError(null);
    if (!list) return;
    const next: File[] = [];
    for (const file of Array.from(list)) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!allowedExtensions.includes(ext)) {
        setFileError(`.${ext} files are not accepted.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setFileError(`${file.name} exceeds 10 MB.`);
        continue;
      }
      next.push(file);
    }
    setFiles(next);
  }

  async function submit(event: FormEvent<HTMLFormElement>, saveAsDraft: boolean) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const get = (name: string) => (data.get(name) as string | null)?.trim() ?? "";

    const nextErrors: Record<string, string> = {};
    if (!get("productType")) nextErrors.productType = "Select a requirement type.";
    if (!get("quantity")) nextErrors.quantity = "Enter the required quantity.";
    if (get("requirementDetails").length < 10) nextErrors.requirementDetails = "Describe the part or application (10+ characters).";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("submitting");
    try {
      const { id } = await customerApi.createRfq({
        productType: get("productType"),
        materialGrade: get("materialGrade") || undefined,
        quantity: get("quantity"),
        deliveryLocation: get("deliveryLocation") || undefined,
        requirementDetails: get("requirementDetails"),
        saveAsDraft,
      });

      if (files.length > 0) {
        setStatus("uploading");
        for (let i = 0; i < files.length; i++) {
          setUploadProgress(`Uploading drawing ${i + 1} of ${files.length}: ${files[i].name}`);
          await customerApi.uploadRfqFile(id, files[i]);
        }
      }

      navigate(`/customer/rfqs/${id}`);
    } catch {
      setStatus("error");
    }
  }

  const busy = status === "submitting" || status === "uploading";

  return (
    <>
      <h1>New RFQ</h1>
      <Panel>
        <form className="form" onSubmit={(e) => submit(e, false)} noValidate>
          <div className="form__field">
            <label htmlFor="n-productType">Requirement *</label>
            <select id="n-productType" name="productType" defaultValue="" required>
              <option value="" disabled>Select requirement type</option>
              {rfqProductTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.productType && <span className="form__error">{errors.productType}</span>}
          </div>
          <div className="form__field">
            <label htmlFor="n-materialGrade">Material Grade / Standard</label>
            <input id="n-materialGrade" name="materialGrade" />
          </div>
          <div className="form__field">
            <label htmlFor="n-quantity">Required Quantity *</label>
            <input id="n-quantity" name="quantity" required />
            {errors.quantity && <span className="form__error">{errors.quantity}</span>}
          </div>
          <div className="form__field">
            <label htmlFor="n-deliveryLocation">Delivery Location</label>
            <input id="n-deliveryLocation" name="deliveryLocation" />
          </div>
          <div className="form__field">
            <label htmlFor="n-details">Part / Application Details *</label>
            <textarea id="n-details" name="requirementDetails" required />
            {errors.requirementDetails && <span className="form__error">{errors.requirementDetails}</span>}
          </div>
          <div className="form__field">
            <label htmlFor="n-files">Drawings / Specifications</label>
            <input
              id="n-files"
              type="file"
              multiple
              accept={allowedExtensions.map((e) => `.${e}`).join(",")}
              onChange={(e) => handleFiles(e.target.files)}
            />
            <span className="form__hint">
              {allowedExtensions.join(", ")} · up to 10 MB each. Files are stored securely and
              visible only to your company and Shakti Udyog staff.
            </span>
            {files.length > 0 && <span className="form__hint">Selected: {files.map((f) => f.name).join(", ")}</span>}
            {fileError && <span className="form__error">{fileError}</span>}
          </div>

          {status === "uploading" && uploadProgress && (
            <p className="form-status form-status--ok" role="status">{uploadProgress}</p>
          )}
          {status === "error" && (
            <p className="form-status form-status--error" role="alert">
              Could not submit the RFQ. Please try again.
            </p>
          )}

          <div className="quick-actions">
            <button className="btn btn--primary" type="submit" disabled={busy}>
              {busy ? "Submitting…" : "Submit RFQ"}
            </button>
            <button
              className="btn btn--ghost"
              style={{ color: "var(--c-ink)" }}
              type="button"
              disabled={busy}
              onClick={(e) => {
                const form = (e.target as HTMLElement).closest("form");
                if (form) submit({ preventDefault: () => {}, currentTarget: form } as unknown as FormEvent<HTMLFormElement>, true);
              }}
            >
              Save as draft
            </button>
          </div>
        </form>
      </Panel>
    </>
  );
}
