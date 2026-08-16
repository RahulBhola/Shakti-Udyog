import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles } from 'lucide-react';
import { useTheme } from '../auth/ThemeContext';

export interface ProductGradeVariant {
  name: string;
  colorHex: string;
  bgGradient: string;
  specSummary: string;
  tensileStrength: string;
  hardness: string;
  image: string;
}

export interface AppleProductModel {
  id: string;
  name: string;
  tagline: string;
  description: string;
  weightRange: string;
  batchCapacity: string;
  variants: ProductGradeVariant[];
  detailSlug: string;
}

const LINEUP_PRODUCTS: AppleProductModel[] = [
  {
    id: 'v-belt-pulley',
    name: 'V-Belt Pulley Systems',
    tagline: 'Precision dynamically balanced for high-RPM vibration-free drives.',
    description: 'Deep V-groove geometry with high wear-resistance and zero belt slippage under continuous torque load.',
    weightRange: '1.2 to 45.0 kg',
    batchCapacity: '50 to 5,000 pcs/mo',
    detailSlug: '/products/grey-iron-castings',
    variants: [
      {
        name: 'FG 220 Standard',
        colorHex: '#475569',
        bgGradient: 'from-[#1a1c24] via-[#12131a] to-[#0a0a0f]',
        specSummary: '220 MPa Tensile · 180-220 HBW',
        tensileStrength: '220 N/mm²',
        hardness: '190 HBW',
        image: '/images/V Belt Pulley/Cast Iron V Belt Pulley Set.png',
      },
      {
        name: 'FG 260 Heavy Duty',
        colorHex: '#EA580C',
        bgGradient: 'from-[#221612] via-[#160f0d] to-[#0a0a0f]',
        specSummary: '260 MPa Tensile · High Damping',
        tensileStrength: '260 N/mm²',
        hardness: '215 HBW',
        image: '/images/V Belt Pulley/Cast Iron V Belt Pulley Set 1.png',
      },
      {
        name: 'SG 500 High Torque',
        colorHex: '#0284C7',
        bgGradient: 'from-[#101c28] via-[#0c131c] to-[#0a0a0f]',
        specSummary: '500 MPa Tensile · 7% Elongation',
        tensileStrength: '500 N/mm²',
        hardness: '230 HBW',
        image: '/images/V Belt Pulley/Cast Iron V Belt Pulley Set 2.png',
      },
    ],
  },
  {
    id: 'rotary-pump',
    name: 'Rotary Pump Casings',
    tagline: 'Hydrostatically tested for 350+ bar fluid containment.',
    description: 'High-density grain structure preventing micro-porosity and hydraulic fluid seepage in extreme OEM pump systems.',
    weightRange: '3.5 to 68.0 kg',
    batchCapacity: '25 to 2,500 pcs/mo',
    detailSlug: '/products/ductile-iron-castings',
    variants: [
      {
        name: 'FG 260 Hydraulic',
        colorHex: '#334155',
        bgGradient: 'from-[#181a22] via-[#101218] to-[#0a0a0f]',
        specSummary: 'Zero Leakage · Hydro Tested',
        tensileStrength: '260 N/mm²',
        hardness: '200 HBW',
        image: '/images/cast_iron_casting/Cast Iron Rotary Barrel Pump Casting.png',
      },
      {
        name: 'SG 400 Ductile Iron',
        colorHex: '#F59E0B',
        bgGradient: 'from-[#241c10] via-[#16120b] to-[#0a0a0f]',
        specSummary: '400 MPa Tensile · 15% Elongation',
        tensileStrength: '400 N/mm²',
        hardness: '160 HBW',
        image: '/images/cast_iron_casting/Cast Iron Tractor Part Casting.png',
      },
      {
        name: 'SG 600 Severe Duty',
        colorHex: '#9333EA',
        bgGradient: 'from-[#1e1226] via-[#140c1a] to-[#0a0a0f]',
        specSummary: '600 MPa Tensile · Anti-Corrosive',
        tensileStrength: '600 N/mm²',
        hardness: '250 HBW',
        image: '/images/cast_iron_casting/Cast Iron Button Machine Casting.png',
      },
    ],
  },
  {
    id: 'sewing-brackets',
    name: 'Precision Brackets',
    tagline: 'Micron-tolerance CNC machined for high-cycle automation.',
    description: 'Superior vibration attenuation ensuring continuous 5000+ RPM sewing needle kinematics without fatigue failure.',
    weightRange: '0.15 to 8.5 kg',
    batchCapacity: '100 to 10,000 pcs/mo',
    detailSlug: '/products/custom-castings',
    variants: [
      {
        name: 'FG 200 Fine Grain',
        colorHex: '#64748B',
        bgGradient: 'from-[#1a1c24] via-[#111218] to-[#0a0a0f]',
        specSummary: 'Class A Finish · High Damping',
        tensileStrength: '200 N/mm²',
        hardness: '180 HBW',
        image: '/images/Sewing_machine_parts/Cast Iron TA 1 Bracket Industrial Sewing Machine Part.png',
      },
      {
        name: 'SG 500 Impact Ductile',
        colorHex: '#EA580C',
        bgGradient: 'from-[#221612] via-[#160f0d] to-[#0a0a0f]',
        specSummary: '500 MPa Tensile · Fatigue Proof',
        tensileStrength: '500 N/mm²',
        hardness: '220 HBW',
        image: '/images/Sewing_machine_parts/Cast Iron Chal T1 Industrial Sewing Machine Part.png',
      },
      {
        name: 'CNC Ready Machined',
        colorHex: '#10B981',
        bgGradient: 'from-[#0e201a] via-[#0a1612] to-[#0a0a0f]',
        specSummary: '±0.015mm CMM Tolerance',
        tensileStrength: '550 N/mm²',
        hardness: '225 HBW',
        image: '/images/Sewing_machine_parts/Cast Iron SV Came Industrial Sewing Machine Part.png',
      },
    ],
  },
  {
    id: 'gear-shift-lever',
    name: 'Automotive Shift Levers',
    tagline: 'High-tensile nodular iron built for heavy transmission shock loads.',
    description: 'Engineered with optimized section thickness and smooth radii preventing stress concentrations under cyclic gear shifting.',
    weightRange: '0.8 to 12.0 kg',
    batchCapacity: '50 to 3,000 pcs/mo',
    detailSlug: '/products/machining-finishing',
    variants: [
      {
        name: 'SG 600/3 High Tensile',
        colorHex: '#EA580C',
        bgGradient: 'from-[#221612] via-[#160f0d] to-[#0a0a0f]',
        specSummary: '600 MPa Tensile · Impact Tested',
        tensileStrength: '600 N/mm²',
        hardness: '240 HBW',
        image: '/images/Gear Lever Parts/Cast Iron Car Gear Lever Part.png',
      },
      {
        name: 'SG 700 Ultra Hard',
        colorHex: '#0284C7',
        bgGradient: 'from-[#101c28] via-[#0c131c] to-[#0a0a0f]',
        specSummary: '700 MPa Tensile · Wear Resistant',
        tensileStrength: '700 N/mm²',
        hardness: '280 HBW',
        image: '/images/Gear Lever Parts/Cast Iron Car Gear Lever Part 1.png',
      },
      {
        name: 'SG 450 Tough Ductile',
        colorHex: '#64748B',
        bgGradient: 'from-[#181a22] via-[#101218] to-[#0a0a0f]',
        specSummary: '450 MPa Tensile · 10% Elongation',
        tensileStrength: '450 N/mm²',
        hardness: '180 HBW',
        image: '/images/Cast Iron Nut/Cast Iron Door Closer Nut.png',
      },
    ],
  },
];

