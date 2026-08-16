import { Seo, localBusinessJsonLd } from "../components/Seo";
import { ScrollytellingCanvas } from "../components/ScrollytellingCanvas";
import { TrustMetricStrip } from "../components/TrustMetricStrip";
import { ProductMarqueeGallery } from "../components/ProductMarqueeGallery";
import { AppleProductLineup } from "../components/AppleProductLineup";
import { EnquiryToDeliverySection } from "../components/EnquiryToDeliverySection";
import { IndustriesWeServeSection } from "../components/IndustriesWeServeSection";
import { FaqSection } from "../components/FaqSection";
import { ContactPreviewAndCtaSection } from "../components/ContactPreviewAndCtaSection";
import {
  FeatureCard,
  Section,
  SectionHeading,
} from "../components/ui";
import { advantages, introduction } from "../content/home";
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

      {/* Modern Glassmorphic Trust & Authority Metric Strip */}
      <TrustMetricStrip />

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

      {/* Modern Industries We Serve Showcase */}
      <IndustriesWeServeSection />

      {/* Frequently Asked Questions with Molten Pouring Ladle */}
      <FaqSection />

      {/* Talk to Our Team & Casting Requirement CTA Sections */}
      <ContactPreviewAndCtaSection />
    </>
  );
}
