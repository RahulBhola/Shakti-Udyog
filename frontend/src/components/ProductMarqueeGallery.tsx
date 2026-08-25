import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Layers,
  Clock,
  ArrowRight,
  Box,
  LayoutGrid,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from '../auth/ThemeContext';
import { getThemedImage } from '../utils/themeImage';

export interface GalleryProductItem {
  id: string;
  title: string;
  category: string;
  grade: string;
  weight: string;
  image: string;
  specs: string;
}

// Row 1 Products (10 Components)
const ROW_1_PRODUCTS: GalleryProductItem[] = [
  {
    id: 'sewing-arm',
    title: 'TA 1 Industrial Sewing Machine Bracket',
    category: 'Precision Mechanism',
    grade: 'SG 500/7 Ductile Iron',
    weight: '0.65 kg',
    image: '/images/Sewing_machine_parts/Cast Iron TA 1 Bracket Industrial Sewing Machine Part.png',
    specs: 'Precision CNC machined kinematic bracket with micron tolerance',
  },
  {
    id: 'sizzler-s',
    title: 'Continental Sizzler Platter Standard',
    category: 'Commercial Hospitality',
    grade: 'FG 200 Cast Iron',
    weight: '2.4 kg',
    image: '/images/Sizzler Plate/Continental Sizzler Plate.png',
    specs: 'Thermal shock resistant pre-seasoned heat retention platter',
  },
  {
    id: 'v-belt-a',
    title: 'Precision Balanced V-Belt Pulley 1A',
    category: 'Power Transmission',
    grade: 'FG 220 Grey Iron',
    weight: '3.8 kg',
    image: '/images/V Belt Pulley/Cast Iron V Belt Pulley Set.png',
    specs: 'Dynamically balanced to ISO 1940 G6.3 up to 3,500 RPM',
  },
  {
    id: 'collar-plug',
    title: 'High-Pressure Collar Sealing Plug',
    category: 'Fluid Containment',
    grade: 'FG 260 Hydraulic Iron',
    weight: '1.1 kg',
    image: '/images/Collar Plug/Cast Iron Collar Plug.png',
    specs: 'Pressure containment certified for 250+ bar hydraulic lines',
  },
  {
    id: 'tractor-bracket',
    title: 'Heavy Duty Tractor Axle Support',
    category: 'Agricultural Machinery',
    grade: 'SG 600/3 Ductile Iron',
    weight: '8.5 kg',
    image: '/images/cast_iron_casting/Cast Iron Tractor Part Casting.png',
    specs: 'High fatigue strength for continuous heavy field tillage loads',
  },
  {
    id: 'gear-lever-a',
    title: 'Automotive Transmission Shift Lever',
    category: 'Automotive Powertrain',
    grade: 'SG 700/2 High Tensile',
    weight: '1.4 kg',
    image: '/images/Gear Lever Parts/Cast Iron Car Gear Lever Part.png',
    specs: 'Surface induction hardened against gear shifting torsional fatigue',
  },
  {
    id: 'pulley-wheel',
    title: 'Industrial Heavy Duty Pulley Wheel',
    category: 'Heavy Engineering',
    grade: 'FG 260 Grey Iron',
    weight: '12.0 kg',
    image: '/images/Pulley Wheel/6 Inch Cast Iron Pulley Wheel.png',
    specs: 'Wear resistant deep groove pulley for heavy material lifting',
  },
  {
    id: 'rotary-pump',
    title: 'Hydraulic Rotary Barrel Pump Housing',
    category: 'Fluid Containment',
    grade: 'FG 260 Hydraulic Iron',
    weight: '5.6 kg',
    image: '/images/cast_iron_casting/Cast Iron Rotary Barrel Pump Casting.png',
    specs: 'Hydrostatically tested for zero porosity under continuous pressure',
  },
  {
    id: 'hillside-washer',
    title: 'Structural Hillside Washer Casting',
    category: 'Structural Infrastructure',
    grade: 'FG 220 Grey Iron',
    weight: '0.9 kg',
    image: '/images/Hillside Washer/Cast Iron Hillside Washer.png',
    specs: 'High load distributing diagonal anchor washer for steel structures',
  },
  {
    id: 'button-machine',
    title: 'Button Machine Heavy Base Frame',
    category: 'Industrial Machinery',
    grade: 'FG 200 Cast Iron',
    weight: '16.5 kg',
    image: '/images/cast_iron_casting/Cast Iron Button Machine Casting.png',
    specs: 'High vibrational damping base frame for industrial press automation',
  },
];

