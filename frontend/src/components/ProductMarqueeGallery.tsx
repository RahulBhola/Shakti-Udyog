import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Heart, ArrowRight, Box } from 'lucide-react';
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

const ALL_GALLERY_PRODUCTS: GalleryProductItem[][] = [
  // Page 1 (10 items: 5 columns x 2 rows)
  [
    {
      id: 'pulley-4in',
      title: '4-Inch Cast Iron Pulley',
      category: 'Drive Hardware',
      grade: 'FG 220 Grey Iron',
      weight: '1.4 kg',
      image: '/images/Pulley Wheel/4 Inch Cast Iron Pulley Wheel.png',
      likes: 394,
      specs: 'Precision keyway slotted & dynamically balanced',
    },
    {
      id: 'v-belt-set',
      title: 'Cast Iron V-Belt Pulley Set',
      category: 'Power Transmission',
      grade: 'FG 260 Grey Iron',
      weight: '4.8 kg',
      image: '/images/V Belt Pulley/Cast Iron V Belt Pulley Set.png',
      likes: 428,
      specs: 'Multi-groove industrial power transmission',
    },
    {
      id: 'sewing-arm',
      title: 'TA 1 Industrial Sewing Arm',
      category: 'Precision Mechanism',
      grade: 'SG 500/7 Ductile Iron',
      weight: '0.65 kg',
      image: '/images/Sewing_machine_parts/Cast Iron TA 1 Bracket Industrial Sewing Machine Part.png',
      likes: 385,
      specs: 'Vibration damped for 5000+ RPM continuous operation',
    },
    {
      id: 'sizzler-plate',
      title: 'Continental Sizzler Plate',
      category: 'Commercial Hospitality',
      grade: 'FG 200 Cast Iron',
      weight: '2.4 kg',
      image: '/images/Sizzler Plate/Continental Sizzler Plate.png',
      likes: 512,
      specs: 'High heat retention, heavy cast iron food service',
    },
    {
      id: 'rotary-pump-housing',
      title: 'Rotary Pump Housing',
      category: 'Fluid Handling',
      grade: 'FG 220 Grey Iron',
      weight: '3.7 kg',
      image: '/images/cast_iron_casting/Cast Iron Rotary Barrel Pump Casting.png',
      likes: 276,
      specs: 'Hydrostatic pressure tested for zero leakage',
    },
    {
      id: 'tractor-part',
      title: 'Cast Iron Tractor Part',
      category: 'Agri-Machinery',
      grade: 'FG 220 Grey Iron',
      weight: '3.2 kg',
      image: '/images/cast_iron_casting/Cast Iron Tractor Part Casting.png',
      likes: 580,
      specs: 'Heavy load endurance for agricultural machinery',
    },
    {
      id: 'train-handle',
      title: 'Train Door Handle Casting',
      category: 'Railways & Transit',
      grade: 'FG 260 Grey Iron',
      weight: '0.75 kg',
      image: '/images/cast_iron_casting/Cast Iron Train Door Handle Casting.png',
      likes: 419,
      specs: 'High tensile impact resistance for railway coaches',
    },
    {
      id: 'button-machine-frame',
      title: 'Button Machine Frame',
      category: 'Apparel Machinery',
      grade: 'FG 220 Grey Iron',
      weight: '1.1 kg',
      image: '/images/cast_iron_casting/Cast Iron Button Machine Casting.png',
      likes: 365,
      specs: 'Rigid flat-ground base for precision punching',
    },
    {
      id: 'hillside-washer',
      title: 'Structural Hillside Washer',
      category: 'Structural Steel',
      grade: 'FG 200 Cast Iron',
      weight: '0.35 kg',
      image: '/images/Hillside Washer/Cast Iron Hillside Washer.png',
      likes: 298,
      specs: 'Angled tie-rod bracing for pre-engineered buildings',
    },
    {
      id: 'high-pressure-collar',
      title: 'High Pressure Collar',
      category: 'Hydraulics & Piping',
      grade: 'FG 260 Grey Iron',
      weight: '1.9 kg',
      image: '/images/Collar Plug/Cast Iron Collar Plug.png',
      likes: 310,
      specs: 'Threaded high-containment fluid pipe coupling',
    },
  ],
  // Page 2 (10 items: 5 columns x 2 rows)
  [
    {
      id: 'gear-lever',
      title: 'Automotive Shift Lever',
      category: 'Automotive OEM',
      grade: 'SG 600/3 Ductile Iron',
      weight: '1.85 kg',
      image: '/images/Gear Lever Parts/Cast Iron Car Gear Lever Part.png',
      likes: 432,
      specs: 'High tensile fatigue proof automotive shift linkage',
    },
    {
      id: 'pulley-6in',
      title: '6-Inch Cast Iron Pulley Wheel',
      category: 'Drive Hardware',
      grade: 'FG 260 Grey Iron',
      weight: '3.1 kg',
      image: '/images/Pulley Wheel/6 Inch Cast Iron Pulley Wheel.png',
      likes: 378,
      specs: 'Solid web dynamically balanced transmission pulley',
    },
    {
      id: 'check-nut',
      title: 'Cast Iron Check Nut',
      category: 'Machinery Hardware',
      grade: 'FG 220 Grey Iron',
      weight: '0.42 kg',
      image: '/images/cast_iron_casting/Cast Iron Check Nut Casting.png',
      likes: 289,
      specs: 'Precision threaded locknut for drive spindles',
    },
    {
      id: 'link-part',
      title: 'Precision Iron Link Part',
      category: 'Mechanism Linkages',
      grade: 'SG 400 Ductile Iron',
      weight: '0.08 kg',
      image: '/images/Link Part/link part 80g.png',
      likes: 315,
      specs: 'Compact ductile link with zero elongation play',
    },
    {
      id: 'door-closer-nut',
      title: 'Door Closer Hex Nut',
      category: 'Hardware & Fixtures',
      grade: 'FG 200 Cast Iron',
      weight: '0.28 kg',
      image: '/images/Cast Iron Nut/Cast Iron Door Closer Nut.png',
      likes: 265,
      specs: 'Hydraulic door closer sealing hex body',
    },
    {
      id: 'chal-t1',
      title: 'Chal T1 Sewing Mechanism',
      category: 'Precision Mechanism',
      grade: 'FG 220 Grey Iron',
      weight: '0.55 kg',
      image: '/images/Sewing_machine_parts/Cast Iron Chal T1 Industrial Sewing Machine Part.png',
      likes: 412,
      specs: 'Vibration absorbing needle drive kinematic link',
    },
    {
      id: 'sv-came',
      title: 'SV Came Sewing Cam',
      category: 'Precision Mechanism',
      grade: 'SG 500/7 Ductile Iron',
      weight: '0.38 kg',
      image: '/images/Sewing_machine_parts/Cast Iron SV Came Industrial Sewing Machine Part.png',
      likes: 349,
      specs: 'Micron profile ground cam lobe for cycle timing',
    },
    {
      id: 'v-belt-2',
      title: 'Dual Groove V-Belt Pulley',
      category: 'Power Transmission',
      grade: 'FG 260 Grey Iron',
      weight: '5.2 kg',
      image: '/images/V Belt Pulley/Cast Iron V Belt Pulley Set 1.png',
      likes: 467,
      specs: 'Double B-section grooved heavy duty motor pulley',
    },
    {
      id: 'sizzler-wooden',
      title: 'Sizzler Server Base Casting',
      category: 'Commercial Hospitality',
      grade: 'FG 200 Cast Iron',
      weight: '2.8 kg',
      image: '/images/Sizzler Plate/Continental Sizzler Plate 1.png',
      likes: 495,
      specs: 'Deep well sizzling plate for restaurants & hotels',
    },
    {
      id: 'gear-lever-2',
      title: 'Heavy Truck Shift Fork',
      category: 'Automotive OEM',
      grade: 'SG 600/3 Ductile Iron',
      weight: '2.4 kg',
      image: '/images/Gear Lever Parts/Cast Iron Car Gear Lever Part 1.png',
      likes: 390,
      specs: 'Impact resistant transmission shift fork casting',
    },
  ],
];

