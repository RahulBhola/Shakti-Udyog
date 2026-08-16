import React from 'react';
import { Link } from 'react-router-dom';
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

export const EnquiryToDeliverySection: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const steps = [
    {
      step: 1,
      title: 'Share Requirement',
      description: 'Share your drawing, sample, or requirement with us.',
      icon: <FileEdit className="w-8 h-8" />,
    },
    {
      step: 2,
      title: 'Review & Quote',
      description: 'We review manufacturability and prepare a detailed quotation.',
      icon: <ClipboardCheck className="w-8 h-8" />,
    },
    {
      step: 3,
      title: 'Planning & Approval',
      description: 'Pattern and process planning are finalized after approval.',
      icon: <Cog className="w-8 h-8" />,
    },
    {
      step: 4,
      title: 'Production & Inspection',
      description: 'Castings are produced and inspected as per the agreed specification.',
      icon: <Search className="w-8 h-8" />,
    },
    {
      step: 5,
      title: 'Finishing & Delivery',
      description: 'Machining, finishing, packing, and delivery are completed as required.',
      icon: <Truck className="w-8 h-8" />,
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
        
        {/* Top Split Section: Left Headline/CTA + Right 3D Pedestal Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center mb-16 sm:mb-20">
          
          {/* Left Column: Headline & CTA */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-block text-xs sm:text-sm font-mono font-bold tracking-widest uppercase text-blue-600 dark:text-orange-500">
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
                className={`inline-flex items-center gap-3 px-8 py-4 rounded-full text-sm sm:text-base font-semibold tracking-wide text-white transition-all transform hover:scale-105 shadow-md ${
                  isLight
                    ? 'bg-[#0a2540] hover:bg-[#071a2e]'
                    : 'bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 shadow-[0_0_20px_rgba(255,109,0,0.3)]'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span>Discuss Your Casting Requirement</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Column: 3D Pedestal Stage with Concentric Ripple Lines & Clean Transparent Casting */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            
            {/* Concentric Wave Rings Background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50 dark:opacity-20">
              <div className="w-[340px] h-[340px] sm:w-[440px] sm:h-[440px] rounded-full border border-blue-200 dark:border-white/10 animate-pulse" />
              <div className="absolute w-[260px] h-[260px] sm:w-[340px] sm:h-[340px] rounded-full border border-blue-300/60 dark:border-white/10" />
              <div className="absolute w-[180px] h-[180px] sm:w-[240px] sm:h-[240px] rounded-full border border-blue-400/40 dark:border-white/10" />
            </div>

            {/* 3D Round Pedestal Stage */}
            <div className="relative w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] flex items-center justify-center">
              
              {/* Bottom 3D Pedestal Disc */}
              <div className={`absolute bottom-4 w-[280px] h-[110px] sm:w-[340px] sm:h-[130px] rounded-[100%] border shadow-2xl transition-all ${
                isLight
                  ? 'bg-gradient-to-b from-white via-blue-50/80 to-blue-100/90 border-blue-200/80 shadow-[0_25px_50px_rgba(10,37,64,0.14)]'
                  : 'bg-gradient-to-b from-[#1c1e2a] via-[#12131c] to-[#0a0b10] border-white/10 shadow-[0_25px_50px_rgba(0,0,0,0.9)]'
              }`} />

              {/* Top Surface Pedestal Ring */}
              <div className={`absolute bottom-10 w-[240px] h-[90px] sm:w-[290px] sm:h-[105px] rounded-[100%] border ${
                isLight ? 'border-blue-100 bg-white/95' : 'border-white/5 bg-[#14151f]'
              } shadow-inner flex items-center justify-center`} />

              {/* Transparent Isolated Casting Floating on Pedestal */}
              <div className="relative z-10 w-full h-full flex items-center justify-center pb-6">
                <img
                  src="/images/enquiry-delivery-casting-transparent.png"
                  alt="Precision Cast Iron Component"
                  className={`max-h-[75%] max-w-[75%] object-contain transform hover:scale-105 transition-transform duration-500 ${
                    isLight
                      ? 'drop-shadow-[0_25px_25px_rgba(10,37,64,0.28)]'
                      : 'drop-shadow-[0_25px_35px_rgba(0,0,0,0.95)]'
                  }`}
                />
              </div>

            </div>

          </div>

        </div>

        {/* 5-Step Process Timeline Cards */}
        <div className="relative mb-14 sm:mb-16">
          
          {/* Dotted / Dashed Connecting Track Line (Desktop) */}
          <div className={`hidden lg:block absolute top-[18px] left-[10%] right-[10%] h-0.5 border-t-2 border-dashed z-0 ${
            isLight ? 'border-blue-200' : 'border-neutral-700'
          }`} />

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-5 relative z-10">
            {steps.map((s) => (
              <div key={s.step} className="flex flex-col items-center">
                
                {/* Step Number Circle */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white mb-4 shadow-md ring-4 ${
                  isLight
                    ? 'bg-blue-600 ring-[#f4f7fb]'
                    : 'bg-orange-500 ring-[#050608]'
                }`}>
                  {s.step}
                </div>

                {/* Card Container */}
                <div className={`w-full h-full rounded-2xl sm:rounded-3xl p-6 sm:p-7 text-center flex flex-col items-center justify-between border transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${
                  isLight
                    ? 'bg-white border-neutral-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-blue-400'
                    : 'bg-[#0c0d14] border-white/[0.08] shadow-xl hover:border-orange-500/50 hover:bg-[#10111a]'
                }`}>
                  
                  {/* Step Icon Badge */}
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 ${
                    isLight
                      ? 'bg-[#eff6ff] text-[#2563eb] border border-blue-100/90'
                      : 'bg-white/5 text-orange-400 border border-white/10'
                  }`}>
                    {s.icon}
                  </div>

                  <div className="space-y-2.5">
                    <h3 className={`text-lg sm:text-xl font-extrabold tracking-tight ${
                      isLight ? 'text-neutral-900' : 'text-white'
                    }`}>
                      {s.title}
                    </h3>
                    <p className={`text-xs sm:text-sm leading-relaxed font-normal ${
                      isLight ? 'text-neutral-600' : 'text-neutral-300'
                    }`}>
                      {s.description}
                    </p>
                  </div>

                </div>

              </div>
            ))}
          </div>

        </div>

        {/* 4-Column Value Proposition Bottom Strip */}
        <div className={`rounded-3xl p-7 sm:p-9 border transition-all duration-300 shadow-xl ${
          isLight
            ? 'bg-white border-neutral-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
            : 'bg-[#0a0b12] border-white/[0.08]'
        }`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {valueProps.map((v) => (
              <div key={v.title} className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                  isLight
                    ? 'bg-blue-50 text-blue-600 border-blue-200/80 shadow-sm'
                    : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                }`}>
                  {v.icon}
                </div>
                <div className="space-y-1.5">
                  <h4 className={`text-base sm:text-lg font-extrabold tracking-tight ${
                    isLight ? 'text-neutral-900' : 'text-white'
                  }`}>
                    {v.title}
                  </h4>
                  <p className={`text-xs sm:text-sm leading-relaxed ${
                    isLight ? 'text-neutral-600' : 'text-neutral-400'
                  }`}>
                    {v.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
