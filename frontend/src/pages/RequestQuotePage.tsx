import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { enquiryProductTypes, submitEnquiry } from "../api/publicApi";
import { Seo } from "../components/Seo";
import { Breadcrumb, Section, SectionHeading } from "../components/ui";
import { seoPages } from "../content/seo";

const allowedExtensions = ["pdf", "dwg", "dxf", "step", "stp", "iges", "igs", "jpg", "jpeg", "png", "zip"];
const maxFileMb = 10;
const maxFiles = 10;

type FormStatus =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "ok"; message: string; reference: string | null }
  | { kind: "error"; message: string };

export default function RequestQuotePage() {
  const [status, setStatus] = useState<FormStatus>({ kind: "idle" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  function handleFilesChosen(files: FileList | null) {
    setFileError(null);
    if (!files || files.length === 0) return;
    const newFiles: File[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!allowedExtensions.includes(ext)) { setFileError(`"${file.name}": .${ext} not accepted`); return; }
      if (file.size > maxFileMb * 1024 * 1024) { setFileError(`"${file.name}": exceeds ${maxFileMb} MB`); return; }
      newFiles.push(file);
    }
    const total = selectedFiles.length + newFiles.length;
    if (total > maxFiles) { setFileError(`Max ${maxFiles} files`); return; }
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  }
  function removeFile(i: number) {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const get = (name: string) => (data.get(name) as string | null)?.trim() ?? "";

    const nextErrors: Record<string, string> = {};
    if (get("fullName").length < 2) nextErrors.fullName = "Please enter your full name.";
    if (get("companyName").length < 2) nextErrors.companyName = "Please enter your company name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(get("email"))) nextErrors.email = "Please enter a valid work email.";
    if (get("phone").length < 7) nextErrors.phone = "Please enter a phone or WhatsApp number.";
    if (!get("productType")) nextErrors.productType = "Please select a requirement type.";
    if (!get("quantity")) nextErrors.quantity = "Please enter the required quantity.";
    if (get("requirementDetails").length < 10) nextErrors.requirementDetails = "Please describe the part or application (10+ characters).";
    if (!data.get("consent")) nextErrors.consent = "Consent is required so we can respond with a quote.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || fileError) return;

    setStatus({ kind: "submitting" });
    try {
      const result = await submitEnquiry({
        fullName: get("fullName"),
        companyName: get("companyName"),
        email: get("email"),
        phone: get("phone"),
        productType: get("productType"),
        materialGrade: get("materialGrade") || undefined,
        quantity: get("quantity"),
        deliveryLocation: get("deliveryLocation") || undefined,
        requirementDetails: get("requirementDetails"),
        consentGiven: true,
        website: get("website") || undefined, // honeypot
      });
      setStatus({ kind: "ok", message: result.message, reference: result.id });
      form.reset();
      setSelectedFiles([]);
    } catch {
      setStatus({ kind: "error", message: "We could not submit your request. Please try again or call us." });
    }
  }

  return (
    <>
      <Seo title={seoPages.enquiry.title} description={seoPages.enquiry.description} path="/request-a-quote" />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Request a Quote", href: "/request-a-quote" }]} />

      <section className="hero hero--page">
        <div className="container">
          <h1>Request a Quote</h1>
          <p>
            Share your drawing, material grade, quantity, and delivery requirement. Our team will
            review it and respond with the next steps.
          </p>
        </div>
      </section>

      <Section labelledBy="enquiry-form-heading">
        <SectionHeading
          id="enquiry-form-heading"
          eyebrow="Quote request"
          title="Tell Us About Your Requirement"
          lead="Not sure what to include? See our guide: How to Prepare a Casting Enquiry."
        />

        {status.kind === "ok" ? (
          <div className="form-status form-status--ok" role="status">
            <p>{status.message}</p>
            {status.reference && <p>Reference: {status.reference}</p>}
            <p>
              <Link to="/">Return to home</Link> ·{" "}
              <Link to="/resources/how-to-prepare-a-casting-rfq">Enquiry preparation guide</Link>
            </p>
          </div>
        ) : (
          <form className="form" onSubmit={handleSubmit} noValidate>
            <div className="form__field">
              <label htmlFor="r-fullName">Full Name *</label>
              <input id="r-fullName" name="fullName" autoComplete="name" required aria-invalid={!!errors.fullName} />
              {errors.fullName && <span className="form__error">{errors.fullName}</span>}
            </div>
            <div className="form__field">
              <label htmlFor="r-companyName">Company Name *</label>
              <input id="r-companyName" name="companyName" autoComplete="organization" required aria-invalid={!!errors.companyName} />
              {errors.companyName && <span className="form__error">{errors.companyName}</span>}
            </div>
            <div className="form__field">
              <label htmlFor="r-email">Work Email *</label>
              <input id="r-email" name="email" type="email" autoComplete="email" required aria-invalid={!!errors.email} />
              {errors.email && <span className="form__error">{errors.email}</span>}
            </div>
            <div className="form__field">
              <label htmlFor="r-phone">Phone / WhatsApp *</label>
              <input id="r-phone" name="phone" type="tel" autoComplete="tel" required aria-invalid={!!errors.phone} />
              {errors.phone && <span className="form__error">{errors.phone}</span>}
            </div>
            <div className="form__field">
              <label htmlFor="r-productType">Requirement *</label>
              <select id="r-productType" name="productType" required aria-invalid={!!errors.productType} defaultValue="">
                <option value="" disabled>Select requirement type</option>
                {enquiryProductTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.productType && <span className="form__error">{errors.productType}</span>}
            </div>
            <div className="form__field">
              <label htmlFor="r-materialGrade">Material Grade / Standard</label>
              <input id="r-materialGrade" name="materialGrade" />
              <span className="form__hint">e.g. the applicable IS / EN / ASTM specification, if known.</span>
            </div>
            <div className="form__field">
              <label htmlFor="r-quantity">Required Quantity *</label>
              <input id="r-quantity" name="quantity" required aria-invalid={!!errors.quantity} />
              {errors.quantity && <span className="form__error">{errors.quantity}</span>}
            </div>
            <div className="form__field">
              <label htmlFor="r-deliveryLocation">Delivery Location</label>
              <input id="r-deliveryLocation" name="deliveryLocation" />
            </div>
            <div className="form__field">
              <label htmlFor="r-details">Part / Application Details *</label>
              <textarea id="r-details" name="requirementDetails" required aria-invalid={!!errors.requirementDetails} />
              {errors.requirementDetails && <span className="form__error">{errors.requirementDetails}</span>}
            </div>
            <div className="form__field">
              <label>Upload Drawings or Specifications (max {maxFiles} files)</label>
              <input id="r-file" type="file" multiple
                accept={allowedExtensions.map((e) => `.${e}`).join(",")}
                onChange={(e) => handleFilesChosen(e.target.files)} />
              <span className="form__hint">
                Accepted: {allowedExtensions.join(", ")} · up to {maxFileMb} MB each · max {maxFiles} files
              </span>
              {selectedFiles.length > 0 && (
                <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {selectedFiles.map((f, i) => {
                    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
                    const isImage = ["jpg", "jpeg", "png"].includes(ext);
                    const previewUrl = isImage ? URL.createObjectURL(f) : null;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid var(--c-line)", background: "var(--c-bg-secondary)" }}>
                        {previewUrl ? (
                          <img src={previewUrl} alt={f.name} style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "0.25rem", border: "1px solid var(--c-line)" }} />
                        ) : (
                          <span style={{ width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.25rem", background: "var(--c-bg)", fontSize: "1.5rem" }}>📄</span>
                        )}
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
            <div className="visually-hidden" aria-hidden="true">
              <label htmlFor="r-website">Leave this field empty</label>
              <input id="r-website" name="website" tabIndex={-1} autoComplete="off" />
            </div>
            <div className="form__field">
              <label className="form__consent">
                <input type="checkbox" name="consent" />
                <span>I agree that Shakti Udyog may use my submitted information to respond to this quote request. *</span>
              </label>
              {errors.consent && <span className="form__error">{errors.consent}</span>}
            </div>
            {status.kind === "error" && (
              <p className="form-status form-status--error" role="alert">{status.message}</p>
            )}
            <button className="btn btn--primary" type="submit" disabled={status.kind === "submitting"}>
              {status.kind === "submitting" ? "Submitting…" : "Request Quote"}
            </button>
          </form>
        )}
      </Section>
    </>
  );
}
