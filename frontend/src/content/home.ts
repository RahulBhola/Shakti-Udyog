/** Homepage copy per requirements §3. */
export const hero = {
  heading: "Precision Iron Castings for Demanding Industries",
  subheading:
    "Shakti Udyog delivers robust, quality-focused iron casting solutions—from drawing review and pattern development to machining and dependable dispatch.",
  primary: { label: "Request a Quote", href: "/request-a-quote" },
  secondary: { label: "Explore Our Capabilities", href: "/capabilities" },
} as const;

export const introduction = {
  heading: "Engineered for Strength. Made for Service.",
  paragraphs: [
    "Shakti Udyog is an iron casting partner for manufacturers who need consistency, sound engineering, and responsive support. We produce cast components for a wide range of industrial applications, with attention to material integrity, dimensional accuracy, and repeatable quality.",
    "Whether you require a development batch, regular production supply, or a machined ready-to-assemble component, our team works from your drawing and specifications to deliver a practical casting solution.",
  ],
} as const;

export const services = [
  {
    title: "Grey Iron Castings",
    description:
      "Reliable, vibration-damping castings for machine bases, housings, pumps, valves, and general engineering applications.",
    href: "/products/grey-iron-castings",
  },
  {
    title: "Ductile Iron Castings",
    description:
      "High-strength, tough, and durable castings for automotive, agricultural, infrastructure, and heavy-duty equipment.",
    href: "/products/ductile-iron-castings",
  },
  {
    title: "Custom Castings",
    description:
      "Drawings-to-castings support for customer-specific geometries, grades, and production requirements.",
    href: "/products/custom-castings",
  },
  {
    title: "Machining & Finishing",
    description:
      "Optional machining, drilling, tapping, surface preparation, painting, and packing for production-ready parts.",
    href: "/products/machining-finishing",
  },
] as const;

export const advantages = [
  {
    title: "Engineering Support",
    description: "Early review of drawings, material requirements, tolerances, and manufacturability.",
  },
  {
    title: "Controlled Production",
    description: "Process checks at key stages help maintain consistency across lots.",
  },
  {
    title: "Flexible Supply",
    description:
      "Support for development samples, small batches, and repeat production, subject to agreed capacity.",
  },
  {
    title: "Clear Communication",
    description:
      "Responsive quotation, order updates, inspection documentation, and dispatch coordination.",
  },
] as const;

export const processSteps = [
  "Share your drawing, sample, or requirement.",
  "We review manufacturability and prepare a quotation.",
  "Pattern and process planning are finalized after approval.",
  "Castings are produced and inspected as per the agreed specification.",
  "Machining, finishing, packing, and delivery are completed as required.",
] as const;

export const finalCta = {
  heading: "Have a Casting Requirement?",
  text: "Send us your drawing, material grade, quantity, and delivery requirement. Our team will review it and respond with the next steps.",
  button: { label: "Get a Custom Quote", href: "/request-a-quote" },
} as const;
