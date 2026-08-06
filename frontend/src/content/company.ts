/**
 * Verified brand and contact data from docs/shakti-udyog-requirements.md §1.
 * Anything the doc marks as unverified stays a labelled placeholder.
 */
export const company = {
  name: "Shakti Udyog",
  tagline: "Strength cast into every component.",
  shortDescription:
    "Shakti Udyog manufactures dependable iron castings engineered to meet industrial requirements.",
  establishedYear: "1965",
  address: {
    line1: "St No. 5, Daba Road, near SPS Hospital",
    city: "Ludhiana",
    state: "Punjab",
    postalCode: "141013",
    country: "India",
  },
  contact: {
    phone: "+91 8043848014",
    phoneHref: "tel:+918043848014",
    whatsapp: "+91 8283041140",
    whatsappHref: "https://wa.me/918283041140",
    email: "iamrahulbhola@gmail.com",
    businessHours: "Mon–Sat, 11 AM – 9 PM",
  },
  social: {
    facebook: "[Facebook URL placeholder]",
    instagram: "[Instagram URL placeholder]",
  },
  domain: "www.shaktiudyog.com",
  siteUrl: "https://www.shaktiudyog.com",
} as const;

/** §3 trust strip — verified figures only. */
export const highlights = [
  { value: "60+", label: "Years of Foundry Experience" },
  { value: "50+", label: "Casting Grades / Specifications" },
  { value: "299", label: "Tons Monthly Capacity" },
  { value: "9000+", label: "Customers Served" },
] as const;
