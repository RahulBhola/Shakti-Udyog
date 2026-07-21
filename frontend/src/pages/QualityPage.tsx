import { Seo } from "../components/Seo";
import { Breadcrumb, CtaBand, Section } from "../components/ui";
import { certificationStatement, qualityChecks, qualityIntro } from "../content/quality";
import { seoPages } from "../content/seo";

export default function QualityPage() {
  return (
    <>
      <Seo title={seoPages.quality.title} description={seoPages.quality.description} path="/quality" />

      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Quality", href: "/quality" }]} />

      {/* Hero — asymmetric layout with image card */}
      <section className="hero hero--page">
        <div className="container">
          <div className="bento-grid bento-grid--equal" style={{ alignItems: "center", gap: "var(--sp-6)" }}>
            {/* Left: Typography */}
            <div>
              <div className="hero-badge">
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--c-ember)" }} />
                Uncompromising Standards
              </div>
              <h1>
                Quality Built <br />
                <span className="text-gradient">into the Process</span>
              </h1>
              <div
                className="bento-card"
                style={{
                  borderLeft: "3px solid var(--c-ember)",
                  borderRadius: "var(--radius)",
                  padding: "var(--sp-5)",
                  marginTop: "var(--sp-4)",
                }}
              >
                <div className="bento-card__content">
                  <p style={{ margin: 0 }}>{qualityIntro}</p>
                </div>
              </div>
            </div>

            {/* Right: Atmospheric image card */}
            <div className="image-hero-card" style={{ minHeight: "22rem" }}>
              <div
                className="image-hero-card__bg"
                style={{ backgroundImage: "url('/assets/images/quality-hero.jpg')" }}
              />
              <div className="image-hero-card__gradient" />
              <div className="image-hero-card__pill">
                <span className="image-hero-card__dot" />
                SYS.ACTIVE
              </div>
              <div className="image-hero-card__content">
                <h3>Precision Engineering</h3>
                <p>
                  Rigorous quality assurance including CMM inspection, ultrasonic testing, and
                  magnetic particle inspection.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Section labelledBy="q-checks">
        <h2
          className="section-heading"
          style={{ marginBottom: "var(--sp-6)" }}
        >
          <span className="section-heading__eyebrow">Inspection Flow</span>
          Rigorous Quality Checks
        </h2>

        {/* Bento quality grid */}
        <div className="quality-grid">
          {/* Card 1: Incoming material (hero card, spans 2x2) */}
          <div className="quality-card quality-card--hero">
            <div className="quality-card__bg">
              <img
                src="/assets/images/quality-materials.jpg"
                alt="Industrial raw materials stacked in warehouse"
                loading="lazy"
              />
            </div>
            <div className="quality-card__bg-overlay" />
            <div className="quality-card__body">
              <div className="quality-card__icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--c-ember)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
              </div>
              <h3>{qualityChecks[0].check}</h3>
              <p style={{ color: "var(--c-ink-soft)", fontSize: "var(--fs-sm)", maxWidth: "30rem" }}>
                Every batch of raw material is subjected to stringent incoming inspections. We ensure
                foundational integrity before a single process begins, eliminating defects at the source.
              </p>
            </div>
          </div>

          {/* Card 2: Chemical composition */}
          <div className="quality-card quality-card--compact">
            <div className="quality-card__icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--c-lavender)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" /><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" /><path d="M9.2 14.8c-.8-.8-.8-2 0-2.8" /><line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
              </svg>
            </div>
            <div className="quality-card__body">
              <h3>{qualityChecks[1].check}</h3>
            </div>
          </div>

          {/* Card 3: Visual & dimensional */}
          <div className="quality-card quality-card--compact">
            <div className="quality-card__icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--c-ember)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            </div>
            <div className="quality-card__body">
              <h3>{qualityChecks[2].check}</h3>
            </div>
          </div>

          {/* Card 4: Hardness testing */}
          <div className="quality-card quality-card--compact">
            <div className="quality-card__icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--c-ember)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
              </svg>
            </div>
            <div className="quality-card__body">
              <h3>{qualityChecks[3].check}</h3>
            </div>
          </div>

          {/* Card 5: Microstructure testing */}
          <div className="quality-card quality-card--compact">
            <div className="quality-card__icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--c-lavender)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" /><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" /><path d="M9.2 14.8c-.8-.8-.8-2 0-2.8" /><line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
              </svg>
            </div>
            <div className="quality-card__body">
              <h3>{qualityChecks[4].check}</h3>
            </div>
          </div>

          {/* Card 6: Traceability (wide, spans 2 cols on desktop) */}
          <div className="quality-card quality-card--wide">
            <div className="quality-card__icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--c-ember)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div className="quality-card__body">
              <h3>{qualityChecks[6].check}</h3>
              <p style={{ color: "var(--c-ink-soft)", fontSize: "var(--fs-sm)", margin: 0 }}>
                Complete, unbroken documentation mapping every component back to its raw material
                source and processing conditions.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Certification statement banner */}
      <Section tint labelledBy="q-cert">
        <div className="container">
          <div className="quote-banner">
            <div className="quote-banner__icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--c-ember)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4" /><path d="M21.5 10.5L19 8v-3h-3L12 .5 8 5H5v3l-2.5 2.5L5 13v3h3l4 4.5 4-4.5h3v-3l2.5-2.5z" />
              </svg>
            </div>
            <blockquote>{certificationStatement}</blockquote>
            <span className="quote-banner__tag">Certified Excellence</span>
            <p className="placeholder-note" style={{ marginTop: "var(--sp-4)", marginBottom: 0 }}>
              Certification status is pending verification. No certification logos are displayed
              until valid authorization is confirmed.
            </p>
          </div>
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
