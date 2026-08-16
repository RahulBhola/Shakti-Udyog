import React from 'react';
import { Award, Layers, Scale, ShieldCheck } from 'lucide-react';
import { useTheme } from '../auth/ThemeContext';

export const TrustMetricStrip: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const metrics = [
    {
      value: '60+',
      tag: 'Heritage',
      label: 'Years of Foundry Heritage',
      sublabel: 'Continuous induction casting excellence since 1965',
      icon: <Award className="w-5 h-5" />,
      badgeBg: isLight
        ? 'bg-amber-50 text-amber-600 border border-amber-200 shadow-sm'
        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    },
    {
      value: '50+',
      tag: 'Materials',
      label: 'Casting Grades & Specs',
      sublabel: 'Grey Iron (FG 150–350) & Ductile Iron (SG 400–700)',
      icon: <Layers className="w-5 h-5" />,
      badgeBg: isLight
        ? 'bg-sky-50 text-sky-600 border border-sky-200 shadow-sm'
        : 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
    },
    {
      value: '300+',
      tag: 'Scale',
      label: 'Tons Monthly Capacity',
      sublabel: 'High-volume automated mould line output',
      icon: <Scale className="w-5 h-5" />,
      badgeBg: isLight
        ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm'
        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    },
    {
      value: '9,000+',
      tag: 'Precision',
      label: 'OEM Parts Delivered',
      sublabel: 'Zero-defect precision delivery across India',
      icon: <ShieldCheck className="w-5 h-5" />,
      badgeBg: isLight
        ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-sm'
        : 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    },
  ];

  return (
    <section className={`relative py-8 sm:py-12 transition-colors duration-300 ${
      isLight ? 'bg-[#f4f7fb]' : 'bg-[#050608]'
    }`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        
        {/* Floating Glassmorphic Authority Container */}
        <div className={`rounded-3xl p-6 sm:p-8 lg:p-10 border transition-all duration-300 shadow-2xl ${
          isLight
            ? 'bg-white border-neutral-200/90 shadow-[0_10px_40px_rgba(0,0,0,0.04)] text-neutral-900'
            : 'bg-[#080a0f] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.9)] text-white'
        }`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {metrics.map((m) => (
              <div
                key={m.label}
                className={`relative rounded-2xl p-6 sm:p-7 border transition-all duration-300 group flex flex-col justify-between ${
                  isLight
                    ? 'bg-neutral-50/80 border-neutral-200/80 hover:bg-white hover:border-blue-300 hover:shadow-xl'
                    : 'bg-[#0c0e16] border-white/[0.08] hover:border-white/20 hover:bg-[#10121c] hover:shadow-[0_0_30px_rgba(255,255,255,0.03)]'
                }`}
              >
                <div>
                  {/* 1. Top Row: Icon Badge + Category Tag */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${m.badgeBg}`}>
                      {m.icon}
                    </div>

                    <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-neutral-400">
                      {m.tag}
                    </span>
                  </div>

                  {/* 2. Big Bold Number with Generous Clearance */}
                  <div className={`text-4xl sm:text-5xl font-black tracking-tight mb-2 ${
                    isLight ? 'text-neutral-900' : 'text-white'
                  }`}>
                    {m.value}
                  </div>
                </div>

                <div>
                  {/* 3. Divider */}
                  <div className="border-t border-neutral-200/80 dark:border-white/10 my-3" />

                  {/* 4. Title & Sublabel */}
                  <div className="space-y-1.5">
                    <h3 className={`text-lg sm:text-xl font-extrabold tracking-tight leading-snug ${
                      isLight ? 'text-neutral-900' : 'text-white'
                    }`}>
                      {m.label}
                    </h3>
                    <p className={`text-xs sm:text-sm leading-relaxed font-normal ${
                      isLight ? 'text-neutral-600' : 'text-neutral-400'
                    }`}>
                      {m.sublabel}
                    </p>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
