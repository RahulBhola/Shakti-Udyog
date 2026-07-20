import { Seo } from "../components/Seo";
import { Breadcrumb, Section } from "../components/ui";
import { company } from "../content/company";

interface LegalPageProps {
  slug: "privacy-policy" | "terms-of-use" | "cookie-policy";
  title: string;
}

/**
 * Legal page placeholders. Final policy text requires review by Shakti Udyog
 * and legal counsel — nothing here is presented as adopted policy.
 */
export default function LegalPage({ slug, title }: LegalPageProps) {
  return (
    <>
      <Seo
        title={`${title} | ${company.name}`}
        description={`${title} for the ${company.name} website.`}
        path={`/${slug}`}
      />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: title, href: `/${slug}` }]} />
      <Section labelledBy="legal-heading">
        <h1 id="legal-heading">{title}</h1>
        <div className="prose">
          <p className="placeholder-note">
            [Placeholder — the final {title.toLowerCase()} will be published here after review and
            approval by Shakti Udyog. This draft outline is not yet adopted policy.]
          </p>
          {slug === "privacy-policy" && (
            <ul>
              <li>What personal information the website collects (enquiry and quotation forms).</li>
              <li>How submitted information is used to respond to enquiries and quotations.</li>
              <li>Consent, data-retention periods, and how to request deletion of your data.</li>
              <li>Contact for privacy questions: {company.contact.email}</li>
            </ul>
          )}
          {slug === "terms-of-use" && (
            <ul>
              <li>Acceptable use of this website and its content.</li>
              <li>Intellectual property in site content and submitted materials.</li>
              <li>Disclaimers: published capability data is indicative until agreed at quotation.</li>
            </ul>
          )}
          {slug === "cookie-policy" && (
            <ul>
              <li>This website currently uses only cookies essential for its operation.</li>
              <li>No advertising or third-party tracking cookies are set by this milestone.</li>
            </ul>
          )}
        </div>
      </Section>
    </>
  );
}