export const AppleProductLineup: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: number }>({
    'v-belt-pulley': 0,
    'rotary-pump': 0,
    'sewing-brackets': 0,
    'gear-shift-lever': 0,
  });

  const handleSelectVariant = (productId: string, variantIndex: number) => {
    setSelectedVariants((prev) => ({ ...prev, [productId]: variantIndex }));
  };

  return (
    <section className={`relative py-16 sm:py-24 transition-colors duration-300 ${
      isLight ? 'bg-white' : 'bg-[#000000]'
    }`}>
      {/* Header Container — Extra Large Typography, Centered */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 mb-12 sm:mb-16">
        <h2 className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight ${
          isLight ? 'text-neutral-900' : 'text-white'
        }`}>
          Explore the line-up.
        </h2>
      </div>

      {/* Product Cards Grid */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-7 sm:gap-8">
          {LINEUP_PRODUCTS.map((product) => {
            const currentVariantIdx = selectedVariants[product.id] || 0;
            const currentVariant = product.variants[currentVariantIdx] || product.variants[0];

            return (
              <div
                key={product.id}
                className="flex flex-col justify-between"
              >
                {/* Large Rounded Media Capsule Container with Smooth Edge-Faded Vignette */}
                <div
                  className={`relative w-full aspect-[4/5] rounded-[32px] overflow-hidden p-6 flex flex-col justify-between border transition-all duration-500 shadow-2xl bg-gradient-to-b ${currentVariant.bgGradient} border-white/[0.08] shadow-[0_16px_40px_rgba(0,0,0,0.85)]`}
                >
                  {/* Top Spec Chip */}
                  <div className="flex items-center justify-between z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase bg-white/10 text-orange-400 border border-orange-500/30 backdrop-blur-md shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                      <span>{currentVariant.name}</span>
                    </span>
                    <span className="text-xs font-mono font-semibold text-neutral-300 shrink-0">
                      {product.weightRange}
                    </span>
                  </div>

                  {/* Centered Product Image with Radial Mask to Eliminate Square Edges */}
                  <div className="relative my-auto w-full h-48 sm:h-56 flex items-center justify-center overflow-hidden">
                    <img
                      src={currentVariant.image}
                      alt={`${product.name} - ${currentVariant.name}`}
                      loading="lazy"
                      style={{
                        WebkitMaskImage: 'radial-gradient(ellipse 90% 90% at 50% 50%, black 60%, transparent 100%)',
                        maskImage: 'radial-gradient(ellipse 90% 90% at 50% 50%, black 60%, transparent 100%)',
                      }}
                      className="max-h-44 sm:max-h-52 max-w-[92%] object-contain transition-all duration-500 drop-shadow-[0_20px_35px_rgba(0,0,0,0.9)] hover:scale-105"
                    />
                  </div>

                  {/* Bottom Grade Color Switcher Dots */}
                  <div className="flex items-center justify-center gap-3.5 z-10 pt-2">
                    {product.variants.map((v, vIdx) => {
                      const isSelected = vIdx === currentVariantIdx;
                      return (
                        <button
                          key={v.name}
                          type="button"
                          onClick={() => handleSelectVariant(product.id, vIdx)}
                          aria-label={`Select ${v.name}`}
                          title={v.name}
                          className={`relative w-4 h-4 rounded-full transition-all duration-200 flex items-center justify-center ${
                            isSelected
                              ? 'scale-125 ring-2 ring-offset-2 ring-orange-500 ring-offset-black'
                              : 'opacity-70 hover:opacity-100 hover:scale-110'
                          }`}
                          style={{ backgroundColor: v.colorHex }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Typography & Actions (Apple Clean Style with Standardized Fixed Heights for Perfect Alignment) */}
                <div className="pt-6 text-center space-y-3 px-2 flex flex-col items-center flex-grow">
                  <h3 className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                    isLight ? 'text-neutral-900' : 'text-white'
                  }`}>
                    {product.name}
                  </h3>

                  <p className={`text-sm sm:text-base leading-relaxed max-w-xs min-h-[48px] flex items-center justify-center ${
                    isLight ? 'text-neutral-600' : 'text-neutral-300'
                  }`}>
                    {product.tagline}
                  </p>

                  <div className="pt-1 text-sm font-mono space-y-1 min-h-[50px] flex flex-col justify-center">
                    <span className="block font-bold text-sm sm:text-base text-orange-600 dark:text-orange-400">
                      {currentVariant.specSummary}
                    </span>
                    <span className={`text-xs sm:text-sm block ${
                      isLight ? 'text-neutral-600' : 'text-neutral-400'
                    }`}>
                      Batch MOQ: {product.batchCapacity}
                    </span>
                  </div>

                  {/* Dual Action Buttons */}
                  <div className="pt-4 flex items-center justify-center gap-4 mt-auto">
                    <Link
                      to="/request-a-quote"
                      className="px-6 py-2.5 rounded-full text-sm font-semibold tracking-wide text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all transform hover:scale-105"
                    >
                      Learn more
                    </Link>

                    <Link
                      to="/request-a-quote"
                      className="inline-flex items-center text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline transition-colors group"
                    >
                      <span>Request RFQ</span>
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
