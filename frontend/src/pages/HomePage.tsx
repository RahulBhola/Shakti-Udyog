import { Link } from "react-router-dom";
import { Seo, localBusinessJsonLd } from "../components/Seo";
import { ScrollytellingCanvas } from "../components/ScrollytellingCanvas";
import { ProductMarqueeGallery } from "../components/ProductMarqueeGallery";
import { AppleProductLineup } from "../components/AppleProductLineup";
import { MetallurgicalBentoGrid } from "../components/MetallurgicalBentoGrid";
import {
  CtaBand,
  FaqAccordion,
  FeatureCard,
  ImagePlaceholder,
  IndustryCard,
  Section,
  SectionHeading,
  StatStrip,
  Timeline,
} from "../components/ui";
import { company, highlights } from "../content/company";
import { faqs } from "../content/faqs";
import { advantages, finalCta, introduction, processSteps } from "../content/home";
import { industriesShort } from "../content/industries";
import { seoPages } from "../content/seo";

export default function HomePage() {
  return (
    <>
      <Seo
        title={seoPages.home.title}
        description={seoPages.home.description}
        path="/"
        jsonLd={[localBusinessJsonLd()]}
      />

      {/* 300-Frame Interactive 3D Molten-to-Casting Scrollytelling Showcase */}
      <ScrollytellingCanvas />

      {/* Trust Highlights Strip */}
      <Section labelledBy="trust-heading">
        <h2 id="trust-heading" className="visually-hidden">
          Company highlights
        </h2>
        <StatStrip stats={highlights} />
      </Section>

      {/* Apple-Style Product Lineup Showcase */}
      <AppleProductLineup />

      {/* Infinite Dual-Row Scrolling Marquee Gallery */}
      <ProductMarqueeGallery />

      {/* High-Fidelity Detail Control Bento Grid */}
      <MetallurgicalBentoGrid />

      {/* Who We Are Introduction */}
      <Section tint labelledBy="intro-heading">
        <SectionHeading id="intro-heading" eyebrow="Who we are" title={introduction.heading} />
        <div className="prose">
          {introduction.paragraphs.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
      </Section>

      {/* Why Shakti Udyog Features */}
      <Section dark labelledBy="why-heading">
        <SectionHeading id="why-heading" eyebrow="Why Shakti Udyog" title="Built on Reliability" />
        <div className="grid grid--2">
          {advantages.map((a) => (
            <FeatureCard key={a.title} {...a} />
          ))}
        </div>
      </Section>

      {/* Step-by-Step Production Process */}
      <Section labelledBy="process-heading">
        <SectionHeading
          id="process-heading"
          eyebrow="How we work"
          title="From Enquiry to Delivery"
        />
        <Timeline items={processSteps.map((step) => ({ title: step }))} />
        <div className="mt-8 text-center sm:text-left">
          <Link className="btn btn--primary" to="/request-a-quote">
            Discuss Your Casting Requirement
          </Link>
        </div>
      </Section>

      {/* Industries We Serve */}
      <Section tint labelledBy="industries-heading">
        <SectionHeading
          id="industries-heading"
          eyebrow="Where our castings work"
          title="Industries We Serve"
        />
        <div className="grid grid--4">
          {industriesShort.map((name) => (
            <IndustryCard key={name} industry={name} />
          ))}
        </div>
      </Section>

      {/* Frequently Asked Questions */}
      <Section labelledBy="faq-heading">
        <SectionHeading id="faq-heading" eyebrow="Common questions" title="FAQs" />
        <FaqAccordion items={faqs.slice(0, 3)} />
        <p style={{ marginTop: "var(--sp-4)" }}>
          <Link to="/resources">More questions? See our resources →</Link>
        </p>
      </Section>

      {/* Contact Preview */}
      <Section tint labelledBy="contact-preview-heading">
        <SectionHeading
          id="contact-preview-heading"
          eyebrow="Get in touch"
          title="Talk to Our Team"
          lead={`${company.contact.businessHours} · ${company.address.city}, ${company.address.state}`}
        />
        <div className="grid grid--2">
          <div>
            <p>
              Phone: <a href={company.contact.phoneHref}>{company.contact.phone}</a>
              <br />
              WhatsApp: <a href={company.contact.whatsappHref}>{company.contact.whatsapp}</a>
              <br />
              Email: <a href={`mailto:${company.contact.email}`}>{company.contact.email}</a>
            </p>
            <div className="mt-4">
              <Link className="btn btn--ghost" to="/contact">
                Contact page
              </Link>
            </div>
          </div>
          <ImagePlaceholder label={`Map of ${company.address.line1}, ${company.address.city} (map embed to be added)`} />
        </div>
      </Section>

      {/* Final RFQ CTA Band */}
      <Section labelledBy="final-cta-heading">
        <h2 id="final-cta-heading" className="visually-hidden">
          Request a quote
        </h2>
        <CtaBand
          heading={finalCta.heading}
          text={finalCta.text}
          buttonLabel={finalCta.button.label}
          buttonHref={finalCta.button.href}
        />
      </Section>
    </>
  );
}
