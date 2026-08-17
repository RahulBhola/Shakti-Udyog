import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Box,
  Layers,
  Flame,
  Sparkles,
  Cog,
  CheckSquare,
  ArrowRight,
  ShieldCheck,
  Factory,
  Sliders,
  Scale,
  Gauge,
  Maximize2,
  Calendar,
  Wrench,
  Sparkle,
} from 'lucide-react';
import { Seo } from '../components/Seo';
import { Breadcrumb } from '../components/ui';
import { seoPages } from '../content/seo';
import { useTheme } from '../auth/ThemeContext';

export interface ProcessPhase {
  phaseNumber: string;
  title: string;
  description: string;
  image: string;
  icon: React.ReactNode;
  highlights?: string[];
}

const MANUFACTURING_PHASES: ProcessPhase[] = [
  {
    phaseNumber: 'PHASE 01',
    title: 'Enquiry & Drawing Review',
    description:
      'We examine application needs, material grade, geometry, tolerances, and volume before proposing a production route.',
    image: '/images/capabilities/phase-1-drawing-review.png',
    icon: <FileText className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
  {
    phaseNumber: 'PHASE 02',
    title: 'Pattern Development',
    description:
      'Patterns and core boxes are developed or managed to support repeatable production and complex dimensional requirements.',
    image: '/images/capabilities/phase-2-pattern-development.png',
    icon: <Box className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
  {
    phaseNumber: 'PHASE 03',
    title: 'Moulding & Core Making',
    description:
      'The moulding process is optimized across part geometry, material, quantity, and surface-finish expectations.',
    image: '/images/capabilities/phase-3-moulding-core.png',
    icon: <Layers className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
  {
    phaseNumber: 'PHASE 04',
    title: 'Melting & Pouring',
    description:
      'Metal chemistry and pouring practices are controlled according to the applicable production plan and material specification.',
    image: '/images/capabilities/phase-4-melting-pouring.png',
    icon: <Flame className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
  {
    phaseNumber: 'PHASE 05',
    title: 'Fettling & Surface Preparation',
    description:
      'Castings are cleaned, gates and risers are removed, and surface preparation is done for inspection or the next operation.',
    image: '/images/capabilities/phase-5-fettling-surface.png',
    icon: <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
  {
    phaseNumber: 'PHASE 06',
    title: 'Machining & Finishing',
    description:
      'Where agreed, castings are machined and finished to supply components ready for assembly.',
    image: '/images/capabilities/phase-6-machining-finishing.png',
    icon: <Cog className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
  {
    phaseNumber: 'PHASE 07',
    title: 'Inspection & Documentation',
    description:
      'Visual, dimensional, and non-destructive checks are performed as specified for the order.',
    image: '/images/capabilities/phase-7-inspection-doc.png',
    icon: <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
];

const TECHNICAL_PARAMETERS = [
  { parameter: 'Casting Process', value: 'High-Density Green Sand & CO2 Sand Moulding', icon: <Factory className="w-4 h-4 text-blue-500" /> },
  { parameter: 'Material Grades', value: 'Grey Iron (FG 150 – FG 350) & Ductile SG Iron (SG 400 – SG 700)', icon: <Layers className="w-4 h-4 text-blue-500" /> },
  { parameter: 'Part Weight Range', value: '0.1 kg to 150.0 kg per single piece casting', icon: <Scale className="w-4 h-4 text-blue-500" /> },
  { parameter: 'Max Dimensions', value: 'Up to 1,200 mm × 1,000 mm × 800 mm flask volume', icon: <Maximize2 className="w-4 h-4 text-blue-500" /> },
  { parameter: 'Monthly Foundry Capacity', value: '299+ Metric Tonnes per month certified capacity', icon: <Gauge className="w-4 h-4 text-blue-500" /> },
  { parameter: 'Machining Capabilities', value: 'In-House CNC Milling, VMC, Turning, and Drill Tapping', icon: <Wrench className="w-4 h-4 text-blue-500" /> },
  { parameter: 'Surface Finishes', value: 'Shot Blasted (SA 2.5), Red Oxide Primer, Anti-Rust Oil Coating', icon: <Sparkle className="w-4 h-4 text-blue-500" /> },
  { parameter: 'Batch Lot Sizes', value: '50 to 50,000+ pieces/month repeatable runs', icon: <Calendar className="w-4 h-4 text-blue-500" /> },
];

export default function CapabilitiesPage() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <>
      <Seo
        title={seoPages.capabilities.title}
        description={seoPages.capabilities.description}
        path="/capabilities"
      />

      <div className={`min-h-screen transition-colors duration-300 ${
        isLight ? 'bg-[#f4f7fb]' : 'bg-[#050608]'
      }`}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-6 pb-20 space-y-12 sm:space-y-16">
          
          {/* Breadcrumb Navigation */}
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Capabilities', href: '/capabilities' }]} />

          {/* Page Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4 max-w-3xl"
          >
            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-xs font-bold tracking-wider uppercase ${
              isLight
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-blue-500/10 text-sky-400 border border-blue-500/20'
            }`}>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>MANUFACTURING EXCELLENCE</span>
            </div>

            <h1 className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] ${
              isLight ? 'text-neutral-900' : 'text-white'
            }`}>
              From Requirement to <br />
              <span className={isLight ? 'text-blue-600' : 'text-sky-400'}>
                Ready-to-Use Casting
              </span>
            </h1>

            <p className={`text-base sm:text-lg leading-relaxed ${
              isLight ? 'text-neutral-600' : 'text-neutral-400'
            }`}>
              Precision engineering driven by decades of metallurgical expertise. Our end-to-end capabilities ensure absolute control over quality, dimensional accuracy, and material integrity at every stage.
            </p>
          </motion.div>

          {/* Technical Specs Bento Grid Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            
            {/* Left: Technical Parameters Table */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className={`lg:col-span-7 rounded-3xl p-6 sm:p-8 border flex flex-col justify-between transition-all ${
                isLight
                  ? 'bg-white border-neutral-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)]'
                  : 'bg-[#090b10] border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.7)]'
              }`}
            >
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isLight ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-blue-500/10 text-sky-400 border border-blue-500/20'
                    }`}>
                      <Sliders className="w-4 h-4" />
                    </div>
                    <h3 className={`text-xl font-bold tracking-tight ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                      Technical Parameters
                    </h3>
                  </div>

                  <span className={`text-xs font-mono px-2.5 py-1 rounded-full font-semibold ${
                    isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    ISO 9001:2015
                  </span>
                </div>

                <p className={`text-xs sm:text-sm ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  Operational capability envelope for serial grey iron and ductile iron casting production.
                </p>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-neutral-100 dark:divide-white/[0.06] text-xs sm:text-sm font-mono">
                {TECHNICAL_PARAMETERS.map((row) => (
                  <div key={row.parameter} className="py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4">
                    <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 shrink-0 font-medium">
                      {row.icon}
                      <span>{row.parameter}</span>
                    </div>
                    <div className={`font-semibold sm:text-right ${isLight ? 'text-neutral-900' : 'text-neutral-200'}`}>
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: Metallurgical Precision Feature Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className={`lg:col-span-5 rounded-3xl p-6 sm:p-8 border flex flex-col justify-between relative overflow-hidden transition-all ${
                isLight
                  ? 'bg-gradient-to-br from-blue-50/60 via-white to-blue-50/30 border-neutral-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)]'
                  : 'bg-gradient-to-br from-[#0c1322] via-[#090c14] to-[#06080e] border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.7)]'
              }`}
            >
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase bg-blue-500/10 text-blue-600 dark:text-sky-400 border border-blue-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>METALLURGICAL ASSURANCE</span>
                </div>

                <h3 className={`text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug ${
                  isLight ? 'text-neutral-900' : 'text-white'
                }`}>
                  Metallurgical Precision at Every Step
                </h3>

                <p className={`text-sm leading-relaxed ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
                  Advanced spectrometry and thermal analysis ensure absolute chemical composition control before pouring, guaranteeing mechanical strength, microstructural uniformity, and defect-free machinability.
                </p>
              </div>

              {/* Stat Metric Badges */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-neutral-200/80 dark:border-white/[0.08]">
                <div className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-white border-neutral-200 shadow-sm' : 'bg-white/5 border-white/10'
                }`}>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-blue-600 dark:text-sky-400">
                    99.4%
                  </div>
                  <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mt-1">
                    First-Time Yield
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-white border-neutral-200 shadow-sm' : 'bg-white/5 border-white/10'
                }`}>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-blue-600 dark:text-sky-400">
                    &lt;0.05mm
                  </div>
                  <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mt-1">
                    Machining Tolerance
                  </div>
                </div>
              </div>

              {/* Quick RFQ action */}
              <div className="mt-6">
                <Link
                  to="/request-a-quote"
                  className={`w-full py-3.5 px-5 rounded-2xl font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] ${
                    isLight
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                  }`}
                >
                  <span>Submit CAD for Manufacturability Check</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>

          </div>

          {/* ========================================================================= */}
          {/* THE PROCESS — MANUFACTURING CAPABILITY TIMELINE SECTION (MATCHING REFERENCE) */}
          {/* ========================================================================= */}
          <section className="pt-8 sm:pt-12">
            
            {/* Section Heading */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55 }}
              className="space-y-3 mb-12 sm:mb-16"
            >
              <div className="text-xs sm:text-sm font-mono font-bold tracking-widest uppercase text-blue-600 dark:text-sky-400">
                THE PROCESS
              </div>

              <h2 className={`text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.08] ${
                isLight ? 'text-neutral-900' : 'text-white'
              }`}>
                Manufacturing <span className="text-blue-600 dark:text-sky-400">Capability</span>
              </h2>
            </motion.div>

            {/* Vertical Connected Process Timeline */}
            <div className="relative space-y-6 sm:space-y-8">
              
              {/* Left Continuous Vertical Rail Line (Desktop & Tablet) */}
              <div className="hidden sm:block absolute left-[31px] sm:left-[35px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-blue-500 via-blue-400/30 to-blue-500/10 pointer-events-none" />

              {MANUFACTURING_PHASES.map((phase, idx) => (
                <motion.div
                  key={phase.phaseNumber}
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: idx * 0.08, ease: 'easeOut' }}
                  className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 group"
                >
                  
                  {/* Left Rail Icon Box + Connecting Dot */}
                  <div className="relative z-10 shrink-0">
                    <div className={`w-14 h-14 sm:w-[70px] sm:h-[70px] rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110 ${
                      isLight
                        ? 'bg-white border-neutral-200/90 text-blue-600 shadow-[0_4px_16px_rgba(0,0,0,0.05)] group-hover:border-blue-400 group-hover:shadow-md'
                        : 'bg-[#0d1017] border-white/10 text-sky-400 shadow-[0_4px_20px_rgba(0,0,0,0.8)] group-hover:border-sky-500/40 group-hover:shadow-[0_0_20px_rgba(56,189,248,0.25)]'
                    }`}>
                      {phase.icon}
                    </div>

                    {/* Small Pulsing Connector Dot on Rail (Between Steps) */}
                    {idx < MANUFACTURING_PHASES.length - 1 && (
                      <div className="hidden sm:block absolute left-1/2 -translate-x-1/2 top-[76px] w-2 h-2 rounded-full bg-blue-500/50" />
                    )}
                  </div>

                  {/* Right Wide Horizontal Card */}
                  <div className={`flex-1 w-full rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border transition-all duration-300 ${
                    isLight
                      ? 'bg-white border-neutral-200/90 hover:border-blue-300 hover:shadow-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
                      : 'bg-[#0a0d14] border-white/[0.08] hover:border-sky-500/30 hover:bg-[#0c101a] hover:shadow-[0_0_30px_rgba(56,189,248,0.12)]'
                  }`}>
                    
                    {/* Phase Info Text */}
                    <div className="space-y-2.5 max-w-xl">
                      <div className="font-mono text-xs font-extrabold tracking-wider uppercase text-blue-600 dark:text-sky-400">
                        {phase.phaseNumber}
                      </div>

                      <h3 className={`text-xl sm:text-2xl font-bold tracking-tight ${
                        isLight ? 'text-neutral-900 group-hover:text-blue-600 transition-colors' : 'text-white group-hover:text-sky-400 transition-colors'
                      }`}>
                        {phase.title}
                      </h3>

                      <p className={`text-sm sm:text-base leading-relaxed ${
                        isLight ? 'text-neutral-600' : 'text-neutral-400'
                      }`}>
                        {phase.description}
                      </p>
                    </div>

                    {/* 3D Process Visual Container */}
                    <div className={`relative w-full md:w-44 h-40 md:h-40 shrink-0 flex items-center justify-center p-2 rounded-2xl overflow-hidden transition-all ${
                      isLight
                        ? 'bg-gradient-to-b from-neutral-50/80 to-neutral-100/50'
                        : 'bg-gradient-to-b from-[#10141f] to-[#07090f]'
                    }`}>
                      <img
                        src={phase.image}
                        alt={phase.title}
                        loading="lazy"
                        className={`max-h-32 sm:max-h-36 max-w-[90%] w-auto h-auto object-contain transition-transform duration-500 group-hover:scale-110 ${
                          isLight
                            ? 'drop-shadow-[0_8px_16px_rgba(0,0,0,0.1)]'
                            : 'drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)]'
                        }`}
                      />
                    </div>

                  </div>

                </motion.div>
              ))}

            </div>

          </section>

          {/* Bottom Conversion CTA Banner */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={`rounded-3xl p-8 sm:p-12 lg:p-14 border transition-all ${
              isLight
                ? 'bg-white border-neutral-200/90 shadow-[0_15px_50px_rgba(0,0,0,0.05)] text-neutral-900'
                : 'bg-gradient-to-r from-[#0c1222] via-[#090e1a] to-[#060810] border-blue-500/30 text-white shadow-[0_0_50px_rgba(59,130,246,0.15)]'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="space-y-3 max-w-2xl">
                <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase ${
                  isLight
                    ? 'bg-blue-50 border border-blue-200 text-blue-700'
                    : 'bg-white/10 backdrop-blur-md border border-white/20 text-sky-300'
                }`}>
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-sky-300 shrink-0" />
                  <span>ENGINEERING REVIEW GUARANTEE</span>
                </div>

                <h2 className={`text-3xl sm:text-5xl font-black tracking-tight leading-[1.08] ${
                  isLight ? 'text-neutral-900' : 'text-white'
                }`}>
                  Not sure if your part is castable?
                </h2>

                <p className={`text-sm sm:text-base leading-relaxed ${
                  isLight ? 'text-neutral-600' : 'text-neutral-300'
                }`}>
                  Send us your 2D/3D CAD drawing — our metallurgical and pattern engineering team reviews feasibility, parting lines, and alloy selection within 24 hours.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 shrink-0">
                <Link
                  to="/request-a-quote"
                  className={`px-8 py-4 rounded-2xl font-extrabold text-sm sm:text-base text-center inline-flex items-center justify-center gap-2.5 transition-all transform hover:scale-105 ${
                    isLight
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white shadow-[0_0_30px_rgba(56,189,248,0.4)]'
                  }`}
                >
                  <span className="text-white font-extrabold">Request a Quote</span>
                  <ArrowRight className="w-4 h-4 text-white shrink-0" />
                </Link>

                <Link
                  to="/contact"
                  className={`px-7 py-4 rounded-2xl font-bold text-sm sm:text-base text-center transition-all ${
                    isLight
                      ? 'bg-neutral-50 hover:bg-neutral-100 border border-neutral-300 text-neutral-800 shadow-sm'
                      : 'bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-sm'
                  }`}
                >
                  <span>Talk to Our Team</span>
                </Link>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </>
  );
}
