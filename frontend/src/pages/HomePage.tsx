import { Link } from "react-router-dom";
import { Seo, localBusinessJsonLd } from "../components/Seo";
import { ScrollytellingCanvas } from "../components/ScrollytellingCanvas";
import { ProductMarqueeGallery } from "../components/ProductMarqueeGallery";
import { AppleProductLineup } from "../components/AppleProductLineup";
import { EnquiryToDeliverySection } from "../components/EnquiryToDeliverySection";
import { ContactPreviewAndCtaSection } from "../components/ContactPreviewAndCtaSection";
import {
  FaqAccordion,
  FeatureCard,
  IndustryCard,
  Section,
  SectionHeading,
  StatStrip,
} from "../components/ui";
import { highlights } from "../content/company";
import { faqs } from "../content/faqs";
import { advantages, introduction } from "../content/home";
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

      {/* Step-by-Step Production Process: From Enquiry to Delivery */}
      <EnquiryToDeliverySection />

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

      {/* Talk to Our Team & Casting Requirement CTA Sections */}
      <ContactPreviewAndCtaSection />
    </>
  );
}
