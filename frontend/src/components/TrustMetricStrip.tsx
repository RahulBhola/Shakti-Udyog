import React from 'react';
import { Award, Layers, Scale, ShieldCheck } from 'lucide-react';
import { useTheme } from '../auth/ThemeContext';

export const TrustMetricStrip: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const metrics = [
    {
      value: '60+',
      label: 'Years of Foundry Heritage',
      sublabel: 'Continuous induction casting excellence since 1965',
      icon: <Award className="w-6 h-6" />,
      accentColor: 'text-amber-500',
      badgeBg: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
    },
    {
      value: '50+',
      label: 'Casting Grades & Specs',
      sublabel: 'Grey Iron (FG 150–350) & Ductile Iron (SG 400–700)',
      icon: <Layers className="w-6 h-6" />,
      accentColor: 'text-sky-400',
      badgeBg: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
    },
    {
      value: '300+',
      label: 'Tons Monthly Capacity',
      sublabel: 'High-volume automated mould line output',
      icon: <Scale className="w-6 h-6" />,
      accentColor: 'text-blue-500',
      badgeBg: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
    },
    {
      value: '9,000+',
      label: 'OEM Parts Delivered',
      sublabel: 'Zero-defect precision delivery across India',
      icon: <ShieldCheck className="w-6 h-6" />,
      accentColor: 'text-orange-500',
      badgeBg: 'bg-orange-500/10 border-orange-500/20 text-orange-500',
    },
  ];

  return (
    <section className={`relative py-8 sm:py-12 transition-colors duration-300 ${
      isLight ? 'bg-[#f4f7fb]' : 'bg-[#050608]'
    }`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        
        {/* Floating Glassmorphic Authority Container */}
        <div className={`rounded-3xl p-6 sm:p-8 lg:p-10 border backdrop-blur-xl transition-all duration-300 shadow-2xl ${
          isLight
            ? 'bg-white border-neutral-200/90 shadow-[0_10px_40px_rgba(0,0,0,0.04)] text-neutral-900'
            : 'bg-[#080a0f]/90 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-white'
        }`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {metrics.map((m) => (
              <div
                key={m.label}
                className={`relative rounded-2xl p-5 sm:p-6 border transition-all duration-300 group flex flex-col justify-between ${
                  isLight
                    ? 'bg-neutral-50/70 border-neutral-200/80 hover:bg-white hover:border-blue-300 hover:shadow-lg'
                    : 'bg-[#0c0e16] border-white/[0.06] hover:border-white/20 hover:bg-[#10121c] hover:shadow-[0_0_25px_rgba(255,255,255,0.03)]'
                }`}
              >
                
                {/* Top Row: Metric Value + Icon */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`text-4xl sm:text-5xl font-black tracking-tight ${
                    isLight
                      ? 'text-neutral-900'
                      : 'bg-gradient-to-r from-white via-neutral-100 to-neutral-300 bg-clip-text text-transparent'
                  }`}>
                    {m.value}
                  </div>

                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-110 ${m.badgeBg}`}>
                    {m.icon}
                  </div>
                </div>

                {/* Bottom Row: Label & Sublabel */}
                <div className="space-y-1 pt-2 border-t border-neutral-200/60 dark:border-white/[0.06]">
                  <h3 className={`text-sm sm:text-base font-bold tracking-tight ${
                    isLight ? 'text-neutral-900' : 'text-white'
                  }`}>
                    {m.label}
                  </h3>
                  <p className={`text-xs leading-relaxed ${
                    isLight ? 'text-neutral-600' : 'text-neutral-400'
                  }`}>
                    {m.sublabel}
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
