import React from 'react';
import { motion } from 'framer-motion';
import {
  Car,
  Tractor,
  Droplets,
  Cog,
  Building2,
  Zap,
  Factory,
  ShieldCheck,
  Target,
  Award,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { Seo } from '../components/Seo';
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
  svgPath: string;
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
    // Diagonal slanted right edge (Top extends further right, slants inward toward bottom-right)
    svgPath: 'M 24,0 L 375,0 Q 395,0 390,20 L 350,222 Q 345,240 325,240 L 24,240 Q 0,240 0,216 L 0,24 Q 0,0 24,0 Z',
  },
  {
    id: 'agriculture',
    badge: '02',
    title: 'Agriculture',
    exampleComponents: 'Gearbox parts, pump bodies, housings, counterweights',
    icon: <Tractor className="w-5 h-5" />,
    image: '/images/cast_iron_casting/Cast Iron Tractor Part Casting.png',
    themeColor: 'emerald',
    // Chevron / Greater-Than (>) pointed right edge
    svgPath: 'M 24,0 L 350,0 Q 365,0 375,12 L 396,110 Q 400,120 396,130 L 375,228 Q 365,240 350,240 L 24,240 Q 0,240 0,216 L 0,24 Q 0,0 24,0 Z',
  },
  {
    id: 'pumps-valves',
    badge: '03',
    title: 'Pumps & Valves',
    exampleComponents: 'Bodies, covers, impellers, flanges, valve components',
    icon: <Droplets className="w-5 h-5" />,
    image: '/images/cast_iron_casting/Cast Iron Rotary Barrel Pump Casting.png',
    themeColor: 'blue',
    // Signature Semicircle / Quarter-Circle Arch Dome at top right
    svgPath: 'M 24,0 L 250,0 C 340,0 400,60 400,150 L 400,216 Q 400,240 376,240 L 24,240 Q 0,240 0,216 L 0,24 Q 0,0 24,0 Z',
  },
  {
    id: 'machine-tools',
    badge: '04',
    title: 'Machine Tools',
    exampleComponents: 'Beds, bases, tables, bearing housings, guards',
    icon: <Cog className="w-5 h-5" />,
    image: '/images/Sewing_machine_parts/Cast Iron TA 1 Bracket Industrial Sewing Machine Part.png',
    themeColor: 'amber',
    // Diagonal angled cut right edge
    svgPath: 'M 24,0 L 375,0 Q 395,0 390,20 L 350,222 Q 345,240 325,240 L 24,240 Q 0,240 0,216 L 0,24 Q 0,0 24,0 Z',
  },
  {
    id: 'construction',
    badge: '05',
    title: 'Construction Equipment',
    exampleComponents: 'Housings, brackets, wear components, support parts',
    icon: <Building2 className="w-5 h-5" />,
    image: '/images/Hillside Washer/Cast Iron Hillside Washer.png',
    themeColor: 'teal',
    // Chevron / Greater-Than (>) pointed right edge
    svgPath: 'M 24,0 L 350,0 Q 365,0 375,12 L 396,110 Q 400,120 396,130 L 375,228 Q 365,240 350,240 L 24,240 Q 0,240 0,216 L 0,24 Q 0,0 24,0 Z',
  },
  {
    id: 'energy-infrastructure',
    badge: '06',
    title: 'Energy & Infrastructure',
    exampleComponents: 'Enclosures, fittings, structural components, equipment bases',
    icon: <Zap className="w-5 h-5" />,
    image: '/images/Collar Plug/Cast Iron Collar Plug.png',
    themeColor: 'pink',
    // Diagonal angled cut right edge
    svgPath: 'M 24,0 L 375,0 Q 395,0 390,20 L 350,222 Q 345,240 325,240 L 24,240 Q 0,240 0,216 L 0,24 Q 0,0 24,0 Z',
  },
];

