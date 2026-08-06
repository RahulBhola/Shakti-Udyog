import { company } from "../content/company";

interface SeoProps {
  title: string;
  description: string;
  /** Path beginning with "/" used for the canonical URL. */
  path: string;
  /** Optional JSON-LD structured data objects. */
  jsonLd?: object[];
}

/**
 * Per-page SEO head tags. React 19 hoists <title>/<meta>/<link> rendered in
 * components into <head> natively — no helmet dependency required.
 */
export function Seo({ title, description, path, jsonLd }: SeoProps) {
  const canonical = `${company.siteUrl}${path === "/" ? "" : path}`;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={company.name} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {jsonLd?.map((data, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </>
  );
}

/** LocalBusiness structured data built only from verified §1 company data. */
export function localBusinessJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: company.name,
    description: company.shortDescription,
    slogan: company.tagline,
    foundingDate: company.establishedYear,
    url: company.siteUrl,
    telephone: company.contact.phone,
    email: company.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: company.address.line1,
      addressLocality: company.address.city,
      addressRegion: company.address.state,
      postalCode: company.address.postalCode,
      addressCountry: "IN",
    },
  };
}

export function breadcrumbJsonLd(items: { label: string; href: string }[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      item: `${company.siteUrl}${item.href}`,
    })),
  };
}
