import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ArrowRight, HelpCircle } from 'lucide-react';
import { useTheme } from '../auth/ThemeContext';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'What casting processes and alloys do you offer?',
    answer: 'We specialize in green sand and CO2/chemically-bonded automated moulding for Grey Cast Iron (IS 210 FG 150 to FG 350) and Ductile / SG Iron (IS 1865 SG 400/15 to SG 700/2). Induction furnace melting ensures certified spectroscopic chemistry with every batch.',
  },
  {
    id: 'faq-2',
    question: 'What is the minimum order quantity (MOQ)?',
    answer: 'Our batch MOQs range from 25 to 100 units for customized industrial prototypes up to 50,000+ units per month for recurring OEM contracts, with dedicated volume tooling lines.',
  },
  {
    id: 'faq-3',
    question: 'What testing and quality certifications do you provide?',
    answer: 'Every dispatch includes a comprehensive 3.1 Mill Test Certificate with spectrometer chemical analysis, Brinell hardness testing, tensile & elongation verification, and hydrostatic pressure testing up to 350 bar when required.',
  },
  {
    id: 'faq-4',
    question: 'Can you work directly from 2D/3D CAD drawings?',
    answer: 'Yes, our engineering team works with STEP, IGES, SolidWorks, and AutoCAD 2D files. We perform tooling feasibility, draft angle optimization, and pattern match-plate fabrication in-house.',
  },
];

export const FaqSection: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [openId, setOpenId] = useState<string | null>('faq-1');

  const toggleFaq = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className={`py-6 sm:py-8 transition-colors duration-300 ${
      isLight ? 'bg-[#f4f7fb]' : 'bg-[#050608]'
    }`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        
        {/* Main Card Container with Scroll Animation */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
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
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-xs font-bold tracking-wider uppercase ${
                isLight
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-blue-500/10 text-sky-400 border border-blue-500/20'
              }`}>
                <HelpCircle className="w-3.5 h-3.5" />
                <span>FREQUENTLY ASKED QUESTIONS</span>
              </div>

              <h2 className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] ${
                isLight ? 'text-neutral-900' : 'text-white'
              }`}>
                Everything You Need to Know
              </h2>

              <p className={`text-sm sm:text-base leading-relaxed max-w-xl ${
                isLight ? 'text-neutral-600' : 'text-neutral-400'
              }`}>
                Clear answers on our foundry capabilities, alloy specifications, order lead times, and quality assurance.
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
              <div className={`relative w-full max-w-[280px] sm:max-w-[320px] aspect-[4/3] rounded-2xl overflow-hidden border shadow-xl ${
                isLight
                  ? 'border-neutral-200 shadow-[0_10px_30px_rgba(0,0,0,0.06)]'
                  : 'border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.8)]'
              }`}>
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
            {FAQS.map((faq, idx) => {
              const isOpen = openId === faq.id;
              return (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: idx * 0.08 }}
                  className="py-5 sm:py-6"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full flex items-center justify-between text-left gap-4 group cursor-pointer focus:outline-none"
                  >
                    <div className="flex items-center gap-3.5 sm:gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-colors ${
                        isOpen
                          ? isLight
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-600 text-white'
                          : isLight
                            ? 'bg-neutral-100 text-neutral-600 group-hover:bg-blue-50 group-hover:text-blue-600'
                            : 'bg-white/5 text-neutral-400 group-hover:bg-blue-500/10 group-hover:text-sky-400'
                      }`}>
                        ?
                      </div>

                      <h3 className={`text-base sm:text-lg font-bold tracking-tight transition-colors ${
                        isOpen
                          ? isLight
                            ? 'text-blue-600'
                            : 'text-sky-400'
                          : isLight
                            ? 'text-neutral-900 group-hover:text-blue-600'
                            : 'text-white group-hover:text-sky-400'
                      }`}>
                        {faq.question}
                      </h3>
                    </div>

                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                      isOpen
                        ? isLight
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-blue-600 border-blue-600 text-white'
                        : isLight
                          ? 'border-neutral-300 text-neutral-600 group-hover:border-blue-600 group-hover:text-blue-600'
                          : 'border-white/15 text-neutral-400 group-hover:border-white/30 group-hover:text-white'
                    }`}>
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
                          <p className={`text-sm sm:text-base leading-relaxed ${
                            isLight ? 'text-neutral-600' : 'text-neutral-300'
                          }`}>
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

          {/* Bottom Link to Full Resources & FAQ */}
          <div className="pt-8 sm:pt-10 flex justify-center border-t border-neutral-200/80 dark:border-white/10 mt-6">
            <Link
              to="/resources"
              className={`inline-flex items-center gap-2 text-xs sm:text-sm font-mono font-bold tracking-wider transition-colors ${
                isLight ? 'text-blue-600 hover:text-blue-700' : 'text-sky-400 hover:text-sky-300'
              }`}
            >
              <span>View All Technical FAQs &amp; Documentation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </motion.div>

      </div>
    </section>
  );
};
