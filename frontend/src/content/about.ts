/** About page copy per requirements §4. */
export const about = {
  heading: "About Shakti Udyog",
  paragraphs: [
    "Shakti Udyog is focused on supplying iron castings that perform reliably in real-world industrial conditions. We combine foundry know-how, disciplined process control, and a customer-first approach to support OEMs, engineering companies, and industrial buyers.",
    "From initial enquiry through final dispatch, we aim to make casting procurement straightforward: understand the application, agree the specification, manufacture responsibly, inspect thoroughly, and communicate clearly.",
  ],
  mission:
    "To supply dependable iron castings that help our customers build durable, high-performing equipment.",
  vision:
    "To be a trusted casting partner known for consistent quality, technical accountability, and long-term customer relationships.",
  values: [
    "Quality with accountability",
    "Safety and responsible operations",
    "Customer responsiveness",
    "Continuous improvement",
    "Respect for people and commitments",
  ],
  /** §4 facility details are unverified — placeholders only. */
  facility: [
    { parameter: "Foundry process", value: "[To be confirmed — green sand / shell moulding / no-bake / other]" },
    { parameter: "Melting equipment", value: "[Equipment and capacity to be confirmed]" },
    { parameter: "Casting weight range", value: "[Minimum to maximum kg to be confirmed]" },
    { parameter: "Machining", value: "[Available machining equipment to be confirmed]" },
    { parameter: "Inspection", value: "[Inspection equipment to be confirmed]" },
  ],
  /**
   * Timeline uses only the verified founding year (1965); other entries are
   * generic capability statements with no invented dates or claims.
   */
  timeline: [
    { period: "1965", title: "Founded in Ludhiana", text: "Shakti Udyog is established as an iron casting business in Ludhiana, Punjab." },
    { period: "Growth years", title: "Broadening the casting range", text: "[Placeholder — verified company history to be added.]" },
    { period: "Today", title: "A quality-led casting partner", text: "Serving OEMs and industrial buyers with grey iron, ductile iron, custom, and machined castings." },
  ],
} as const;
