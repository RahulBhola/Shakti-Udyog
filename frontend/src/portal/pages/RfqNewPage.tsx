import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { customerApi } from "../../api/customerApi";
import { rfqProductTypes } from "../../api/publicApi";
import { Panel } from "../shared";

const allowedExtensions = ["pdf", "dwg", "dxf", "step", "stp", "iges", "igs", "jpg", "jpeg", "png", "zip"];
const maxFileMb = 10;
const maxFiles = 10;

export default function RfqNewPage() {
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "uploading" | "error">("idle");
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  function handleFiles(list: FileList | null) {
    setFileError(null);
    if (!list || list.length === 0) return;
    const next: File[] = [];
    for (const file of Array.from(list)) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!allowedExtensions.includes(ext)) { setFileError(`"${file.name}": .${ext} not accepted`); continue; }
      if (file.size > maxFileMb * 1024 * 1024) { setFileError(`"${file.name}": exceeds ${maxFileMb} MB`); continue; }
      next.push(file);
    }
    const total = files.length + next.length;
    if (total > maxFiles) { setFileError(`Max ${maxFiles} files`); return; }
    setFiles((prev) => [...prev, ...next]);
  }
  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
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
              {allowedExtensions.join(", ")} · up to {maxFileMb} MB each · max {maxFiles} files. Files are stored securely.
            </span>
            {files.length > 0 && (
              <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {files.map((f, i) => {
                  const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
                  const isImage = ["jpg", "jpeg", "png"].includes(ext);
                  const url = isImage ? URL.createObjectURL(f) : null;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid var(--c-line)", background: "var(--c-bg-secondary)" }}>
                      {url ? <img src={url} alt={f.name} style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "0.25rem", border: "1px solid var(--c-line)" }} />
                        : <span style={{ width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.25rem", background: "var(--c-bg)", fontSize: "1.5rem" }}>📄</span>}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--c-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--c-ink-muted)" }}>{(f.size / 1024).toFixed(1)} KB</div>
                      </div>
                      <button type="button" onClick={() => removeFile(i)} style={{ background: "none", border: "none", color: "var(--c-danger)", cursor: "pointer", fontSize: "1rem", padding: "0.25rem" }} title="Remove">✕</button>
                    </div>
                  );
                })}
              </div>
            )}
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
