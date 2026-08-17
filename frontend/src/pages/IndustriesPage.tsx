import React from 'react';
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
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    icon: 'text-purple-400',
    card: 'border-purple-500/30 hover:border-purple-500/60 shadow-[0_0_25px_rgba(168,85,247,0.12)]',
    radialGlow: 'from-purple-500/10',
  },
  emerald: {
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    icon: 'text-emerald-400',
    card: 'border-emerald-500/30 hover:border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.12)]',
    radialGlow: 'from-emerald-500/10',
  },
  blue: {
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    icon: 'text-blue-400',
    card: 'border-blue-500/30 hover:border-blue-500/60 shadow-[0_0_25px_rgba(59,130,246,0.12)]',
    radialGlow: 'from-blue-500/10',
  },
  amber: {
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    icon: 'text-amber-400',
    card: 'border-amber-500/30 hover:border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.12)]',
    radialGlow: 'from-amber-500/10',
  },
  teal: {
    badge: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    icon: 'text-teal-400',
    card: 'border-teal-500/30 hover:border-teal-500/60 shadow-[0_0_25px_rgba(20,184,166,0.12)]',
    radialGlow: 'from-teal-500/10',
  },
  pink: {
    badge: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
    icon: 'text-pink-400',
    card: 'border-pink-500/30 hover:border-pink-500/60 shadow-[0_0_25px_rgba(236,72,153,0.12)]',
    radialGlow: 'from-pink-500/10',
  },
};

