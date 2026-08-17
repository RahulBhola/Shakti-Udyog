export interface DeliveryMilestone {
  id: string;
  startProgress: number;
  endProgress: number;
  startFrame: number;
  endFrame: number;
  phaseNumber: string;
  phaseTitle: string;
  headline: string;
  supportingText: string;
  badge: string;
  tags: string[];
}

export const TOTAL_DELIVERY_FRAMES = 300;

export const DELIVERY_MILESTONES: DeliveryMilestone[] = [
  {
    id: 'stage-1-packed',
    startProgress: 0.0,
    endProgress: 0.12,
    startFrame: 1,
    endFrame: 35,
    phaseNumber: 'STAGE 01',
    phaseTitle: 'FINAL PACKAGING',
    headline: 'Precision-Packed Castings',
    supportingText:
      'Finished cast-iron components are securely strapped and cushioned on heavy-duty industrial wooden pallets with multi-layer VCI anti-corrosion barrier protection inside the Shakti Udyog facility.',
    badge: 'PACKED PRODUCT · VCI PROTECTION',
    tags: ['VCI Rust Barrier', 'Heavy-Duty Palletizing', 'EN 10204 3.1 Certified'],
  },
  {
    id: 'stage-2-loaded',
    startProgress: 0.12,
    endProgress: 0.25,
    startFrame: 36,
    endFrame: 75,
    phaseNumber: 'STAGE 02',
    phaseTitle: 'SECURED LOADING',
    headline: 'Secured Fleet Ingestion',
    supportingText:
      'Palletized castings are loaded directly into Shakti Udyog\'s signature black heavy-duty transport trailer with shock-damped tie-downs for vibration-free transit.',
    badge: 'TRUCK LOADED · SHOCK DAMPED',
    tags: ['Shock-Damped Lashing', 'Tare Weight Verified', 'GPS Fleet Lock'],
  },
  {
    id: 'stage-3-departs',
    startProgress: 0.25,
    endProgress: 0.38,
    startFrame: 76,
    endFrame: 112,
    phaseNumber: 'STAGE 03',
    phaseTitle: 'FOUNDRY DISPATCH',
    headline: 'Factory Departure',
    supportingText:
      'The premium Shakti Udyog prime-mover clears our Ludhiana foundry complex gates, commencing scheduled route delivery with live IoT telematics tracking.',
    badge: 'TRUCK DEPARTS · 99.4% ON-TIME',
    tags: ['Geofenced Clearance', 'On-Time Dispatch', 'Digital E-Way Bill'],
  },
  {
    id: 'stage-4-road',
    startProgress: 0.38,
    endProgress: 0.52,
    startFrame: 113,
    endFrame: 155,
    phaseNumber: 'STAGE 04',
    phaseTitle: 'ARTERIAL TRANSIT',
    headline: 'Industrial Corridor Transit',
    supportingText:
      'Navigating dedicated industrial arterial highways with pneumatic air-ride suspension, isolating precision-machined bores and tight tolerances from road vibration.',
    badge: 'ROAD JOURNEY · AIR-RIDE SUSPENSION',
    tags: ['Air-Ride Suspension', 'Telemetry Monitored', 'Smooth Heavy Haul'],
  },
  {
    id: 'stage-5-highway',
    startProgress: 0.52,
    endProgress: 0.65,
    startFrame: 156,
    endFrame: 195,
    phaseNumber: 'STAGE 05',
    phaseTitle: 'EXPRESS CORRIDOR',
    headline: 'Interstate Freight Corridor',
    supportingText:
      'High-speed interstate transit connecting Punjab’s casting manufacturing hub directly to tier-1 automotive, agricultural machinery, and industrial pump OEM assembly plants.',
    badge: 'HIGHWAY EXPRESS · MULTILANE CRUISE',
    tags: ['Express Corridor', 'Continuous Tilt Log', 'Fast-Track Freight'],
  },
  {
    id: 'stage-6-facility',
    startProgress: 0.65,
    endProgress: 0.78,
    startFrame: 196,
    endFrame: 230,
    phaseNumber: 'STAGE 06',
    phaseTitle: 'CLIENT ARRIVAL',
    headline: 'Client Facility Arrival',
    supportingText:
      'The Shakti Udyog delivery truck enters the customer\'s manufacturing premises and docks directly into the receiving bay strictly within scheduled Just-in-Time (JIT) delivery windows.',
    badge: 'CUSTOMER FACILITY · JIT DOCKING',
    tags: ['JIT Docking', 'Scheduled Window', 'Plant Clearance'],
  },
  {
    id: 'stage-7-unloading',
    startProgress: 0.78,
    endProgress: 0.88,
    startFrame: 231,
    endFrame: 263,
    phaseNumber: 'STAGE 07',
    phaseTitle: 'DOCK UNLOADING',
    headline: 'Precision Dock Unloading',
    supportingText:
      'Trailer doors open, and hydraulic forklifts transfer the palletized casting components onto the customer’s receiving dock for inward barcode scanning and physical inspection.',
    badge: 'UNLOADING · ZERO TRANSIT DAMAGE',
    tags: ['Forklift Offload', 'Zero Transit Wear', 'Direct-to-Line Staged'],
  },
  {
    id: 'stage-8-delivered',
    startProgress: 0.88,
    endProgress: 1.0,
    startFrame: 264,
    endFrame: 300,
    phaseNumber: 'STAGE 08',
    phaseTitle: 'DELIVERY HERO',
    headline: 'Component Delivered & Assembly Ready',
    supportingText:
      'The finished cast-iron component stands delivered in flawless condition — complete with EN 10204 3.1 inspection certification, zero defect verification, and 100% batch traceability.',
    badge: 'PRODUCT DELIVERED · 100% LINE-READY',
    tags: ['100% Traceability', 'Line-Ready Acceptance', 'Shakti Assurance'],
  },
];
