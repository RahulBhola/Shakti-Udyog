import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProducts, type Product } from "../api/publicApi";
import { Seo } from "../components/Seo";
import { seoPages } from "../content/seo";
import { AppleProductLineup } from "../components/AppleProductLineup";
import { ProductMarqueeGallery } from "../components/ProductMarqueeGallery";
import { MetallurgicalBentoGrid } from "../components/MetallurgicalBentoGrid";
import { useTheme } from "../auth/ThemeContext";
import {
  ArrowRight,
  Sparkles,
  Sliders,
  Cpu,
  ShieldCheck,
} from "lucide-react";

export default function ProductsPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(() => {});
  }, []);

  const greyIron = products?.find((p) => p.slug === "grey-iron-castings");
  const ductileIron = products?.find((p) => p.slug === "ductile-iron-castings");

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${
      isLight ? "bg-[#f8f9fa] text-neutral-900" : "bg-[#050507] text-white"
    }`}>
      <Seo
        title={seoPages.products.title}
        description={seoPages.products.description}
        path="/products"
      />

      {/* Hero Header — Perfectly Centered */}
      <section className={`relative pt-32 pb-16 sm:pt-40 sm:pb-24 border-b overflow-hidden transition-colors ${
        isLight ? "bg-white border-neutral-200/80" : "bg-[#08090d] border-white/[0.08]"
      }`}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-mono font-bold tracking-wider uppercase text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/30 mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span>Foundry Portfolio &amp; Engineering Specifications</span>
          </div>

          <h1 className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl ${
            isLight ? "text-neutral-900" : "text-white"
          }`}>
            Precision Engineered <span className="text-orange-500">Castings</span>
          </h1>

          <p className={`text-lg sm:text-2xl max-w-3xl mx-auto leading-relaxed mb-10 ${
            isLight ? "text-neutral-600" : "text-neutral-300"
          }`}>
            Delivering high-integrity Grey Iron (FG 150–FG 350) and Ductile Iron (SG 400–SG 700) components for heavy OEM machinery, automotive transmissions, and hydraulic fluid systems.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-sm sm:text-base font-mono">
            <span className={`px-4 py-2 rounded-full border shadow-sm ${
              isLight ? "bg-neutral-100/90 border-neutral-300 text-neutral-800" : "bg-white/[0.04] border-white/10 text-neutral-300"
            }`}>
              ⚡ 1460°C Induction Melt Control
            </span>
            <span className={`px-4 py-2 rounded-full border shadow-sm ${
              isLight ? "bg-neutral-100/90 border-neutral-300 text-neutral-800" : "bg-white/[0.04] border-white/10 text-neutral-300"
            }`}>
              🎯 ±0.015 mm Zeiss 3D CMM Precision
            </span>
            <span className={`px-4 py-2 rounded-full border shadow-sm ${
              isLight ? "bg-neutral-100/90 border-neutral-300 text-neutral-800" : "bg-white/[0.04] border-white/10 text-neutral-300"
            }`}>
              🛡️ ISO 9001:2015 Certified
            </span>
          </div>
        </div>
      </section>

      {/* Apple-Style Product Lineup */}
      <AppleProductLineup />

      {/* Infinite Scrolling Dual-Row Marquee Gallery */}
      <ProductMarqueeGallery />

      {/* High-Fidelity Detail Control Bento Grid */}
      <MetallurgicalBentoGrid />

      {/* Metallurgical Material Matrix (Grey Iron vs Ductile Iron) */}
      <section className={`py-16 sm:py-24 border-t transition-colors ${
        isLight ? "bg-white border-neutral-200/80" : "bg-[#07080c] border-white/[0.08]"
      }`}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className={`text-3xl sm:text-5xl font-bold tracking-tight mb-4 ${
              isLight ? "text-neutral-900" : "text-white"
            }`}>
              Metallurgical Grade Specifications
            </h2>
            <p className={`text-base sm:text-lg ${
              isLight ? "text-neutral-600" : "text-neutral-300"
            }`}>
              Compare mechanical properties, matrix structures, and standard applications to select the optimal iron alloy for your working loads.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Grey Iron Card */}
            <div className={`rounded-[32px] p-7 sm:p-10 border transition-all duration-300 shadow-xl flex flex-col justify-between ${
              isLight
                ? "bg-[#fbfbfd] border-neutral-200/90 shadow-[0_10px_35px_rgba(0,0,0,0.04)]"
                : "bg-[#0e0f14]/90 border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.8)]"
            }`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3.5 py-1 rounded-full text-xs sm:text-sm font-mono font-bold uppercase bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                    Flake Graphite (Cast Iron)
                  </span>
                  <span className="text-xs sm:text-sm font-mono text-neutral-500 dark:text-neutral-400">IS 210 / EN-GJL</span>
                </div>

                <h3 className={`text-2xl sm:text-4xl font-bold tracking-tight ${
                  isLight ? "text-neutral-900" : "text-white"
                }`}>
                  Grey Iron Castings
                </h3>

                <p className={`text-sm sm:text-base leading-relaxed ${
                  isLight ? "text-neutral-600" : "text-neutral-300"
                }`}>
                  Renowned for exceptional damping capacity, high thermal conductivity, and effortless CNC machinability. The international benchmark for machine beds, vibration dampeners, and hydraulic casings.
                </p>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-3">
                  <div className={`p-3.5 rounded-2xl border ${
                    isLight ? "bg-white border-neutral-200 text-neutral-900" : "bg-white/[0.04] border-white/[0.06] text-white"
                  }`}>
                    <span className="text-xs font-mono text-neutral-500 block uppercase">Tensile Range</span>
                    <span className="text-base font-bold text-orange-600 dark:text-orange-400 font-mono">150–350 MPa</span>
                  </div>
                  <div className={`p-3.5 rounded-2xl border ${
                    isLight ? "bg-white border-neutral-200 text-neutral-900" : "bg-white/[0.04] border-white/[0.06] text-white"
                  }`}>
                    <span className="text-xs font-mono text-neutral-500 block uppercase">Hardness HBW</span>
                    <span className="text-base font-bold font-mono">160–260 HBW</span>
                  </div>
                  <div className={`p-3.5 rounded-2xl border ${
                    isLight ? "bg-white border-neutral-200 text-neutral-900" : "bg-white/[0.04] border-white/[0.06] text-white"
                  }`}>
                    <span className="text-xs font-mono text-neutral-500 block uppercase">Unit Weight</span>
                    <span className="text-base font-bold font-mono">0.2 to 250 kg</span>
                  </div>
                </div>

                <div className="pt-3">
                  <span className="text-sm font-semibold block mb-2 text-neutral-500 dark:text-neutral-400">Typical Components:</span>
                  <div className="flex flex-wrap gap-2">
                    {["V-Belt Pulleys", "Pump Casings", "Valve Bodies", "Machine Bases", "Sizzler Plates"].map((app) => (
                      <span key={app} className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-medium border ${
                        isLight ? "bg-neutral-100 border-neutral-300 text-neutral-800" : "bg-white/[0.04] border-white/10 text-neutral-300"
                      }`}>
                        {app}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-neutral-200 dark:border-white/5">
                <Link
                  to={greyIron ? `/products/${greyIron.slug}` : "/request-a-quote"}
                  className="inline-flex items-center gap-2 text-base font-bold text-orange-600 dark:text-orange-400 hover:underline"
                >
                  <span>Explore Grey Iron Technical Guide</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {/* Ductile (SG) Iron Card */}
            <div className={`rounded-[32px] p-7 sm:p-10 border transition-all duration-300 shadow-xl flex flex-col justify-between ${
              isLight
                ? "bg-[#fbfbfd] border-neutral-200/90 shadow-[0_10px_35px_rgba(0,0,0,0.04)]"
                : "bg-[#0e0f14]/90 border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.8)]"
            }`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3.5 py-1 rounded-full text-xs sm:text-sm font-mono font-bold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                    Spheroidal Graphite (SG Iron)
                  </span>
                  <span className="text-xs sm:text-sm font-mono text-neutral-500 dark:text-neutral-400">IS 1865 / EN-GJS</span>
                </div>

                <h3 className={`text-2xl sm:text-4xl font-bold tracking-tight ${
                  isLight ? "text-neutral-900" : "text-white"
                }`}>
                  Ductile (SG) Iron Castings
                </h3>

                <p className={`text-sm sm:text-base leading-relaxed ${
                  isLight ? "text-neutral-600" : "text-neutral-300"
                }`}>
                  High tensile strength, impact toughness, and up to 18% elongation. S.G. Iron bridges the gap between conventional cast iron and forged steel for high-stress dynamic components.
                </p>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-3">
                  <div className={`p-3.5 rounded-2xl border ${
                    isLight ? "bg-white border-neutral-200 text-neutral-900" : "bg-white/[0.04] border-white/[0.06] text-white"
                  }`}>
                    <span className="text-xs font-mono text-neutral-500 block uppercase">Tensile Range</span>
                    <span className="text-base font-bold text-blue-600 dark:text-blue-400 font-mono">400–700 MPa</span>
                  </div>
                  <div className={`p-3.5 rounded-2xl border ${
                    isLight ? "bg-white border-neutral-200 text-neutral-900" : "bg-white/[0.04] border-white/[0.06] text-white"
                  }`}>
                    <span className="text-xs font-mono text-neutral-500 block uppercase">Elongation %</span>
                    <span className="text-base font-bold font-mono">5% to 18%</span>
                  </div>
                  <div className={`p-3.5 rounded-2xl border ${
                    isLight ? "bg-white border-neutral-200 text-neutral-900" : "bg-white/[0.04] border-white/[0.06] text-white"
                  }`}>
                    <span className="text-xs font-mono text-neutral-500 block uppercase">Unit Weight</span>
                    <span className="text-base font-bold font-mono">0.1 to 180 kg</span>
                  </div>
                </div>

                <div className="pt-3">
                  <span className="text-sm font-semibold block mb-2 text-neutral-500 dark:text-neutral-400">Typical Components:</span>
                  <div className="flex flex-wrap gap-2">
                    {["Gear Shift Levers", "Tractor Parts", "Train Handles", "Sewing Brackets", "Heavy Flanges"].map((app) => (
                      <span key={app} className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-medium border ${
                        isLight ? "bg-neutral-100 border-neutral-300 text-neutral-800" : "bg-white/[0.04] border-white/10 text-neutral-300"
                      }`}>
                        {app}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-neutral-200 dark:border-white/5">
                <Link
                  to={ductileIron ? `/products/${ductileIron.slug}` : "/request-a-quote"}
                  className="inline-flex items-center gap-2 text-base font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <span>Explore Ductile Iron Technical Guide</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Value-Added Engineering Services */}
      <section className={`py-16 sm:py-24 transition-colors ${
        isLight ? "bg-[#f8f9fa]" : "bg-[#050507]"
      }`}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className={`text-3xl sm:text-5xl font-bold tracking-tight mb-4 ${
              isLight ? "text-neutral-900" : "text-white"
            }`}>
              Full-Cycle Casting &amp; Machining Services
            </h2>
            <p className={`text-base sm:text-lg ${
              isLight ? "text-neutral-600" : "text-neutral-300"
            }`}>
              From early 3D drawing review and pattern tooling to CNC machining and dispatch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7 sm:gap-8">
            <div className={`p-7 sm:p-9 rounded-3xl border transition-all duration-300 shadow-md ${
              isLight ? "bg-white border-neutral-200/90" : "bg-[#0c0d12] border-white/[0.08]"
            }`}>
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-6 text-orange-500">
                <Sliders className="w-7 h-7" />
              </div>
              <h3 className={`text-2xl font-bold mb-3 ${isLight ? "text-neutral-900" : "text-white"}`}>
                Pattern &amp; Tooling Shop
              </h3>
              <p className={`text-sm sm:text-base leading-relaxed ${isLight ? "text-neutral-600" : "text-neutral-300"}`}>
                In-house wooden, aluminum matchplate, and shell core pattern making. Ensuring shrinkage allowances and zero draft errors.
              </p>
            </div>

            <div className={`p-7 sm:p-9 rounded-3xl border transition-all duration-300 shadow-md ${
              isLight ? "bg-white border-neutral-200/90" : "bg-[#0c0d12] border-white/[0.08]"
            }`}>
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 text-blue-500">
                <Cpu className="w-7 h-7" />
              </div>
              <h3 className={`text-2xl font-bold mb-3 ${isLight ? "text-neutral-900" : "text-white"}`}>
                Precision CNC Machining
              </h3>
              <p className={`text-sm sm:text-base leading-relaxed ${isLight ? "text-neutral-600" : "text-neutral-300"}`}>
                Equipped with CNC turning centers, VMCs, tapping, and keyway slotting to deliver ready-to-assemble components to your assembly lines.
              </p>
            </div>

            <div className={`p-7 sm:p-9 rounded-3xl border transition-all duration-300 shadow-md ${
              isLight ? "bg-white border-neutral-200/90" : "bg-[#0c0d12] border-white/[0.08]"
            }`}>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-500">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className={`text-2xl font-bold mb-3 ${isLight ? "text-neutral-900" : "text-white"}`}>
                Quality Metrology &amp; OES
              </h3>
              <p className={`text-sm sm:text-base leading-relaxed ${isLight ? "text-neutral-600" : "text-neutral-300"}`}>
                14-element Spark OES chemical analysis, Brinell hardness testing, Zeiss CMM 3D dimensional reports, and 100% batch traceability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Custom OEM Solutions CTA Card */}
      <section className={`py-16 sm:py-24 border-t transition-colors ${
        isLight ? "bg-white border-neutral-200/80" : "bg-[#08090d] border-white/[0.08]"
      }`}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className={`rounded-[32px] p-8 sm:p-14 border transition-all duration-300 shadow-2xl relative overflow-hidden ${
            isLight
              ? "bg-gradient-to-br from-orange-50 via-white to-amber-50/50 border-orange-500/30"
              : "bg-gradient-to-br from-[#12131a] via-[#0e0f14] to-black border-orange-500/30"
          }`}>
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-mono font-bold tracking-wider uppercase text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/30">
                <span>Custom OEM Tooling &amp; Casting</span>
              </div>

              <h2 className={`text-3xl sm:text-5xl font-bold tracking-tight ${
                isLight ? "text-neutral-900" : "text-white"
              }`}>
                Have a Custom 2D/3D Drawing or Sample?
              </h2>

              <p className={`text-base sm:text-lg leading-relaxed ${
                isLight ? "text-neutral-700" : "text-neutral-300"
              }`}>
                Send us your CAD model (STEP/IGES/PDF) or physical sample. Our metallurgical engineering team will perform DFM feasibility, pattern tooling layout, and provide a competitive quote within 24 hours.
              </p>

              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Link
                  to="/request-a-quote"
                  className="px-8 py-4 rounded-full text-base font-semibold tracking-wide text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 shadow-[0_4px_20px_rgba(255,109,0,0.35)] transition-all transform hover:-translate-y-0.5"
                >
                  Request a Formal Quote →
                </Link>
                <Link
                  to="/contact"
                  className={`px-7 py-4 rounded-full text-base font-semibold border transition-colors ${
                    isLight
                      ? "bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-100 shadow-sm"
                      : "bg-white/5 border-white/15 text-white hover:bg-white/10"
                  }`}
                >
                  Contact Technical Sales
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
