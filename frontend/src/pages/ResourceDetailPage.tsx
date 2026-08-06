import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getResource, type Resource } from "../api/publicApi";
import { Seo } from "../components/Seo";
import { Breadcrumb, CtaBand, EmptyState, Loading, Section } from "../components/ui";

export default function ResourceDetailPage() {
  const { slug = "" } = useParams();
  const [resource, setResource] = useState<Resource | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    setStatus("loading");
    getResource(slug)
      .then((r) => {
        setResource(r);
        setStatus("ready");
      })
      .catch(() => setStatus("missing"));
  }, [slug]);

  if (status === "loading") return <Loading label="Loading resource" />;

  if (status === "missing" || !resource) {
    return (
      <Section>
        <EmptyState title="Resource not found" text="The guide you requested does not exist." />
        <p style={{ textAlign: "center" }}>
          <Link className="btn btn--primary" to="/resources">Browse all resources</Link>
        </p>
      </Section>
    );
  }

  return (
    <>
      <Seo
        title={`${resource.title} | Shakti Udyog`}
        description={resource.summary}
        path={`/resources/${resource.slug}`}
      />
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Resources", href: "/resources" },
          { label: resource.title, href: `/resources/${resource.slug}` },
        ]}
      />

      <section className="hero hero--page">
        <div className="container">
          <h1>{resource.title}</h1>
          <p>{resource.summary}</p>
        </div>
      </section>

      <Section labelledBy="res-body">
        <h2 id="res-body" className="visually-hidden">Article content</h2>
        <article className="prose">
          {resource.body.map((paragraph) => (
            <p key={paragraph.slice(0, 32)}>{paragraph}</p>
          ))}
        </article>
      </Section>

      <Section tint labelledBy="res-cta">
        <h2 id="res-cta" className="visually-hidden">Request a quote</h2>
        <CtaBand
          heading="Ready to request a quotation?"
          text="Use our RFQ form to share your drawing and requirement."
          buttonLabel="Request a Quote"
          buttonHref="/request-a-quote"
        />
      </Section>
    </>
  );
}
