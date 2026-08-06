import { Breadcrumb, CtaBand, FeatureCard, Gallery, Section, SectionHeading, Timeline } from "../components/ui";
import { Seo } from "../components/Seo";
import { about } from "../content/about";
import { seoPages } from "../content/seo";

export default function AboutPage() {
  return (
    <>
      <Seo title={seoPages.about.title} description={seoPages.about.description} path="/about" />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "About Us", href: "/about" }]} />

      <section className="hero hero--page">
        <div className="container">
          <h1>{about.heading}</h1>
          <p>{about.paragraphs[0]}</p>
        </div>
      </section>

      <Section labelledBy="overview-heading">
        <SectionHeading id="overview-heading" eyebrow="Our approach" title="Company Overview" />
        <div className="prose">
          {about.paragraphs.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
      </Section>

      <Section tint labelledBy="mvv-heading">
        <SectionHeading id="mvv-heading" eyebrow="What guides us" title="Mission, Vision & Values" />
        <div className="grid grid--3">
          <FeatureCard title="Mission" description={about.mission} />
          <FeatureCard title="Vision" description={about.vision} />
          <FeatureCard title="Values" description={about.values.join(" · ")} />
        </div>
      </Section>

      <Section labelledBy="facility-heading">
        <SectionHeading
          id="facility-heading"
          eyebrow="Where we work"
          title="Our Facility"
          lead="Facility details below are placeholders pending verification; real factory photographs will replace these placeholders."
        />
        <div className="table-scroll">
          <table className="data-table">
            <caption className="visually-hidden">Facility details (placeholders)</caption>
            <tbody>
              {about.facility.map((row) => (
                <tr key={row.parameter}>
                  <th scope="row">{row.parameter}</th>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: "var(--sp-5)" }}>
          <Gallery
            items={[
              "Foundry floor photograph (to be added)",
              "Moulding line photograph (to be added)",
              "Finished castings photograph (to be added)",
            ]}
          />
        </div>
      </Section>

      <Section tint labelledBy="timeline-heading">
        <SectionHeading id="timeline-heading" eyebrow="Our journey" title="Since 1965" />
        <Timeline items={about.timeline} />
      </Section>

      <Section labelledBy="about-cta">
        <h2 id="about-cta" className="visually-hidden">Request a quote</h2>
        <CtaBand
          heading="Work with a casting partner that communicates."
          text="Share your requirement and our team will respond with practical next steps."
          buttonLabel="Request a Quote"
          buttonHref="/request-a-quote"
        />
      </Section>
    </>
  );
}
