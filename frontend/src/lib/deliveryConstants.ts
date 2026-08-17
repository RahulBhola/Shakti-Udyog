export interface DeliveryMilestone {
  id: string;
  stageNumber: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  startProgress: number;
  endProgress: number;
  startFrame: number;
  endFrame: number;
}

export const TOTAL_DELIVERY_FRAMES = 300;

export const DELIVERY_MILESTONES: DeliveryMilestone[] = [
  {
    id: 'stage-1-packed',
    stageNumber: '01 / 08',
    badge: 'PACKED PRODUCT',
    title: 'Precision-Packed Castings',
    subtitle: 'Heavy-Duty Wooden Pallets & VCI Rust Protection',
    description:
      'Finished cast-iron components are securely strapped and cushioned on heavy-duty industrial wooden pallets with multi-layer VCI anti-corrosion barrier packaging inside the Shakti Udyog foundry facility.',
    tags: ['VCI Rust Barrier', 'Heavy-Duty Palletizing', 'EN 10204 3.1 Certified'],
    startProgress: 0.0,
    endProgress: 0.12,
    startFrame: 1,
    endFrame: 35,
  },
  {
    id: 'stage-2-loaded',
    stageNumber: '02 / 08',
    badge: 'TRUCK LOADED',
    title: 'Secured Fleet Ingestion',
    subtitle: 'Hydraulic Loading into Dedicated Shakti Fleet',
    description:
      'Palletized castings are loaded directly into Shakti Udyog\'s signature black heavy-duty transport trailer with shock-damped tie-downs to ensure zero transit vibration or edge chipping.',
    tags: ['Shock-Damped Lashing', 'Tare Weight Verified', 'GPS Fleet Lock'],
    startProgress: 0.12,
    endProgress: 0.25,
    startFrame: 36,
    endFrame: 75,
  },
  {
    id: 'stage-3-departs',
    stageNumber: '03 / 08',
    badge: 'TRUCK DEPARTS',
    title: 'Foundry Gate Clearance',
    subtitle: 'Rolling Out from the Ludhiana Manufacturing Plant',
    description:
      'The premium Shakti Udyog prime-mover departs our Ludhiana foundry complex, initiating scheduled route freight with live IoT telematics and real-time delivery tracking.',
    tags: ['Geofenced Clearance', '99.4% On-Time Dispatch', 'Digital E-Way Bill'],
    startProgress: 0.25,
    endProgress: 0.38,
    startFrame: 76,
    endFrame: 112,
  },
  {
    id: 'stage-4-road',
    stageNumber: '04 / 08',
    badge: 'ROAD JOURNEY',
    title: 'Industrial Corridor Transit',
    subtitle: 'Pneumatic Air-Ride Suspension Route',
    description:
      'Navigating dedicated industrial arterial highways with air-ride pneumatic suspension, isolating machined bores and critical tolerance datums from road vibration.',
    tags: ['Air-Ride Suspension', 'Telemetry Monitored', 'Smooth Heavy Haul'],
    startProgress: 0.38,
    endProgress: 0.52,
    startFrame: 113,
    endFrame: 155,
  },
  {
    id: 'stage-5-highway',
    stageNumber: '05 / 08',
    badge: 'HIGHWAY EXPRESS',
    title: 'Interstate Freight Corridor',
    subtitle: 'Direct Multilane Supply Chain Route',
    description:
      'High-speed interstate transit connecting Punjab’s casting hub directly to tier-1 automotive, agricultural machinery, and industrial pump OEM assembly plants across India.',
    tags: ['Express Corridor', 'Continuous Tilt Log', 'Fast-Track Freight'],
    startProgress: 0.52,
    endProgress: 0.65,
    startFrame: 156,
    endFrame: 195,
  },
  {
    id: 'stage-6-facility',
    stageNumber: '06 / 08',
    badge: 'CUSTOMER FACILITY',
    title: 'Client Facility Arrival',
    subtitle: 'Just-in-Time Docking at the Receiving Bay',
    description:
      'The Shakti Udyog delivery truck enters the customer\'s industrial plant premises and docks directly into the receiving unloading bay strictly on scheduled JIT arrival windows.',
    tags: ['JIT Docking', 'Scheduled Window', 'Plant Clearance'],
    startProgress: 0.65,
    endProgress: 0.78,
    startFrame: 196,
    endFrame: 230,
  },
  {
    id: 'stage-7-unloading',
    stageNumber: '07 / 08',
    badge: 'UNLOADING',
    title: 'Precision Dock Unloading',
    subtitle: 'Direct Transfer to Inward Quality Check',
    description:
      'Trailer doors open, and hydraulic forklifts carefully offload the palletized casting components onto the customer’s receiving platform for inward barcode scanning and physical verification.',
    tags: ['Forklift Offload', 'Zero Transit Wear', 'Direct-to-Line Staged'],
    startProgress: 0.78,
    endProgress: 0.88,
    startFrame: 231,
    endFrame: 263,
  },
  {
    id: 'stage-8-delivered',
    stageNumber: '08 / 08',
    badge: 'PRODUCT DELIVERED',
    title: 'Component Delivered & Assembly Ready',
    subtitle: 'Flawless Finish Ready for Immediate Assembly',
    description:
      'The finished cast-iron component stands delivered in flawless condition — complete with EN 10204 3.1 inspection certification, zero defect verification, and full metallurgical traceability.',
    tags: ['100% Traceability', 'Line-Ready Acceptance', 'Shakti Assurance'],
    startProgress: 0.88,
    endProgress: 1.0,
    startFrame: 264,
    endFrame: 300,
  },
];
