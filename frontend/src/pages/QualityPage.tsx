import { Seo } from "../components/Seo";
import { Breadcrumb, CtaBand, Section, SectionHeading } from "../components/ui";
import { certificationStatement, qualityChecks, qualityHeading, qualityIntro } from "../content/quality";
import { seoPages } from "../content/seo";

export default function QualityPage() {
  return (
    <>
      <Seo title={seoPages.quality.title} description={seoPages.quality.description} path="/quality" />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Quality", href: "/quality" }]} />

      <section className="hero hero--page">
        <div className="container">
          <h1>{qualityHeading}</h1>
          <p>{qualityIntro}</p>
        </div>
      </section>

      <Section labelledBy="q-checks">
        <SectionHeading
          id="q-checks"
          eyebrow="Inspection flow"
          title="Quality Checks"
          lead="Checks are planned per order against the agreed drawing, material, and acceptance criteria. Bracketed scopes are pending confirmation."
        />
        <div className="table-scroll">
          <table className="data-table">
            <caption className="visually-hidden">Quality checks and scope</caption>
            <thead>
              <tr>
                <th scope="col">Check</th>
                <th scope="col">Scope</th>
              </tr>
            </thead>
            <tbody>
              {qualityChecks.map((row) => (
                <tr key={row.check}>
                  <th scope="row">{row.check}</th>
                  <td>{row.note || "Performed on every order"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section tint labelledBy="q-cert">
        <SectionHeading id="q-cert" eyebrow="Certification" title="Our Quality System" />
        <div className="prose">
          <p>{certificationStatement}</p>
          <p className="placeholder-note">
            Certification status is pending verification. No certification logos are displayed
            until valid authorization is confirmed.
          </p>
        </div>
      </Section>

      <Section labelledBy="q-cta">
        <h2 id="q-cta" className="visually-hidden">Request a quote</h2>
        <CtaBand
          heading="Quality requirements for your order?"
          text="Inspection and documentation scope is agreed as part of the quotation."
          buttonLabel="Request a Quote"
          buttonHref="/request-a-quote"
        />
      </Section>
    </>
  );
}