const COLOR_STYLES = {
  purple: {
    badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    icon: 'text-purple-600 dark:text-purple-400',
    divider: 'bg-gradient-to-r from-purple-500 to-transparent',
    strokeDark: 'rgba(168, 85, 247, 0.45)',
    strokeLight: 'rgba(168, 85, 247, 0.4)',
    bgDarkStart: '#0d0c18',
    bgDarkEnd: '#080710',
    bgLightStart: '#ffffff',
    bgLightEnd: '#faf8ff',
    radialGlow: 'from-purple-500/15',
    pillGlow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]',
  },
  emerald: {
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    icon: 'text-emerald-600 dark:text-emerald-400',
    divider: 'bg-gradient-to-r from-emerald-500 to-transparent',
    strokeDark: 'rgba(16, 185, 129, 0.45)',
    strokeLight: 'rgba(16, 185, 129, 0.4)',
    bgDarkStart: '#08120e',
    bgDarkEnd: '#050c09',
    bgLightStart: '#ffffff',
    bgLightEnd: '#f4fbf7',
    radialGlow: 'from-emerald-500/15',
    pillGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]',
  },
  blue: {
    badge: 'bg-blue-500/10 text-blue-600 dark:text-sky-400 border-blue-500/30',
    icon: 'text-blue-600 dark:text-sky-400',
    divider: 'bg-gradient-to-r from-blue-500 to-transparent',
    strokeDark: 'rgba(59, 130, 246, 0.45)',
    strokeLight: 'rgba(59, 130, 246, 0.4)',
    bgDarkStart: '#080f1e',
    bgDarkEnd: '#050a14',
    bgLightStart: '#ffffff',
    bgLightEnd: '#f4f8ff',
    radialGlow: 'from-blue-500/15',
    pillGlow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]',
  },
  amber: {
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    icon: 'text-amber-600 dark:text-amber-400',
    divider: 'bg-gradient-to-r from-amber-500 to-transparent',
    strokeDark: 'rgba(245, 158, 11, 0.45)',
    strokeLight: 'rgba(245, 158, 11, 0.4)',
    bgDarkStart: '#140f08',
    bgDarkEnd: '#0d0a05',
    bgLightStart: '#ffffff',
    bgLightEnd: '#fffbf4',
    radialGlow: 'from-amber-500/15',
    pillGlow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]',
  },
  teal: {
    badge: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30',
    icon: 'text-teal-600 dark:text-teal-400',
    divider: 'bg-gradient-to-r from-teal-500 to-transparent',
    strokeDark: 'rgba(20, 184, 166, 0.45)',
    strokeLight: 'rgba(20, 184, 166, 0.4)',
    bgDarkStart: '#061314',
    bgDarkEnd: '#040d0e',
    bgLightStart: '#ffffff',
    bgLightEnd: '#f2fbfb',
    radialGlow: 'from-teal-500/15',
    pillGlow: 'shadow-[0_0_15px_rgba(20,184,166,0.3)]',
  },
  pink: {
    badge: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30',
    icon: 'text-pink-600 dark:text-pink-400',
    divider: 'bg-gradient-to-r from-pink-500 to-transparent',
    strokeDark: 'rgba(236, 72, 153, 0.45)',
    strokeLight: 'rgba(236, 72, 153, 0.4)',
    bgDarkStart: '#140711',
    bgDarkEnd: '#0d040b',
    bgLightStart: '#ffffff',
    bgLightEnd: '#fdf5fa',
    radialGlow: 'from-pink-500/15',
    pillGlow: 'shadow-[0_0_15px_rgba(236,72,153,0.3)]',
  },
};

