import React from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  Tractor,
  Droplets,
  Cog,
  HardHat,
  Zap,
  Train,
  Factory,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { useTheme } from '../auth/ThemeContext';

export interface IndustryCardItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  image: string;
}

export const IndustriesWeServeSection: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const industries: IndustryCardItem[] = [
    {
      id: 'automotive',
      title: 'Automotive & Commercial Vehicles',
      description: 'High-performance castings for engine, transmission and chassis systems.',
      icon: <Car className="w-5 h-5" />,
      image: '/images/V Belt Pulley/Cast Iron V Belt Pulley Set.png',
    },
    {
      id: 'agriculture',
      title: 'Agricultural Equipment',
      description: 'Durable castings built for harsh field and operating conditions.',
      icon: <Tractor className="w-5 h-5" />,
      image: '/images/cast_iron_casting/Cast Iron Tractor Part Casting.png',
    },
    {
      id: 'pumps-valves',
      title: 'Pumps, Valves & Fluid Handling',
      description: 'Leak-proof, precision castings for efficient fluid control.',
      icon: <Droplets className="w-5 h-5" />,
      image: '/images/cast_iron_casting/Cast Iron Rotary Barrel Pump Casting.png',
    },
    {
      id: 'machine-tools',
      title: 'Machine Tools & General Engineering',
      description: 'Reliable castings for machine tools and engineering components.',
      icon: <Cog className="w-5 h-5" />,
      image: '/images/Industrial Iron Casting.png',
    },
    {
      id: 'construction',
      title: 'Construction & Earthmoving Equipment',
      description: 'Robust castings that withstand extreme loads and impact.',
      icon: <HardHat className="w-5 h-5" />,
      image: '/images/Collar Plug/Cast Iron Collar Plug.png',
    },
    {
      id: 'power-energy',
      title: 'Power, Energy & Infrastructure',
      description: 'Castings that power generation, distribution and energy systems.',
      icon: <Zap className="w-5 h-5" />,
      image: '/images/Hillside Washer/Cast Iron Hillside Washer.png',
    },
    {
      id: 'rail-transport',
      title: 'Rail & Transport Equipment',
      description: 'Safety-critical castings for railways and transport systems.',
      icon: <Train className="w-5 h-5" />,
      image: '/images/cast_iron_casting/Cast Iron Train Door Handle Casting.png',
    },
    {
      id: 'industrial-machinery',
      title: 'Industrial Machinery & OEM Manufacturing',
      description: 'Custom castings for industrial machines and OEM solutions.',
      icon: <Factory className="w-5 h-5" />,
      image: '/images/cast_iron_casting/Cast Iron Button Machine Casting.png',
    },
  ];

  return (
    <section className={`py-16 sm:py-24 transition-colors duration-300 ${
      isLight ? 'bg-[#f4f7fb]' : 'bg-[#050608]'
    }`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        
        {/* Section Header with Top-Right Badge */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          
          {/* Left Title */}
          <div className="space-y-2.5">
            <div className={`text-xs font-mono font-bold tracking-widest uppercase ${
              isLight ? 'text-blue-600' : 'text-sky-400'
            }`}>
              WHERE OUR CASTINGS WORK
            </div>
            <h2 className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight ${
              isLight ? 'text-neutral-900' : 'text-white'
            }`}>
              Industries We Serve
            </h2>
          </div>

          {/* Right Engineering Badge */}
          <div className="flex items-center gap-3 self-start md:self-end">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isLight
                ? 'bg-blue-50 text-blue-600 border-blue-200'
                : 'bg-blue-500/10 text-sky-400 border-blue-500/20'
            }`}>
              <Building2 className="w-5 h-5" />
            </div>
            <div className={`text-xs sm:text-sm leading-snug font-medium ${
              isLight ? 'text-neutral-600' : 'text-neutral-400'
            }`}>
              Engineered castings for<br />
              <span className={`font-bold ${isLight ? 'text-blue-600' : 'text-sky-400'}`}>
                critical applications
              </span>{' '}
              across industries.
            </div>
          </div>

        </div>

        {/* 8 Industry Cards Grid (4 Columns x 2 Rows) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {industries.map((ind) => (
            <Link
              key={ind.id}
              to="/industries"
              className={`group relative rounded-3xl p-6 flex flex-col justify-between border transition-all duration-300 overflow-hidden ${
                isLight
                  ? 'bg-white border-neutral-200/90 hover:border-blue-400 hover:shadow-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-neutral-900'
                  : 'bg-[#080a0f] border-white/[0.08] hover:border-white/20 hover:bg-[#0c0e16] shadow-xl text-white'
              }`}
            >
              <div>
                {/* Top Icon Badge */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
                  isLight
                    ? 'bg-blue-50 text-blue-600 border border-blue-100'
                    : 'bg-blue-500/10 text-sky-400 border border-blue-500/20'
                }`}>
                  {ind.icon}
                </div>

                {/* Title & Description */}
                <h3 className={`text-base sm:text-lg font-bold tracking-tight mb-2 group-hover:text-blue-500 transition-colors ${
                  isLight ? 'text-neutral-900' : 'text-white'
                }`}>
                  {ind.title}
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed mb-6 ${
                  isLight ? 'text-neutral-600' : 'text-neutral-400'
                }`}>
                  {ind.description}
                </p>
              </div>

              {/* Product Visual Container with Dark Studio Vignette */}
              <div className={`relative w-full h-32 sm:h-36 rounded-2xl flex items-center justify-center p-2 overflow-hidden ${
                isLight
                  ? 'bg-gradient-to-b from-neutral-50 to-neutral-100/70'
                  : 'bg-gradient-to-b from-[#12141d] to-[#08090e]'
              }`}>
                <img
                  src={ind.image}
                  alt={ind.title}
                  loading="lazy"
                  style={{
                    WebkitMaskImage: 'radial-gradient(ellipse 90% 90% at 50% 50%, black 70%, transparent 100%)',
                    maskImage: 'radial-gradient(ellipse 90% 90% at 50% 50%, black 70%, transparent 100%)',
                  }}
                  className="max-h-24 sm:max-h-28 max-w-[85%] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] transform group-hover:scale-105 transition-transform duration-500"
                />
              </div>

            </Link>
          ))}
        </div>

      </div>
    </section>
  );
};
