import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight, ShieldCheck, LayoutGrid, Atom } from 'lucide-react';
import { useTheme } from '../auth/ThemeContext';
import { useEnquiryModal } from '../context/EnquiryModalContext';
import { getThemedImage } from '../utils/themeImage';

export interface ProductGradeVariant {
  name: string;
  badge: string;
  specSummary: string;
  image: string;
}

export interface LineupCardModel {
  id: string;
  name: string;
  tagline: string;
  weightRange: string;
  moq: string;
  detailSlug: string;
  defaultBadge: string;
  variants: ProductGradeVariant[];
}

const LINEUP_PRODUCTS: LineupCardModel[] = [
  {
    id: 'v-belt-pulley',
    name: 'V-Belt Pulley Systems',
    tagline: 'Precision dynamically balanced for high-RPM vibration-free drives.',
    weightRange: '1.2 to 45.0 kg',
    moq: 'Batch MOQ: 50 to 5,000 pcs/mo',
    defaultBadge: 'FG 220 STANDARD',
    detailSlug: '/products/grey-iron-castings',
    variants: [
      {
        name: 'FG 220 Standard',
        badge: 'FG 220 STANDARD',
        specSummary: '220 MPa Tensile  •  180–220 HBW',
        image: '/images/V Belt Pulley/Cast Iron V Belt Pulley Set.png',
      },
      {
        name: 'FG 260 Heavy Duty',
        badge: 'FG 260 HEAVY DUTY',
        specSummary: '260 MPa Tensile  •  High Damping',
        image: '/images/V Belt Pulley/Cast Iron V Belt Pulley Set 1.png',
      },
      {
        name: 'SG 500 High Torque',
        badge: 'SG 500/7 DUCTILE',
        specSummary: '500 MPa Tensile  •  7% Elongation',
        image: '/images/V Belt Pulley/Cast Iron V Belt Pulley Set 2.png',
      },
    ],
  },
  {
    id: 'rotary-pump',
    name: 'Rotary Pump Casings',
    tagline: 'Hydrostatically tested for 350+ bar fluid containment.',
    weightRange: '3.5 to 68.0 kg',
    moq: 'Batch MOQ: 25 to 2,500 pcs/mo',
    defaultBadge: 'FG 260 HYDRAULIC',
    detailSlug: '/products/grey-iron-castings',
    variants: [
      {
        name: 'FG 260 Hydraulic',
        badge: 'FG 260 HYDRAULIC',
        specSummary: 'Zero Leakage  •  Hydro Tested',
        image: '/images/cast_iron_casting/Cast Iron Rotary Barrel Pump Casting.png',
      },
      {
        name: 'FG 300 High Pressure',
        badge: 'FG 300 PRESSURE',
        specSummary: '300 MPa Tensile  •  Machined Flanges',
        image: '/images/Collar Plug/Cast Iron Collar Plug.png',
      },
      {
        name: 'SG 600 Heavy Pump',
        badge: 'SG 600/3 DUCTILE',
        specSummary: '600 MPa Tensile  •  Impact Proof',
        image: '/images/Industrial Iron Casting.png',
      },
    ],
  },
  {
    id: 'precision-brackets',
    name: 'Precision Brackets',
    tagline: 'Micron-tolerance CNC machined for high-cycle automation.',
    weightRange: '0.15 to 8.5 kg',
    moq: 'Batch MOQ: 100 to 10,000 pcs/mo',
    defaultBadge: 'FG 200 FINE GRAIN',
    detailSlug: '/products/grey-iron-castings',
    variants: [
      {
        name: 'FG 200 Fine Grain',
        badge: 'FG 200 FINE GRAIN',
        specSummary: 'Class A Finish  •  High Damping',
        image: '/images/Sewing_machine_parts/Cast Iron TA 1 Bracket Industrial Sewing Machine Part.png',
      },
      {
        name: 'Chal T1 Bracket',
        badge: 'FG 220 CHAL T1',
        specSummary: 'Kinematic Link  •  Vibration Proof',
        image: '/images/Sewing_machine_parts/Cast Iron Chal T1 Industrial Sewing Machine Part.png',
      },
      {
        name: 'SV Came Cam Link',
        badge: 'SG 500/7 DUCTILE',
        specSummary: 'Micron Ground Cam  •  Low Inertia',
        image: '/images/Sewing_machine_parts/Cast Iron SV Came Industrial Sewing Machine Part.png',
      },
    ],
  },
  {
    id: 'automotive-shift-levers',
    name: 'Automotive Shift Levers',
    tagline: 'High-tensile nodular iron built for heavy transmission shock loads.',
    weightRange: '0.8 to 12.0 kg',
    moq: 'Batch MOQ: 50 to 3,000 pcs/mo',
    defaultBadge: 'SG 600/3 HIGH TENSILE',
    detailSlug: '/products/ductile-iron-castings',
    variants: [
      {
        name: 'SG 600/3 Nodular',
        badge: 'SG 600/3 HIGH TENSILE',
        specSummary: '600 MPa Tensile  •  Impact Tested',
        image: '/images/Gear Lever Parts/Cast Iron Car Gear Lever Part.png',
      },
      {
        name: 'SG 700 Heavy Truck',
        badge: 'SG 700/2 HIGH TORQUE',
        specSummary: '700 MPa Tensile  •  Induction Hardened',
        image: '/images/Gear Lever Parts/Cast Iron Car Gear Lever Part 1.png',
      },
      {
        name: 'SG 500 Shift Fork',
        badge: 'SG 500/7 OEM FORK',
        specSummary: '500 MPa Tensile  •  Ductile Yield',
        image: '/images/cast_iron_casting/Cast Iron Tractor Part Casting.png',
      },
    ],
  },
];

