export interface StoryMilestone {
  id: string;
  startProgress: number; // 0.00 to 1.00
  endProgress: number;
  phaseNumber: string;
  phaseTitle: string;
  headline: string;
  supportingText: string;
  badge: string;
}

export const TOTAL_FRAMES = 300;

export const STORY_MILESTONES: StoryMilestone[] = [
  {
    id: 'foundry',
    startProgress: 0.00,
    endProgress: 0.16,
    phaseNumber: 'PHASE 01',
    phaseTitle: 'THE FOUNDRY MELT',
    headline: 'Where Metal Becomes Engineering',
    supportingText: 'Precision castings engineered for demanding industrial applications, beginning with induction-melted metallurgical control.',
    badge: 'INDUCTION CRUCIBLE · 1460°C'
  },
  {
    id: 'molten-iron',
    startProgress: 0.16,
    endProgress: 0.36,
    phaseNumber: 'PHASE 02',
    phaseTitle: 'CONTROLLED POURING',
    headline: 'From Molten Iron',
    supportingText: 'Every casting begins with carefully controlled molten metal stream velocity, FeSi stream inoculation, and thermal discipline.',
    badge: 'LADLE DISCHARGE · 4.8 KG/S'
  },
  {
    id: 'molding',
    startProgress: 0.36,
    endProgress: 0.54,
    phaseNumber: 'PHASE 03',
    phaseTitle: 'SAND MOULDING & MATRIX',
    headline: 'To High-Pressure Integrity',
    supportingText: 'High-pressure green sand compaction creates precise cavity geometry capable of handling 350+ bar working pressures.',
    badge: 'MAGMASOFT SAND MOLD · 90 N/CM²'
  },
  {
    id: 'cooling',
    startProgress: 0.54,
    endProgress: 0.72,
    phaseNumber: 'PHASE 04',
    phaseTitle: 'COOLING SOLIDIFICATION',
    headline: 'Thermal Discipline & Graphitization',
    supportingText: 'Controlled in-mold cooling rate governs graphite nodule spherical distribution and pearlite/ferrite matrix formation.',
    badge: 'ISOTHERMAL COOLING · 8.5°C/MIN'
  },
  {
    id: 'fettling',
    startProgress: 0.72,
    endProgress: 0.88,
    phaseNumber: 'PHASE 05',
    phaseTitle: 'SHOT BLASTING & FETTLING',
    headline: 'Rough Castings to Clean Shells',
    supportingText: 'High-velocity steel shot blasting strips refractory residue, revealing a pristine casting envelope ready for CNC machining.',
    badge: 'STEEL SHOT BLAST · SA 2.5'
  },
  {
    id: 'machined',
    startProgress: 0.88,
    endProgress: 1.00,
    phaseNumber: 'PHASE 06',
    phaseTitle: 'FINAL COMPONENT PERFECTION',
    headline: 'Micron-Tolerance Heavy Castings',
    supportingText: 'CNC multi-axis precision machining and 100% CMM coordinate inspection ensure leak-proof performance under extreme field loads.',
    badge: 'ZEISS CMM VERIFIED · ±0.015 MM'
  }
];