const PILLARS = [
  {
    title: 'Built to Last',
    subtitle: 'High strength & durability',
    icon: <ShieldCheck className="w-6 h-6 text-purple-400" />,
  },
  {
    title: 'Precision Made',
    subtitle: 'Tight tolerances & consistency',
    icon: <Target className="w-6 h-6 text-purple-400" />,
  },
  {
    title: 'Quality Assured',
    subtitle: 'Tested for every critical use',
    icon: <Award className="w-6 h-6 text-purple-400" />,
  },
  {
    title: 'Custom Solutions',
    subtitle: 'Tailored to your industry needs',
    icon: <Wrench className="w-6 h-6 text-purple-400" />,
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
        isLight ? 'bg-[#f4f7fb] text-neutral-900' : 'bg-[#06070a] text-white'
      }`}>
        
        {/* Hero Header — Perfectly Centered Matching Capabilities & Products */}
        <section className={`relative pt-32 pb-16 sm:pt-40 sm:pb-24 border-b overflow-hidden transition-colors ${
          isLight ? 'bg-white border-neutral-200/80' : 'bg-[#08090d] border-white/[0.08]'
        }`}>
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10 text-center flex flex-col items-center">
            
            {/* Centered Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-mono font-bold tracking-wider uppercase text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/30 mb-6 shadow-sm">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span>Industrial Sectors &amp; Custom OEM Applications</span>
            </div>

            {/* Centered Main Title */}
            <h1 className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl ${
              isLight ? 'text-neutral-900' : 'text-white'
            }`}>
              Applications by <span className="text-orange-500">Industry</span>
            </h1>

            {/* Centered Subtitle */}
            <p className={`text-lg sm:text-2xl max-w-3xl mx-auto leading-relaxed ${
              isLight ? 'text-neutral-600' : 'text-neutral-300'
            }`}>
              Our cast iron components power performance across diverse industries with strength, precision, and reliability.
            </p>

          </div>
        </section>

        {/* Main Content Area */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12 sm:py-16 space-y-12 sm:space-y-14">
          
          {/* Breadcrumb Navigation */}
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Industries', href: '/industries' }]} />

          {/* 6 Grid Sector Cards (2 Rows x 3 Cols) - Matching Exact Layout of Image 1 */}
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
                  whileHover={{ y: -4, transition: { duration: 0.25 } }}
                  className={`group relative rounded-3xl p-6 sm:p-7 flex flex-row items-center justify-between gap-4 border transition-all duration-300 overflow-hidden ${styles.card} ${
                    isLight
                      ? 'bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)]'
                      : 'bg-[#080a0f] backdrop-blur-md'
                  }`}
                >
                  {/* Subtle Inner Ambient Glow */}
                  <div className={`absolute -right-12 -top-12 w-44 h-44 rounded-full blur-3xl pointer-events-none bg-gradient-to-br ${styles.radialGlow} to-transparent`} />

                  {/* Left Column: Badge, Icon, Title, Example Components */}
                  <div className="w-[52%] sm:w-[54%] space-y-3 z-10 flex flex-col justify-between h-full">
                    
                    {/* Top: Badge + Icon */}
                    <div className="flex items-center gap-3">
                      <div className={`px-2.5 py-0.5 rounded-lg font-mono text-xs font-bold border ${styles.badge}`}>
                        {sector.badge}
                      </div>

                      <div className={`${styles.icon} transition-transform duration-300 group-hover:scale-110`}>
                        {sector.icon}
                      </div>
                    </div>

                    {/* Sector Title */}
                    <h3 className={`text-lg sm:text-xl font-bold tracking-tight leading-snug ${
                      isLight ? 'text-neutral-900' : 'text-white'
                    }`}>
                      {sector.title}
                    </h3>

                    {/* Example components */}
                    <div className="space-y-0.5 pt-1">
                      <div className={`text-[11px] font-mono font-medium ${
                        isLight ? 'text-neutral-500' : 'text-neutral-400'
                      }`}>
                        Example components:
                      </div>
                      <p className={`text-xs leading-relaxed ${
                        isLight ? 'text-neutral-700 font-medium' : 'text-neutral-300'
                      }`}>
                        {sector.exampleComponents}
                      </p>
                    </div>

                  </div>

                  {/* Right Column: 3D Cast Iron Component Render (Seamless Floating) */}
                  <div className="w-[48%] sm:w-[46%] h-36 sm:h-44 flex items-center justify-center relative z-10">
                    <img
                      src={themedImg}
                      alt={sector.title}
                      loading="lazy"
                      className={`max-h-32 sm:max-h-36 max-w-full w-auto h-auto object-contain transition-transform duration-500 group-hover:scale-110 ${
                        isLight
                          ? 'filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.14)]'
                          : 'filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)]'
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
            className={`rounded-3xl p-6 sm:p-8 lg:p-10 border transition-all duration-300 border-purple-500/30 hover:border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.12)] ${
              isLight
                ? 'bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)]'
                : 'bg-[#080a0f] backdrop-blur-md'
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column: General Engineering Info */}
              <div className="lg:col-span-4 space-y-3.5">
                <div className="flex items-center gap-3">
                  <div className="px-2.5 py-0.5 rounded-lg font-mono text-xs font-bold border bg-purple-500/10 text-purple-400 border-purple-500/30">
                    07
                  </div>
                  <div className="text-purple-400">
                    <Factory className="w-5 h-5" />
                  </div>
                </div>

                <h3 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                  isLight ? 'text-neutral-900' : 'text-white'
                }`}>
                  General Engineering
                </h3>

                <div className="space-y-0.5">
                  <div className={`text-[11px] font-mono font-medium ${
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
                <img
                  src={getThemedImage('/images/Pulley Wheel/6 Inch Cast Iron Pulley Wheel.png', isLight)}
                  alt="General Engineering Flange Disc"
                  loading="lazy"
                  className={`max-h-36 sm:max-h-40 max-w-full w-auto h-auto object-contain transition-transform duration-500 hover:scale-110 ${
                    isLight
                      ? 'filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.14)]'
                      : 'filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)]'
                  }`}
                />
              </div>

              {/* Right Column: 4 Pillar Features Matching Image 1 */}
              <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-4 lg:pt-0 lg:pl-6 border-t lg:border-t-0 lg:border-l border-neutral-200/80 dark:border-white/10">
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
                    <p className={`text-[11px] font-mono leading-relaxed ${
                      isLight ? 'text-neutral-500' : 'text-neutral-400'
                    }`}>
                      {pillar.subtitle}
                    </p>
                  </div>
                ))}
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </>
  );
}
