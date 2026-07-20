import { useState, type FormEvent } from "react";
import { submitEnquiry } from "../api/publicApi";
import { Seo, localBusinessJsonLd } from "../components/Seo";
import { Breadcrumb, ContactCard, ImagePlaceholder, Section, SectionHeading } from "../components/ui";
import { company } from "../content/company";
import { seoPages } from "../content/seo";

type FormStatus = { kind: "idle" } | { kind: "submitting" } | { kind: "ok"; message: string } | { kind: "error"; message: string };

export default function ContactPage() {
  const [status, setStatus] = useState<FormStatus>({ kind: "idle" });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (get("message").length < 10) nextErrors.message = "Please describe how we can help (10+ characters).";
    if (!data.get("consent")) nextErrors.consent = "Consent is required so we can respond to you.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus({ kind: "submitting" });
    try {
      const result = await submitEnquiry({
        fullName: get("fullName"),
        companyName: get("companyName"),
        email: get("email"),
        phone: get("phone"),
        city: get("city") || undefined,
        message: get("message"),
        consentGiven: true,
        website: get("website") || undefined, // honeypot
      });
      setStatus({ kind: "ok", message: result.message });
      form.reset();
    } catch {
      setStatus({ kind: "error", message: "We could not send your enquiry. Please try again or call us." });
    }
  }

  return (
    <>
      <Seo
        title={seoPages.contact.title}
        description={seoPages.contact.description}
        path="/contact"
        jsonLd={[localBusinessJsonLd()]}
      />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Contact", href: "/contact" }]} />

      <section className="hero hero--page">
        <div className="container">
          <h1>Let's Discuss Your Casting Requirement</h1>
          <p>
            Tell us about your component, application, material, and volume. We will connect you
            with the appropriate team member.
          </p>
        </div>
      </section>

      <Section labelledBy="contact-details">
        <SectionHeading id="contact-details" eyebrow="Reach us" title="Contact Details" />
        <div className="contact-cards">
          <ContactCard title="Phone & WhatsApp">
            <p>
              Phone: <a href={company.contact.phoneHref}>{company.contact.phone}</a>
              <br />
              WhatsApp: <a href={company.contact.whatsappHref}>{company.contact.whatsapp}</a>
            </p>
          </ContactCard>
          <ContactCard title="Email">
            <p>
              <a href={`mailto:${company.contact.email}`}>{company.contact.email}</a>
            </p>
          </ContactCard>
          <ContactCard title="Business Hours">
            <p>{company.contact.businessHours}</p>
          </ContactCard>
          <ContactCard title="Address">
            <p>
              {company.address.line1}
              <br />
              {company.address.city}, {company.address.state} {company.address.postalCode},{" "}
              {company.address.country}
            </p>
          </ContactCard>
        </div>
        <div style={{ marginTop: "var(--sp-5)" }}>
          <ImagePlaceholder label={`Map of ${company.address.line1}, ${company.address.city} (map embed to be added)`} />
        </div>
      </Section>

      <Section tint labelledBy="enquiry-form-heading">
        <SectionHeading id="enquiry-form-heading" eyebrow="Write to us" title="Send an Enquiry" />
        {status.kind === "ok" ? (
          <p className="form-status form-status--ok" role="status">{status.message}</p>
        ) : (
          <form className="form" onSubmit={handleSubmit} noValidate>
            <div className="form__field">
              <label htmlFor="c-fullName">Full Name *</label>
              <input id="c-fullName" name="fullName" autoComplete="name" required aria-invalid={!!errors.fullName} aria-describedby={errors.fullName ? "c-fullName-err" : undefined} />
              {errors.fullName && <span id="c-fullName-err" className="form__error">{errors.fullName}</span>}
            </div>
            <div className="form__field">
              <label htmlFor="c-companyName">Company Name *</label>
              <input id="c-companyName" name="companyName" autoComplete="organization" required aria-invalid={!!errors.companyName} aria-describedby={errors.companyName ? "c-companyName-err" : undefined} />
              {errors.companyName && <span id="c-companyName-err" className="form__error">{errors.companyName}</span>}
            </div>
            <div className="form__field">
              <label htmlFor="c-email">Work Email *</label>
              <input id="c-email" name="email" type="email" autoComplete="email" required aria-invalid={!!errors.email} aria-describedby={errors.email ? "c-email-err" : undefined} />
              {errors.email && <span id="c-email-err" className="form__error">{errors.email}</span>}
            </div>
            <div className="form__field">
              <label htmlFor="c-phone">Phone / WhatsApp *</label>
              <input id="c-phone" name="phone" type="tel" autoComplete="tel" required aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "c-phone-err" : undefined} />
              {errors.phone && <span id="c-phone-err" className="form__error">{errors.phone}</span>}
            </div>
            <div className="form__field">
              <label htmlFor="c-city">City and State</label>
              <input id="c-city" name="city" autoComplete="address-level2" />
            </div>
            <div className="form__field">
              <label htmlFor="c-message">How can we help? *</label>
              <textarea id="c-message" name="message" required aria-invalid={!!errors.message} aria-describedby={errors.message ? "c-message-err" : undefined} />
              {errors.message && <span id="c-message-err" className="form__error">{errors.message}</span>}
            </div>
            {/* Honeypot — hidden from humans, tabbed past by screen readers. */}
            <div className="visually-hidden" aria-hidden="true">
              <label htmlFor="c-website">Leave this field empty</label>
              <input id="c-website" name="website" tabIndex={-1} autoComplete="off" />
            </div>
            <div className="form__field">
              <label className="form__consent">
                <input type="checkbox" name="consent" />
                <span>I agree that Shakti Udyog may contact me about this enquiry. *</span>
              </label>
              {errors.consent && <span className="form__error">{errors.consent}</span>}
            </div>
            {status.kind === "error" && (
              <p className="form-status form-status--error" role="alert">{status.message}</p>
            )}
            <button className="btn btn--primary" type="submit" disabled={status.kind === "submitting"}>
              {status.kind === "submitting" ? "Sending…" : "Send Enquiry"}
            </button>
          </form>
        )}
      </Section>
    </>
  );
}