export const ProductMarqueeGallery: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [currentPage, setCurrentPage] = useState(0);
  const [activeCardId, setActiveCardId] = useState<string>('sewing-arm');
  const [selectedProduct, setSelectedProduct] = useState<GalleryProductItem | null>(null);

  const totalPages = ALL_GALLERY_PRODUCTS.length;
  const currentProducts = ALL_GALLERY_PRODUCTS[currentPage] || ALL_GALLERY_PRODUCTS[0];

  const handlePrev = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  };

  return (
    <section className={`relative py-16 sm:py-24 transition-colors duration-300 ${
      isLight ? 'bg-[#f8f9fa]' : 'bg-[#060709]'
    }`}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        
        {/* Section Header (Matching Reference UI Exactly) */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12 sm:mb-16">
          
          {/* Left Column: Eyebrow + 2-Line Bold Heading */}
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2.5 text-xs font-mono font-bold tracking-widest uppercase">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                isLight ? 'bg-blue-600 text-white' : 'bg-orange-500 text-black'
              }`}>
                <Box className="w-3.5 h-3.5" />
              </div>
              <span className={isLight ? 'text-blue-700' : 'text-orange-500'}>
                ENGINEERED COMPONENT CATALOG
              </span>
            </div>

            <h2 className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] ${
              isLight ? 'text-neutral-900' : 'text-white'
            }`}>
              Precision Castings<br />in Motion
            </h2>
          </div>

          {/* Right Column: Description + Link + Arrow Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end gap-6 lg:gap-10 max-w-xl">
            <div className="space-y-2">
              <p className={`text-sm sm:text-base leading-relaxed ${
                isLight ? 'text-neutral-600' : 'text-neutral-400'
              }`}>
                Explore our diverse range of cast iron &amp; ductile iron components manufactured for OEM machinery, automotive drives, and heavy infrastructure.
              </p>
              <Link
                to="/products"
                className={`inline-flex items-center gap-1.5 text-sm sm:text-base font-bold transition-colors ${
                  isLight ? 'text-blue-600 hover:text-blue-700' : 'text-orange-500 hover:text-orange-400'
                }`}
              >
                <span>Explore All Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Circular Navigation Buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous Products"
                className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-200 ${
                  isLight
                    ? 'bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-100 shadow-sm'
                    : 'bg-[#12131a] border-white/15 text-white hover:bg-white/10'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Next Products"
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-md transform hover:scale-105 ${
                  isLight
                    ? 'bg-[#0f172a] text-white hover:bg-[#1e293b]'
                    : 'bg-gradient-to-r from-orange-600 to-amber-500 text-black hover:from-orange-500 hover:to-amber-400 shadow-[0_0_15px_rgba(255,109,0,0.3)]'
                }`}
              >
                <ChevronRight className="w-5 h-5 font-bold" />
              </button>
            </div>
          </div>

        </div>

        {/* 5x2 Product Cards Grid (Matching Reference UI Exactly) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
          {currentProducts.map((item) => {
            const isActive = activeCardId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => {
                  setActiveCardId(item.id);
                  setSelectedProduct(item);
                }}
                className={`group relative rounded-2xl p-4 sm:p-4.5 flex flex-col justify-between cursor-pointer border transition-all duration-300 ${
                  isLight
                    ? isActive
                      ? 'bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-xl'
                      : 'bg-white border-neutral-200/90 hover:border-blue-400 hover:shadow-lg shadow-[0_4px_16px_rgba(0,0,0,0.03)]'
                    : isActive
                      ? 'bg-[#0f1017] border-orange-500 shadow-[0_0_25px_rgba(255,109,0,0.2)]'
                      : 'bg-[#0b0c10] border-white/[0.08] hover:border-orange-500/50 hover:bg-[#0e0f14]'
                }`}
              >
                {/* Top Row: Category Pill Badge + Like Count */}
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] sm:text-[11px] font-semibold tracking-wide ${
                    isLight
                      ? 'bg-blue-50 text-blue-700 border border-blue-200/80'
                      : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                  }`}>
                    {item.category}
                  </span>

                  <div className="flex items-center gap-1 text-neutral-400">
                    <Heart className="w-3.5 h-3.5 text-neutral-400 group-hover:text-red-400 transition-colors" />
                    <span className="font-mono text-[10px] sm:text-[11px]">{item.likes}</span>
                  </div>
                </div>

                {/* Center Product Image Container with Soft Vignette */}
                <div className={`relative w-full h-36 sm:h-40 my-1.5 flex items-center justify-center overflow-hidden rounded-xl p-2 ${
                  isLight
                    ? 'bg-gradient-to-b from-neutral-50/80 to-neutral-100/60'
                    : 'bg-gradient-to-b from-[#12131a] to-[#07080b]'
                }`}>
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    style={{
                      WebkitMaskImage: 'radial-gradient(ellipse 90% 90% at 50% 50%, black 70%, transparent 100%)',
                      maskImage: 'radial-gradient(ellipse 90% 90% at 50% 50%, black 70%, transparent 100%)',
                    }}
                    className="max-h-32 sm:max-h-36 max-w-[90%] object-contain transition-transform duration-500 group-hover:scale-105 drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
                  />
                </div>

                {/* Card Bottom Meta */}
                <div className="space-y-2 pt-2.5 border-t border-neutral-100 dark:border-white/[0.06]">
                  <h3 className={`text-xs sm:text-sm font-bold tracking-tight line-clamp-1 group-hover:text-orange-500 transition-colors ${
                    isLight ? 'text-neutral-900' : 'text-white'
                  }`}>
                    {item.title}
                  </h3>

                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                    <span className="flex items-center gap-1 font-semibold truncate max-w-[120px]">
                      <svg className="w-3 h-3 text-orange-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 2 7 12 12 22 7 12 2" />
                        <polyline points="2 17 12 22 22 17" />
                        <polyline points="2 12 12 17 22 12" />
                      </svg>
                      <span className="truncate">{item.grade}</span>
                    </span>

                    <span className="flex items-center gap-1 font-semibold text-neutral-700 dark:text-neutral-300 shrink-0">
                      <svg className="w-3 h-3 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>{item.weight}</span>
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Bottom Pagination Dots */}
        <div className="flex items-center justify-center gap-2 mt-10">
          {ALL_GALLERY_PRODUCTS.map((_, pIdx) => {
            const isCurrent = pIdx === currentPage;
            return (
              <button
                key={pIdx}
                type="button"
                onClick={() => setCurrentPage(pIdx)}
                aria-label={`Go to gallery page ${pIdx + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  isCurrent
                    ? isLight
                      ? 'w-7 h-2 bg-blue-600'
                      : 'w-7 h-2 bg-orange-500 shadow-[0_0_10px_rgba(255,109,0,0.5)]'
                    : isLight
                      ? 'w-2 h-2 bg-neutral-300 hover:bg-neutral-400'
                      : 'w-2 h-2 bg-neutral-700 hover:bg-neutral-500'
                }`}
              />
            );
          })}
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
              <div className={`w-48 h-48 sm:w-56 sm:h-56 rounded-2xl flex items-center justify-center p-4 border shadow-inner shrink-0 ${
                isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-[#0a0b0e] border-white/10'
              }`}>
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.title}
                  className="w-full h-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)]"
                />
              </div>

              <div className="space-y-3.5 w-full">
                <div className={`inline-block px-3 py-1 rounded-md text-xs font-mono uppercase font-bold border ${
                  isLight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                }`}>
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
                    <span className={`font-semibold ${isLight ? 'text-blue-600' : 'text-orange-400'}`}>
                      {selectedProduct.grade}
                    </span>
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
                    className={`w-full block text-center py-3 rounded-full text-sm font-semibold tracking-wide text-white transition-all shadow-md ${
                      isLight ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-500 hover:bg-orange-600 shadow-[0_0_15px_rgba(255,109,0,0.3)]'
                    }`}
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
