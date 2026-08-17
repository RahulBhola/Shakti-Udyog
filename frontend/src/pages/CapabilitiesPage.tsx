import React, { useState } from 'react';
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
} from 'lucide-react';
import { Seo } from '../components/Seo';
import { seoPages } from '../content/seo';
import { useTheme } from '../auth/ThemeContext';
import { useEnquiryModal } from '../context/EnquiryModalContext';
import { EnquiryModal } from '../components/EnquiryModal';
import { DeliveryScrollytellingCanvas } from '../components/DeliveryScrollytellingCanvas';

export interface ProcessPhase {
  phaseNumber: string;
  title: string;
  description: string;
  image: string;
  icon: React.ReactNode;
}

const PROCESS_PHASES: ProcessPhase[] = [
  {
    phaseNumber: '01',
    title: 'Drawing & Methoding',
    description:
      'We study part drawings to determine parting lines, draft angles, shrinkage allowances, and gating systems.',
    image: '/images/capabilities/phase-1-drawing-review.png',
    icon: <FileText className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
  {
    phaseNumber: '02',
    title: 'Pattern & Core Box Preparation',
    description:
      'Matchplate patterns and core boxes are prepared in wood, metal, or resin depending on volume requirements.',
    image: '/images/capabilities/phase-2-pattern-development.png',
    icon: <Box className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
  {
    phaseNumber: '03',
    title: 'Mould & Core Making',
    description:
      'Green sand and chemically bonded sand systems provide uniform compaction and good permeability for sound castings.',
    image: '/images/capabilities/phase-3-moulding-core.png',
    icon: <Layers className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
  {
    phaseNumber: '04',
    title: 'Melting & Inoculation',
    description:
      'Induction melting with calibrated alloy additions and inoculation ensures the target microstructure and grade.',
    image: '/images/capabilities/phase-4-melting-pouring.png',
    icon: <Flame className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
  {
    phaseNumber: '05',
    title: 'Pouring & Controlled Cooling',
    description:
      'Temperature-controlled pouring and adequate in-mould cooling prevent thermal shock, cracks, and distortion.',
    image: '/images/capabilities/phase-5-fettling-surface.png',
    icon: <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
  {
    phaseNumber: '06',
    title: 'Knockout, Fettling & Shot Blasting',
    description:
      'Castings are shaken out, risers and runners removed, followed by shot blasting for clean surface preparation.',
    image: '/images/capabilities/phase-6-machining-finishing.png',
    icon: <Cog className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
  {
    phaseNumber: '07',
    title: 'Inspection, Quality & Documentation',
    description:
      'Visual, dimensional, and non-destructive checks are performed as specified for the order.',
    image: '/images/capabilities/phase-7-inspection-doc.png',
    icon: <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
];

export default function CapabilitiesPage() {
  const { theme } = useTheme();
  const { openQuoteModal } = useEnquiryModal();
  const isLight = theme === 'light';
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${
      isLight ? 'bg-[#f8f9fa] text-neutral-900' : 'bg-[#050507] text-white'
    }`}>
      <Seo
        title={seoPages.capabilities.title}
        description={seoPages.capabilities.description}
        path="/capabilities"
      />

      {/* Hero Header — Centered */}
      <section className={`relative pt-32 pb-16 sm:pt-40 sm:pb-24 border-b overflow-hidden transition-colors ${
        isLight ? 'bg-white border-neutral-200/80' : 'bg-[#08090d] border-white/[0.08]'
      }`}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10 text-center flex flex-col items-center">
          
          {/* Centered Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-mono font-bold tracking-wider uppercase text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/30 mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span>Manufacturing Process &amp; Metallurgical Excellence</span>
          </div>

          {/* Centered Main Title */}
          <h1 className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl ${
            isLight ? 'text-neutral-900' : 'text-white'
          }`}>
            From Requirement to <span className="text-orange-500">Ready-to-Use Casting</span>
          </h1>

          {/* Centered Subtitle */}
          <p className={`text-lg sm:text-2xl max-w-3xl mx-auto leading-relaxed ${
            isLight ? 'text-neutral-600' : 'text-neutral-300'
          }`}>
            Precision engineering driven by decades of metallurgical expertise. Our end-to-end capabilities ensure absolute control over quality, dimensional accuracy, and material integrity at every stage.
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 1. 300-FRAME CINEMATIC 3D JIT FLEET DELIVERY SCROLLYTELLING ANIMATION */}
      {/* ========================================================================= */}
      <DeliveryScrollytellingCanvas />

      {/* ========================================================================= */}
      {/* 2. THE PROCESS — MANUFACTURING CAPABILITY TIMELINE (BELOW ANIMATION) */}
      {/* ========================================================================= */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-16 sm:py-24 space-y-16">
        
        <section>
          
          {/* Section Heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55 }}
            className="space-y-3 mb-10 sm:mb-14"
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
            
            {/* Left Continuous Vertical Rail Line */}
            <div className="hidden sm:block absolute left-[31px] sm:left-[35px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-blue-500 via-blue-400/30 to-blue-500/10 pointer-events-none" />

            {PROCESS_PHASES.map((phase, idx) => (
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

                  {/* Connector Dot */}
                  {idx < PROCESS_PHASES.length - 1 && (
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

        {/* ========================================================================= */}
        {/* 3. BOTTOM CONVERSION CTA BANNER */}
        {/* ========================================================================= */}
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
              <button
                type="button"
                onClick={() => openQuoteModal()}
                className={`px-8 py-4 rounded-2xl font-extrabold text-sm sm:text-base text-center inline-flex items-center justify-center gap-2.5 transition-all transform hover:scale-105 cursor-pointer ${
                  isLight
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white shadow-[0_0_30px_rgba(56,189,248,0.4)]'
                }`}
              >
                <span className="text-white font-extrabold">Request a Quote</span>
                <ArrowRight className="w-4 h-4 text-white shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setIsEnquiryOpen(true)}
                className={`px-7 py-4 rounded-2xl font-bold text-sm sm:text-base text-center transition-all cursor-pointer ${
                  isLight
                    ? 'bg-neutral-50 hover:bg-neutral-100 border border-neutral-300 text-neutral-800 shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-sm'
                }`}
              >
                <span>Send a Query</span>
              </button>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Direct Foundry Enquiry Popup Modal */}
      <EnquiryModal
        isOpen={isEnquiryOpen}
        onClose={() => setIsEnquiryOpen(false)}
      />
    </div>
  );
}