export const AppleProductLineup: React.FC = () => {
  const { theme } = useTheme();
  const { openEnquiryModal } = useEnquiryModal();
  const isLight = theme === 'light';

  // Track active variant index for each product card
  const [activeVariantMap, setActiveVariantMap] = useState<Record<string, number>>({
    'v-belt-pulley': 0,
    'rotary-pump': 0,
    'precision-brackets': 0,
    'automotive-shift-levers': 0,
  });

  const handlePrev = () => {
    setActiveVariantMap((prev) => {
      const nextMap: Record<string, number> = {};
      LINEUP_PRODUCTS.forEach((p) => {
        const curr = prev[p.id] || 0;
        nextMap[p.id] = (curr - 1 + p.variants.length) % p.variants.length;
      });
      return nextMap;
    });
  };

  const handleNext = () => {
    setActiveVariantMap((prev) => {
      const nextMap: Record<string, number> = {};
      LINEUP_PRODUCTS.forEach((p) => {
        const curr = prev[p.id] || 0;
        nextMap[p.id] = (curr + 1) % p.variants.length;
      });
      return nextMap;
    });
  };

  return (
    <section className={`relative py-10 sm:py-14 overflow-hidden transition-colors duration-300 ${
      isLight ? 'bg-[#f4f7fb]' : 'bg-[#050608]'
    }`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        
        {/* Section Header with Scroll Animation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-end justify-between gap-6 mb-12 sm:mb-16"
        >
          
          {/* Left Title */}
          <div className="space-y-3">
            <div className={`text-sm sm:text-base font-mono font-extrabold tracking-widest uppercase ${
              isLight ? 'text-blue-600' : 'text-sky-400'
            }`}>
              OUR PRODUCT LINE-UP
            </div>

            <h2 className={`text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[1.04] ${
              isLight ? 'text-neutral-900' : 'text-white'
            }`}>
              Explore the line-up<span className={isLight ? 'text-blue-600' : 'text-sky-400'}>.</span>
            </h2>
          </div>

          {/* Right Navigation Arrows */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous Product"
              className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-200 ${
                isLight
                  ? 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100 shadow-sm'
                  : 'bg-[#0c0d14] border-white/10 text-neutral-400 hover:text-white hover:border-white/20'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Next Product"
              className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-200 ${
                isLight
                  ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 shadow-md'
                  : 'bg-blue-950/60 border-blue-500/60 text-blue-400 hover:bg-blue-900/80 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

        </motion.div>

        {/* 4-Column Product Cards Grid with Staggered Scroll Reveal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-6">
          {LINEUP_PRODUCTS.map((prod, idx) => {
            const currentVarIdx = activeVariantMap[prod.id] || 0;
            const currentVar = prod.variants[currentVarIdx] || prod.variants[0];

            return (
              <motion.div
                key={prod.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.55, delay: idx * 0.1, ease: 'easeOut' }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className={`group relative rounded-3xl p-5 sm:p-6 flex flex-col justify-between border transition-all duration-300 ${
                  isLight
                    ? 'bg-white border-neutral-200/90 hover:border-blue-400 hover:shadow-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
                    : 'bg-[#08090e] border-white/[0.08] hover:border-sky-500/40 hover:bg-[#0c0d14] hover:shadow-[0_0_25px_rgba(56,189,248,0.15)]'
                }`}
              >
                
                {/* Top Row: Grade Badge + Weight Range */}
                <div className="flex items-center justify-between text-xs mb-4">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] font-bold tracking-wide ${
                    isLight
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-blue-500/10 text-sky-400 border border-blue-500/20'
                  }`}>
                    <Atom className="w-3 h-3 shrink-0" />
                    <span>{currentVar.badge}</span>
                  </div>

                  <span className="font-mono text-[11px] text-neutral-400 font-medium">
                    {prod.weightRange}
                  </span>
                </div>

                {/* Central Product Image Container with Dark/Light Studio */}
                <div className={`relative w-full h-56 sm:h-64 rounded-2xl flex items-center justify-center p-3 overflow-hidden transition-all ${
                  isLight
                    ? 'bg-gradient-to-b from-neutral-50 to-neutral-100/60'
                    : 'bg-gradient-to-b from-[#10121a] to-[#06070b]'
                }`}>
                  <img
                    src={getThemedImage(currentVar.image, isLight)}
                    alt={prod.name}
                    loading="lazy"
                    style={
                      isLight
                        ? undefined
                        : {
                            WebkitMaskImage: 'radial-gradient(ellipse 92% 92% at 50% 50%, black 75%, transparent 100%)',
                            maskImage: 'radial-gradient(ellipse 92% 92% at 50% 50%, black 75%, transparent 100%)',
                          }
                    }
                    className={`max-h-48 sm:max-h-56 max-w-[92%] w-auto h-auto object-contain transform group-hover:scale-110 transition-transform duration-500 ${
                      isLight ? 'drop-shadow-[0_10px_20px_rgba(0,0,0,0.12)]' : 'drop-shadow-[0_16px_32px_rgba(0,0,0,0.7)]'
                    }`}
                  />
                </div>

                {/* 3 Variant Dots Selector */}
                <div className="flex items-center justify-center gap-2 my-4">
                  {prod.variants.map((v, vIdx) => {
                    const isSelected = vIdx === currentVarIdx;
                    return (
                      <button
                        key={v.name}
                        type="button"
                        onClick={() =>
                          setActiveVariantMap((prev) => ({
                            ...prev,
                            [prod.id]: vIdx,
                          }))
                        }
                        aria-label={`Select variant ${v.name}`}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                          isSelected
                            ? isLight
                              ? 'bg-blue-600 scale-125'
                              : 'bg-sky-400 scale-125 shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                            : isLight
                              ? 'bg-neutral-300 hover:bg-neutral-400'
                              : 'bg-neutral-700 hover:bg-neutral-500'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Title & Tagline */}
                <div className="space-y-2 mb-4">
                  <h3 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${
                    isLight ? 'text-neutral-900' : 'text-white'
                  }`}>
                    {prod.name}
                  </h3>
                  <p className={`text-sm sm:text-base leading-relaxed min-h-[44px] ${
                    isLight ? 'text-neutral-600' : 'text-neutral-300'
                  }`}>
                    {prod.tagline}
                  </p>
                </div>

                {/* Key Specs Box */}
                <div className="space-y-2 pt-3.5 mb-5 border-t border-neutral-200/80 dark:border-white/10">
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm font-mono font-bold">
                    <ShieldCheck className={`w-4 h-4 shrink-0 ${
                      isLight ? 'text-blue-600' : 'text-sky-400'
                    }`} />
                    <span className={isLight ? 'text-neutral-800' : 'text-neutral-200'}>
                      {currentVar.specSummary}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-neutral-500 pl-6">
                    {prod.moq}
                  </div>
                </div>

                {/* Action Buttons: Learn More + Request RFQ */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Link
                    to={prod.detailSlug}
                    className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-center inline-flex items-center justify-center gap-1.5 transition-all ${
                      isLight
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                    }`}
                  >
                    <span>Learn more</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => openEnquiryModal(`Enquiry for ${prod.name} (${currentVar.name})`)}
                    className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-center border inline-flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                      isLight
                        ? 'border-neutral-300 text-neutral-800 hover:bg-neutral-100'
                        : 'border-white/15 text-neutral-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span>Submit Enquiry</span>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                  </button>
                </div>

              </motion.div>
            );
          })}
        </div>

        {/* Centered Bottom Action Pill: View All Products */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mt-12 sm:mt-14"
        >
          <Link
            to="/products"
            className={`inline-flex items-center gap-2.5 px-7 py-3 rounded-full text-xs sm:text-sm font-mono font-bold tracking-wider transition-all transform hover:scale-105 border shadow-md ${
              isLight
                ? 'bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-100'
                : 'bg-blue-950/40 border-blue-500/40 text-sky-400 hover:bg-blue-900/60 shadow-[0_0_20px_rgba(56,189,248,0.15)]'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>View All Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

      </div>
    </section>
  );
};
