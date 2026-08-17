import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  ArrowRight,
  ClipboardCheck,
  Truck,
  ShieldCheck,
  Crosshair,
  Clock,
  Headphones,
  FileEdit,
  Cog,
  Search,
} from 'lucide-react';
import { useTheme } from '../auth/ThemeContext';
import { getThemedImage } from '../utils/themeImage';

export const EnquiryToDeliverySection: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const steps = [
    {
      step: 1,
      title: 'Share Requirement',
      description: 'Share your drawing, sample, or requirement with us.',
      icon: <FileEdit className="w-7 h-7" />,
    },
    {
      step: 2,
      title: 'Review & Quote',
      description: 'We review manufacturability and prepare a detailed quotation.',
      icon: <ClipboardCheck className="w-7 h-7" />,
    },
    {
      step: 3,
      title: 'Planning & Approval',
      description: 'Pattern and process planning are finalized after approval.',
      icon: <Cog className="w-7 h-7" />,
    },
    {
      step: 4,
      title: 'Production & Inspection',
      description: 'Castings are produced and inspected as per the agreed specification.',
      icon: <Search className="w-7 h-7" />,
    },
    {
      step: 5,
      title: 'Finishing & Delivery',
      description: 'Machining, finishing, packing, and delivery are completed as required.',
      icon: <Truck className="w-7 h-7" />,
    },
  ];

  const valueProps = [
    {
      title: 'Quality Assured',
      description: 'Strict quality checks at every stage',
      icon: <ShieldCheck className="w-6 h-6" />,
    },
    {
      title: 'Precision Engineering',
      description: 'Tight tolerances and consistent accuracy',
      icon: <Crosshair className="w-6 h-6" />,
    },
    {
      title: 'On-Time Delivery',
      description: 'Reliable lead times and commitment',
      icon: <Clock className="w-6 h-6" />,
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
        
        {/* Top Split Section: Left Headline/CTA + Right 3D Pedestal Stage with Scroll Animation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center mb-16 sm:mb-20">
          
          {/* Left Column: Headline & CTA */}
          <motion.div
            initial={{ opacity: 0, x: -35 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-block text-xs font-mono font-bold tracking-widest uppercase text-blue-600 dark:text-sky-400">
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
                className={`inline-flex items-center gap-3 px-8 py-3.5 rounded-full text-sm sm:text-base font-semibold tracking-wide text-white transition-all transform hover:scale-105 shadow-md ${
                  isLight
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25'
                    : 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span>Discuss Your Casting Requirement</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* Right Column: 3D Stage with Concentric Rings & User Casting Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 relative flex items-center justify-center"
          >
            {/* Concentric Wave Rings SVG Background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 dark:opacity-20">
              <div className="w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] rounded-full border border-blue-300 dark:border-white/10 animate-pulse" />
              <div className="absolute w-[240px] h-[240px] sm:w-[320px] sm:h-[320px] rounded-full border border-blue-400/50 dark:border-white/10" />
              <div className="absolute w-[160px] h-[160px] sm:w-[220px] sm:h-[220px] rounded-full border border-blue-500/40 dark:border-white/10" />
            </div>

            {/* Floating 3D Pedestal Disc */}
            <div className={`relative w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] rounded-full flex items-center justify-center p-6 border shadow-2xl transition-all ${
              isLight
                ? 'bg-gradient-to-b from-white via-blue-50/50 to-blue-100/60 border-blue-100 shadow-[0_25px_60px_rgba(10,37,64,0.12)]'
                : 'bg-gradient-to-b from-[#181a24] via-[#101118] to-[#0a0b10] border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.9)]'
            }`}>
              
              {/* Top Surface Pedestal Ring */}
              <div className={`absolute inset-4 rounded-full border ${
                isLight ? 'border-blue-200/50 bg-white/70' : 'border-white/5 bg-[#0f1017]/80'
              } shadow-inner flex items-center justify-center overflow-hidden`}>
                
                {/* The User-Provided Casting Image */}
                <img
                  src={getThemedImage('/images/enquiry-delivery-casting.png', isLight)}
                  alt="Precision Cast Iron Component"
                  className={`max-h-[84%] max-w-[84%] object-contain transform hover:scale-105 transition-transform duration-500 ${
                    isLight ? 'drop-shadow-[0_12px_24px_rgba(0,0,0,0.12)]' : 'drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)]'
                  }`}
                />
              </div>
            </div>

          </motion.div>

        </div>

        {/* 5-Step Process Timeline Cards with Number Circles */}
        <div className="relative mb-14 sm:mb-16">
          
          {/* Dotted / Dashed Connecting Track Line (Desktop) */}
          <div className={`hidden lg:block absolute top-[18px] left-[10%] right-[10%] h-0.5 border-t-2 border-dashed z-0 ${
            isLight ? 'border-blue-200' : 'border-neutral-700'
          }`} />

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-5 relative z-10">
            {steps.map((s, idx) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.5, delay: idx * 0.1, ease: 'easeOut' }}
                className="flex flex-col items-center"
              >
                
                {/* Step Number Circle */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white mb-4 shadow-md ring-4 ${
                  isLight
                    ? 'bg-blue-600 ring-[#f4f7fb]'
                    : 'bg-blue-600 ring-[#050608]'
                }`}>
                  {s.step}
                </div>

                {/* Card Container */}
                <div className={`w-full h-full rounded-2xl sm:rounded-3xl p-6 sm:p-7 text-center flex flex-col items-center justify-between border transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${
                  isLight
                    ? 'bg-white border-neutral-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-blue-400'
                    : 'bg-[#0c0d14] border-white/[0.08] shadow-xl hover:border-sky-500/50 hover:bg-[#10111a]'
                }`}>
                  
                  {/* Step Icon Badge */}
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 ${
                    isLight ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-white/5 text-sky-400 border border-white/10'
                  }`}>
                    {s.icon}
                  </div>

                  <div className="space-y-2.5">
                    <h3 className={`text-base sm:text-lg font-bold tracking-tight ${
                      isLight ? 'text-neutral-900' : 'text-white'
                    }`}>
                      {s.title}
                    </h3>
                    <p className={`text-xs sm:text-sm leading-relaxed ${
                      isLight ? 'text-neutral-600' : 'text-neutral-400'
                    }`}>
                      {s.description}
                    </p>
                  </div>

                </div>

              </motion.div>
            ))}
          </div>

        </div>

        {/* Bottom Feature Strip Bar */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55 }}
          className={`rounded-2xl sm:rounded-3xl p-6 sm:p-7 border shadow-sm transition-colors ${
            isLight
              ? 'bg-white border-neutral-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
              : 'bg-[#0c0d14] border-white/[0.08]'
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {valueProps.map((vp, idx) => (
              <motion.div
                key={vp.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="flex items-center gap-4"
              >
                
                {/* Round Icon Badge */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                  isLight
                    ? 'bg-blue-50 text-blue-600 border-blue-100'
                    : 'bg-white/5 text-sky-400 border border-white/10'
                }`}>
                  {vp.icon}
                </div>

                <div>
                  <h4 className={`text-sm sm:text-base font-bold tracking-tight ${
                    isLight ? 'text-neutral-900' : 'text-white'
                  }`}>
                    {vp.title}
                  </h4>
                  <p className={`text-xs sm:text-sm ${
                    isLight ? 'text-neutral-600' : 'text-neutral-400'
                  }`}>
                    {vp.description}
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
