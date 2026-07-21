import { Seo } from "../components/Seo";
import { Breadcrumb, Section } from "../components/ui";
import { capabilities, technicalTable } from "../content/capabilities";
import { seoPages } from "../content/seo";

const phaseIcons = [
  // Enquiry & Drawing Review
  <svg key="0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--c-ember)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
  </svg>,
  // Pattern Development
  <svg key="1" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--c-ember)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>,
  // Moulding & Core Making
  <svg key="2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--c-ember)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
  </svg>,
  // Melting & Pouring
  <svg key="3" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--c-ember)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>,
  // Fettling & Surface Preparation
  <svg key="4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--c-ember)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>,
  // Machining & Finishing
  <svg key="5" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--c-ember)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
  </svg>,
  // Inspection & Documentation
  <svg key="6" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--c-ember)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>,
];

export default function CapabilitiesPage() {
  return (
    <>
      <Seo
        title={seoPages.capabilities.title}
        description={seoPages.capabilities.description}
        path="/capabilities"
      />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Capabilities", href: "/capabilities" }]} />

      {/* Hero */}
      <section className="hero hero--page">
        <div className="container">
          <div className="hero-badge">
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--c-ember)" }} />
            Manufacturing Excellence
          </div>
          <h1>
            From Requirement to <br />
            <span className="text-gradient">Ready-to-Use Casting</span>
          </h1>
          <p>
            Precision engineering driven by decades of metallurgical expertise. Our end-to-end
            capabilities ensure absolute control over quality, dimensional accuracy, and material
            integrity at every stage.
          </p>
        </div>
      </section>

      <Section labelledBy="cap-intro">
        {/* Bento: Technical Specs Table + Featured Image */}
        <div className="bento-grid bento-grid--wide" style={{ marginBottom: "var(--sp-7)" }}>
          {/* Technical specs table */}
          <div className="bento-card">
            <div className="bento-card__content">
              <div className="bento-card__icon bento-card__icon--primary" style={{ marginBottom: "var(--sp-5)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--c-ember)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
                </svg>
              </div>
              <h3>Technical Parameters</h3>
              <div className="table-scroll">
                <table className="specs-table">
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
            </div>
          </div>

          {/* Featured capability image */}
          <div className="image-hero-card">
            <div
              className="image-hero-card__bg"
              style={{ backgroundImage: "url('/assets/images/capabilities-hero.jpg')" }}
            />
            <div className="image-hero-card__gradient" />
            <div className="image-hero-card__pill">
              <span className="image-hero-card__dot" />
              Precision Controlled
            </div>
            <div className="image-hero-card__content">
              <h3>Metallurgical Precision</h3>
              <p>
                Advanced spectrometry and thermal analysis ensure absolute chemical composition
                control before pouring, guaranteeing mechanical integrity.
              </p>
            </div>
          </div>
        </div>

        {/* Process timeline */}
        <section>
          <h2
            className="section-heading"
            style={{ marginBottom: "var(--sp-6)" }}
          >
            <span className="section-heading__eyebrow">The Process</span>
            Manufacturing Capability
          </h2>

          <ol className="process-timeline">
            <div className="process-timeline__rail" />
            {capabilities.map((cap, i) => (
              <li key={cap.title}>
                <div className="process-step__icon">
                  {phaseIcons[i]}
                </div>
                <div className="process-step__body">
                  <span className="process-step__phase">Phase {String(i + 1).padStart(2, "0")}</span>
                  <h3>{cap.title}</h3>
                  <p style={{ color: "var(--c-ink-soft)", fontSize: "var(--fs-sm)", margin: 0 }}>{cap.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </Section>

      <Section tint labelledBy="cap-cta">
        <h2 id="cap-cta" className="visually-hidden">Request a quote</h2>
        <div className="container">
          <div className="quote-banner">
            <div className="quote-banner__icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--c-ember)" strokeWidth="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            </div>
            <blockquote>
              Not sure if your part is castable? Send the drawing — our team reviews manufacturability before quoting.
            </blockquote>
            <span className="quote-banner__tag">Get Started Today</span>
            <div style={{ marginTop: "var(--sp-4)" }}>
              <a className="btn btn--primary" href="/request-a-quote">Request a Quote</a>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
