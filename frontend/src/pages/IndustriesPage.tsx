import { Seo } from "../components/Seo";
import { Breadcrumb, CtaBand, IndustryCard, Section, SectionHeading } from "../components/ui";
import { industries } from "../content/industries";
import { seoPages } from "../content/seo";

export default function IndustriesPage() {
  return (
    <>
      <Seo
        title={seoPages.industries.title}
        description={seoPages.industries.description}
        path="/industries"
      />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Industries", href: "/industries" }]} />

      <section className="hero hero--page">
        <div className="container">
          <h1>Industries We Serve</h1>
          <p>
            Cast components for OEMs, engineering companies, and industrial buyers across sectors.
          </p>
        </div>
      </section>

      <Section labelledBy="ind-grid">
        <SectionHeading id="ind-grid" eyebrow="Sectors" title="Applications by Industry" />
        <div className="grid grid--3">
          {industries.map((i) => (
            <IndustryCard key={i.industry} industry={i.industry} components={i.components} />
          ))}
        </div>
      </Section>

      <Section tint labelledBy="ind-cta">
        <h2 id="ind-cta" className="visually-hidden">Request a quote</h2>
        <CtaBand
          heading="Don't see your industry?"
          text="If it's an iron casting, we can review it. Send your requirement."
          buttonLabel="Request a Quote"
          buttonHref="/request-a-quote"
        />
      </Section>
    </>
  );
}
