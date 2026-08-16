'use client';

import React from 'react';
import { Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative w-full bg-[#050505] text-neutral-400 pt-16 pb-12 border-t border-white/[0.08] overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[250px] bg-orange-600/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start justify-between">
          <div className="space-y-4 max-w-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-950 border border-white/15 flex items-center justify-center">
                <div className="w-3.5 h-3.5 border-2 border-orange-500 rotate-45 flex items-center justify-center">
                  <div className="w-1 h-1 bg-white rounded-full" />
                </div>
              </div>
              <span className="font-bold text-lg text-white tracking-tight font-sans">
                SHAKTI UDYOG
              </span>
            </div>

            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Precision cast-iron and high-pressure alloy casting foundry delivering mission-critical multi-way valve bodies, pump volutes, and heavy mechanical infrastructure.
            </p>
          </div>

          <div className="space-y-3 md:text-right flex flex-col md:items-end">
            <h4 className="text-xs font-mono uppercase tracking-widest text-white font-semibold">
              Foundry Operations
            </h4>
            <div className="text-xs font-mono space-y-2 text-neutral-300">
              <div className="flex items-center md:justify-end gap-2">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                <span>Foundry Complex · Industrial Area, Phase II, India</span>
              </div>
              <div className="flex items-center md:justify-end gap-2">
                <Mail className="w-4 h-4 text-orange-500 shrink-0" />
                <span>contact@shaktiudyog.com · engineering@shaktiudyog.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-neutral-400">
          <div>
            © {new Date().getFullYear()} Shakti Udyog Precision Castings Ltd. All rights reserved.
          </div>
          <div className="text-neutral-400 font-mono">
            EST. 1994 · PRECISION FOUNDRY METALLURGY
          </div>
        </div>
      </div>
    </footer>
  );
};
