import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Seo } from '../components/Seo';
import { seoPages } from '../content/seo';
import { useTheme } from '../auth/ThemeContext';
import { getThemedImage } from '../utils/themeImage';
import { EnquiryModal } from '../components/EnquiryModal';
import {
  Search,
  SlidersHorizontal,
  Layers,
  Scale,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Info,
  X,
} from 'lucide-react';

export interface CatalogProduct {
  id: string;
  title: string;
  category: string;
  materialType: 'Grey Iron' | 'Ductile Iron';
  grade: string;
  standard: string;
  weight: string;
  image: string;
  application: string;
  specs: string;
  tolerances: string;
  hardness: string;
  tensileStrength: string;
}

export const ALL_PRODUCTS: CatalogProduct[] = [
  {
    id: 'sewing-arm',
    title: 'TA 1 Industrial Sewing Machine Bracket',
    category: 'Precision Mechanism',
    materialType: 'Ductile Iron',
    grade: 'SG 500/7',
    standard: 'IS 1865 / EN-GJS-500-7',
    weight: '0.65 kg',
    image: '/images/Sewing_machine_parts/Cast Iron TA 1 Bracket Industrial Sewing Machine Part.png',
    application: 'Industrial garment and footwear lockstitch machinery',
    specs: 'Precision CNC machined kinematic bracket with micron bore alignment',
    tolerances: '±0.015 mm CMM verified',
    hardness: '170–230 HBW',
    tensileStrength: '500 MPa min',
  },
  {
    id: 'sizzler-s',
    title: 'Continental Sizzler Platter Standard',
    category: 'Commercial Hospitality',
    materialType: 'Grey Iron',
    grade: 'FG 200',
    standard: 'IS 210 / EN-GJL-200',
    weight: '2.4 kg',
    image: '/images/Sizzler Plate/Continental Sizzler Plate.png',
    application: 'Commercial restaurant sizzler and steak service',
    specs: 'Thermal shock resistant pre-seasoned heat retention platter',
    tolerances: '±0.5 mm surface profile',
    hardness: '160–210 HBW',
    tensileStrength: '200 MPa min',
  },
  {
    id: 'v-belt-a',
    title: 'Precision Balanced V-Belt Pulley 1A',
    category: 'Power Transmission',
    materialType: 'Grey Iron',
    grade: 'FG 220',
    standard: 'IS 210 / EN-GJL-220',
    weight: '3.8 kg',
    image: '/images/V Belt Pulley/Cast Iron V Belt Pulley Set.png',
    application: 'Electric motor drives, air compressors, conveyors',
    specs: 'Dynamically balanced to ISO 1940 G6.3 up to 3,500 RPM',
    tolerances: '±0.025 mm bore & groove',
    hardness: '180–230 HBW',
    tensileStrength: '220 MPa min',
  },
  {
    id: 'collar-plug',
    title: 'High-Pressure Collar Sealing Plug',
    category: 'Fluid & Pumps',
    materialType: 'Grey Iron',
    grade: 'FG 260',
    standard: 'IS 210 / EN-GJL-260',
    weight: '1.1 kg',
    image: '/images/Collar Plug/Cast Iron Collar Plug.png',
    application: 'High-pressure hydraulic manifolds & fluid lines',
    specs: 'Hydrostatically tested for 250+ bar continuous working pressure',
    tolerances: '±0.02 mm thread pitch',
    hardness: '190–240 HBW',
    tensileStrength: '260 MPa min',
  },
  {
    id: 'tractor-bracket',
    title: 'Heavy Duty Tractor Axle Support',
    category: 'Agricultural Machinery',
    materialType: 'Ductile Iron',
    grade: 'SG 600/3',
    standard: 'IS 1865 / EN-GJS-600-3',
    weight: '8.5 kg',
    image: '/images/cast_iron_casting/Cast Iron Tractor Part Casting.png',
    application: 'Agricultural tractors and heavy tillage implements',
    specs: 'High fatigue strength for continuous heavy field draft loads',
    tolerances: '±0.03 mm mounting holes',
    hardness: '190–270 HBW',
    tensileStrength: '600 MPa min',
  },
  {
    id: 'gear-lever-a',
    title: 'Automotive Transmission Shift Lever',
    category: 'Automotive & Powertrain',
    materialType: 'Ductile Iron',
    grade: 'SG 700/2',
    standard: 'IS 1865 / EN-GJS-700-2',
    weight: '1.4 kg',
    image: '/images/Gear Lever Parts/Cast Iron Car Gear Lever Part.png',
    application: 'Commercial vehicle manual and automated gearboxes',
    specs: 'Surface induction hardened against gear shifting torsional fatigue',
    tolerances: '±0.02 mm pivot hole',
    hardness: '220–300 HBW',
    tensileStrength: '700 MPa min',
  },
  {
    id: 'pulley-wheel',
    title: 'Industrial Heavy Duty Pulley Wheel',
    category: 'Power Transmission',
    materialType: 'Grey Iron',
    grade: 'FG 260',
    standard: 'IS 210 / EN-GJL-260',
    weight: '12.0 kg',
    image: '/images/Pulley Wheel/6 Inch Cast Iron Pulley Wheel.png',
    application: 'Heavy overhead cranes, winches, elevator hoist drums',
    specs: 'Wear-resistant deep groove profile with low rope friction coefficient',
    tolerances: '±0.03 mm radial runout',
    hardness: '190–240 HBW',
    tensileStrength: '260 MPa min',
  },
  {
    id: 'rotary-pump',
    title: 'Hydraulic Rotary Barrel Pump Housing',
    category: 'Fluid & Pumps',
    materialType: 'Grey Iron',
    grade: 'FG 260',
    standard: 'IS 210 / EN-GJL-260',
    weight: '5.6 kg',
    image: '/images/cast_iron_casting/Cast Iron Rotary Barrel Pump Casting.png',
    application: 'Fuel transfer pumps, chemical drums, fluid dispensing',
    specs: '100% hydrostatically tested for zero porosity under continuous pressure',
    tolerances: '±0.02 mm internal bore',
    hardness: '190–240 HBW',
    tensileStrength: '260 MPa min',
  },
  {
    id: 'hillside-washer',
    title: 'Structural Hillside Washer Casting',
    category: 'Industrial & Structural',
    materialType: 'Grey Iron',
    grade: 'FG 220',
    standard: 'IS 210 / EN-GJL-220',
    weight: '0.9 kg',
    image: '/images/Hillside Washer/Cast Iron Hillside Washer.png',
    application: 'Pre-engineered steel buildings, diagonal cross-bracing rods',
    specs: 'High load distributing diagonal anchor washer for structural I-beams',
    tolerances: '±0.4 mm cast profile',
    hardness: '180–220 HBW',
    tensileStrength: '220 MPa min',
  },
  {
    id: 'button-machine',
    title: 'Button Machine Heavy Base Frame',
    category: 'Industrial Machinery',
    materialType: 'Grey Iron',
    grade: 'FG 200',
    standard: 'IS 210 / EN-GJL-200',
    weight: '16.5 kg',
    image: '/images/cast_iron_casting/Cast Iron Button Machine Casting.png',
    application: 'Automated fastener press machinery, high-speed textile stamping',
    specs: 'High vibrational damping base frame for industrial press automation',
    tolerances: '±0.05 mm bed flatness',
    hardness: '160–210 HBW',
    tensileStrength: '200 MPa min',
  },
  {
    id: 'link-part',
    title: 'Forged Link Pivot Mechanism',
    category: 'Precision Mechanism',
    materialType: 'Ductile Iron',
    grade: 'SG 500/7',
    standard: 'IS 1865 / EN-GJS-500-7',
    weight: '0.85 kg',
    image: '/images/Link Part/Iron Link Part 50g.png',
    application: 'Packaging machinery linkages, pick-and-place automation',
    specs: 'Precision ground bore with high tensile kinematic endurance',
    tolerances: '±0.015 mm center distance',
    hardness: '170–230 HBW',
    tensileStrength: '500 MPa min',
  },
  {
    id: 'train-handle',
    title: 'Railway Passenger Door Safety Handle',
    category: 'Industrial & Structural',
    materialType: 'Ductile Iron',
    grade: 'SG 600/3',
    standard: 'IS 1865 / EN-GJS-600-3',
    weight: '1.75 kg',
    image: '/images/cast_iron_casting/Cast Iron Train Door Handle Casting.png',
    application: 'Rail passenger coach doors, transit rolling stock',
    specs: 'High elongation impact-proof casting tested to railway safety norms',
    tolerances: '±0.05 mm pivot pins',
    hardness: '190–260 HBW',
    tensileStrength: '600 MPa min',
  },
  {
    id: 'sizzler-m',
    title: 'Commercial Sizzler Platter Round',
    category: 'Commercial Hospitality',
    materialType: 'Grey Iron',
    grade: 'FG 200',
    standard: 'IS 210 / EN-GJL-200',
    weight: '1.9 kg',
    image: '/images/Sizzler Plate/Continental Sizzler Plate 1.png',
    application: 'Restaurant hot-plate serving, cast iron culinary cookware',
    specs: 'Uniform wall thickness for even heat distribution and retention',
    tolerances: '±0.5 mm cast surface',
    hardness: '160–210 HBW',
    tensileStrength: '200 MPa min',
  },
  {
    id: 'nut-heavy',
    title: 'Industrial Hex Check Nut Casting',
    category: 'Fasteners & Hardware',
    materialType: 'Grey Iron',
    grade: 'FG 220',
    standard: 'IS 210 / EN-GJL-220',
    weight: '0.45 kg',
    image: '/images/Cast Iron Nut/Cast Iron Door Closer Nut.png',
    application: 'Pneumatic door closers, heavy machinery shaft clamping',
    specs: 'High torque resistance with precision metric internal threading',
    tolerances: 'Class 6H thread fit',
    hardness: '180–220 HBW',
    tensileStrength: '220 MPa min',
  },
  {
    id: 'gear-lever-b',
    title: 'Commercial Truck Shift Control Link',
    category: 'Automotive & Powertrain',
    materialType: 'Ductile Iron',
    grade: 'SG 600/3',
    standard: 'IS 1865 / EN-GJS-600-3',
    weight: '2.1 kg',
    image: '/images/Gear Lever Parts/Cast Iron Car Gear Lever Part 1.png',
    application: 'Heavy commercial truck transmission linkage assemblies',
    specs: 'Reinforced pivot fork with anti-backlash bushing seat',
    tolerances: '±0.02 mm bushing bore',
    hardness: '190–260 HBW',
    tensileStrength: '600 MPa min',
  },
  {
    id: 'industrial-block',
    title: 'Precision Machine Tool Pillow Block',
    category: 'Industrial Machinery',
    materialType: 'Grey Iron',
    grade: 'FG 260',
    standard: 'IS 210 / EN-GJL-260',
    weight: '9.4 kg',
    image: '/images/Industrial Iron Casting.png',
    application: 'CNC machine spindle supports, heavy linear guide rails',
    specs: 'Stress-relieved casting ensuring zero thermal deformation under load',
    tolerances: '±0.015 mm bearing seat',
    hardness: '190–240 HBW',
    tensileStrength: '260 MPa min',
  },
  {
    id: 'check-nut',
    title: 'Slotted Locking Nut Casting',
    category: 'Fasteners & Hardware',
    materialType: 'Grey Iron',
    grade: 'FG 220',
    standard: 'IS 210 / EN-GJL-220',
    weight: '0.35 kg',
    image: '/images/cast_iron_casting/Cast Iron Check Nut Casting.png',
    application: 'Heavy rotating equipment, wheel spindle vibration locks',
    specs: 'Positive cotter-pin safety locking slots with precision pitch',
    tolerances: 'Class 6H thread fit',
    hardness: '180–220 HBW',
    tensileStrength: '220 MPa min',
  },
  {
    id: 'chal-t1',
    title: 'Chal T1 Sewing Mechanism',
    category: 'Precision Mechanism',
    materialType: 'Grey Iron',
    grade: 'FG 220',
    standard: 'IS 210 / EN-GJL-220',
    weight: '0.55 kg',
    image: '/images/Sewing_machine_parts/Cast Iron Chal T1 Industrial Sewing Machine Part.png',
    application: 'High-speed industrial embroidery and lockstitch machinery',
    specs: 'Self-lubricating micro-porosity graphite structure for reduced friction',
    tolerances: '±0.015 mm slide face',
    hardness: '180–220 HBW',
    tensileStrength: '220 MPa min',
  },
  {
    id: 'sv-came',
    title: 'SV Came Sewing Cam',
    category: 'Precision Mechanism',
    materialType: 'Ductile Iron',
    grade: 'SG 500/7',
    standard: 'IS 1865 / EN-GJS-500-7',
    weight: '0.38 kg',
    image: '/images/Sewing_machine_parts/Cast Iron SV Came Industrial Sewing Machine Part.png',
    application: 'Mechanical timing cams for automated textile equipment',
    specs: 'Precision profiled eccentric lobes ground to micron accuracy',
    tolerances: '±0.010 mm cam lobe',
    hardness: '170–230 HBW',
    tensileStrength: '500 MPa min',
  },
  {
    id: 'v-belt-2',
    title: 'Dual Groove V-Belt Pulley',
    category: 'Power Transmission',
    materialType: 'Grey Iron',
    grade: 'FG 260',
    standard: 'IS 210 / EN-GJL-260',
    weight: '5.2 kg',
    image: '/images/V Belt Pulley/Cast Iron V Belt Pulley Set 1.png',
    application: 'Heavy dual-belt drive assemblies, industrial blowers, gensets',
    specs: 'Dual matched groove geometry ensuring equal tension load sharing',
    tolerances: '±0.025 mm dual groove runout',
    hardness: '190–240 HBW',
    tensileStrength: '260 MPa min',
  },
];

