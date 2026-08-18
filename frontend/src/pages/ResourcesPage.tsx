import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Seo } from '../components/Seo';
import { seoPages } from '../content/seo';
import { useTheme } from '../auth/ThemeContext';
import { useEnquiryModal } from '../context/EnquiryModalContext';
import {
  FileText,
  Layers,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Plus,
  Minus,
  ArrowRight,
  Sparkles,
  Scale,
  Gauge,
  Wrench,
  Flame,
  CheckSquare,
  Compass,
  UserCheck,
  Users,
  Truck,
  Clock,
  FileSpreadsheet,
  Workflow,
} from 'lucide-react';

export interface ExtendedFaqItem {
  id: string;
  question: string;
  answer: string;
}

const RESOURCES_FAQS: ExtendedFaqItem[] = [
  {
    id: 'faq-1',
    question: 'What casting processes and alloys do you offer?',
    answer:
      'We specialize in high-density green sand and CO2/chemically-bonded automated moulding for Grey Cast Iron (IS 210 FG 150 to FG 350) and Ductile / SG Iron (IS 1865 SG 400/15 to SG 700/2). Medium-frequency induction furnace melting ensures certified spectroscopic chemistry with every heat.',
  },
  {
    id: 'faq-2',
    question: 'What is the minimum order quantity (MOQ)?',
    answer:
      'Our production flexible routing supports pilot runs (25 to 100 pieces) for custom tooling development, as well as high-volume serial production (500 to 50,000+ pieces/month) for repeat OEM supply contracts.',
  },
  {
    id: 'faq-3',
    question: 'What testing and quality certifications do you provide?',
    answer:
      'Every production batch is supplied with an EN 10204 Type 3.1 Inspection Certificate detailing chemical composition (spectrometer), Brinell hardness (HBW), tensile strength, elongation, and hydrostatic pressure testing up to 350 bar where specified.',
  },
  {
    id: 'faq-4',
    question: 'Can you work directly from 2D/3D CAD drawings?',
    answer:
      'Yes, our engineering department accepts STEP, IGES, SolidWorks, Parasolid, and 2D DWG/PDF drawings. We perform DFM (Design for Manufacturability), shrinkage allowances, parting line placement, and CAD/CAM CNC pattern development.',
  },
  {
    id: 'faq-5',
    question: 'What information do you need to quote a casting?',
    answer:
      'To provide a fast and firm quote within 24 hours, please share: 2D/3D CAD drawing with tolerances, material grade (e.g. FG 260 or SG 500/7), estimated annual/batch volume, machining requirements, surface finish specifications, and delivery location.',
  },
  {
    id: 'faq-6',
    question: 'Do you supply fully machined ready-to-assemble castings?',
    answer:
      'Yes. In addition to raw and shot-blasted (SA 2.5) castings, we offer in-house CNC turning, VMC milling, drilling, tapping, and dimensional inspection on Zeiss 3D CMM machines to supply components ready for direct assembly line integration.',
  },
  {
    id: 'faq-7',
    question: 'Can Shakti Udyog develop new custom patterns and tooling?',
    answer:
      'Absolutely. We design and manufacture high-durability metallic match plates, aluminium pattern equipment, and core boxes optimized for long-run dimensional consistency and minimal draft angle deviations.',
  },
  {
    id: 'faq-8',
    question: 'What are typical lead times for development and production?',
    answer:
      'Sample pattern development and pilot batch inspection typically take 2 to 3 weeks. Regular batch production runs are dispatched within 7 to 14 days after sample approval, supported by rolling buffer stock for scheduled repeat OEM orders.',
  },
];

