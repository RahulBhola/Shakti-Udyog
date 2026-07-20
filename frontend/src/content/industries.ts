/** Industries per requirements §8 (with §3 list for the homepage). */
export const industriesShort = [
  "Automotive & Commercial Vehicles",
  "Agricultural Equipment",
  "Pumps, Valves & Fluid Handling",
  "Machine Tools & General Engineering",
  "Construction & Earthmoving Equipment",
  "Power, Energy & Infrastructure",
  "Rail & Transport Equipment",
  "Industrial Machinery & OEM Manufacturing",
] as const;

export const industries = [
  {
    industry: "Automotive & Commercial Vehicles",
    components: "Housings, brackets, carriers, hubs, manifolds",
  },
  {
    industry: "Agriculture",
    components: "Gearbox parts, pump bodies, housings, counterweights",
  },
  {
    industry: "Pumps & Valves",
    components: "Bodies, covers, impellers, flanges, valve components",
  },
  {
    industry: "Machine Tools",
    components: "Beds, bases, tables, bearing housings, guards",
  },
  {
    industry: "Construction Equipment",
    components: "Housings, brackets, wear components, support parts",
  },
  {
    industry: "Energy & Infrastructure",
    components: "Enclosures, fittings, structural components, equipment bases",
  },
  {
    industry: "General Engineering",
    components: "Custom OEM parts based on drawings and specifications",
  },
] as const;
