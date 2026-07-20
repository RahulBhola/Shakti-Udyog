/** Capabilities page copy per requirements §6. */
export const capabilitiesHeading = "From Requirement to Ready-to-Use Casting";

export const capabilities = [
  {
    title: "Enquiry & Drawing Review",
    description:
      "We examine application needs, material grade, geometry, tolerances, and volume before proposing a production route.",
  },
  {
    title: "Pattern Development",
    description:
      "Patterns and core boxes are developed or managed to support repeatable production and agreed dimensional requirements.",
  },
  {
    title: "Moulding & Core Making",
    description:
      "The moulding method is selected around part geometry, material, quantity, and surface-finish expectations.",
  },
  {
    title: "Melting & Pouring",
    description:
      "Metal chemistry and pouring practice are controlled according to the applicable production plan and material specification.",
  },
  {
    title: "Fettling & Surface Preparation",
    description:
      "Castings are cleaned, gates and risers are removed, and surfaces are prepared for inspection or the next operation.",
  },
  {
    title: "Machining & Finishing",
    description:
      "Where agreed, castings are machined and finished to supply components ready for assembly.",
  },
  {
    title: "Inspection & Documentation",
    description:
      "Visual, dimensional, and material-related checks are performed as specified for the order.",
  },
] as const;

/** §6 technical table — actual values unverified; placeholders only. */
export const technicalTable = [
  { parameter: "Casting process", value: "[Process to be confirmed]" },
  { parameter: "Materials", value: "[Grey iron / ductile iron grades to be confirmed]" },
  { parameter: "Part weight", value: "[Minimum–maximum kg to be confirmed]" },
  { parameter: "Maximum dimensions", value: "[L × W × H mm to be confirmed]" },
  { parameter: "Monthly capacity", value: "299 tonnes" },
  { parameter: "Machining", value: "[Availability and details to be confirmed]" },
  { parameter: "Finish", value: "[Shot blast / paint / other — to be confirmed]" },
  { parameter: "Typical lot size", value: "[Range to be confirmed]" },
  { parameter: "Inspection equipment", value: "[List to be confirmed]" },
] as const;
