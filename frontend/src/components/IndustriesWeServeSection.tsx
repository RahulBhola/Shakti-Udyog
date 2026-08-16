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
      icon: <Car className="w-6 h-6" />,
      image: '/images/V Belt Pulley/Cast Iron V Belt Pulley Set.png',
    },
    {
      id: 'agriculture',
      title: 'Agricultural Equipment',
      description: 'Durable castings built for harsh field and operating conditions.',
      icon: <Tractor className="w-6 h-6" />,
      image: '/images/cast_iron_casting/Cast Iron Tractor Part Casting.png',
    },
    {
      id: 'pumps-valves',
      title: 'Pumps, Valves & Fluid Handling',
      description: 'Leak-proof, precision castings for efficient fluid control.',
      icon: <Droplets className="w-6 h-6" />,
      image: '/images/cast_iron_casting/Cast Iron Rotary Barrel Pump Casting.png',
    },
    {
      id: 'machine-tools',
      title: 'Machine Tools & General Engineering',
      description: 'Reliable castings for machine tools and engineering components.',
      icon: <Cog className="w-6 h-6" />,
      image: '/images/Industrial Iron Casting.png',
    },
    {
      id: 'construction',
      title: 'Construction & Earthmoving Equipment',
      description: 'Robust castings that withstand extreme loads and impact.',
      icon: <HardHat className="w-6 h-6" />,
      image: '/images/Collar Plug/Cast Iron Collar Plug.png',
    },
    {
      id: 'power-energy',
      title: 'Power, Energy & Infrastructure',
      description: 'Castings that power generation, distribution and energy systems.',
      icon: <Zap className="w-6 h-6" />,
      image: '/images/Hillside Washer/Cast Iron Hillside Washer.png',
    },
    {
      id: 'rail-transport',
      title: 'Rail & Transport Equipment',
      description: 'Safety-critical castings for railways and transport systems.',
      icon: <Train className="w-6 h-6" />,
      image: '/images/cast_iron_casting/Cast Iron Train Door Handle Casting.png',
    },
    {
      id: 'industrial-machinery',
      title: 'Industrial Machinery & OEM Manufacturing',
      description: 'Custom castings for industrial machines and OEM solutions.',
      icon: <Factory className="w-6 h-6" />,
      image: '/images/cast_iron_casting/Cast Iron Button Machine Casting.png',
    },
  ];

  return (
    <section className={`py-20 sm:py-28 transition-colors duration-300 ${
      isLight ? 'bg-[#f4f7fb]' : 'bg-[#050608]'
    }`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        
        {/* Section Header with Top-Right Badge */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14 sm:mb-18">
          
          {/* Left Title */}
          <div className="space-y-3">
            <div className={`text-sm sm:text-base font-mono font-bold tracking-widest uppercase ${
              isLight ? 'text-blue-600' : 'text-sky-400'
            }`}>
              WHERE OUR CASTINGS WORK
            </div>
            <h2 className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight ${
              isLight ? 'text-neutral-900' : 'text-white'
            }`}>
              Industries We Serve
            </h2>
          </div>

          {/* Right Engineering Badge */}
          <div className="flex items-center gap-3.5 self-start md:self-end">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
              isLight
                ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm'
                : 'bg-blue-500/10 text-sky-400 border-blue-500/20'
            }`}>
              <Building2 className="w-6 h-6" />
            </div>
            <div className={`text-sm sm:text-base leading-snug font-medium ${
              isLight ? 'text-neutral-700' : 'text-neutral-300'
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {industries.map((ind) => (
            <Link
              key={ind.id}
              to="/industries"
              className={`group relative rounded-3xl p-7 flex flex-col justify-between border transition-all duration-300 overflow-hidden ${
                isLight
                  ? 'bg-white border-neutral-200/90 hover:border-blue-400 hover:shadow-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] text-neutral-900'
                  : 'bg-[#080a0f] border-white/[0.08] hover:border-white/20 hover:bg-[#0c0e16] shadow-2xl text-white'
              }`}
            >
              <div>
                {/* Top Icon Badge */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-5 transition-transform group-hover:scale-110 ${
                  isLight
                    ? 'bg-blue-50 text-blue-600 border border-blue-200/80 shadow-sm'
                    : 'bg-blue-500/10 text-sky-400 border border-blue-500/20'
                }`}>
                  {ind.icon}
                </div>

                {/* Title & Description with Enlarged Font */}
                <h3 className={`text-lg sm:text-xl font-extrabold tracking-tight mb-2.5 group-hover:text-blue-500 transition-colors ${
                  isLight ? 'text-neutral-900' : 'text-white'
                }`}>
                  {ind.title}
                </h3>
                <p className={`text-sm sm:text-base leading-relaxed mb-6 font-normal ${
                  isLight ? 'text-neutral-600' : 'text-neutral-300'
                }`}>
                  {ind.description}
                </p>
              </div>

              {/* Large Product Visual Container with Dark Studio Vignette */}
              <div className={`relative w-full h-64 sm:h-72 lg:h-80 rounded-2xl flex items-center justify-center p-3 overflow-hidden ${
                isLight
                  ? 'bg-gradient-to-b from-neutral-50 to-neutral-100/70'
                  : 'bg-gradient-to-b from-[#12141d] to-[#08090e]'
              }`}>
                <img
                  src={ind.image}
                  alt={ind.title}
                  loading="lazy"
                  style={{
                    WebkitMaskImage: 'radial-gradient(ellipse 94% 94% at 50% 50%, black 78%, transparent 100%)',
                    maskImage: 'radial-gradient(ellipse 94% 94% at 50% 50%, black 78%, transparent 100%)',
                  }}
                  className="max-h-56 sm:max-h-64 lg:max-h-72 max-w-[96%] w-auto h-auto object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] transform group-hover:scale-110 transition-transform duration-500"
                />
              </div>

            </Link>
          ))}
        </div>

      </div>
    </section>
  );
};
