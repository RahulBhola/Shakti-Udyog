import { Seo, localBusinessJsonLd } from "../components/Seo";
import { ScrollytellingCanvas } from "../components/ScrollytellingCanvas";
import { TrustMetricStrip } from "../components/TrustMetricStrip";
import { ProductMarqueeGallery } from "../components/ProductMarqueeGallery";
import { AppleProductLineup } from "../components/AppleProductLineup";
import { EnquiryToDeliverySection } from "../components/EnquiryToDeliverySection";
import { IndustriesWeServeSection } from "../components/IndustriesWeServeSection";
import { FaqSection } from "../components/FaqSection";
import { ContactPreviewAndCtaSection } from "../components/ContactPreviewAndCtaSection";
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

      {/* Modern Industries We Serve Showcase */}
      <IndustriesWeServeSection />

      {/* Frequently Asked Questions with Molten Pouring Ladle */}
      <FaqSection />

      {/* Talk to Our Team & Casting Requirement CTA Sections */}
      <ContactPreviewAndCtaSection />
    </>
  );
}
