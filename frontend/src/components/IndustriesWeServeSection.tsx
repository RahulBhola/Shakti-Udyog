import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Car,
  Tractor,
  Droplet,
  Cog,
  HardHat,
  Zap,
  Train,
  Factory,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from '../auth/ThemeContext';
import { getThemedImage } from '../utils/themeImage';

export interface IndustrySectorCard {
  title: string;
  description: string;
  gradeSpec: string;
  icon: React.ReactNode;
  image: string;
  slug: string;
}

export const IndustriesWeServeSection: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const industries: IndustrySectorCard[] = [
    {
      title: 'Automotive',
      description: 'Engine mounts, brake discs, differential cases, and transmission shift levers.',
      gradeSpec: 'SG 600/3 • FG 260',
      icon: <Car className="w-5 h-5" />,
      image: '/images/Gear Lever Parts/Cast Iron Car Gear Lever Part.png',
      slug: '/industries',
    },
    {
      title: 'Agriculture',
      description: 'Tractor axle housings, plough points, seed drills, and harvester gearbox brackets.',
      gradeSpec: 'SG 500/7 • Heavy Duty',
      icon: <Tractor className="w-5 h-5" />,
      image: '/images/cast_iron_casting/Cast Iron Tractor Part Casting.png',
      slug: '/industries',
    },
    {
      title: 'Pumps & Valves',
      description: 'Hydraulic barrel pump casings, impeller housings, and fluid gate valve bodies.',
      gradeSpec: 'FG 260 • 350 Bar Tested',
      icon: <Droplet className="w-5 h-5" />,
      image: '/images/cast_iron_casting/Cast Iron Rotary Barrel Pump Casting.png',
      slug: '/industries',
    },
    {
      title: 'Machine Tools',
      description: 'Kinematic brackets, cam links, vibration-damping motor bases, and slideways.',
      gradeSpec: 'FG 200 • High Damping',
      icon: <Cog className="w-5 h-5" />,
      image: '/images/Sewing_machine_parts/Cast Iron TA 1 Bracket Industrial Sewing Machine Part.png',
      slug: '/industries',
    },
    {
      title: 'Construction',
      description: 'Hillside washers, scaffold couplers, column base plates, and drainage gratings.',
      gradeSpec: 'FG 220 • Structural Cast',
      icon: <HardHat className="w-5 h-5" />,
      image: '/images/Hillside Washer/Cast Iron Hillside Washer.png',
      slug: '/industries',
    },
    {
      title: 'Power & Energy',
      description: 'Turbine bearing housings, generator brackets, transformer caps, and switchgear bodies.',
      gradeSpec: 'SG 700/2 • High Fatigue',
      icon: <Zap className="w-5 h-5" />,
      image: '/images/Collar Plug/Cast Iron Collar Plug.png',
      slug: '/industries',
    },
    {
      title: 'Rail & Transport',
      description: 'Bogie pivot liners, passenger door safety handles, brake rigging, and track fixtures.',
      gradeSpec: 'SG 600/3 • Impact Proof',
      icon: <Train className="w-5 h-5" />,
      image: '/images/cast_iron_casting/Cast Iron Train Door Handle Casting.png',
      slug: '/industries',
    },
    {
      title: 'Industrial Machinery',
      description: 'Dynamically balanced V-belt pulleys, industrial check nuts, and machine bases.',
      gradeSpec: 'FG 260 • ISO Balanced',
      icon: <Factory className="w-5 h-5" />,
      image: '/images/V Belt Pulley/Cast Iron V Belt Pulley Set.png',
      slug: '/industries',
    },
  ];

  return (
    <section className={`pt-10 sm:pt-14 pb-6 sm:pb-8 transition-colors duration-300 ${
      isLight ? 'bg-[#f4f7fb]' : 'bg-[#050608]'
    }`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        
        {/* Section Header with Scroll Animation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 sm:mb-16"
        >
          
          <div className="space-y-3 max-w-xl">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-xs font-bold tracking-wider uppercase ${
              isLight
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-blue-500/10 text-sky-400 border border-blue-500/20'
            }`}>
              WHERE OUR CASTINGS PERFORM
            </div>

            <h2 className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] ${
              isLight ? 'text-neutral-900' : 'text-white'
            }`}>
              Industries We Serve
            </h2>
          </div>

          <p className={`text-sm sm:text-base leading-relaxed max-w-lg ${
            isLight ? 'text-neutral-600' : 'text-neutral-400'
          }`}>
            Engineering high-integrity Grey Iron and SG Iron castings tailored to the stringent metallurgical standards of India's leading OEMs.
          </p>

        </motion.div>

        {/* 8-Sector Responsive Card Grid with Staggered Scroll Animation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-6">
          {industries.map((ind, idx) => (
            <motion.div
              key={ind.title}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: idx * 0.07, ease: 'easeOut' }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className={`group relative rounded-3xl p-5 sm:p-6 flex flex-col justify-between border transition-all duration-300 ${
                isLight
                  ? 'bg-white border-neutral-200/90 hover:border-blue-400 hover:shadow-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
                  : 'bg-[#08090e] border-white/[0.08] hover:border-sky-500/40 hover:bg-[#0c0d14] hover:shadow-[0_0_25px_rgba(56,189,248,0.12)]'
              }`}
            >
              <div>
                {/* Card Top Row: Sector Icon Badge + Grade Spec */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                    isLight
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'bg-blue-500/10 text-sky-400 border border-blue-500/20'
                  }`}>
                    {ind.icon}
                  </div>

                  <span className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    isLight
                      ? 'bg-neutral-100 text-neutral-700'
                      : 'bg-white/5 text-neutral-300 border border-white/10'
                  }`}>
                    <ShieldCheck className="w-3 h-3 text-sky-400" />
                    <span>{ind.gradeSpec}</span>
                  </span>
                </div>

                {/* Card Casting Visual in Dark/Light Studio */}
                <div className={`relative w-full h-48 sm:h-52 rounded-2xl flex items-center justify-center p-3 mb-4 overflow-hidden ${
                  isLight
                    ? 'bg-gradient-to-b from-neutral-50 to-neutral-100/60'
                    : 'bg-gradient-to-b from-[#12131a] to-[#07080b]'
                }`}>
                  <img
                    src={getThemedImage(ind.image, isLight)}
                    alt={ind.title}
                    loading="lazy"
                    style={
                      isLight
                        ? undefined
                        : {
                            WebkitMaskImage: 'radial-gradient(ellipse 92% 92% at 50% 50%, black 75%, transparent 100%)',
                            maskImage: 'radial-gradient(ellipse 92% 92% at 50% 50%, black 75%, transparent 100%)',
                          }
                    }
                    className={`max-h-40 sm:max-h-44 max-w-[92%] w-auto h-auto object-contain transform group-hover:scale-110 transition-transform duration-500 ${
                      isLight ? 'drop-shadow-[0_10px_20px_rgba(0,0,0,0.12)]' : 'drop-shadow-[0_16px_32px_rgba(0,0,0,0.7)]'
                    }`}
                  />
                </div>

                {/* Title & Description */}
                <div className="space-y-2 mb-4">
                  <h3 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${
                    isLight ? 'text-neutral-900' : 'text-white'
                  }`}>
                    {ind.title}
                  </h3>
                  <p className={`text-sm sm:text-base leading-relaxed min-h-[44px] ${
                    isLight ? 'text-neutral-600' : 'text-neutral-300'
                  }`}>
                    {ind.description}
                  </p>
                </div>
              </div>

              {/* Bottom Link Action */}
              <div className="pt-3 border-t border-neutral-100 dark:border-white/5">
                <Link
                  to={ind.slug}
                  className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold transition-colors ${
                    isLight ? 'text-blue-600 hover:text-blue-700' : 'text-sky-400 hover:text-sky-300'
                  }`}
                >
                  <span>Explore Sector Castings</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