const APPLICATION_STAGES = [
  {
    stage: '01',
    title: 'Enquiry & Drawing Submission',
    subtitle: 'Client Portal or Direct Web Form',
    timeframe: 'Instant Acknowledgment',
    role: 'Visitor / Customer',
    icon: <FileText className="w-5 h-5 text-orange-500" />,
    badgeColor: 'orange',
    desc: 'Submit your 2D PDF or 3D CAD drawing (STEP, IGES, DWG) along with casting grade (IS 210 / IS 1865), piece weight, batch quantity, and machining requirements.',
    keyPoints: [
      'Encrypted CAD upload up to 50 MB',
      'Automated confirmation email & reference ID',
      'No upfront account required to submit initial enquiry',
    ],
  },
  {
    stage: '02',
    title: 'DFM & Feasibility Review',
    subtitle: 'Foundry Engineering Department',
    timeframe: 'Within 24 Hours',
    role: 'Foundry Engineer',
    icon: <Compass className="w-5 h-5 text-blue-500" />,
    badgeColor: 'blue',
    desc: 'Our metallurgical and pattern engineers analyze parting lines, draft angles (1.5°–3.0°), shrinkage allowances, core box feasibility, and induction melt metallurgy.',
    keyPoints: [
      'Design for Manufacturability (DFM) feedback',
      'Optimal alloy selection & gating simulation',
      'Tooling complexity evaluation (Wood / Aluminium match-plate)',
    ],
  },
  {
    stage: '03',
    title: 'Commercial Quotation & Approval',
    subtitle: 'Transparent Itemized Pricing',
    timeframe: '1 – 2 Business Days',
    role: 'Sales & Customer',
    icon: <FileSpreadsheet className="w-5 h-5 text-emerald-500" />,
    badgeColor: 'emerald',
    desc: 'A formal itemized quotation is generated in the portal detailing pattern tooling development, unit casting price, finish CNC machining, and dispatch schedule.',
    keyPoints: [
      'Downloadable PDF quotation in Customer Portal',
      'Interactive accept, decline, or negotiate actions',
      'Locked batch pricing valid for 30 days',
    ],
  },
  {
    stage: '04',
    title: 'Order Confirmation & Advance',
    subtitle: 'Sales Order & Production Booking',
    timeframe: 'Day 1 of Production',
    role: 'Admin & Customer',
    icon: <ShieldCheck className="w-5 h-5 text-purple-500" />,
    badgeColor: 'purple',
    desc: 'Once quotation is approved, an official Sales Order is issued. Customer uploads payment proof for the agreed advance (typically 30% for tooling / pilot run), unlocking the manufacturing queue.',
    keyPoints: [
      'Instant payment proof submission & invoice generation',
      'Admin financial reconciliation & production job creation',
      'Official delivery commitment date registered',
    ],
  },
  {
    stage: '05',
    title: 'Pattern Design & 25-Stage Kanban',
    subtitle: 'Automated Foundry & Machine Shop',
    timeframe: '7 – 14 Days (Serial Supply)',
    role: 'Foundry Floor Operations',
    icon: <Flame className="w-5 h-5 text-amber-500" />,
    badgeColor: 'amber',
    desc: 'The casting moves through our 25-stage Jira-inspired Production Kanban: CNC pattern fabrication, high-density green sand moulding, 1450°C induction melting, pouring, shakeout, fettling, and CNC machining.',
    keyPoints: [
      'In-house CNC match plate & core box machining',
      'Optical spectrometer chemistry verification per heat',
      'Real-time status updates across all production milestones',
    ],
  },
  {
    stage: '06',
    title: '3.1 Certification, Dispatch & Tracking',
    subtitle: 'Live Tracking & Document Vault',
    timeframe: 'Same-Day Dispatch on QA Pass',
    role: 'Quality & Logistics Team',
    icon: <Truck className="w-5 h-5 text-teal-500" />,
    badgeColor: 'teal',
    desc: 'Components undergo 3D CMM dimensional verification, Brinell hardness (HBW), and hydrostatic testing. Packed in anti-rust VCI film on wooden pallets with live transporter tracking in your portal.',
    keyPoints: [
      'EN 10204 Type 3.1 Mill Test Certificate attached',
      'Amazon-style live 8-stage shipment tracking',
      'Instant download of Invoices, Packing Lists & Test Reports',
    ],
  },
];

const USER_ROLES = [
  {
    role: 'Visitor / Prospective Buyer',
    audience: 'Engineers, Procurement Managers, OEM Designers',
    tag: 'Public Access',
    icon: <Users className="w-6 h-6 text-orange-500" />,
    color: 'orange',
    capabilities: [
      'Explore 50+ casting grades and typical OEM components',
      'Access interactive DFM guides, alloy comparisons & FAQs',
      'Submit enquiries and CAD files directly without mandatory account signup',
      'Use quick "Send a Query" popup for instant metallurgical feedback',
    ],
  },
  {
    role: 'Customer Portal Account',
    audience: 'Verified B2B Buyers & Active OEM Clients',
    tag: 'Authenticated Portal',
    icon: <UserCheck className="w-6 h-6 text-blue-500" />,
    color: 'blue',
    capabilities: [
      'View comprehensive Quotation history, accept/decline terms, and download PDFs',
      'Track live Amazon-style order milestones from pattern making to delivery',
      'Securely download official Tax Invoices, Delivery Challans, and 3.1 Test Certificates',
      'Submit advance payment proofs and raise linked technical support tickets',
    ],
  },
  {
    role: 'Foundry Staff Engineer',
    audience: 'Metallurgists, Pattern Engineers, Production Supervisors',
    tag: 'Internal Staff',
    icon: <Wrench className="w-6 h-6 text-emerald-500" />,
    color: 'emerald',
    capabilities: [
      'Review incoming customer drawings, evaluate DFM, and specify gating geometry',
      'Manage the 25-stage drag-and-drop Production Kanban manufacturing board',
      'Record spectrometer chemistries, hardness (HBW), and CMM quality results',
      'Maintain product catalog drafts and technical specification sheets',
    ],
  },
  {
    role: 'Platform Administrator',
    audience: 'Foundry Executives, Operations Heads, Finance Managers',
    tag: 'Full Governance',
    icon: <ShieldCheck className="w-6 h-6 text-purple-500" />,
    color: 'purple',
    capabilities: [
      'Approve new customer accounts and configure fine-grained role permissions',
      'Review and authorize commercial quotations and financial payment reconciliations',
      'Oversee real-time production analytics, capacity utilization, and dispatch reports',
      'Audit immutable system logs for complete security and compliance traceability',
    ],
  },
];

