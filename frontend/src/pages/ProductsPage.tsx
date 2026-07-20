import { useEffect, useState } from "react";
import { getProducts, type Product } from "../api/publicApi";
import { Seo } from "../components/Seo";
import { Breadcrumb, CtaBand, EmptyState, Loading, Section, SectionHeading, ServiceCard } from "../components/ui";
import { seoPages } from "../content/seo";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getProducts().then(setProducts).catch(() => setError(true));
  }, []);

  return (
    <>
      <Seo title={seoPages.products.title} description={seoPages.products.description} path="/products" />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Products", href: "/products" }]} />

      <section className="hero hero--page">
        <div className="container">
          <h1>Products & Services</h1>
          <p>
            Grey iron, ductile iron, custom, and machined casting solutions — produced from your
            drawing and specifications.
          </p>
        </div>
      </section>

      <Section labelledBy="catalogue-heading">
        <SectionHeading id="catalogue-heading" eyebrow="Casting families" title="What We Supply" />
        {error && (
          <EmptyState
            title="Product catalogue is temporarily unavailable"
            text="Please try again shortly, or contact us directly."
          />
        )}
        {!products && !error && <Loading label="Loading products" />}
        {products && (
          <div className="grid grid--2">
            {products.map((p) => (
              <ServiceCard key={p.slug} title={p.title} description={p.summary} href={`/products/${p.slug}`} />
            ))}
          </div>
        )}
      </Section>

      <Section tint labelledBy="products-cta">
        <h2 id="products-cta" className="visually-hidden">Request a quote</h2>
        <CtaBand
          heading="Need a specific grade or geometry?"
          text="Send your drawing and specification — we'll assess the casting route and quote."
          buttonLabel="Request a Quote"
          buttonHref="/request-a-quote"
        />
      </Section>
    </>
  );
}