const CATEGORIES = [
  'All Categories',
  'Automotive & Powertrain',
  'Agricultural Machinery',
  'Fluid & Pumps',
  'Power Transmission',
  'Precision Mechanism',
  'Industrial Machinery',
  'Industrial & Structural',
  'Fasteners & Hardware',
  'Commercial Hospitality',
];

const MATERIALS = ['All Materials', 'Grey Iron', 'Ductile Iron'];

export default function ProductsPage() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedMaterial, setSelectedMaterial] = useState('All Materials');
  const [activeModalProduct, setActiveModalProduct] = useState<CatalogProduct | null>(null);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return ALL_PRODUCTS.filter((product) => {
      const matchesSearch =
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.specs.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.application.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All Categories' || product.category === selectedCategory;

      const matchesMaterial =
        selectedMaterial === 'All Materials' || product.materialType === selectedMaterial;

      return matchesSearch && matchesCategory && matchesMaterial;
    });
  }, [searchQuery, selectedCategory, selectedMaterial]);

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-300 ${
        isLight ? 'bg-[#f8f9fa] text-neutral-900' : 'bg-[#050507] text-white'
      }`}
    >
      <Seo
        title={seoPages.products.title}
        description={seoPages.products.description}
        path="/products"
      />

      {/* Hero Header — Perfectly Centered */}
      <section
        className={`relative pt-32 pb-16 sm:pt-40 sm:pb-24 border-b overflow-hidden transition-colors ${
          isLight ? 'bg-white border-neutral-200/80' : 'bg-[#08090d] border-white/[0.08]'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-mono font-bold tracking-wider uppercase text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/30 mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span>Complete Component Catalog &amp; Technical Specifications</span>
          </div>

          <h1
            className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl ${
              isLight ? 'text-neutral-900' : 'text-white'
            }`}
          >
            Precision Engineered <span className="text-orange-500">Castings</span>
          </h1>

          <p
            className={`text-lg sm:text-2xl max-w-3xl mx-auto leading-relaxed ${
              isLight ? 'text-neutral-600' : 'text-neutral-300'
            }`}
          >
            Explore our complete portfolio of high-grade Grey Iron (FG 150–FG 350) and S.G. Ductile
            Iron (SG 400–SG 700) components manufactured for automotive, agricultural, industrial
            machinery, and infrastructure applications.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12 sm:py-16 space-y-12 sm:space-y-16">
        

        {/* ========================================================================= */}
        {/* SEARCH & FILTER CONTROLS TOOLBAR */}
        {/* ========================================================================= */}
        <div className={`p-6 sm:p-8 rounded-3xl border transition-all ${
          isLight
            ? 'bg-white border-neutral-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
            : 'bg-[#0a0d14] border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.6)]'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Live Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name, grade, application, or spec..."
                className={`w-full pl-12 pr-10 py-3.5 rounded-2xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                  isLight
                    ? 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:bg-white'
                    : 'bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus:bg-white/10'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Material Filter Toggle Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
              <span className="text-xs font-mono font-bold uppercase text-neutral-400 mr-1 shrink-0 hidden sm:inline">
                Material:
              </span>
              {MATERIALS.map((mat) => (
                <button
                  key={mat}
                  onClick={() => setSelectedMaterial(mat)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all shrink-0 border ${
                    selectedMaterial === mat
                      ? isLight
                        ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20'
                        : 'bg-orange-500 border-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                      : isLight
                        ? 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:bg-neutral-200'
                        : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {mat}
                </button>
              ))}
            </div>

          </div>

          {/* Category Filter Pills Row */}
          <div className="flex items-center gap-2 overflow-x-auto pt-6 border-t border-neutral-100 dark:border-white/[0.06] mt-6 scrollbar-none">
            <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400 shrink-0 mr-2">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Category:</span>
            </div>

            {CATEGORIES.map((cat) => {
              const count =
                cat === 'All Categories'
                  ? ALL_PRODUCTS.length
                  : ALL_PRODUCTS.filter((p) => p.category === cat).length;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold transition-all shrink-0 border ${
                    selectedCategory === cat
                      ? isLight
                        ? 'bg-neutral-900 border-neutral-900 text-white shadow-sm'
                        : 'bg-white border-white text-neutral-950 font-bold shadow-[0_0_15px_rgba(255,255,255,0.25)]'
                      : isLight
                        ? 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                        : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Results Summary and Reset */}
          <div className="flex items-center justify-between text-xs font-mono text-neutral-500 dark:text-neutral-400 pt-4 mt-4 border-t border-neutral-100 dark:border-white/[0.04]">
            <span>
              Showing <strong className="text-orange-500 font-bold">{filteredProducts.length}</strong> of{' '}
              {ALL_PRODUCTS.length} precision components
            </span>

            {(searchQuery || selectedCategory !== 'All Categories' || selectedMaterial !== 'All Materials') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All Categories');
                  setSelectedMaterial('All Materials');
                }}
                className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 hover:underline font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

        </div>

        {/* ========================================================================= */}
        {/* EXHAUSTIVE PRODUCTS GRID */}
        {/* ========================================================================= */}
        {filteredProducts.length === 0 ? (
          <div className={`p-12 text-center rounded-3xl border ${
            isLight ? 'bg-white border-neutral-200' : 'bg-[#0a0d14] border-white/10'
          }`}>
            <Info className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
            <h3 className="text-xl font-bold mb-1">No products match your criteria</h3>
            <p className="text-sm text-neutral-500 mb-6">
              Try adjusting your search query or removing category/material filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All Categories');
                setSelectedMaterial('All Materials');
              }}
              className="px-6 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-sm"
            >
              Show All 20 Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
            {filteredProducts.map((product, idx) => {
              const themedImg = getThemedImage(product.image, isLight);
              const isDuctile = product.materialType === 'Ductile Iron';

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.45, delay: (idx % 4) * 0.06 }}
                  whileHover={{ y: -6, transition: { duration: 0.25 } }}
                  className={`group rounded-3xl p-5 sm:p-6 flex flex-col justify-between border transition-all duration-300 relative overflow-hidden ${
                    isLight
                      ? 'bg-white border-neutral-200/90 hover:border-orange-300 hover:shadow-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
                      : 'bg-[#090b10] border-white/[0.08] hover:border-orange-500/40 hover:bg-[#0c0f17] hover:shadow-[0_0_30px_rgba(249,115,22,0.12)]'
                  }`}
                >
                  <div>
                    
                    {/* Top Row: Category & Grade Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] sm:text-[11px] font-bold tracking-wider uppercase border truncate max-w-[130px] ${
                        isDuctile
                          ? 'bg-blue-500/10 text-blue-600 dark:text-sky-400 border-blue-500/30'
                          : 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30'
                      }`}>
                        {product.grade}
                      </span>

                      <div className="flex items-center gap-1 font-mono text-[11px] text-neutral-500 dark:text-neutral-400 shrink-0">
                        <Scale className="w-3 h-3 text-neutral-400" />
                        <span>{product.weight}</span>
                      </div>
                    </div>

                    {/* Product 3D Studio Visual Stage */}
                    <div
                      onClick={() => setActiveModalProduct(product)}
                      className={`relative w-full h-44 sm:h-48 my-2 rounded-2xl flex items-center justify-center p-3 cursor-pointer overflow-hidden transition-all ${
                        isLight
                          ? 'bg-gradient-to-b from-neutral-50 to-neutral-100/60'
                          : 'bg-gradient-to-b from-[#121520] to-[#07090e]'
                      }`}
                    >
                      <img
                        src={themedImg}
                        alt={product.title}
                        loading="lazy"
                        className={`max-h-36 sm:max-h-40 max-w-[92%] w-auto h-auto object-contain transition-transform duration-500 group-hover:scale-110 ${
                          isLight
                            ? 'filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)]'
                            : 'filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.75)]'
                        }`}
                      />

                      {/* Hover Quick View Chip */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-300">
                        <span className="px-3.5 py-1.5 rounded-full bg-white text-neutral-900 font-mono text-xs font-bold shadow-lg">
                          Quick Specs
                        </span>
                      </div>
                    </div>

                    {/* Title and Sector */}
                    <div className="space-y-1 mt-3">
                      <div className="text-[11px] font-mono font-medium text-neutral-400 uppercase tracking-wide">
                        {product.category}
                      </div>

                      <h3
                        onClick={() => setActiveModalProduct(product)}
                        className={`text-base font-bold tracking-tight line-clamp-2 cursor-pointer transition-colors ${
                          isLight ? 'text-neutral-900 group-hover:text-orange-600' : 'text-white group-hover:text-orange-400'
                        }`}
                      >
                        {product.title}
                      </h3>
                    </div>

                    {/* Spec Summary Description */}
                    <p className={`text-xs leading-relaxed line-clamp-2 mt-2 ${
                      isLight ? 'text-neutral-600' : 'text-neutral-400'
                    }`}>
                      {product.specs}
                    </p>

                    {/* Quick Specs Pill Badges */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-neutral-100 dark:border-white/[0.06] text-[11px] font-mono">
                      <div className={`p-2 rounded-xl border ${
                        isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-white/5 border-white/5'
                      }`}>
                        <span className="text-neutral-400 block text-[9px] uppercase">Tolerance</span>
                        <span className="font-bold truncate block">{product.tolerances}</span>
                      </div>

                      <div className={`p-2 rounded-xl border ${
                        isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-white/5 border-white/5'
                      }`}>
                        <span className="text-neutral-400 block text-[9px] uppercase">Tensile</span>
                        <span className="font-bold text-orange-600 dark:text-orange-400 truncate block">
                          {product.tensileStrength}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Card Action Buttons */}
                  <div className="mt-5 pt-3 border-t border-neutral-100 dark:border-white/[0.06] flex items-center gap-2">
                    <Link
                      to={`/request-a-quote?part=${encodeURIComponent(product.title)}`}
                      className={`flex-1 py-2.5 px-3 rounded-xl font-mono text-xs font-bold text-center transition-all inline-flex items-center justify-center gap-1.5 ${
                        isLight
                          ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20'
                          : 'bg-orange-500 hover:bg-orange-400 text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                      }`}
                    >
                      <span>Request Quote</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      onClick={() => setActiveModalProduct(product)}
                      className={`p-2.5 rounded-xl border transition-colors ${
                        isLight
                          ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700'
                          : 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300'
                      }`}
                      title="View Full Technical Details"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>

                </motion.div>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* METALLURGICAL GRADE SPECIFICATIONS (GREY IRON VS DUCTILE IRON) */}
        {/* ========================================================================= */}
        <section className={`py-14 sm:py-20 rounded-3xl p-6 sm:p-10 lg:p-12 border transition-colors ${
          isLight ? 'bg-white border-neutral-200/90 shadow-sm' : 'bg-[#080a0f] border-white/[0.08]'
        }`}>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase text-blue-600 dark:text-sky-400 bg-blue-500/10 border border-blue-500/20 mb-4">
              <Layers className="w-3.5 h-3.5" />
              <span>METALLURGICAL SELECTION MATRIX</span>
            </div>

            <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 ${
              isLight ? 'text-neutral-900' : 'text-white'
            }`}>
              Grey Iron vs. Ductile Iron Comparison
            </h2>

            <p className={`text-sm sm:text-base ${isLight ? 'text-neutral-600' : 'text-neutral-300'}`}>
              Compare mechanical properties, microstructure characteristics, and international standards to select the optimal casting grade for your engineering application.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Grey Iron Card */}
            <div className={`rounded-3xl p-6 sm:p-8 border transition-all ${
              isLight ? 'bg-neutral-50/70 border-neutral-200' : 'bg-[#0d1017] border-white/10'
            }`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                    Flake Graphite (Cast Iron)
                  </span>
                  <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">IS 210 / EN-GJL</span>
                </div>

                <h3 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                  Grey Iron Castings
                </h3>

                <p className={`text-sm leading-relaxed ${isLight ? 'text-neutral-600' : 'text-neutral-300'}`}>
                  Renowned for exceptional damping capacity, high thermal conductivity, and effortless CNC machinability. The international benchmark for machine beds, vibration dampeners, and hydraulic casings.
                </p>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className={`p-3 rounded-2xl border ${isLight ? 'bg-white border-neutral-200' : 'bg-white/5 border-white/5'}`}>
                    <span className="text-[10px] font-mono text-neutral-500 block uppercase">Tensile</span>
                    <span className="text-sm font-bold text-orange-600 dark:text-orange-400 font-mono">150–350 MPa</span>
                  </div>
                  <div className={`p-3 rounded-2xl border ${isLight ? 'bg-white border-neutral-200' : 'bg-white/5 border-white/5'}`}>
                    <span className="text-[10px] font-mono text-neutral-500 block uppercase">Hardness</span>
                    <span className="text-sm font-bold font-mono">160–260 HBW</span>
                  </div>
                  <div className={`p-3 rounded-2xl border ${isLight ? 'bg-white border-neutral-200' : 'bg-white/5 border-white/5'}`}>
                    <span className="text-[10px] font-mono text-neutral-500 block uppercase">Damping</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">Superior</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ductile Iron Card */}
            <div className={`rounded-3xl p-6 sm:p-8 border transition-all ${
              isLight ? 'bg-neutral-50/70 border-neutral-200' : 'bg-[#0d1017] border-white/10'
            }`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-blue-500/10 text-blue-600 dark:text-sky-400 border border-blue-500/30">
                    Nodular S.G. Iron
                  </span>
                  <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">IS 1865 / EN-GJS</span>
                </div>

                <h3 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                  Ductile (SG) Castings
                </h3>

                <p className={`text-sm leading-relaxed ${isLight ? 'text-neutral-600' : 'text-neutral-300'}`}>
                  Combines the high tensile strength and toughness of cast steel with the economical fluidity of cast iron. The optimal choice for automotive knuckles, high-load gears, and railway components.
                </p>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className={`p-3 rounded-2xl border ${isLight ? 'bg-white border-neutral-200' : 'bg-white/5 border-white/5'}`}>
                    <span className="text-[10px] font-mono text-neutral-500 block uppercase">Tensile</span>
                    <span className="text-sm font-bold text-sky-500 font-mono">400–700 MPa</span>
                  </div>
                  <div className={`p-3 rounded-2xl border ${isLight ? 'bg-white border-neutral-200' : 'bg-white/5 border-white/5'}`}>
                    <span className="text-[10px] font-mono text-neutral-500 block uppercase">Elongation</span>
                    <span className="text-sm font-bold font-mono">2% – 18%</span>
                  </div>
                  <div className={`p-3 rounded-2xl border ${isLight ? 'bg-white border-neutral-200' : 'bg-white/5 border-white/5'}`}>
                    <span className="text-[10px] font-mono text-neutral-500 block uppercase">Impact</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">High Toughness</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* CUSTOM REQUIREMENT / CAD RFQ BANNER */}
        {/* ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={`rounded-3xl p-8 sm:p-12 lg:p-14 border transition-all ${
            isLight
              ? 'bg-white border-neutral-200/90 shadow-[0_15px_50px_rgba(0,0,0,0.05)] text-neutral-900'
              : 'bg-gradient-to-r from-[#140e08] via-[#0e0f17] to-[#08090f] border-orange-500/30 text-white shadow-[0_0_50px_rgba(249,115,22,0.15)]'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase ${
                isLight
                  ? 'bg-orange-50 border border-orange-200 text-orange-700'
                  : 'bg-orange-500/10 border border-orange-500/20 text-orange-400'
              }`}>
                <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span>CUSTOM PATTERNING &amp; TOOLING AVAILABLE</span>
              </div>

              <h2 className={`text-3xl sm:text-5xl font-black tracking-tight leading-[1.08] ${
                isLight ? 'text-neutral-900' : 'text-white'
              }`}>
                Need a Custom Component or New Pattern?
              </h2>

              <p className={`text-sm sm:text-base leading-relaxed ${
                isLight ? 'text-neutral-600' : 'text-neutral-300'
              }`}>
                We cast bespoke components from 0.1 kg up to 150 kg with custom wooden or metallic pattern development, tight tolerance CNC machining, and 100% metallurgical inspection.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 shrink-0">
              <Link
                to="/request-a-quote"
                className={`px-8 py-4 rounded-2xl font-extrabold text-sm sm:text-base text-center inline-flex items-center justify-center gap-2.5 transition-all transform hover:scale-105 ${
                  isLight
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-[0_0_30px_rgba(249,115,22,0.4)]'
                }`}
              >
                <span className="text-white font-extrabold">Submit RFQ &amp; CAD</span>
                <ArrowRight className="w-4 h-4 text-white shrink-0" />
              </Link>

              <button
                type="button"
                onClick={() => setIsEnquiryModalOpen(true)}
                className={`px-7 py-4 rounded-2xl font-bold text-sm sm:text-base text-center transition-all cursor-pointer ${
                  isLight
                    ? 'bg-neutral-50 hover:bg-neutral-100 border border-neutral-300 text-neutral-800 shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-sm'
                }`}
              >
                <span>Send a Query</span>
              </button>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Direct Foundry Enquiry Popup Modal */}
      <EnquiryModal
        isOpen={isEnquiryModalOpen}
        onClose={() => setIsEnquiryModalOpen(false)}
      />

      {/* ========================================================================= */}
      {/* TECHNICAL SPECIFICATION MODAL DRAWER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activeModalProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`relative w-full max-w-2xl rounded-3xl p-6 sm:p-8 border shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto ${
                isLight ? 'bg-white border-neutral-200 text-neutral-900' : 'bg-[#0c0e15] border-white/15 text-white'
              }`}
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveModalProduct(null)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
                <div className={`w-36 h-36 rounded-2xl p-3 flex items-center justify-center shrink-0 ${
                  isLight ? 'bg-neutral-100' : 'bg-white/5'
                }`}>
                  <img
                    src={getThemedImage(activeModalProduct.image, isLight)}
                    alt={activeModalProduct.title}
                    className="max-h-28 max-w-full object-contain"
                  />
                </div>

                <div className="space-y-2 text-center sm:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                    {activeModalProduct.grade} • {activeModalProduct.standard}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight">{activeModalProduct.title}</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{activeModalProduct.application}</p>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm font-mono divide-y divide-neutral-100 dark:divide-white/10">
                <div className="py-2.5 flex justify-between">
                  <span className="text-neutral-500">Material Category:</span>
                  <span className="font-semibold">{activeModalProduct.materialType}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-neutral-500">Weight:</span>
                  <span className="font-semibold">{activeModalProduct.weight}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-neutral-500">Machining Tolerance:</span>
                  <span className="font-semibold">{activeModalProduct.tolerances}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-neutral-500">Tensile Strength:</span>
                  <span className="font-semibold text-orange-500">{activeModalProduct.tensileStrength}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-neutral-500">Hardness Range:</span>
                  <span className="font-semibold">{activeModalProduct.hardness}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-neutral-500">Engineering Overview:</span>
                  <span className="font-semibold text-right max-w-xs">{activeModalProduct.specs}</span>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <Link
                  to={`/request-a-quote?part=${encodeURIComponent(activeModalProduct.title)}`}
                  className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-center text-sm font-mono transition-all"
                  onClick={() => setActiveModalProduct(null)}
                >
                  Request Quote for this Component
                </Link>
                <button
                  onClick={() => setActiveModalProduct(null)}
                  className="px-5 py-3 rounded-xl border border-neutral-300 dark:border-white/10 font-bold text-sm"
                >
                  Close
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
