import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getResources, type Resource } from '../api/publicApi';
import { Seo } from '../components/Seo';
import { Breadcrumb } from '../components/ui';
import { seoPages } from '../content/seo';
import { useTheme } from '../auth/ThemeContext';
import {
  HelpCircle,
  Plus,
  Minus,
  BookOpen,
  ArrowRight,
  Sparkles,
  FileText,
  ShieldCheck,
  Cpu,
  Layers,
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

export default function ResourcesPage() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [resources, setResources] = useState<Resource[] | null>(null);
  const [error, setError] = useState(false);
  const [openId, setOpenId] = useState<string | null>('faq-1');

  useEffect(() => {
    getResources()
      .then(setResources)
      .catch(() => setError(true));
  }, []);

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

      {/* Hero Header — Perfectly Centered Matching All Pages */}
      <section
        className={`relative pt-32 pb-16 sm:pt-40 sm:pb-24 border-b overflow-hidden transition-colors ${
          isLight ? 'bg-white border-neutral-200/80' : 'bg-[#08090d] border-white/[0.08]'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-mono font-bold tracking-wider uppercase text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/30 mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span>Technical Documentation &amp; Knowledge Base</span>
          </div>

          <h1
            className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl ${
              isLight ? 'text-neutral-900' : 'text-white'
            }`}
          >
            Engineering <span className="text-orange-500">Resources &amp; FAQs</span>
          </h1>

          <p
            className={`text-lg sm:text-2xl max-w-3xl mx-auto leading-relaxed ${
              isLight ? 'text-neutral-600' : 'text-neutral-300'
            }`}
          >
            Practical metallurgical guides, foundry specifications, and answers to help you specify,
            engineer, and procure cast iron components with confidence.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12 sm:py-16 space-y-14 sm:space-y-18">
        {/* Breadcrumb Navigation */}
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Resources', href: '/resources' }]} />

        {/* ========================================================================= */}
        {/* RECOMMENDED TECHNICAL GUIDES & READING */}
        {/* ========================================================================= */}
        {resources && resources.length > 0 && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="text-xs font-mono font-bold tracking-widest uppercase text-blue-600 dark:text-sky-400">
                  METALLURGICAL GUIDES
                </div>
                <h2
                  className={`text-2xl sm:text-4xl font-extrabold tracking-tight ${
                    isLight ? 'text-neutral-900' : 'text-white'
                  }`}
                >
                  Recommended Engineering Reading
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((r, idx) => (
                <motion.div
                  key={r.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                >
                  <Link
                    to={`/resources/${r.slug}`}
                    className={`group h-full rounded-3xl p-6 sm:p-7 flex flex-col justify-between border transition-all duration-300 ${
                      isLight
                        ? 'bg-white border-neutral-200/90 hover:border-blue-400 hover:shadow-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
                        : 'bg-[#090b10] border-white/[0.08] hover:border-sky-500/40 hover:bg-[#0c0f17] hover:shadow-[0_0_25px_rgba(56,189,248,0.12)]'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-blue-500/10 text-blue-600 dark:text-sky-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
                        <BookOpen className="w-5 h-5" />
                      </div>

                      <h3
                        className={`text-lg sm:text-xl font-bold tracking-tight transition-colors ${
                          isLight
                            ? 'text-neutral-900 group-hover:text-blue-600'
                            : 'text-white group-hover:text-sky-400'
                        }`}
                      >
                        {r.title}
                      </h3>

                      <p
                        className={`text-xs sm:text-sm leading-relaxed ${
                          isLight ? 'text-neutral-600' : 'text-neutral-400'
                        }`}
                      >
                        {r.summary}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-neutral-100 dark:border-white/[0.06] flex items-center gap-1 text-xs font-mono font-bold text-blue-600 dark:text-sky-400">
                      <span>Read Technical Guide</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* THE FAQ SECTION (EXACT BEAUTIFUL UI MATCHING HOME PAGE) */}
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

              <Link
                to="/request-a-quote"
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-mono font-bold tracking-wider transition-all border shadow-sm ${
                  isLight
                    ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                    : 'bg-blue-950/60 border-blue-500/40 text-sky-300 hover:bg-blue-900/80 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
                }`}
              >
                <span>Ask Our Metallurgist</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
