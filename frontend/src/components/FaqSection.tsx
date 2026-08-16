import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Plus, Minus, FileText, ArrowRight } from 'lucide-react';
import { useTheme } from '../auth/ThemeContext';

export interface FaqItem {
  question: string;
  answer: string;
}

export const FaqSection: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqs: FaqItem[] = [
    {
      question: 'What information do you need to quote a casting?',
      answer:
        'To provide an accurate and competitive quotation, we require your 2D/3D technical drawings (STEP, IGES, or PDF), estimated annual/batch quantities, required material grade (e.g., FG 200–300 or SG 400–700), machining tolerances, and any specific testing or inspection requirements.',
    },
    {
      question: 'Can Shakti Udyog develop custom castings?',
      answer:
        'Yes, we specialize in end-to-end custom casting development from pattern making and sample approval to batch production, CNC machining, and quality certification.',
    },
    {
      question: 'Do you supply machined castings?',
      answer:
        'Yes, we provide proof-machined and fully finished CNC/VMC machined components ready for immediate assembly in your production line.',
    },
  ];

  const toggleFaq = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className={`py-20 sm:py-28 transition-colors duration-300 ${
      isLight ? 'bg-[#f4f7fb]' : 'bg-[#050608]'
    }`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        
        {/* Main Card Container */}
        <div className={`rounded-3xl p-8 sm:p-14 border transition-all duration-300 ${
          isLight
            ? 'bg-white border-neutral-200/90 shadow-[0_10px_40px_rgba(0,0,0,0.04)] text-neutral-900'
            : 'bg-[#080a0f] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.9)] text-white'
        }`}>
          
          {/* Top Header: Left Title + Right 3D Molten Pour Visual */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 pb-10 border-b border-neutral-100 dark:border-white/5">
            
            {/* Left Title */}
            <div className="space-y-3">
              <div className={`text-sm sm:text-base font-mono font-bold tracking-widest uppercase ${
                isLight ? 'text-blue-600' : 'text-sky-400'
              }`}>
                COMMON QUESTIONS
              </div>
              <h2 className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight ${
                isLight ? 'text-neutral-900' : 'text-white'
              }`}>
                FAQs
              </h2>
            </div>

            {/* Right: Large Cinematic Molten Foundry Ladle Visual */}
            <div className="relative w-full md:w-96 h-40 sm:h-48 rounded-2xl overflow-hidden border border-orange-500/20 shadow-xl shrink-0">
              <img
                src="/images/faq-molten-ladle.jpg"
                alt="Foundry Molten Metal Casting Process"
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent pointer-events-none" />
            </div>

          </div>

          {/* Accordion Questions List with Larger Typography */}
          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = expandedIndex === index;
              return (
                <div
                  key={faq.question}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? isLight
                        ? 'bg-blue-50/50 border-blue-200 shadow-sm'
                        : 'bg-[#0f111a] border-blue-500/30 shadow-md'
                      : isLight
                        ? 'bg-neutral-50/80 border-neutral-200/80 hover:bg-white'
                        : 'bg-[#0a0c12] border-white/[0.06] hover:border-white/10'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                    className="w-full p-6 sm:p-7 text-left flex items-center justify-between gap-4 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        isOpen
                          ? isLight
                            ? 'bg-blue-600 text-white'
                            : 'bg-sky-400 text-black'
                          : isLight
                            ? 'bg-neutral-200 text-neutral-600'
                            : 'bg-white/5 text-neutral-400'
                      }`}>
                        <HelpCircle className="w-5 h-5" />
                      </div>
                      <span className={`text-base sm:text-lg lg:text-xl font-bold tracking-tight ${
                        isLight ? 'text-neutral-900' : 'text-white'
                      }`}>
                        {faq.question}
                      </span>
                    </div>

                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform ${
                      isOpen
                        ? isLight
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-blue-500/20 text-sky-400'
                        : isLight
                          ? 'bg-neutral-200 text-neutral-600'
                          : 'bg-white/10 text-neutral-400'
                    }`}>
                      {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-7 pb-7 pt-1 text-sm sm:text-base leading-relaxed text-neutral-600 dark:text-neutral-300 pl-19">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Bar: More questions link + View All FAQs Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-10 pt-8 border-t border-neutral-100 dark:border-white/5">
            <Link
              to="/resources"
              className={`inline-flex items-center gap-2 text-sm sm:text-base font-semibold transition-colors ${
                isLight ? 'text-blue-600 hover:text-blue-700' : 'text-sky-400 hover:text-sky-300'
              }`}
            >
              <span>More questions? See our resources</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/resources"
              className={`inline-flex items-center gap-2.5 px-7 py-3 rounded-full text-xs sm:text-sm font-mono font-bold tracking-wider transition-all border shadow-sm ${
                isLight
                  ? 'bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-100'
                  : 'bg-blue-950/40 border-blue-500/40 text-sky-400 hover:bg-blue-900/60 shadow-[0_0_15px_rgba(56,189,248,0.15)]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>View All FAQs</span>
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
};