// Row 2 Products (10 Components)
const ROW_2_PRODUCTS: GalleryProductItem[] = [
  {
    id: 'link-part',
    title: 'Forged Link Pivot Mechanism',
    category: 'Motion Control',
    grade: 'SG 500/7 Ductile Iron',
    weight: '0.85 kg',
    image: '/images/Link Part/Iron Link Part 50g.png',
    specs: 'Precision ground bore with high tensile kinematic endurance',
  },
  {
    id: 'train-handle',
    title: 'Railway Passenger Door Safety Handle',
    category: 'Railway Transport',
    grade: 'SG 600/3 Ductile Iron',
    weight: '1.75 kg',
    image: '/images/cast_iron_casting/Cast Iron Train Door Handle Casting.png',
    specs: 'Impact proof safety certified casting for passenger rail cars',
  },
  {
    id: 'sizzler-m',
    title: 'Commercial Sizzler Platter Round',
    category: 'Commercial Hospitality',
    grade: 'FG 200 Cast Iron',
    weight: '1.9 kg',
    image: '/images/Sizzler Plate/Continental Sizzler Plate 1.png',
    specs: 'Heavy heat retention base designed for commercial kitchens',
  },
  {
    id: 'nut-heavy',
    title: 'Industrial Hex Check Nut Casting',
    category: 'Fasteners & Hardware',
    grade: 'FG 220 Grey Iron',
    weight: '0.45 kg',
    image: '/images/Cast Iron Nut/Cast Iron Door Closer Nut.png',
    specs: 'Clean tapped threads with high torque clamp load capability',
  },
  {
    id: 'gear-lever-b',
    title: 'Commercial Truck Shift Control Link',
    category: 'Automotive Powertrain',
    grade: 'SG 600/3 Ductile Iron',
    weight: '2.1 kg',
    image: '/images/Gear Lever Parts/Cast Iron Car Gear Lever Part 1.png',
    specs: 'Reinforced pivot arm for commercial truck transmissions',
  },
  {
    id: 'industrial-block',
    title: 'Precision Machine Tool Pillow Block',
    category: 'General Engineering',
    grade: 'FG 260 Grey Iron',
    weight: '9.4 kg',
    image: '/images/Industrial Iron Casting.png',
    specs: 'Stress relieved casting for dimensional stability under load',
  },
  {
    id: 'check-nut',
    title: 'Slotted Locking Nut Casting',
    category: 'Fasteners & Hardware',
    grade: 'FG 220 Grey Iron',
    weight: '0.35 kg',
    image: '/images/cast_iron_casting/Cast Iron Check Nut Casting.png',
    specs: 'Cotter pin slotted locking nut for heavy shaft retention',
  },
  {
    id: 'chal-t1',
    title: 'Chal T1 Sewing Mechanism',
    category: 'Precision Mechanism',
    grade: 'FG 220 Grey Iron',
    weight: '0.55 kg',
    image: '/images/Sewing_machine_parts/Cast Iron Chal T1 Industrial Sewing Machine Part.png',
    specs: 'Vibration absorbing needle drive kinematic link',
  },
  {
    id: 'sv-came',
    title: 'SV Came Sewing Cam',
    category: 'Precision Mechanism',
    grade: 'SG 500/7 Ductile Iron',
    weight: '0.38 kg',
    image: '/images/Sewing_machine_parts/Cast Iron SV Came Industrial Sewing Machine Part.png',
    specs: 'Micron profile ground cam lobe for cycle timing',
  },
  {
    id: 'v-belt-2',
    title: 'Dual Groove V-Belt Pulley',
    category: 'Power Transmission',
    grade: 'FG 260 Grey Iron',
    weight: '5.2 kg',
    image: '/images/V Belt Pulley/Cast Iron V Belt Pulley Set 1.png',
    specs: 'Dual groove heavy power transmission drive pulley',
  },
];

