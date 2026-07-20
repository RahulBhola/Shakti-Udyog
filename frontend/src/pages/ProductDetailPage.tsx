import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProduct, type Product } from "../api/publicApi";
import { Seo } from "../components/Seo";
import { Breadcrumb, CtaBand, EmptyState, ImagePlaceholder, Loading, Section, SectionHeading } from "../components/ui";

export default function ProductDetailPage() {
  const { slug = "" } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    setStatus("loading");
    getProduct(slug)
      .then((p) => {
        setProduct(p);
        setStatus("ready");
      })
      .catch(() => setStatus("missing"));
  }, [slug]);

  if (status === "loading") return <Loading label="Loading product" />;

  if (status === "missing" || !product) {
    return (
      <Section>
        <EmptyState title="Product not found" text="The casting family you requested does not exist." />
        <p style={{ textAlign: "center" }}>
          <Link className="btn btn--primary" to="/products">Browse all products</Link>
        </p>
      </Section>
    );
  }

  return (
    <>
      <Seo
        title={`${product.title} | Shakti Udyog`}
        description={product.summary}
        path={`/products/${product.slug}`}
      />
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Products", href: "/products" },
          { label: product.title, href: `/products/${product.slug}` },
        ]}
      />

      <section className="hero hero--page">
        <div className="container">
          <h1>{product.title}</h1>
          <p>{product.summary}</p>
        </div>
      </section>

      <Section labelledBy="pd-overview">
        <div className="grid grid--2">
          <div>
            <SectionHeading id="pd-overview" eyebrow="Overview" title="About this casting family" />
            <div className="prose">
              {product.description.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
          </div>
          <ImagePlaceholder tall label={`${product.title} product photograph (to be added)`} />
        </div>
      </Section>

      <Section tint labelledBy="pd-apps">
        <SectionHeading id="pd-apps" eyebrow="Where it's used" title="Typical Applications" />
        <ul className="prose">
          {product.typicalApplications.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </Section>

      <Section labelledBy="pd-specs">
        <SectionHeading
          id="pd-specs"
          eyebrow="Specifications"
          title="Technical Summary"
          lead="Bracketed values are placeholders pending verification — confirmed details are agreed at quotation."
        />
        <div className="table-scroll">
          <table className="data-table">
            <caption className="visually-hidden">Technical summary for {product.title}</caption>
            <tbody>
              <tr><th scope="row">Common grades</th><td>{product.commonGrades}</td></tr>
              <tr><th scope="row">Casting weight range</th><td>{product.castingWeightRange}</td></tr>
              <tr><th scope="row">Available finish</th><td>{product.availableFinish}</td></tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section tint labelledBy="pd-cta">
        <h2 id="pd-cta" className="visually-hidden">Request a quote</h2>
        <CtaBand
          heading={`Get a quote for ${product.title.toLowerCase()}`}
          text="Share your drawing, grade, quantity, and delivery requirement."
          buttonLabel="Request a Quote"
          buttonHref="/request-a-quote"
        />
      </Section>
    </>
  );
}