const PILLARS = [
  {
    title: 'Built to Last',
    subtitle: 'High strength & durability',
    icon: <ShieldCheck className="w-5 h-5 text-purple-400" />,
  },
  {
    title: 'Precision Made',
    subtitle: 'Tight tolerances & consistency',
    icon: <Target className="w-5 h-5 text-purple-400" />,
  },
  {
    title: 'Quality Assured',
    subtitle: 'Tested for every critical use',
    icon: <Award className="w-5 h-5 text-purple-400" />,
  },
  {
    title: 'Custom Solutions',
    subtitle: 'Tailored to your industry needs',
    icon: <Wrench className="w-5 h-5 text-purple-400" />,
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

      <div
        className={`min-h-screen transition-colors duration-300 ${
          isLight ? 'bg-[#f4f7fb] text-neutral-900' : 'bg-[#050508] text-white'
        }`}
      >
        {/* ========================================================================= */}
        {/* CENTERED HERO HEADER MATCHING USER REFERENCE */}
        {/* ========================================================================= */}
        <section
          className={`relative pt-32 pb-16 sm:pt-40 sm:pb-24 border-b overflow-hidden transition-colors ${
            isLight ? 'bg-white border-neutral-200/80' : 'bg-[#08090d] border-white/[0.08]'
          }`}
        >
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10 text-center flex flex-col items-center">
            {/* Centered Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-mono font-bold tracking-wider uppercase text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/30 mb-6 shadow-sm">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span>Industrial Sectors &amp; Custom OEM Applications</span>
            </div>

            {/* Centered Main Title with Orange Highlight */}
            <h1
              className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl ${
                isLight ? 'text-neutral-900' : 'text-white'
              }`}
            >
              Applications by <span className="text-orange-500">Industry</span>
            </h1>

            {/* Centered Subtitle */}
            <p
              className={`text-lg sm:text-2xl max-w-3xl mx-auto leading-relaxed ${
                isLight ? 'text-neutral-600' : 'text-neutral-300'
              }`}
            >
              Our cast iron components power performance across diverse industries with strength,
              precision, and reliability.
            </p>
          </div>
        </section>

        {/* Main Content Area */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12 sm:py-16 space-y-12 sm:space-y-16">
          
          {/* ========================================================================= */}
          {/* 6 ASYMMETRIC SECTOR CARDS WITH EXACT GEOMETRIC SVG OUTLINES */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 items-stretch">
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
                  className="group relative p-6 sm:p-7 flex flex-row items-center justify-between gap-3 sm:gap-4 transition-all duration-300 min-h-[230px] sm:min-h-[250px]"
                >
                  {/* SVG Custom Silhouette Background and Glowing Border */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none transition-all duration-300 filter drop-shadow-lg"
                    viewBox="0 0 400 240"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id={`grad-${sector.id}-${isLight ? 'l' : 'd'}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={isLight ? styles.bgLightStart : styles.bgDarkStart} />
                        <stop offset="100%" stopColor={isLight ? styles.bgLightEnd : styles.bgDarkEnd} />
                      </linearGradient>
                    </defs>
                    <path
                      d={sector.svgPath}
                      fill={`url(#grad-${sector.id}-${isLight ? 'l' : 'd'})`}
                      stroke={isLight ? styles.strokeLight : styles.strokeDark}
                      strokeWidth="1.5"
                      className="transition-all duration-300 group-hover:stroke-width-2"
                    />
                  </svg>

                  {/* Subtle Inner Ambient Glow */}
                  <div
                    className={`absolute -right-8 -top-8 w-44 h-44 rounded-full blur-3xl pointer-events-none bg-gradient-to-br ${styles.radialGlow} to-transparent`}
                  />

                  {/* Left Column: Badge, Icon, Title, Divider, Example Components */}
                  <div className="flex-1 min-w-0 pr-1 sm:pr-2 space-y-2.5 z-10 flex flex-col justify-between h-full">
                    {/* Top: Badge + Icon */}
                    <div className="flex items-center gap-2">
                      <div
                        className={`px-2.5 py-0.5 rounded-lg font-mono text-xs font-bold border ${styles.badge} ${styles.pillGlow}`}
                      >
                        {sector.badge}
                      </div>

                      <div
                        className={`${styles.icon} transition-transform duration-300 group-hover:scale-110`}
                      >
                        {sector.icon}
                      </div>
                    </div>

                    {/* Sector Title */}
                    <h2
                      className={`text-base sm:text-lg font-bold tracking-tight leading-snug break-words ${
                        isLight ? 'text-neutral-900' : 'text-white'
                      }`}
                    >
                      {sector.title}
                    </h2>

                    {/* Thin Glowing Divider */}
                    <div className={`h-[1.5px] w-10 rounded-full ${styles.divider}`} />

                    {/* Example components */}
                    <div className="space-y-0.5 pt-0.5">
                      <div
                        className={`text-[10.5px] sm:text-[11px] font-mono font-medium ${
                          isLight ? 'text-neutral-500' : 'text-neutral-400'
                        }`}
                      >
                        Example components:
                      </div>
                      <p
                        className={`text-xs leading-relaxed line-clamp-3 font-semibold ${
                          isLight ? 'text-neutral-800' : 'text-neutral-200'
                        }`}
                      >
                        {sector.exampleComponents}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: 3D Cast Iron Product Visualization (Positioned inside the unique custom corner) */}
                  <div className="w-28 h-28 sm:w-32 sm:h-32 shrink-0 flex items-center justify-center relative z-10 select-none pointer-events-none pr-1">
                    <img
                      src={themedImg}
                      alt={`${sector.title} casting component`}
                      loading="lazy"
                      className={`max-w-full max-h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-out group-hover:scale-108 group-hover:rotate-2 ${
                        isLight ? 'mix-blend-multiply' : ''
                      }`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* ROW 3: GENERAL ENGINEERING (HERO FEATURE PANEL - WIDE HORIZONTAL CARD) */}
          {/* ========================================================================= */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            whileHover={{ y: -3, transition: { duration: 0.25 } }}
            className={`group relative rounded-[32px] sm:rounded-[36px] p-7 sm:p-10 border transition-all duration-300 overflow-hidden shadow-2xl ${
              isLight
                ? 'bg-white border-purple-300 shadow-[0_10px_35px_rgba(168,85,247,0.08)]'
                : 'bg-[#080911] border-purple-500/40 shadow-[0_0_40px_rgba(168,85,247,0.16)]'
            }`}
          >
            {/* Ambient Radial Lighting */}
            <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none bg-purple-600/10" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative z-10">
              {/* Left Column: Info */}
              <div className="lg:col-span-4 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="px-2.5 py-0.5 rounded-lg font-mono text-xs font-bold border bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                    07
                  </div>
                  <Factory className="w-5 h-5 text-purple-600 dark:text-purple-400 transition-transform group-hover:scale-110" />
                </div>

                <h2
                  className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                    isLight ? 'text-neutral-900' : 'text-white'
                  }`}
                >
                  General Engineering
                </h2>

                {/* Glowing Purple Divider */}
                <div className="h-[2px] w-16 rounded-full bg-gradient-to-r from-purple-500 to-transparent" />

                <div className="space-y-1">
                  <div
                    className={`text-xs font-mono font-medium ${
                      isLight ? 'text-neutral-500' : 'text-neutral-400'
                    }`}
                  >
                    Example components:
                  </div>
                  <p
                    className={`text-sm font-semibold leading-relaxed ${
                      isLight ? 'text-neutral-800' : 'text-neutral-200'
                    }`}
                  >
                    Custom OEM parts based on drawings and specifications
                  </p>
                </div>
              </div>

              {/* Center Column: 3D Circular Pulley Casting with Concentric Radar Grid */}
              <div className="lg:col-span-4 flex items-center justify-center">
                <div className="relative w-44 sm:w-56 aspect-square flex items-center justify-center">
                  {/* Concentric Technical Rings */}
                  <div className="absolute inset-0 rounded-full border border-purple-500/20 animate-pulse" />
                  <div className="absolute inset-4 rounded-full border border-purple-500/15" />
                  <div className="absolute inset-8 rounded-full border border-purple-500/10" />

                  <img
                    src={getThemedImage(
                      '/images/Pulley Wheel/6 Inch Cast Iron Pulley Wheel.png',
                      isLight
                    )}
                    alt="General Engineering 3D Casting"
                    loading="lazy"
                    className={`w-full h-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)] transform group-hover:scale-108 group-hover:rotate-6 transition-transform duration-500 ${
                      isLight ? 'mix-blend-multiply' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Right Column: 4 Value Pillars */}
              <div className="lg:col-span-4 grid grid-cols-2 gap-4 sm:gap-5 border-t lg:border-t-0 lg:border-l border-neutral-200 dark:border-white/10 pt-6 lg:pt-0 lg:pl-8">
                {PILLARS.map((p) => (
                  <div key={p.title} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        {p.icon}
                      </div>
                      <div
                        className={`text-xs sm:text-sm font-bold tracking-tight ${
                          isLight ? 'text-neutral-900' : 'text-white'
                        }`}
                      >
                        {p.title}
                      </div>
                    </div>
                    <p
                      className={`text-[11px] sm:text-xs leading-snug pl-8 ${
                        isLight ? 'text-neutral-600' : 'text-neutral-400'
                      }`}
                    >
                      {p.subtitle}
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
