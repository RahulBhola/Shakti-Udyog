import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Car,
  Tractor,
  Droplet,
  Cog,
  Building,
  Zap,
  Factory,
  ShieldCheck,
  Target,
  Award,
  Wrench,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Seo } from '../components/Seo';
import { Breadcrumb } from '../components/ui';
import { seoPages } from '../content/seo';
import { useTheme } from '../auth/ThemeContext';
import { getThemedImage } from '../utils/themeImage';

interface IndustrySector {
  id: string;
  badge: string;
  title: string;
  exampleComponents: string;
  icon: React.ReactNode;
  image: string;
  themeColor: 'purple' | 'emerald' | 'blue' | 'amber' | 'teal' | 'pink';
}

const SECTOR_CARDS: IndustrySector[] = [
  {
    id: 'automotive',
    badge: '01',
    title: 'Automotive & Commercial Vehicles',
    exampleComponents: 'Housings, brackets, carriers, hubs, manifolds',
    icon: <Car className="w-5 h-5" />,
    image: '/images/Gear Lever Parts/Cast Iron Car Gear Lever Part.png',
    themeColor: 'purple',
  },
  {
    id: 'agriculture',
    badge: '02',
    title: 'Agriculture',
    exampleComponents: 'Gearbox parts, pump bodies, housings, counterweights',
    icon: <Tractor className="w-5 h-5" />,
    image: '/images/cast_iron_casting/Cast Iron Tractor Part Casting.png',
    themeColor: 'emerald',
  },
  {
    id: 'pumps-valves',
    badge: '03',
    title: 'Pumps & Valves',
    exampleComponents: 'Bodies, covers, impellers, flanges, valve components',
    icon: <Droplet className="w-5 h-5" />,
    image: '/images/cast_iron_casting/Cast Iron Rotary Barrel Pump Casting.png',
    themeColor: 'blue',
  },
  {
    id: 'machine-tools',
    badge: '04',
    title: 'Machine Tools',
    exampleComponents: 'Beds, bases, tables, bearing housings, guards',
    icon: <Cog className="w-5 h-5" />,
    image: '/images/Sewing_machine_parts/Cast Iron TA 1 Bracket Industrial Sewing Machine Part.png',
    themeColor: 'amber',
  },
  {
    id: 'construction',
    badge: '05',
    title: 'Construction Equipment',
    exampleComponents: 'Housings, brackets, wear components, support parts',
    icon: <Building className="w-5 h-5" />,
    image: '/images/Hillside Washer/Cast Iron Hillside Washer.png',
    themeColor: 'teal',
  },
  {
    id: 'energy-infrastructure',
    badge: '06',
    title: 'Energy & Infrastructure',
    exampleComponents: 'Enclosures, fittings, structural components, equipment bases',
    icon: <Zap className="w-5 h-5" />,
    image: '/images/Collar Plug/Cast Iron Collar Plug.png',
    themeColor: 'pink',
  },
];

const COLOR_STYLES = {
  purple: {
    badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    icon: 'text-purple-600 dark:text-purple-400',
    border: 'hover:border-purple-500/50 border-purple-500/20 dark:border-purple-500/30',
    glow: 'shadow-[0_4px_25px_rgba(168,85,247,0.06)] hover:shadow-[0_0_30px_rgba(168,85,247,0.18)]',
  },
  emerald: {
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    icon: 'text-emerald-600 dark:text-emerald-400',
    border: 'hover:border-emerald-500/50 border-emerald-500/20 dark:border-emerald-500/30',
    glow: 'shadow-[0_4px_25px_rgba(16,185,129,0.06)] hover:shadow-[0_0_30px_rgba(16,185,129,0.18)]',
  },
  blue: {
    badge: 'bg-blue-500/10 text-blue-600 dark:text-sky-400 border-blue-500/30',
    icon: 'text-blue-600 dark:text-sky-400',
    border: 'hover:border-blue-500/50 border-blue-500/20 dark:border-blue-500/30',
    glow: 'shadow-[0_4px_25px_rgba(59,130,246,0.06)] hover:shadow-[0_0_30px_rgba(59,130,246,0.18)]',
  },
  amber: {
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    icon: 'text-amber-600 dark:text-amber-400',
    border: 'hover:border-amber-500/50 border-amber-500/20 dark:border-amber-500/30',
    glow: 'shadow-[0_4px_25px_rgba(245,158,11,0.06)] hover:shadow-[0_0_30px_rgba(245,158,11,0.18)]',
  },
  teal: {
    badge: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30',
    icon: 'text-teal-600 dark:text-teal-400',
    border: 'hover:border-teal-500/50 border-teal-500/20 dark:border-teal-500/30',
    glow: 'shadow-[0_4px_25px_rgba(20,184,166,0.06)] hover:shadow-[0_0_30px_rgba(20,184,166,0.18)]',
  },
  pink: {
    badge: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30',
    icon: 'text-pink-600 dark:text-pink-400',
    border: 'hover:border-pink-500/50 border-pink-500/20 dark:border-pink-500/30',
    glow: 'shadow-[0_4px_25px_rgba(236,72,153,0.06)] hover:shadow-[0_0_30px_rgba(236,72,153,0.18)]',
  },
};

