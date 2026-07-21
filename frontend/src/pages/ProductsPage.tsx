import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProducts, type Product } from "../api/publicApi";
import { Seo } from "../components/Seo";
import { CtaBand, EmptyState, Loading, Section } from "../components/ui";
import { seoPages } from "../content/seo";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getProducts().then(setProducts).catch(() => setError(true));
  }, []);

  const greyIron = products?.find((p) => p.slug === "grey-iron-castings");
  const ductileIron = products?.find((p) => p.slug === "ductile-iron-castings");

  return (
    <>
      <Seo title={seoPages.products.title} description={seoPages.products.description} path="/products" />

      {/* Hero */}
      <section className="hero hero--page">
        <div className="container">
          <div className="hero-badge">
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--c-ember)" }} />
            Our Portfolio
          </div>
          <h1>
            Precision <span className="text-gradient">Engineered</span>
          </h1>
          <p>
            Delivering high-integrity Grey Iron and Ductile Iron components for demanding
            industrial applications worldwide.
          </p>
        </div>
      </section>

      <Section labelledBy="catalogue-heading">
        {error && (
          <EmptyState
            title="Product catalogue is temporarily unavailable"
            text="Please try again shortly, or contact us directly."
          />
        )}
        {!products && !error && <Loading label="Loading products" />}

        {products && (
          <>
            {/* Bento grid — Grey Iron + Ductile Iron */}
            <div className="bento-grid bento-grid--wide" style={{ marginBottom: "var(--sp-7)" }}>
              {/* Grey Iron */}
              <div className="bento-card">
                <div className="bento-card__bg">
                  <img
                    src="/assets/images/grey-iron-casting.jpg"
                    alt="Grey iron casting component after shot blasting"
                    loading="lazy"
                  />
                </div>
                <div className="bento-card__overlay" />
                <div className="bento-card__content">
                  <div className="bento-card__icon bento-card__icon--primary">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--c-ember)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                    </svg>
                  </div>
                  <h3>Grey Iron Castings</h3>
                  <p>
                    Renowned for excellent machinability, damping capacity, and thermal
                    conductivity. Our Grey Iron castings are the backbone of heavy machinery.
                  </p>
                  {greyIron && (
                    <>
                      <div className="spec-grid">
                        <div>
                          <span style={{ fontSize: "var(--fs-xs)", fontWeight: 700, letterSpacing: "0.1em", color: "var(--c-ember)", textTransform: "uppercase", display: "block", marginBottom: "var(--sp-1)" }}>
                            Grades
                          </span>
                          <span style={{ fontWeight: 600 }}>{greyIron.commonGrades || "FG 150 to FG 350"}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: "var(--fs-xs)", fontWeight: 700, letterSpacing: "0.1em", color: "var(--c-ember)", textTransform: "uppercase", display: "block", marginBottom: "var(--sp-1)" }}>
                            Weight Range
                          </span>
                          <span style={{ fontWeight: 600 }}>{greyIron.castingWeightRange || "5 kg to 500 kg"}</span>
                        </div>
                      </div>
                      <div className="chip-group">
                        {greyIron.typicalApplications.slice(0, 6).map((app) => (
                          <span key={app} className="chip">{app}</span>
                        ))}
                      </div>
                      <div style={{ marginTop: "var(--sp-4)" }}>
                        <Link className="btn btn--primary" to={`/products/${greyIron.slug}`}>
                          Learn more
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Ductile Iron */}
              <div className="bento-card">
                <div className="bento-card__bg">
                  <img
                    src="/assets/images/ductile-iron-casting.jpg"
                    alt="Ductile iron casting component"
                    loading="lazy"
                  />
                </div>
                <div className="bento-card__overlay" />
                <div className="bento-card__content">
                  <div className="bento-card__icon bento-card__icon--tertiary">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--c-lavender)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                    </svg>
                  </div>
                  <h3>Ductile (SG) Iron Castings</h3>
                  <p>
                    Exceptional tensile strength, impact resistance, and elongation. SG Iron
                    bridges the gap between conventional cast iron and steel.
                  </p>
                  {ductileIron && (
                    <>
                      <div className="spec-grid">
                        <div>
                          <span style={{ fontSize: "var(--fs-xs)", fontWeight: 700, letterSpacing: "0.1em", color: "var(--c-ember)", textTransform: "uppercase", display: "block", marginBottom: "var(--sp-1)" }}>
                            Grades
                          </span>
                          <span style={{ fontWeight: 600 }}>{ductileIron.commonGrades || "SG 400 to SG 700"}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: "var(--fs-xs)", fontWeight: 700, letterSpacing: "0.1em", color: "var(--c-ember)", textTransform: "uppercase", display: "block", marginBottom: "var(--sp-1)" }}>
                            Weight Range
                          </span>
                          <span style={{ fontWeight: 600 }}>{ductileIron.castingWeightRange || "2 kg to 300 kg"}</span>
                        </div>
                      </div>
                      <div className="chip-group">
                        {ductileIron.typicalApplications.slice(0, 6).map((app) => (
                          <span key={app} className="chip">{app}</span>
                        ))}
                      </div>
                      <div style={{ marginTop: "var(--sp-4)" }}>
                        <Link className="btn btn--primary" to={`/products/${ductileIron.slug}`}>
                          Learn more
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Remaining products as cards */}
            {products.length > 2 && (
              <div className="grid grid--2" style={{ marginBottom: "var(--sp-7)" }}>
                {products.slice(2).map((p) => (
                  <Link key={p.slug} to={`/products/${p.slug}`} className="card" style={{ display: "block" }}>
                    <h3>{p.title}</h3>
                    <p>{p.summary}</p>
                    <span className="card__link">Learn more →</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Value-added services */}
            <section style={{ marginBottom: "var(--sp-7)" }}>
              <h2 className="section-heading section-heading--center" style={{ marginBottom: "var(--sp-6)" }}>
                <span className="section-heading__eyebrow">Beyond Casting</span>
                Value-Added <span style={{ color: "var(--c-ember)" }}>Services</span>
              </h2>
              <div className="services-grid">
                <div className="service-card">
                  <div className="service-card__icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--c-ember)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <h3>Pattern Development</h3>
                  <p>
                    In-house capabilities to develop precise wooden, aluminum, and metallic
                    patterns. Ensuring dimensional accuracy from the very first mold.
                  </p>
                </div>
                <div className="service-card">
                  <div className="service-card__icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--c-lavender)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
                    </svg>
                  </div>
                  <h3>CNC Machining</h3>
                  <p>
                    Equipped machine shop offering turning, milling, and drilling. We supply
                    ready-to-assemble components, reducing your supply chain complexity.
                  </p>
                </div>
                <div className="service-card">
                  <div className="service-card__icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--c-ember)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                  </div>
                  <h3>Quality &amp; Inspection</h3>
                  <p>
                    Comprehensive testing including spectrometer analysis, microscopic structure
                    checking, and physical testing. Detailed reports accompany every batch.
                  </p>
                </div>
              </div>
            </section>

            {/* Custom OEM CTA banner */}
            <section
              className="bento-card"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--sp-5)",
                alignItems: "flex-start",
              }}
            >
              <div className="bento-card__content" style={{ width: "100%" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)", alignItems: "flex-start" }}>
                  <h2 style={{ fontSize: "var(--fs-2xl)" }}>Custom OEM Solutions</h2>
                  <p style={{ maxWidth: "36rem" }}>
                    Looking for a specific component? We specialize in reverse engineering and
                    custom casting based on your exact specifications.
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-5)", marginBottom: "var(--sp-3)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", fontSize: "var(--fs-sm)", color: "var(--c-ink-soft)" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--c-ember)" strokeWidth="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                      Upload 2D/3D Drawings
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", fontSize: "var(--fs-sm)", color: "var(--c-ink-soft)" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--c-ember)" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                      Sample Duplication
                    </span>
                  </div>
                  <Link className="btn btn--primary" to="/request-a-quote">Enquire Now</Link>
                </div>
              </div>
            </section>
          </>
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