const STATUS_LIFECYCLES = [
  {
    title: '1. Customer Enquiry Lifecycle',
    subtitle: 'From initial customer inquiry to formal quotation',
    steps: [
      { name: 'Submitted', desc: 'Customer submits enquiry with CAD drawing' },
      { name: 'Under Review', desc: 'Engineer performs metallurgical DFM check' },
      { name: 'Approved', desc: 'Technical feasibility verified and approved' },
      { name: 'Quoted', desc: 'Commercial quotation issued in portal' },
      { name: 'Accepted', desc: 'Customer approves price and terms' },
    ],
  },
  {
    title: '2. Quotation Flow',
    subtitle: 'Commercial negotiations and approval routing',
    steps: [
      { name: 'Draft', desc: 'Costing calculated by sales engineering' },
      { name: 'Pending Approval', desc: 'Admin reviews tooling & margins' },
      { name: 'Issued', desc: 'Sent to customer with 30-day validity' },
      { name: 'Viewed / Negotiating', desc: 'Customer reviews or requests adjustments' },
      { name: 'Converted to Order', desc: 'Order created upon acceptance' },
    ],
  },
  {
    title: '3. Order & Shipment Milestones',
    subtitle: 'Customer-visible Amazon-style timeline',
    steps: [
      { name: 'Advance Paid', desc: '30% advance verified by finance' },
      { name: 'Pattern / Tooling', desc: 'CNC match plate & core boxes fabricated' },
      { name: 'In Production', desc: 'Moulding, induction melt & pouring' },
      { name: 'Quality Inspection', desc: 'Spectro, HBW hardness, CMM inspection' },
      { name: 'Packed & Dispatched', desc: 'Palletized with transporter tracking ID' },
      { name: 'Delivered', desc: 'Proof of Delivery & 3.1 certs finalized' },
    ],
  },
];

const ENQUIRY_CHECKLIST = [
  {
    step: '01',
    title: 'Part Geometry & CAD Files',
    desc: '2D PDF with critical tolerances or 3D CAD files (STEP, IGES, SolidWorks) or a physical sample for scanning.',
    icon: <Compass className="w-5 h-5 text-orange-500" />,
  },
  {
    step: '02',
    title: 'Material Grade & Specification',
    desc: 'Exact alloy grade (e.g., Grey Iron FG 260, SG 500/7) and national standard (IS 210, IS 1865, ASTM, DIN).',
    icon: <Layers className="w-5 h-5 text-orange-500" />,
  },
  {
    step: '03',
    title: 'Casting Weight & Dimensions',
    desc: 'Approximate piece weight (0.1 kg to 150 kg) and bounding envelope dimensions (length, width, height).',
    icon: <Scale className="w-5 h-5 text-orange-500" />,
  },
  {
    step: '04',
    title: 'Order & Annual Quantities',
    desc: 'Initial pilot batch lot size (e.g., 50 pcs) and recurring monthly or annual production volume forecasts.',
    icon: <Gauge className="w-5 h-5 text-orange-500" />,
  },
  {
    step: '05',
    title: 'Machining & Finishing Scope',
    desc: 'Specify raw as-cast, shot-blasted (SA 2.5), primer coated, or fully CNC finish-machined with tight bore tolerances.',
    icon: <Wrench className="w-5 h-5 text-orange-500" />,
  },
  {
    step: '06',
    title: 'Inspection & Certification Needs',
    desc: 'Requirement for EN 10204 3.1 chemical/mechanical test reports, CMM reports, Brinell hardness, or pressure testing.',
    icon: <ShieldCheck className="w-5 h-5 text-orange-500" />,
  },
];

const DFM_CHECKLIST_PILLARS = [
  {
    title: 'Draft Angles & Parting Lines',
    desc: 'Maintain 1.5° to 3.0° draft on vertical walls for clean pattern extraction without mold wall tear.',
    badge: 'Draft Angle: 1.5°–3.0°',
  },
  {
    title: 'Machining Stock Allowances (RMA)',
    desc: 'Allocate +2.5 mm to +4.0 mm extra stock on critical milled faces and bearing bores for clean defect-free machining.',
    badge: 'Stock: +2.5 to 4.0 mm',
  },
  {
    title: 'Fillet Radii & Section Transitions',
    desc: 'Use minimum internal fillet radius R3–R5 mm at all wall junctions to prevent hot-spot stress concentration cracks.',
    badge: 'Min Fillet: R3–R5 mm',
  },
  {
    title: 'Dimensional Standards & Datums',
    desc: 'Casting tolerance grade conforming to ISO 8062 / IS 11115 (DCTG 8–10) with primary CMM datum features identified.',
    badge: 'Tolerance: ISO 8062 DCTG',
  },
];

