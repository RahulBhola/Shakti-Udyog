import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Cog,
  Flame,
  CheckCircle2,
  Truck,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  Headphones,
} from 'lucide-react';
import { useTheme } from '../auth/ThemeContext';

export const EnquiryToDeliverySection: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const steps = [
    {
      number: '01',
      title: 'Enquiry & Spec Review',
      description: 'Submit 2D/3D CAD drawings. Our engineers review tolerances, metal grades, and tooling options within 24 hours.',
      icon: <FileText className="w-6 h-6" />,
      badge: 'Step 1',
    },
    {
      number: '02',
      title: 'Pattern & Tooling',
      description: 'High-precision aluminum or wooden match plates crafted with shrinkage allowances for repeatable dimensional accuracy.',
      icon: <Cog className="w-6 h-6" />,
      badge: 'Step 2',
    },
    {
      number: '03',
      title: 'Melting & Casting',
      description: 'Induction furnace melting with spectrometer-verified chemistry and controlled pouring into automated sand moulds.',
      icon: <Flame className="w-6 h-6" />,
      badge: 'Step 3',
    },
    {
      number: '04',
      title: 'Quality & Testing',
      description: 'Shot blasting, fettling, hardness testing, tensile verification, and hydrostatic pressure testing to ensure zero defects.',
      icon: <CheckCircle2 className="w-6 h-6" />,
      badge: 'Step 4',
    },
    {
      number: '05',
      title: 'Dispatch & Delivery',
      description: 'Protective rust-preventive packaging with batch test certificates, dispatched via reliable logistics across India.',
      icon: <Truck className="w-6 h-6" />,
      badge: 'Step 5',
    },
  ];

  const features = [
    {
      title: '24hr Quote Turnaround',
      description: 'Fast feasibility feedback and transparent batch pricing',
      icon: <Clock className="w-6 h-6" />,
    },
    {
      title: 'Zero Defect Policy',
      description: '100% visual and dimensional QA checks before dispatch',
      icon: <ShieldCheck className="w-6 h-6" />,
    },
    {
      title: 'Flexible Batch Sizes',
      description: 'From 50-piece prototypes to 50,000+ monthly runs',
      icon: <Zap className="w-6 h-6" />,
    },
    {
      title: 'Expert Support',
      description: 'Dedicated team for all your casting needs',
      icon: <Headphones className="w-6 h-6" />,
    },
  ];

  return (
    <section className={`relative py-10 sm:py-14 overflow-hidden transition-colors duration-300 ${
      isLight ? 'bg-[#f4f7fb]' : 'bg-[#050608]'
    }`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        
        {/* Top Split Section: Left Headline/CTA + Right 3D Pedestal Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center mb-16 sm:mb-20">
          
          {/* Left Column: Headline & CTA with Scroll Animation */}
          <motion.div
            initial={{ opacity: 0, x: -35 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 space-y-6"
          >
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-xs font-bold tracking-wider uppercase ${
              isLight
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-blue-500/10 text-sky-400 border border-blue-500/20'
            }`}>
              HOW WE WORK
            </div>

            <h2 className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] ${
              isLight ? 'text-neutral-900' : 'text-white'
            }`}>
              From Enquiry to Delivery
            </h2>

            <p className={`text-base sm:text-lg leading-relaxed max-w-xl ${
              isLight ? 'text-neutral-600' : 'text-neutral-300'
            }`}>
              A streamlined process that ensures quality, precision, and on-time delivery every time.
            </p>

            <div className="pt-2">
              <Link
                to="/request-a-quote"
                className={`inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-sm font-bold shadow-lg transition-all transform hover:scale-105 ${
                  isLight
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                    : 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white shadow-blue-500/30'
                }`}
              >
                <span>Start Your Enquiry</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* Right Column: 3D Pedestal Stage with Scroll Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 flex justify-center"
          >
            <div className={`relative w-full max-w-md rounded-3xl p-6 sm:p-8 border shadow-2xl overflow-hidden flex flex-col items-center justify-center transition-all ${
              isLight
                ? 'bg-white border-neutral-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.06)]'
                : 'bg-gradient-to-b from-[#0e1017] to-[#06070a] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)]'
            }`}>
              <div className="relative w-full h-64 sm:h-72 flex items-center justify-center">
                <img
                  src="/images/Industrial Iron Casting.png"
                  alt="Industrial Casting"
                  loading="lazy"
                  className="max-h-56 sm:max-h-64 w-auto object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] transform hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Pedestal Spec Label */}
              <div className={`mt-4 w-full py-2.5 px-4 rounded-xl border text-center font-mono text-xs font-semibold ${
                isLight
                  ? 'bg-neutral-50 text-neutral-800 border-neutral-200'
                  : 'bg-white/5 text-neutral-300 border-white/10'
              }`}>
                Precision Machined SG 500/7 Component
              </div>
            </div>
          </motion.div>

        </div>

        {/* 5-Step Process Timeline Cards with Staggered Scroll Animation */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-16 sm:mb-20">
          {steps.map((step, idx) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: idx * 0.1, ease: 'easeOut' }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className={`relative rounded-3xl p-6 border flex flex-col justify-between transition-all duration-300 group ${
                isLight
                  ? 'bg-white border-neutral-200/90 hover:border-blue-400 hover:shadow-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)]'
                  : 'bg-[#08090e] border-white/[0.08] hover:border-sky-500/40 hover:bg-[#0c0d14] hover:shadow-[0_0_25px_rgba(56,189,248,0.12)]'
              }`}
            >
              <div>
                {/* Step Top Bar: Icon + Number */}
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                    isLight
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'bg-blue-500/10 text-sky-400 border border-blue-500/20'
                  }`}>
                    {step.icon}
                  </div>

                  <span className="font-mono text-2xl font-black text-neutral-400/60">
                    {step.number}
                  </span>
                </div>

                {/* Step Title & Description */}
                <div className="space-y-2.5 mb-4">
                  <h3 className={`text-lg sm:text-xl font-extrabold tracking-tight ${
                    isLight ? 'text-neutral-900' : 'text-white'
                  }`}>
                    {step.title}
                  </h3>
                  <p className={`text-xs sm:text-sm leading-relaxed ${
                    isLight ? 'text-neutral-600' : 'text-neutral-400'
                  }`}>
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Bottom Step Indicator Tag */}
              <div className="pt-3 border-t border-neutral-100 dark:border-white/5">
                <span className={`inline-block font-mono text-[10px] font-bold uppercase tracking-widest ${
                  isLight ? 'text-blue-600' : 'text-sky-400'
                }`}>
                  {step.badge}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 4-Column Value Proposition Bar with Scroll Animation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className={`rounded-3xl p-6 sm:p-8 lg:p-10 border transition-all ${
            isLight
              ? 'bg-white border-neutral-200/90 shadow-[0_10px_30px_rgba(0,0,0,0.03)]'
              : 'bg-[#08090e] border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.6)]'
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((feat, idx) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
                className="flex items-start gap-4"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  isLight
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'bg-blue-500/10 text-sky-400 border border-blue-500/20'
                }`}>
                  {feat.icon}
                </div>

                <div className="space-y-1">
                  <h4 className={`text-base font-extrabold tracking-tight ${
                    isLight ? 'text-neutral-900' : 'text-white'
                  }`}>
                    {feat.title}
                  </h4>
                  <p className={`text-xs sm:text-sm leading-relaxed ${
                    isLight ? 'text-neutral-600' : 'text-neutral-400'
                  }`}>
                    {feat.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
};
