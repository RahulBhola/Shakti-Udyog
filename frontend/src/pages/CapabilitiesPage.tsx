import { Seo } from "../components/Seo";
import { Breadcrumb, CtaBand, Section, SectionHeading, Timeline } from "../components/ui";
import { capabilities, capabilitiesHeading, technicalTable } from "../content/capabilities";
import { seoPages } from "../content/seo";

export default function CapabilitiesPage() {
  return (
    <>
      <Seo
        title={seoPages.capabilities.title}
        description={seoPages.capabilities.description}
        path="/capabilities"
      />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Capabilities", href: "/capabilities" }]} />

      <section className="hero hero--page">
        <div className="container">
          <h1>{capabilitiesHeading}</h1>
          <p>
            A step-by-step production route — from drawing review to inspected, ready-to-use
            castings.
          </p>
        </div>
      </section>

      <Section labelledBy="cap-steps">
        <SectionHeading id="cap-steps" eyebrow="Our process" title="Capability Stages" />
        <Timeline items={capabilities.map((c) => ({ title: c.title, text: c.description }))} />
      </Section>

      <Section tint labelledBy="cap-table">
        <SectionHeading
          id="cap-table"
          eyebrow="At a glance"
          title="Technical Capability"
          lead="Bracketed entries are placeholders pending verification — only confirmed values are published."
        />
        <div className="table-scroll">
          <table className="data-table">
            <caption className="visually-hidden">Technical capability parameters</caption>
            <thead>
              <tr>
                <th scope="col">Parameter</th>
                <th scope="col">Shakti Udyog capability</th>
              </tr>
            </thead>
            <tbody>
              {technicalTable.map((row) => (
                <tr key={row.parameter}>
                  <th scope="row">{row.parameter}</th>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section labelledBy="cap-cta">
        <h2 id="cap-cta" className="visually-hidden">Request a quote</h2>
        <CtaBand
          heading="Not sure if your part is castable?"
          text="Send the drawing — our team reviews manufacturability before quoting."
          buttonLabel="Request a Quote"
          buttonHref="/request-a-quote"
        />
      </Section>
    </>
  );
}
