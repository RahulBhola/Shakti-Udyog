import { useEffect, useState } from "react";
import { getResources, type Resource } from "../api/publicApi";
import { Seo } from "../components/Seo";
import { Breadcrumb, EmptyState, FaqAccordion, Loading, Section, SectionHeading, ServiceCard } from "../components/ui";
import { faqs } from "../content/faqs";
import { seoPages } from "../content/seo";

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getResources().then(setResources).catch(() => setError(true));
  }, []);

  return (
    <>
      <Seo
        title={seoPages.resources.title}
        description={seoPages.resources.description}
        path="/resources"
      />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Resources", href: "/resources" }]} />

      <section className="hero hero--page">
        <div className="container">
          <h1>Resources</h1>
          <p>Practical guides to help you specify, drawing-check, and buy castings with confidence.</p>
        </div>
      </section>

      <Section labelledBy="res-list">
        <SectionHeading id="res-list" eyebrow="Guides" title="Recommended Reading" />
        {error && (
          <EmptyState title="Resources are temporarily unavailable" text="Please try again shortly." />
        )}
        {!resources && !error && <Loading label="Loading resources" />}
        {resources && (
          <div className="grid grid--3">
            {resources.map((r) => (
              <ServiceCard key={r.slug} title={r.title} description={r.summary} href={`/resources/${r.slug}`} />
            ))}
          </div>
        )}
      </Section>

      <Section tint labelledBy="res-faq">
        <SectionHeading id="res-faq" eyebrow="Answers" title="Frequently Asked Questions" />
        <FaqAccordion items={faqs} />
      </Section>
    </>
  );
}
