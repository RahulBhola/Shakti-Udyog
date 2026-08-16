import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Heart, Weight, Layers } from 'lucide-react';
import { useTheme } from '../auth/ThemeContext';

export interface GalleryProductItem {
  id: string;
  title: string;
  category: string;
  grade: string;
  weight: string;
  image: string;
  likes: number;
  specs: string;
}

const TOP_ROW_PRODUCTS: GalleryProductItem[] = [
  {
    id: 'v-belt-1',
    title: 'Cast Iron V-Belt Pulley Set',
    category: 'Power Transmission',
    grade: 'FG 260 Grey Iron',
    weight: '4.8 kg',
    image: '/images/V Belt Pulley/Cast Iron V Belt Pulley Set.png',
    likes: 428,
    specs: 'Dynamic Balanced · ISO 1940 G6.3',
  },
  {
    id: 'sewing-1',
    title: 'TA 1 Industrial Sewing Bracket',
    category: 'Precision Mechanism',
    grade: 'SG 500/7 Ductile Iron',
    weight: '0.65 kg',
    image: '/images/Sewing_machine_parts/Cast Iron TA 1 Bracket Industrial Sewing Machine Part.png',
    likes: 385,
    specs: 'CNC Machined · Vibration Damped',
  },
  {
    id: 'sizzler-1',
    title: 'Continental Sizzler Plate',
    category: 'Commercial Hospitality',
    grade: 'FG 200 Cast Iron',
    weight: '2.4 kg',
    image: '/images/Sizzler Plate/Continental Sizzler Plate.png',
    likes: 512,
    specs: 'High Heat Retention · Food Safe',
  },
  {
    id: 'rotary-pump',
    title: 'Rotary Barrel Pump Casting',
    category: 'Fluid Handling',
    grade: 'FG 260 / SG 400',
    weight: '6.2 kg',
    image: '/images/cast_iron_casting/Cast Iron Rotary Barrel Pump Casting.png',
    likes: 467,
    specs: 'Hydrostatic Tested 25 Bar',
  },
  {
    id: 'gear-lever-1',
    title: 'Automotive Gear Shift Lever',
    category: 'Automotive OEM',
    grade: 'SG 600/3 Ductile Iron',
    weight: '1.85 kg',
    image: '/images/Gear Lever Parts/Cast Iron Car Gear Lever Part.png',
    likes: 394,
    specs: 'High Tensile · Impact Resistant',
  },
  {
    id: 'pulley-4in',
    title: '4-Inch Cast Iron Pulley Wheel',
    category: 'Drive Hardware',
    grade: 'FG 220 Grey Iron',
    weight: '1.4 kg',
    image: '/images/Pulley Wheel/4 Inch Cast Iron Pulley Wheel.png',
    likes: 342,
    specs: 'Keyway Slotted · Smooth Bore',
  },
];

const BOTTOM_ROW_PRODUCTS: GalleryProductItem[] = [
  {
    id: 'tractor-part',
    title: 'Cast Iron Tractor Part Casting',
    category: 'Agri-Machinery',
    grade: 'SG 500/7 Ductile Iron',
    weight: '14.5 kg',
    image: '/images/cast_iron_casting/Cast Iron Tractor Part Casting.png',
    likes: 580,
    specs: 'Heavy Field Load · Fatigue Tested',
  },
  {
    id: 'train-handle',
    title: 'Train Door Handle Casting',
    category: 'Railways & Transit',
    grade: 'SG 400/15 Ductile Iron',
    weight: '2.1 kg',
    image: '/images/cast_iron_casting/Cast Iron Train Door Handle Casting.png',
    likes: 419,
    specs: 'EN 1563 Compliant · High Impact',
  },
  {
    id: 'button-machine',
    title: 'Button Machine Frame Casting',
    category: 'Apparel Machinery',
    grade: 'FG 200 Grey Iron',
    weight: '8.7 kg',
    image: '/images/cast_iron_casting/Cast Iron Button Machine Casting.png',
    likes: 365,
    specs: 'Flat Ground Beds · Damped Rigidity',
  },
  {
    id: 'hillside-washer',
    title: 'Structural Hillside Washer',
    category: 'Structural Steel',
    grade: 'SG 400 Ductile Iron',
    weight: '0.45 kg',
    image: '/images/Hillside Washer/Cast Iron Hillside Washer.png',
    likes: 298,
    specs: 'Hot Dip Galvanized Ready',
  },
  {
    id: 'collar-plug',
    title: 'High Pressure Collar Plug',
    category: 'Hydraulics & Piping',
    grade: 'FG 260 Grey Iron',
    weight: '0.85 kg',
    image: '/images/Collar Plug/Cast Iron Collar Plug.png',
    likes: 334,
    specs: 'BSPT Threaded · Zero Leakage',
  },
  {
    id: 'sewing-t1',
    title: 'T1 Industrial Sewing Bracket',
    category: 'Precision Machinery',
    grade: 'FG 220 Cast Iron',
    weight: '0.55 kg',
    image: '/images/Sewing_machine_parts/Cast Iron Chal T1 Industrial Sewing Machine Part.png',
    likes: 405,
    specs: 'High Speed Sewing Damping',
  },
];