export default function ResourcesPage() {
  const { theme } = useTheme();
  const { openQuoteModal, openEnquiryModal } = useEnquiryModal();
  const isLight = theme === 'light';

  const [activeWorkflowTab, setActiveWorkflowTab] = useState<'stages' | 'roles' | 'lifecycles'>('stages');
  const [openId, setOpenId] = useState<string | null>('faq-1');

  const toggleFaq = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-300 ${
        isLight ? 'bg-[#f8f9fa] text-neutral-900' : 'bg-[#050507] text-white'
      }`}
    >
      <Seo
        title={seoPages.resources.title}
        description={seoPages.resources.description}
        path="/resources"
      />

      {/* Hero Header — Perfectly Centered */}
      <section
        className={`relative pt-32 pb-16 sm:pt-40 sm:pb-24 border-b overflow-hidden transition-colors ${
          isLight ? 'bg-white border-neutral-200/80' : 'bg-[#08090d] border-white/[0.08]'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-mono font-bold tracking-wider uppercase text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/30 mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span>Foundry Engineering Knowledge Base &amp; Technical Reference</span>
          </div>

          <h1
            className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl ${
              isLight ? 'text-neutral-900' : 'text-white'
            }`}
          >
            Engineering <span className="text-orange-500">Resources &amp; Guides</span>
          </h1>

          <p
            className={`text-lg sm:text-2xl max-w-3xl mx-auto leading-relaxed ${
              isLight ? 'text-neutral-600' : 'text-neutral-300'
            }`}
          >
            Practical metallurgical guides, enquiry blueprints, DFM checklists, and comprehensive
            foundry answers to help you specify, engineer, and procure castings with confidence.
          </p>
        </div>
      </section>

      {/* Main Content Container */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12 sm:py-16 space-y-16 sm:space-y-20">
        
        {/* ========================================================================= */}
        {/* SECTION 0: HOW THE APPLICATION & ORDERING PROCESS WORKS (END-TO-END GUIDE) */}
        {/* ========================================================================= */}
        <section className="space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/30">
              <Workflow className="w-3.5 h-3.5 text-orange-500" />
              <span>PLATFORM WORKFLOW &amp; BUYER GUIDE</span>
            </div>

            <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight ${
              isLight ? 'text-neutral-900' : 'text-white'
            }`}>
              How the Shakti Udyog Platform Works
            </h2>

            <p className={`text-sm sm:text-base max-w-3xl leading-relaxed ${
              isLight ? 'text-neutral-600' : 'text-neutral-300'
            }`}>
              A transparent look at our end-to-end digital casting workflow — from CAD file upload and 24-hour metallurgical DFM review to the 25-stage Kanban foundry floor, quality inspection, and live shipment milestone tracking.
            </p>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 w-fit">
            <button
              type="button"
              onClick={() => setActiveWorkflowTab('stages')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl font-mono text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeWorkflowTab === 'stages'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                  : isLight
                    ? 'text-neutral-700 hover:text-neutral-900 hover:bg-white/80'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              1. 6-Stage Order Lifecycle
            </button>

            <button
              type="button"
              onClick={() => setActiveWorkflowTab('roles')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl font-mono text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeWorkflowTab === 'roles'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                  : isLight
                    ? 'text-neutral-700 hover:text-neutral-900 hover:bg-white/80'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              2. User Roles &amp; Portals
            </button>

            <button
              type="button"
              onClick={() => setActiveWorkflowTab('lifecycles')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl font-mono text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeWorkflowTab === 'lifecycles'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                  : isLight
                    ? 'text-neutral-700 hover:text-neutral-900 hover:bg-white/80'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              3. Status &amp; Milestone Cheat Sheet
            </button>
          </div>

          {/* TAB 1: 6-STAGE ORDER LIFECYCLE */}
          {activeWorkflowTab === 'stages' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {APPLICATION_STAGES.map((st, idx) => (
                <motion.div
                  key={st.stage}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className={`rounded-3xl p-6 sm:p-7 border flex flex-col justify-between transition-all duration-300 ${
                    isLight
                      ? 'bg-white border-neutral-200/90 hover:border-orange-300 hover:shadow-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
                      : 'bg-[#090b10] border-white/[0.08] hover:border-orange-500/30 hover:bg-[#0c0e15] hover:shadow-[0_0_25px_rgba(249,115,22,0.12)]'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Card Header: Stage Number + Icon + Turnaround Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                          STAGE {st.stage}
                        </span>
                        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/10">
                          {st.role}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 shrink-0">
                        {st.icon}
                      </div>
                    </div>

                    <div>
                      <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${
                        isLight ? 'text-neutral-900' : 'text-white'
                      }`}>
                        {st.title}
                      </h3>
                      <div className="text-xs font-mono text-orange-600 dark:text-orange-400 font-semibold mt-0.5">
                        {st.subtitle}
                      </div>
                    </div>

                    <p className={`text-xs sm:text-sm leading-relaxed ${
                      isLight ? 'text-neutral-600' : 'text-neutral-300'
                    }`}>
                      {st.desc}
                    </p>

                    {/* Key Deliverables Bullet Points */}
                    <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-white/[0.06]">
                      {st.keyPoints.map((pt, pIdx) => (
                        <div key={pIdx} className="flex items-start gap-2 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className={isLight ? 'text-neutral-700' : 'text-neutral-300'}>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer Turnaround Pill */}
                  <div className="mt-5 pt-3 border-t border-neutral-100 dark:border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
                    <span className="text-neutral-500">Timeline:</span>
                    <span className="font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {st.timeframe}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* TAB 2: USER ROLES & PORTALS */}
          {activeWorkflowTab === 'roles' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {USER_ROLES.map((role, idx) => (
                <motion.div
                  key={role.role}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className={`rounded-3xl p-7 border flex flex-col justify-between transition-all duration-300 ${
                    isLight
                      ? 'bg-white border-neutral-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
                      : 'bg-[#090b10] border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.7)]'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                          {role.icon}
                        </div>
                        <div>
                          <h3 className={`text-xl font-bold tracking-tight ${
                            isLight ? 'text-neutral-900' : 'text-white'
                          }`}>
                            {role.role}
                          </h3>
                          <span className="text-xs font-mono text-neutral-500">
                            {role.audience}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-sky-400 border border-blue-500/20">
                        {role.tag}
                      </span>
                    </div>

                    <div className="space-y-2.5 pt-3 border-t border-neutral-100 dark:border-white/[0.06]">
                      <div className="text-xs font-mono font-bold uppercase text-neutral-500">Core Capabilities:</div>
                      {role.capabilities.map((cap, cIdx) => (
                        <div key={cIdx} className="flex items-start gap-2 text-xs sm:text-sm">
                          <CheckSquare className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                          <span className={isLight ? 'text-neutral-700' : 'text-neutral-300'}>{cap}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-white/[0.06] flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-500">Security &amp; RBAC:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Strict Role Isolation</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* TAB 3: STATUS & MILESTONE CHEAT SHEET */}
          {activeWorkflowTab === 'lifecycles' && (
            <div className="space-y-6">
              {STATUS_LIFECYCLES.map((flow, idx) => (
                <motion.div
                  key={flow.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className={`rounded-3xl p-6 sm:p-8 border ${
                    isLight
                      ? 'bg-white border-neutral-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
                      : 'bg-[#090b10] border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.7)]'
                  }`}
                >
                  <div className="mb-5">
                    <h3 className={`text-xl font-bold tracking-tight ${
                      isLight ? 'text-neutral-900' : 'text-white'
                    }`}>
                      {flow.title}
                    </h3>
                    <p className="text-xs font-mono text-neutral-500 mt-1">
                      {flow.subtitle}
                    </p>
                  </div>

                  {/* Flow Badges Pipeline */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {flow.steps.map((st, sIdx) => (
                      <div
                        key={sIdx}
                        className={`p-4 rounded-2xl border transition-all ${
                          isLight
                            ? 'bg-neutral-50 border-neutral-200 text-neutral-800'
                            : 'bg-white/5 border-white/10 text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                            {sIdx + 1}
                          </span>
                          <span className="font-bold text-xs sm:text-sm">{st.name}</span>
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                          {st.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Quick Action Banner */}
          <div className={`rounded-2xl p-6 border flex flex-col sm:flex-row items-center justify-between gap-4 ${
            isLight
              ? 'bg-orange-50/70 border-orange-200 text-neutral-800'
              : 'bg-orange-950/20 border-orange-500/30 text-white'
          }`}>
            <div className="space-y-1 text-center sm:text-left">
              <div className="font-bold text-sm sm:text-base">Ready to start your casting development?</div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                Upload your CAD files to receive a comprehensive metallurgical review and quotation within 24 hours.
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => openEnquiryModal()}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold text-xs sm:text-sm transition-all transform hover:scale-105 shadow-md cursor-pointer ${
                  isLight
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/25'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)]'
                }`}
              >
                <span>Submit Enquiry</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => openEnquiryModal()}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all border cursor-pointer ${
                  isLight
                    ? 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-800 shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 border-white/20 text-white shadow-sm'
                }`}
              >
                <span>Send a Query</span>
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 1: HOW TO PREPARE A CASTING ENQUIRY (FULL 6-POINT BLUEPRINT) */}
        {/* ========================================================================= */}
        <section className="space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/30">
              <FileText className="w-3.5 h-3.5 text-orange-500" />
              <span>ENQUIRY PREPARATION BLUEPRINT</span>
            </div>

            <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight ${
              isLight ? 'text-neutral-900' : 'text-white'
            }`}>
              How to Prepare a Casting Enquiry
            </h2>

            <p className={`text-sm sm:text-base max-w-2xl leading-relaxed ${
              isLight ? 'text-neutral-600' : 'text-neutral-300'
            }`}>
              Include these 6 critical engineering parameters in your enquiry for accurate feasibility review, optimized pattern tooling quotes, and fixed unit pricing within 24 hours.
            </p>
          </div>

          {/* 6-Card Interactive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ENQUIRY_CHECKLIST.map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.06 }}
                className={`rounded-3xl p-6 sm:p-7 border flex flex-col justify-between transition-all duration-300 ${
                  isLight
                    ? 'bg-white border-neutral-200/90 hover:border-orange-300 hover:shadow-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
                    : 'bg-[#090b10] border-white/[0.08] hover:border-orange-500/30 hover:bg-[#0c0e15] hover:shadow-[0_0_25px_rgba(249,115,22,0.12)]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                      STEP {item.step}
                    </span>
                    <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
                      {item.icon}
                    </div>
                  </div>

                  <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${
                    isLight ? 'text-neutral-900' : 'text-white'
                  }`}>
                    {item.title}
                  </h3>

                  <p className={`text-xs sm:text-sm leading-relaxed ${
                    isLight ? 'text-neutral-600' : 'text-neutral-400'
                  }`}>
                    {item.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-white/[0.06] flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Essential for 24h Quotation</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick RFQ CTA Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => openQuoteModal()}
              className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-xs sm:text-sm transition-all transform hover:scale-105 shadow-md cursor-pointer ${
                isLight
                  ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]'
              }`}
            >
              <span>Submit 2D/3D CAD Drawing for Feasibility Check</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: GREY IRON VS DUCTILE IRON (FULL COMPARATIVE MATRIX) */}
        {/* ========================================================================= */}
        <section className="space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase text-blue-600 dark:text-sky-400 bg-blue-500/10 border border-blue-500/30">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span>METALLURGICAL ALLOY MATRIX</span>
            </div>

            <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight ${
              isLight ? 'text-neutral-900' : 'text-white'
            }`}>
              Grey Iron vs. Ductile Iron Selection Guide
            </h2>

            <p className={`text-sm sm:text-base max-w-2xl leading-relaxed ${
              isLight ? 'text-neutral-600' : 'text-neutral-300'
            }`}>
              A direct comparison of microstructure, mechanical properties, vibration damping, and typical industry applications to select the optimal casting grade.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Grey Iron Card (Full Data) */}
            <div className={`rounded-3xl p-7 sm:p-9 border transition-all ${
              isLight
                ? 'bg-white border-neutral-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)]'
                : 'bg-[#090b10] border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.7)]'
            }`}>
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                    Flake Graphite Iron (IS 210)
                  </span>
                  <span className="text-xs font-mono text-neutral-500">FG 150 to FG 350</span>
                </div>

                <h3 className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                  isLight ? 'text-neutral-900' : 'text-white'
                }`}>
                  Grey Cast Iron
                </h3>

                <p className={`text-xs sm:text-sm leading-relaxed ${
                  isLight ? 'text-neutral-600' : 'text-neutral-400'
                }`}>
                  Characterized by carbon dispersed as interconnected graphite flakes. Provides unmatched harmonic vibration damping, high compressive strength, and high thermal conductivity.
                </p>

                {/* Technical Specs Table */}
                <div className="space-y-2.5 pt-2 border-t border-neutral-100 dark:border-white/[0.06] text-xs font-mono">
                  <div className="flex justify-between py-1.5 border-b border-neutral-100 dark:border-white/[0.04]">
                    <span className="text-neutral-500">Tensile Strength:</span>
                    <span className="font-bold text-orange-500">150 – 350 MPa</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-neutral-100 dark:border-white/[0.04]">
                    <span className="text-neutral-500">Brinell Hardness:</span>
                    <span className="font-bold">160 – 260 HBW</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-neutral-100 dark:border-white/[0.04]">
                    <span className="text-neutral-500">Elongation:</span>
                    <span className="font-bold">&lt; 1% (Rigid / Non-Ductile)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-neutral-100 dark:border-white/[0.04]">
                    <span className="text-neutral-500">Vibration Damping:</span>
                    <span className="font-bold text-emerald-500">Superior (Absorbs kinetic harmonics)</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-neutral-500">Machinability:</span>
                    <span className="font-bold text-emerald-500">Excellent (Discontinuous chips)</span>
                  </div>
                </div>

                {/* Common Applications */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/5 space-y-1">
                  <div className="text-[11px] font-mono font-bold uppercase text-neutral-500">Primary Applications:</div>
                  <p className="text-xs text-neutral-700 dark:text-neutral-300">
                    Machine tool beds, gearboxes, compressor housings, hydraulic barrel pumps, brake discs, V-belt pulleys.
                  </p>
                </div>
              </div>
            </div>

            {/* Ductile Iron Card (Full Data) */}
            <div className={`rounded-3xl p-7 sm:p-9 border transition-all ${
              isLight
                ? 'bg-white border-neutral-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)]'
                : 'bg-[#090b10] border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.7)]'
            }`}>
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-blue-500/10 text-blue-600 dark:text-sky-400 border border-blue-500/30">
                    Nodular S.G. Iron (IS 1865)
                  </span>
                  <span className="text-xs font-mono text-neutral-500">SG 400/15 to SG 700/2</span>
                </div>

                <h3 className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                  isLight ? 'text-neutral-900' : 'text-white'
                }`}>
                  Ductile (SG) Iron
                </h3>

                <p className={`text-xs sm:text-sm leading-relaxed ${
                  isLight ? 'text-neutral-600' : 'text-neutral-400'
                }`}>
                  Magnesium inoculation transforms graphite into spherical nodules, eliminating sharp stress concentration points. Delivers high tensile strength, impact toughness, and elongation similar to cast steel.
                </p>

                {/* Technical Specs Table */}
                <div className="space-y-2.5 pt-2 border-t border-neutral-100 dark:border-white/[0.06] text-xs font-mono">
                  <div className="flex justify-between py-1.5 border-b border-neutral-100 dark:border-white/[0.04]">
                    <span className="text-neutral-500">Tensile Strength:</span>
                    <span className="font-bold text-sky-500">400 – 700+ MPa</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-neutral-100 dark:border-white/[0.04]">
                    <span className="text-neutral-500">Brinell Hardness:</span>
                    <span className="font-bold">170 – 300 HBW</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-neutral-100 dark:border-white/[0.04]">
                    <span className="text-neutral-500">Elongation:</span>
                    <span className="font-bold text-sky-500">2% – 18% (High Ductility)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-neutral-100 dark:border-white/[0.04]">
                    <span className="text-neutral-500">Impact Resistance:</span>
                    <span className="font-bold text-emerald-500">High Shock &amp; Fracture Toughness</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-neutral-500">Strength-to-Weight:</span>
                    <span className="font-bold text-emerald-500">Superior (Comparable to forged steel)</span>
                  </div>
                </div>

                {/* Common Applications */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/5 space-y-1">
                  <div className="text-[11px] font-mono font-bold uppercase text-neutral-500">Primary Applications:</div>
                  <p className="text-xs text-neutral-700 dark:text-neutral-300">
                    Automotive shift levers, tractor axle supports, railway safety handles, high-pressure valves, heavy machinery pivot arms.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: CASTING DRAWING & DFM CHECKLIST (FULL ENGINEERING DATA) */}
        {/* ========================================================================= */}
        <section className="space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
              <span>DFM &amp; TOLERANCE STANDARDS</span>
            </div>

            <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight ${
              isLight ? 'text-neutral-900' : 'text-white'
            }`}>
              Casting Drawing &amp; DFM Checklist
            </h2>

            <p className={`text-sm sm:text-base max-w-2xl leading-relaxed ${
              isLight ? 'text-neutral-600' : 'text-neutral-300'
            }`}>
              Key drawing rules, draft angles, machining stock allowances, and inspection callouts required for defect-free production.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {DFM_CHECKLIST_PILLARS.map((pillar, idx) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.07 }}
                className={`rounded-3xl p-6 border flex flex-col justify-between transition-all ${
                  isLight
                    ? 'bg-white border-neutral-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
                    : 'bg-[#090b10] border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.7)]'
                }`}
              >
                <div className="space-y-3">
                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 inline-block">
                    {pillar.badge}
                  </span>

                  <h3 className={`text-base sm:text-lg font-bold tracking-tight ${
                    isLight ? 'text-neutral-900' : 'text-white'
                  }`}>
                    {pillar.title}
                  </h3>

                  <p className={`text-xs leading-relaxed ${
                    isLight ? 'text-neutral-600' : 'text-neutral-400'
                  }`}>
                    {pillar.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-white/[0.06] flex items-center gap-1.5 text-[11px] font-mono text-neutral-400">
                  <CheckSquare className="w-3.5 h-3.5 text-purple-500" />
                  <span>ISO 8062 Compliant</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 4: THE FAQ SECTION (EXACT BEAUTIFUL UI WITH MOLTEN LADLE) */}
        {/* ========================================================================= */}
        <section id="res-faq">
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={`rounded-3xl p-8 sm:p-12 lg:p-14 border transition-all duration-300 shadow-2xl ${
              isLight
                ? 'bg-white border-neutral-200/90 shadow-[0_10px_40px_rgba(0,0,0,0.04)] text-neutral-900'
                : 'bg-[#080a0f] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.9)] text-white'
            }`}
          >
            {/* Top Split Header: Left Title + Right 3D Molten Ladle Visualizer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-10 sm:mb-14">
              {/* Left Header Column */}
              <div className="lg:col-span-8 space-y-4">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-xs font-bold tracking-wider uppercase ${
                    isLight
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-blue-500/10 text-sky-400 border border-blue-500/20'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>FREQUENTLY ASKED QUESTIONS</span>
                </div>

                <h2
                  className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] ${
                    isLight ? 'text-neutral-900' : 'text-white'
                  }`}
                >
                  Everything You Need to Know
                </h2>

                <p
                  className={`text-sm sm:text-base leading-relaxed max-w-xl ${
                    isLight ? 'text-neutral-600' : 'text-neutral-400'
                  }`}
                >
                  Clear answers on our foundry capabilities, alloy specifications, order lead times,
                  and quality assurance.
                </p>
              </div>

              {/* Right Column: 3D Molten Foundry Visualizer with Scroll Scale */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="lg:col-span-4 flex justify-center lg:justify-end"
              >
                <div
                  className={`relative w-full max-w-[280px] sm:max-w-[320px] aspect-[4/3] rounded-2xl overflow-hidden border shadow-xl ${
                    isLight
                      ? 'border-neutral-200 shadow-[0_10px_30px_rgba(0,0,0,0.06)]'
                      : 'border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.8)]'
                  }`}
                >
                  <img
                    src="/images/faq-molten-ladle.jpg"
                    alt="Molten Foundry Ladle"
                    loading="lazy"
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-3.5">
                    <span className="font-mono text-[11px] font-bold text-amber-300 tracking-wider">
                      Induction Pouring at 1450°C
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Expandable FAQs Accordion Rows with Staggered Scroll Animation */}
            <div className="divide-y divide-neutral-200/80 dark:divide-white/10">
              {RESOURCES_FAQS.map((faq, idx) => {
                const isOpen = openId === faq.id;
                return (
                  <motion.div
                    key={faq.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: idx * 0.05 }}
                    className="py-5 sm:py-6"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full flex items-center justify-between text-left gap-4 group cursor-pointer focus:outline-none"
                    >
                      <div className="flex items-center gap-3.5 sm:gap-4">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-colors ${
                            isOpen
                              ? 'bg-blue-600 text-white'
                              : isLight
                                ? 'bg-neutral-100 text-neutral-600 group-hover:bg-blue-50 group-hover:text-blue-600'
                                : 'bg-white/5 text-neutral-400 group-hover:bg-blue-500/10 group-hover:text-sky-400'
                          }`}
                        >
                          ?
                        </div>

                        <h3
                          className={`text-base sm:text-lg font-bold tracking-tight transition-colors ${
                            isOpen
                              ? isLight
                                ? 'text-blue-600'
                                : 'text-sky-400'
                              : isLight
                                ? 'text-neutral-900 group-hover:text-blue-600'
                                : 'text-white group-hover:text-sky-400'
                          }`}
                        >
                          {faq.question}
                        </h3>
                      </div>

                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                          isOpen
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : isLight
                              ? 'border-neutral-300 text-neutral-600 group-hover:border-blue-600 group-hover:text-blue-600'
                              : 'border-white/15 text-neutral-400 group-hover:border-white/30 group-hover:text-white'
                        }`}
                      >
                        {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </div>
                    </button>

                    {/* Smooth Animated Height Expand/Collapse */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="pl-11 sm:pl-12 pr-4 pt-3.5">
                            <p
                              className={`text-sm sm:text-base leading-relaxed ${
                                isLight ? 'text-neutral-600' : 'text-neutral-300'
                              }`}
                            >
                              {faq.answer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Bottom RFQ Quick Action */}
            <div className="pt-8 sm:pt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-200/80 dark:border-white/10 mt-8">
              <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                Have a specific question about your alloy specification or pattern?
              </span>

              <button
                type="button"
                onClick={() => openEnquiryModal()}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-mono font-bold tracking-wider transition-all border shadow-sm cursor-pointer ${
                  isLight
                    ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                    : 'bg-blue-950/60 border-blue-500/40 text-sky-300 hover:bg-blue-900/80 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
                }`}
              >
                <span>Send a Query</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </section>

      </div>
    </div>
  );
}
