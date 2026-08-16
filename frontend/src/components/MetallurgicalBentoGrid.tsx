import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Cpu, Sliders, Flame, Maximize2 } from 'lucide-react';
import { useTheme } from '../auth/ThemeContext';

export const MetallurgicalBentoGrid: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [activeTab, setActiveTab] = useState<'magmasoft' | 'spectro' | 'cmm'>('magmasoft');

  return (
    <section className={`relative py-20 sm:py-28 transition-colors duration-300 ${
      isLight ? 'bg-[#f8f9fa]' : 'bg-[#060709]'
    }`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-14 sm:mb-20">
          <h2 className={`text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight ${
            isLight ? 'text-neutral-900' : 'text-white'
          }`}>
            High-Fidelity Detail Control
          </h2>
          <p className={`text-base sm:text-lg md:text-xl leading-relaxed ${
            isLight ? 'text-neutral-600' : 'text-neutral-300'
          }`}>
            Use Shakti Udyog&apos;s advanced MagmaSoft® thermal simulation, 14-element spark OES spectrometry, and Zeiss 3D CMM metrology to ensure zero-defect casting integrity.
          </p>
        </div>

        {/* Bento Grid Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 sm:gap-8">
          
          {/* Card 1: Flexible 3D Tooling & CAD Controls (Span 7) */}
          <div className={`lg:col-span-7 rounded-[32px] p-7 sm:p-10 border flex flex-col justify-between transition-all duration-300 shadow-xl overflow-hidden relative ${
            isLight
              ? 'bg-white border-neutral-200/90 shadow-[0_12px_40px_rgba(0,0,0,0.05)]'
              : 'bg-[#0d0e14]/90 border-white/[0.08] shadow-[0_16px_45px_rgba(0,0,0,0.85)]'
          }`}>
            <div className="space-y-3 z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs sm:text-sm font-mono font-bold tracking-wider uppercase text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/30">
                <Sliders className="w-4 h-4 text-orange-500" />
                <span>Tooling &amp; Pattern Engineering</span>
              </div>
              <h3 className={`text-2xl sm:text-4xl font-bold tracking-tight ${
                isLight ? 'text-neutral-900' : 'text-white'
              }`}>
                Flexible 3D Tooling Controls
              </h3>
              <p className={`text-sm sm:text-base max-w-lg ${
                isLight ? 'text-neutral-600' : 'text-neutral-300'
              }`}>
                Explore matchplate, shell core, and precision gating systems configured for zero-turbulent molten iron filling.
              </p>
            </div>

            {/* Central Visual Stage */}
            <div className="my-6 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="flex flex-col gap-3">
                {[
                  { label: 'MATCHPLATE CAD', sub: '±0.02 mm Pattern', active: activeTab === 'magmasoft', id: 'magmasoft' as const },
                  { label: 'SIMULATION FEA', sub: 'MagmaSoft Pour', active: activeTab === 'spectro', id: 'spectro' as const },
                  { label: 'ZEISS CMM', sub: '100% Inspection', active: activeTab === 'cmm', id: 'cmm' as const },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`text-left p-3.5 rounded-2xl border transition-all text-xs sm:text-sm ${
                      tab.active
                        ? 'bg-orange-500 text-white border-orange-400 shadow-[0_0_20px_rgba(255,109,0,0.35)]'
                        : isLight
                          ? 'bg-neutral-100/90 border-neutral-300 text-neutral-800 hover:bg-neutral-200/80'
                          : 'bg-white/[0.04] border-white/[0.06] text-neutral-300 hover:bg-white/[0.08]'
                    }`}
                  >
                    <span className="font-mono font-bold block">{tab.label}</span>
                    <span className="text-xs opacity-80">{tab.sub}</span>
                  </button>
                ))}
              </div>

              {/* Exploded 3D Component Rendering */}
              <div className="sm:col-span-2 relative h-60 sm:h-72 rounded-2xl bg-gradient-to-br from-[#181920] to-[#0a0b0e] border border-black/10 flex items-center justify-center p-4 overflow-hidden shadow-inner">
                <img
                  src={
                    activeTab === 'magmasoft'
                      ? '/images/V Belt Pulley/Cast Iron V Belt Pulley Set.png'
                      : activeTab === 'spectro'
                        ? '/images/cast_iron_casting/Cast Iron Rotary Barrel Pump Casting.png'
                        : '/images/Sewing_machine_parts/Cast Iron TA 1 Bracket Industrial Sewing Machine Part.png'
                  }
                  alt="3D Metallurgical Control"
                  className="max-h-52 max-w-[88%] object-contain drop-shadow-[0_15px_30px_rgba(255,109,0,0.4)] transition-all duration-500 transform hover:scale-105"
                />

                <div className="absolute bottom-3.5 right-3.5 text-right">
                  <span className="text-xs font-mono tracking-widest text-orange-400 uppercase font-bold block">
                    MAGMASOFT VERIFIED
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    GATING &amp; RISER BALANCED
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm font-mono pt-4 border-t border-neutral-200 dark:border-white/5 text-neutral-500 dark:text-neutral-400">
              <span>ISO 9001:2015 CERTIFIED FOUNDRY</span>
              <span className="text-orange-600 dark:text-orange-400 font-bold">1460°C CONTROLLED MELT</span>
            </div>
          </div>

          {/* Card 2: 3D ControlNet / Metrology Inspection (Span 5) */}
          <div className={`lg:col-span-5 rounded-[32px] p-7 sm:p-10 border flex flex-col justify-between transition-all duration-300 shadow-xl relative overflow-hidden ${
            isLight
              ? 'bg-white border-neutral-200/90 shadow-[0_12px_40px_rgba(0,0,0,0.05)]'
              : 'bg-[#0d0e14]/90 border-white/[0.08] shadow-[0_16px_45px_rgba(0,0,0,0.85)]'
          }`}>
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs sm:text-sm font-mono font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/30">
                <Cpu className="w-4 h-4 text-blue-500" />
                <span>3D Metrology Verification</span>
              </div>
              <h3 className={`text-2xl sm:text-4xl font-bold tracking-tight ${
                isLight ? 'text-neutral-900' : 'text-white'
              }`}>
                3D ControlNet Inspection
              </h3>
              <p className={`text-sm sm:text-base ${
                isLight ? 'text-neutral-600' : 'text-neutral-300'
              }`}>
                Guide quality verification with bounding box, voxel density, and coordinate point clouds.
              </p>
            </div>

            <div className="my-6 space-y-3.5 font-mono text-sm">
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-white/[0.04] border-white/[0.06]'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  <span className="text-neutral-800 dark:text-neutral-200 font-semibold">Zeiss CMM Spatial Scan</span>
                </div>
                <span className="text-blue-600 dark:text-blue-400 font-bold">±0.015 mm</span>
              </div>

              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-white/[0.04] border-white/[0.06]'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                  <span className="text-neutral-800 dark:text-neutral-200 font-semibold">Spark OES Spectrometer</span>
                </div>
                <span className="text-orange-600 dark:text-orange-400 font-bold">14 Elements</span>
              </div>

              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-white/[0.04] border-white/[0.06]'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <span className="text-neutral-800 dark:text-neutral-200 font-semibold">Hydrostatic Pressure Test</span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">350+ Bar</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/quality"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-semibold tracking-wide text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-md"
              >
                <span>View Quality &amp; Testing Standards</span>
                <Maximize2 className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 3: In-Mold Thermal Solidification & Grain Matrix (Span 4) */}
          <div className={`lg:col-span-4 rounded-[32px] p-7 sm:p-9 border flex flex-col justify-between transition-all duration-300 shadow-xl ${
            isLight
              ? 'bg-white border-neutral-200/90 shadow-[0_12px_40px_rgba(0,0,0,0.05)]'
              : 'bg-[#0d0e14]/90 border-white/[0.08] shadow-[0_16px_45px_rgba(0,0,0,0.85)]'
          }`}>
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs sm:text-sm font-mono font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Microstructure</span>
              </div>
              <h3 className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                isLight ? 'text-neutral-900' : 'text-white'
              }`}>
                Graphite Nodularity
              </h3>
              <p className={`text-xs sm:text-sm ${
                isLight ? 'text-neutral-600' : 'text-neutral-300'
              }`}>
                Controlled in-mold cooling rate governs graphite nodule spherical distribution and pearlite/ferrite matrix formation.
              </p>
            </div>

            <div className={`my-5 p-5 rounded-2xl text-center border ${
              isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-black/40 border-white/5'
            }`}>
              <span className="text-4xl sm:text-5xl font-bold font-mono text-orange-600 dark:text-orange-400 block mb-1">
                ≥ 85%
              </span>
              <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">
                Type I &amp; II Spheroidal Nodules
              </span>
            </div>

            <div className="text-xs sm:text-sm font-mono text-neutral-500 dark:text-neutral-400 flex items-center justify-between border-t border-neutral-200 dark:border-white/5 pt-3.5">
              <span>COOLING RATE</span>
              <span className="text-neutral-900 dark:text-neutral-200 font-bold">8.5°C / MIN</span>
            </div>
          </div>

          {/* Card 4: Smart Low-Porosity Fettling & Shot Blasting (Span 8) */}
          <div className={`lg:col-span-8 rounded-[32px] p-7 sm:p-9 border flex flex-col justify-between transition-all duration-300 shadow-xl relative overflow-hidden ${
            isLight
              ? 'bg-white border-neutral-200/90 shadow-[0_12px_40px_rgba(0,0,0,0.05)]'
              : 'bg-[#0d0e14]/90 border-white/[0.08] shadow-[0_16px_45px_rgba(0,0,0,0.85)]'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs sm:text-sm font-mono font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Finishing &amp; Fettling</span>
                </div>
                <h3 className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                  isLight ? 'text-neutral-900' : 'text-white'
                }`}>
                  Smart Low-Porosity Surface Finish
                </h3>
              </div>

              <div className="px-5 py-2.5 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-xs sm:text-sm font-mono font-bold">
                SA 2.5 BLASTED
              </div>
            </div>

            <div className="my-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`p-4 sm:p-5 rounded-2xl border text-center ${
                isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-white/[0.03] border-white/[0.05]'
              }`}>
                <span className={`text-xl sm:text-2xl font-bold block ${isLight ? 'text-neutral-900' : 'text-white'}`}>Steel Shot</span>
                <span className="text-xs sm:text-sm font-mono text-neutral-500 dark:text-neutral-400">High Velocity Stripping</span>
              </div>
              <div className={`p-4 sm:p-5 rounded-2xl border text-center ${
                isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-white/[0.03] border-white/[0.05]'
              }`}>
                <span className={`text-xl sm:text-2xl font-bold block ${isLight ? 'text-neutral-900' : 'text-white'}`}>Anti-Rust</span>
                <span className="text-xs sm:text-sm font-mono text-neutral-500 dark:text-neutral-400">Protective Primer / Oil</span>
              </div>
              <div className={`p-4 sm:p-5 rounded-2xl border text-center ${
                isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-white/[0.03] border-white/[0.05]'
              }`}>
                <span className={`text-xl sm:text-2xl font-bold block ${isLight ? 'text-neutral-900' : 'text-white'}`}>Ready to Fit</span>
                <span className="text-xs sm:text-sm font-mono text-neutral-500 dark:text-neutral-400">Clean Shell Envelope</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm font-mono pt-4 border-t border-neutral-200 dark:border-white/5 text-neutral-500 dark:text-neutral-400">
              <span>ZERO REFRACTORY RESIDUE</span>
              <Link to="/request-a-quote" className="text-orange-600 dark:text-orange-400 hover:underline font-bold inline-flex items-center gap-1.5">
                <span>Start Production Run →</span>
              </Link>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