export const ProductMarqueeGallery: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [selectedProduct, setSelectedProduct] = useState<GalleryProductItem | null>(null);

  // Duplicate arrays to create continuous infinite marquee loop
  const topLoop = [...TOP_ROW_PRODUCTS, ...TOP_ROW_PRODUCTS, ...TOP_ROW_PRODUCTS];
  const bottomLoop = [...BOTTOM_ROW_PRODUCTS, ...BOTTOM_ROW_PRODUCTS, ...BOTTOM_ROW_PRODUCTS];

  return (
    <section className={`relative py-16 sm:py-24 overflow-hidden transition-colors duration-300 ${
      isLight ? 'bg-[#f4f5f7]' : 'bg-[#050507]'
    }`}>
      {/* Header Container — Centered Alignment */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 mb-10 sm:mb-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs sm:text-sm font-mono font-bold tracking-wider uppercase text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/30">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>Engineered Component Catalog</span>
            </div>
            <h2 className={`text-3xl sm:text-5xl font-bold tracking-tight ${
              isLight ? 'text-neutral-900' : 'text-white'
            }`}>
              Precision Castings in Motion
            </h2>
            <p className={`text-base sm:text-lg max-w-2xl leading-relaxed ${
              isLight ? 'text-neutral-600' : 'text-neutral-300'
            }`}>
              Explore our diverse cast iron &amp; ductile iron components manufactured for OEM machinery, automotive drives, and heavy infrastructure.
            </p>
          </div>

          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold tracking-wide text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 shadow-[0_4px_20px_rgba(255,109,0,0.3)] transition-all transform hover:-translate-y-0.5 shrink-0"
          >
            <span>Explore All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Infinite Scrolling Dual-Row Marquee */}
      <div className="space-y-6 sm:space-y-8 select-none">
        
        {/* Row 1: Left to Right */}
        <div className="relative w-full overflow-hidden flex">
          <div className={`absolute top-0 bottom-0 left-0 w-16 sm:w-32 z-10 pointer-events-none ${
            isLight ? 'bg-gradient-to-r from-[#f4f5f7] to-transparent' : 'bg-gradient-to-r from-[#050507] to-transparent'
          }`} />
          <div className={`absolute top-0 bottom-0 right-0 w-16 sm:w-32 z-10 pointer-events-none ${
            isLight ? 'bg-gradient-to-l from-[#f4f5f7] to-transparent' : 'bg-gradient-to-l from-[#050507] to-transparent'
          }`} />

          <div className="animate-marquee-ltr gap-5 sm:gap-6 px-3">
            {topLoop.map((item, idx) => (
              <ProductGalleryCard
                key={`${item.id}-${idx}`}
                item={item}
                isLight={isLight}
                onSelect={() => setSelectedProduct(item)}
              />
            ))}
          </div>
        </div>

        {/* Row 2: Right to Left */}
        <div className="relative w-full overflow-hidden flex">
          <div className={`absolute top-0 bottom-0 left-0 w-16 sm:w-32 z-10 pointer-events-none ${
            isLight ? 'bg-gradient-to-r from-[#f4f5f7] to-transparent' : 'bg-gradient-to-r from-[#050507] to-transparent'
          }`} />
          <div className={`absolute top-0 bottom-0 right-0 w-16 sm:w-32 z-10 pointer-events-none ${
            isLight ? 'bg-gradient-to-l from-[#f4f5f7] to-transparent' : 'bg-gradient-to-l from-[#050507] to-transparent'
          }`} />

          <div className="animate-marquee-rtl gap-5 sm:gap-6 px-3">
            {bottomLoop.map((item, idx) => (
              <ProductGalleryCard
                key={`${item.id}-${idx}`}
                item={item}
                isLight={isLight}
                onSelect={() => setSelectedProduct(item)}
              />
            ))}
          </div>
        </div>

      </div>

      {/* Lightbox / Detail Quick View Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className={`relative w-full max-w-xl p-7 sm:p-9 rounded-3xl border shadow-2xl transition-all ${
            isLight ? 'bg-white border-neutral-200 text-neutral-900' : 'bg-[#0f1015] border-white/10 text-white'
          }`}>
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center bg-neutral-500/20 hover:bg-neutral-500/40 text-neutral-400 hover:text-white transition-colors text-lg"
            >
              ✕
            </button>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl bg-[#0a0b0e] flex items-center justify-center p-4 border border-white/10 shadow-inner shrink-0">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.title}
                  className="w-full h-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.9)]"
                />
              </div>

              <div className="space-y-3.5 w-full">
                <div className="inline-block px-3 py-1 rounded-md text-xs font-mono uppercase bg-orange-500/15 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/30">
                  {selectedProduct.category}
                </div>

                <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {selectedProduct.title}
                </h3>

                <div className="grid grid-cols-2 gap-2.5 text-xs font-mono pt-2">
                  <div className={`p-2.5 rounded-xl border ${
                    isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-white/5 border-white/5'
                  }`}>
                    <span className="text-neutral-500 block">Grade</span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">{selectedProduct.grade}</span>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${
                    isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-white/5 border-white/5'
                  }`}>
                    <span className="text-neutral-500 block">Piece Weight</span>
                    <span className="font-semibold">{selectedProduct.weight}</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed pt-1">
                  {selectedProduct.specs}
                </p>

                <div className="pt-3">
                  <Link
                    to="/request-a-quote"
                    className="w-full block text-center py-3 rounded-full text-sm font-semibold tracking-wide text-white bg-orange-500 hover:bg-orange-600 transition-all shadow-[0_0_15px_rgba(255,109,0,0.3)]"
                  >
                    Request Quotation for this Component
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

interface CardProps {
  item: GalleryProductItem;
  isLight: boolean;
  onSelect: () => void;
}

const ProductGalleryCard: React.FC<CardProps> = ({ item, isLight, onSelect }) => {
  return (
    <div
      onClick={onSelect}
      className={`group relative w-68 sm:w-76 h-84 rounded-3xl p-5 flex flex-col justify-between cursor-pointer border transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-2xl ${
        isLight
          ? 'bg-white border-neutral-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-orange-500/40'
          : 'bg-[#0e0f14]/90 border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:border-orange-500/50 hover:shadow-[0_12px_40px_rgba(255,109,0,0.15)]'
      }`}
    >
      {/* Top Meta Badge */}
      <div className="flex items-center justify-between text-xs">
        <span className="px-3 py-1 rounded-full font-mono font-semibold text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/30">
          {item.category}
        </span>
        <div className="flex items-center gap-1.5 text-neutral-400">
          <Heart className="w-4 h-4 text-neutral-400 group-hover:text-red-400 transition-colors" />
          <span className="font-mono text-xs">{item.likes}</span>
        </div>
      </div>

      {/* Central Product Image Container */}
      <div className={`relative w-full h-40 my-2.5 flex items-center justify-center overflow-hidden rounded-2xl p-2.5 ${
        isLight
          ? 'bg-gradient-to-b from-[#1c1e26] to-[#0c0d12] border border-black/10 shadow-md'
          : 'bg-gradient-to-b from-[#14151c] to-[#08090d] border border-white/5'
      }`}>
        <img
          src={item.image}
          alt={item.title}
          loading="lazy"
          className="max-h-36 max-w-[88%] object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-[0_10px_20px_rgba(0,0,0,0.85)]"
        />
      </div>

      {/* Card Info Footer */}
      <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-white/[0.06]">
        <h4 className={`text-sm sm:text-base font-bold tracking-tight line-clamp-1 group-hover:text-orange-500 transition-colors ${
          isLight ? 'text-neutral-900' : 'text-white'
        }`}>
          {item.title}
        </h4>

        <div className="flex items-center justify-between text-xs font-mono text-neutral-500 dark:text-neutral-400">
          <span className="flex items-center gap-1.5 font-semibold text-orange-600 dark:text-orange-400">
            <Layers className="w-3.5 h-3.5 text-orange-500" />
            <span>{item.grade}</span>
          </span>
          <span className="flex items-center gap-1 font-semibold text-neutral-700 dark:text-neutral-300">
            <Weight className="w-3.5 h-3.5 text-neutral-400" />
            <span>{item.weight}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