const PILLARS = [
  {
    title: 'Built to Last',
    subtitle: 'High strength & durability',
    icon: <ShieldCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
  },
  {
    title: 'Precision Made',
    subtitle: 'Tight tolerances & consistency',
    icon: <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
  },
  {
    title: 'Quality Assured',
    subtitle: 'Tested for every critical use',
    icon: <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
  },
  {
    title: 'Custom Solutions',
    subtitle: 'Tailored to your industry needs',
    icon: <Wrench className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
  },
];

export default function IndustriesPage() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <>
      <Seo
        title={seoPages.industries.title}
        description={seoPages.industries.description}
        path="/industries"
      />

      <div className={`min-h-screen transition-colors duration-300 ${
        isLight ? 'bg-[#f8f9fa]' : 'bg-[#050608]'
      }`}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-32 pb-20 sm:pt-40 space-y-12 sm:space-y-14">
          
          {/* Breadcrumb Navigation */}
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Industries', href: '/industries' }]} />

          {/* Page Hero Header (Exact Layout from Reference Image) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3 max-w-3xl"
          >
            <div className="text-xs sm:text-sm font-mono font-bold tracking-widest uppercase text-purple-600 dark:text-purple-400">
              SECTORS
            </div>

            <h1 className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] ${
              isLight ? 'text-neutral-900' : 'text-white'
            }`}>
              Applications by <br />
              <span>Industry</span>
            </h1>

            <p className={`text-base sm:text-lg leading-relaxed ${
              isLight ? 'text-neutral-600' : 'text-neutral-400'
            }`}>
              Our cast iron components power performance across diverse industries with strength, precision, and reliability.
            </p>
          </motion.div>

          {/* 6 Grid Sector Cards (2 Rows x 3 Cols) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SECTOR_CARDS.map((sector, idx) => {
              const styles = COLOR_STYLES[sector.themeColor];
              const themedImg = getThemedImage(sector.image, isLight);

              return (
                <motion.div
                  key={sector.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.5, delay: idx * 0.08, ease: 'easeOut' }}
                  whileHover={{ y: -6, transition: { duration: 0.25 } }}
                  className={`group relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between border transition-all duration-300 ${styles.border} ${styles.glow} ${
                    isLight
                      ? 'bg-white shadow-[0_4px_24px_rgba(0,0,0,0.03)]'
                      : 'bg-[#090b10]/95 backdrop-blur-md'
                  }`}
                >
                  {/* Top: Badge + Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold border ${styles.badge}`}>
                      {sector.badge}
                    </div>

                    <div className={`${styles.icon} transition-transform duration-300 group-hover:scale-110`}>
                      {sector.icon}
                    </div>
                  </div>

                  {/* Middle Content */}
                  <div className="space-y-4">
                    <h3 className={`text-xl font-bold tracking-tight leading-snug min-h-[56px] flex items-center ${
                      isLight ? 'text-neutral-900' : 'text-white'
                    }`}>
                      {sector.title}
                    </h3>

                    {/* Example components */}
                    <div className="space-y-1">
                      <div className={`text-xs font-mono font-medium ${
                        isLight ? 'text-neutral-500' : 'text-neutral-400'
                      }`}>
                        Example components:
                      </div>
                      <p className={`text-xs sm:text-sm leading-relaxed ${
                        isLight ? 'text-neutral-700 font-medium' : 'text-neutral-300'
                      }`}>
                        {sector.exampleComponents}
                      </p>
                    </div>
                  </div>

                  {/* Bottom: 3D Cast Iron Component Visual */}
                  <div className={`mt-6 pt-4 h-48 sm:h-52 w-full flex items-center justify-center rounded-2xl overflow-hidden relative transition-all ${
                    isLight
                      ? 'bg-gradient-to-b from-neutral-50 to-neutral-100/50'
                      : 'bg-gradient-to-b from-[#0e121a]/80 to-[#06080e]'
                  }`}>
                    <img
                      src={themedImg}
                      alt={sector.title}
                      loading="lazy"
                      className={`max-h-40 sm:max-h-44 max-w-[90%] w-auto h-auto object-contain transition-transform duration-500 group-hover:scale-110 ${
                        isLight
                          ? 'drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)]'
                          : 'drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)]'
                      }`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* CARD 07: BOTTOM WIDE CARD (GENERAL ENGINEERING + 4 PILLAR BADGES) */}
          {/* ========================================================================= */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={`rounded-3xl p-6 sm:p-8 lg:p-10 border transition-all duration-300 border-purple-500/30 hover:border-purple-500/50 shadow-[0_4px_30px_rgba(168,85,247,0.08)] ${
              isLight
                ? 'bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)]'
                : 'bg-[#090b10]/95 backdrop-blur-md'
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column: General Engineering Info */}
              <div className="lg:col-span-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="px-2.5 py-1 rounded-lg font-mono text-xs font-bold border bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30">
                    07
                  </div>
                  <div className="text-purple-600 dark:text-purple-400">
                    <Factory className="w-5 h-5" />
                  </div>
                </div>

                <h3 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                  isLight ? 'text-neutral-900' : 'text-white'
                }`}>
                  General Engineering
                </h3>

                <div className="space-y-1">
                  <div className={`text-xs font-mono font-medium ${
                    isLight ? 'text-neutral-500' : 'text-neutral-400'
                  }`}>
                    Example components:
                  </div>
                  <p className={`text-xs sm:text-sm leading-relaxed ${
                    isLight ? 'text-neutral-700 font-medium' : 'text-neutral-300'
                  }`}>
                    Custom OEM parts based on drawings and specifications
                  </p>
                </div>
              </div>

              {/* Center Column: 3D Precision Flanged Disc / Wheel Visual */}
              <div className="lg:col-span-3 flex items-center justify-center p-2">
                <div className={`h-40 sm:h-44 w-full flex items-center justify-center rounded-2xl p-2 overflow-hidden transition-all ${
                  isLight
                    ? 'bg-gradient-to-b from-neutral-50 to-neutral-100/50'
                    : 'bg-gradient-to-b from-[#0e121a]/80 to-[#06080e]'
                }`}>
                  <img
                    src={getThemedImage('/images/Pulley Wheel/6 Inch Cast Iron Pulley Wheel.png', isLight)}
                    alt="General Engineering Flange Disc"
                    loading="lazy"
                    className={`max-h-36 max-w-[90%] w-auto h-auto object-contain transition-transform duration-500 hover:scale-110 ${
                      isLight
                        ? 'drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)]'
                        : 'drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)]'
                    }`}
                  />
                </div>
              </div>

              {/* Right Column: 4 Pillar Features */}
              <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-2 gap-4 sm:gap-6 pt-4 lg:pt-0 lg:pl-4 border-t lg:border-t-0 lg:border-l border-neutral-200/80 dark:border-white/[0.08]">
                {PILLARS.map((pillar) => (
                  <div key={pillar.title} className="space-y-1.5">
                    <div className="mb-2">
                      {pillar.icon}
                    </div>
                    <h4 className={`text-sm sm:text-base font-bold tracking-tight ${
                      isLight ? 'text-neutral-900' : 'text-white'
                    }`}>
                      {pillar.title}
                    </h4>
                    <p className={`text-xs font-mono leading-relaxed ${
                      isLight ? 'text-neutral-500' : 'text-neutral-400'
                    }`}>
                      {pillar.subtitle}
                    </p>
                  </div>
                ))}
              </div>

            </div>
          </motion.div>

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
                  <span>CUSTOM OEM SPECIFICATIONS</span>
                </div>

                <h2 className={`text-3xl sm:text-5xl font-black tracking-tight leading-[1.08] ${
                  isLight ? 'text-neutral-900' : 'text-white'
                }`}>
                  Don't see your specific industry?
                </h2>

                <p className={`text-sm sm:text-base leading-relaxed ${
                  isLight ? 'text-neutral-600' : 'text-neutral-300'
                }`}>
                  If it requires high-grade grey iron or ductile iron casting, our metallurgical engineers can review your drawings and develop custom tooling for your serial production.
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
                  <span>Consult Engineering</span>
                </Link>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </>
  );
}