interface ProductCardProps {
  item: GalleryProductItem;
  isLight: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ item, isLight }) => (
  <div
    className={`group relative w-[270px] sm:w-[310px] rounded-2xl p-4 flex flex-col justify-between cursor-pointer border shrink-0 transition-all duration-300 select-none ${
      isLight
        ? 'bg-white border-neutral-200/90 hover:border-blue-400 hover:shadow-xl shadow-[0_4px_16px_rgba(0,0,0,0.03)]'
        : 'bg-[#0b0c10] border-white/[0.08] hover:border-sky-500/40 hover:bg-[#0e0f14] hover:shadow-[0_0_20px_rgba(56,189,248,0.12)]'
    }`}
  >
    {/* Top Row: Category Pill Badge + Quality Certified Pill */}
    <div className="flex items-center justify-between text-xs mb-2.5">
      <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] sm:text-[11px] font-semibold tracking-wide ${
        isLight
          ? 'bg-blue-50 text-blue-700 border border-blue-200/80'
          : 'bg-white/5 text-neutral-300 border border-white/10 group-hover:text-sky-400 group-hover:border-sky-500/30'
      }`}>
        {item.category}
      </span>

      <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono text-neutral-400">
        <ShieldCheck className="w-3 h-3 text-emerald-500" />
        <span className="hidden sm:inline">Certified</span>
      </div>
    </div>

    {/* Center Product Image Container with Dark/Light Studio */}
    <div className={`relative w-full h-40 sm:h-44 my-1 flex items-center justify-center overflow-hidden rounded-2xl p-2.5 ${
      isLight
        ? 'bg-gradient-to-b from-neutral-50/80 to-neutral-100/60'
        : 'bg-gradient-to-b from-[#12131a] to-[#07080b]'
    }`}>
      <img
        src={getThemedImage(item.image, isLight)}
        alt={item.title}
        loading="lazy"
        style={
          isLight
            ? undefined
            : {
                WebkitMaskImage: 'radial-gradient(ellipse 92% 92% at 50% 50%, black 75%, transparent 100%)',
                maskImage: 'radial-gradient(ellipse 92% 92% at 50% 50%, black 75%, transparent 100%)',
              }
        }
        className={`max-h-32 sm:max-h-36 max-w-[92%] w-auto h-auto object-contain transition-transform duration-500 group-hover:scale-110 ${
          isLight ? 'drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)]' : 'drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]'
        }`}
      />
    </div>

    {/* Card Bottom Meta */}
    <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-white/[0.06]">
      <h3 className={`text-xs sm:text-sm font-bold tracking-tight line-clamp-1 group-hover:text-blue-500 transition-colors ${
        isLight ? 'text-neutral-900' : 'text-white'
      }`}>
        {item.title}
      </h3>

      <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-1">
          <Layers className="w-3 h-3 text-sky-400" />
          <span className="truncate max-w-[100px]">{item.grade}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Clock className="w-3 h-3 text-neutral-400" />
          <span>{item.weight}</span>
        </div>
      </div>
    </div>
  </div>
);

export const ProductMarqueeGallery: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Duplicate arrays for infinite seamless loop
  const row1Loop = [...ROW_1_PRODUCTS, ...ROW_1_PRODUCTS, ...ROW_1_PRODUCTS];
  const row2Loop = [...ROW_2_PRODUCTS, ...ROW_2_PRODUCTS, ...ROW_2_PRODUCTS];

  return (
    <section className={`relative py-10 sm:py-14 overflow-hidden transition-colors duration-300 ${
      isLight ? 'bg-[#f4f7fb]' : 'bg-[#050608]'
    }`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 mb-8 sm:mb-12">
        
        {/* Section Header with Scroll Animation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-8"
        >
          
          {/* Left Column: Eyebrow + 2-Line Bold Heading */}
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2.5 text-xs font-mono font-bold tracking-widest uppercase">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                isLight ? 'bg-blue-600 text-white' : 'bg-blue-500/20 text-sky-400 border border-blue-500/30'
              }`}>
                <Box className="w-3.5 h-3.5" />
              </div>
              <span className={isLight ? 'text-blue-700' : 'text-sky-400'}>
                ENGINEERED COMPONENT CATALOG
              </span>
            </div>

            <h2 className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] ${
              isLight ? 'text-neutral-900' : 'text-white'
            }`}>
              Precision Castings<br />in Motion
            </h2>
          </div>

          {/* Right Column: Description + Link */}
          <div className="space-y-3 max-w-lg">
            <p className={`text-sm sm:text-base leading-relaxed ${
              isLight ? 'text-neutral-600' : 'text-neutral-400'
            }`}>
              Explore our diverse range of cast iron &amp; ductile iron components manufactured for OEM machinery, automotive drives, and heavy infrastructure.
            </p>
            <Link
              to="/products"
              className={`inline-flex items-center gap-1.5 text-sm sm:text-base font-bold transition-colors ${
                isLight ? 'text-blue-600 hover:text-blue-700' : 'text-sky-400 hover:text-sky-300'
              }`}
            >
              <span>Explore All Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </motion.div>
      </div>

      {/* Dual Continuous Infinite Marquee Rows Container */}
      <div className="relative w-full space-y-4 sm:space-y-6 overflow-hidden py-4">
        
        {/* Left & Right Gradient Fade Masks for Seamless Edge Transitions */}
        <div className={`absolute top-0 left-0 bottom-0 w-16 sm:w-28 md:w-40 z-20 pointer-events-none bg-gradient-to-r ${
          isLight ? 'from-[#f4f7fb] to-transparent' : 'from-[#050608] to-transparent'
        }`} />
        <div className={`absolute top-0 right-0 bottom-0 w-16 sm:w-28 md:w-40 z-20 pointer-events-none bg-gradient-to-l ${
          isLight ? 'from-[#f4f7fb] to-transparent' : 'from-[#050608] to-transparent'
        }`} />

        {/* Top Row: Moves from LEFT to RIGHT (marquee-ltr) */}
        <div className="flex overflow-hidden py-3">
          <div className="animate-marquee-ltr flex gap-4 sm:gap-5 will-change-transform py-2 px-1">
            {row1Loop.map((item, idx) => (
              <ProductCard key={`r1-${item.id}-${idx}`} item={item} isLight={isLight} />
            ))}
          </div>
        </div>

        {/* Bottom Row: Moves from RIGHT to LEFT (marquee-rtl) */}
        <div className="flex overflow-hidden py-3">
          <div className="animate-marquee-rtl flex gap-4 sm:gap-5 will-change-transform py-2 px-1">
            {row2Loop.map((item, idx) => (
              <ProductCard key={`r2-${item.id}-${idx}`} item={item} isLight={isLight} />
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Action Section */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 mt-10 sm:mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-neutral-200/60 dark:border-white/5"
        >
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>20+ Precision Engineered Castings • Hover Card to Pause</span>
          </div>

          {/* View Full Component Catalog Button */}
          <Link
            to="/products"
            className={`inline-flex items-center gap-2 px-7 py-3 rounded-full text-xs sm:text-sm font-mono font-bold tracking-wider transition-all border shadow-sm transform hover:scale-105 ${
              isLight
                ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                : 'bg-blue-950/60 border-blue-500/40 text-sky-300 hover:bg-blue-900/80 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>View Full Component Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>

    </section>
  );
};
