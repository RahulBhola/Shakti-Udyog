import { useEffect, useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getProduct, getPublicProducts, type PublicProductItem, type Product } from "../api/publicApi";
import { Seo } from "../components/Seo";
import { useTheme } from "../auth/ThemeContext";
import { useEnquiryModal } from "../context/EnquiryModalContext";
import { getThemedImage } from "../utils/themeImage";
import {
  ArrowLeft, ChevronRight, Check, ShieldCheck, Scale, Ruler,
  Beaker, Sparkles, Download, FileText, Package, Phone,
  MessageSquare, Star, ExternalLink, Award, Truck, Layers,
  Activity, FileSpreadsheet, Share2, CheckCircle2,
} from "lucide-react";

export default function ProductDetailPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { openQuoteModal, openEnquiryModal } = useEnquiryModal();

  const [productData, setProductData] = useState<PublicProductItem | Product | null>(null);
  const [allProducts, setAllProducts] = useState<PublicProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"specs" | "manufacturing" | "drawings" | "applications">("specs");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSelectedImageIndex(0);

    // Fetch product details
    getProduct(slug)
      .then((data) => {
        setProductData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message || "Failed to load product specifications.");
        setLoading(false);
      });

    // Also fetch public catalog for related products
    getPublicProducts()
      .then(setAllProducts)
      .catch(() => {});
  }, [slug]);

  // Normalize product fields
  const isRich = productData && "productCode" in productData;
  const rich = isRich ? (productData as PublicProductItem) : null;
  const legacy = !isRich && productData ? (productData as Product) : null;

  const title = rich ? rich.title : legacy?.title ?? "Industrial Casting";
  const productCode = rich?.productCode ?? "PRD-CAST";
  const category = rich?.category ?? "Precision Mechanism";
  const materialType = rich?.materialType ?? (title.toLowerCase().includes("ductile") ? "Ductile Iron" : "Grey Iron");
  const grade = rich?.grade ?? (materialType === "Ductile Iron" ? "SG 500/7" : "FG 200");
  const weight = rich?.weight ?? (legacy?.castingWeightRange || "As per drawing");
  const rawImage = rich?.image || "/images/products_transparent/Industrial Iron Casting.png";
  const description = rich?.detailedDescription || rich?.specs || (legacy?.description?.join(" ") ?? "High precision engineered casting component manufactured to ISO/IS metallurgical standards.");
  const application = rich?.application || (legacy?.typicalApplications?.join(", ") ?? "Industrial machinery, pumps, valves, and automotive components.");
  const tolerances = rich?.tolerances || "±0.05 mm";
  const hardness = rich?.hardness || "180–220 HBW";
  const tensileStrength = rich?.tensileStrength || (materialType === "Ductile Iron" ? "500 MPa min" : "200 MPa min");
  const dimensions = rich?.dimensions || (rich?.length && rich?.width && rich?.height ? `${rich.length} × ${rich.width} × ${rich.height} mm` : "Custom dimensional envelope");

  // Gallery items
  const galleryImages = useMemo(() => {
    const list: { url: string; label: string }[] = [];
    if (rawImage) {
      list.push({ url: rawImage, label: "3D Isometric View" });
    }
    if (rich?.lightImage && rich.lightImage !== rawImage) {
      list.push({ url: rich.lightImage, label: "Light Surface Studio" });
    }
    if (rich?.attachments && rich.attachments.length > 0) {
      rich.attachments
        .filter((a) => a.contentType?.startsWith("image/"))
        .forEach((a, i) => list.push({ url: a.downloadUrl, label: a.fileName || `Drawing View ${i + 1}` }));
    }
    if (list.length === 0) {
      list.push({ url: "/images/products_transparent/Industrial Iron Casting.png", label: "Foundry Casting Component" });
    }
    return list;
  }, [rawImage, rich]);

  const activeImage = galleryImages[selectedImageIndex] || galleryImages[0];
  const themedActiveImage = getThemedImage(activeImage.url, isLight);

  // Related products from same category or material
  const relatedProducts = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];
    return allProducts
      .filter((p) => (rich ? p.id !== rich.id : p.title !== title))
      .filter((p) => (category ? p.category === category : p.materialType === materialType))
      .slice(0, 4);
  }, [allProducts, rich, title, category, materialType]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-[80vh] flex flex-col items-center justify-center ${isLight ? "bg-[#f8f9fa] text-neutral-900" : "bg-[#06080d] text-white"}`}>
        <div className="w-12 h-12 rounded-2xl border-2 border-orange-500 border-t-transparent animate-spin mb-4" />
        <p className="font-mono text-sm font-semibold tracking-wide text-neutral-500">Loading component specifications &amp; 3D renders...</p>
      </div>
    );
  }

  if (error || !productData) {
    return (
      <div className={`min-h-[70vh] flex flex-col items-center justify-center px-4 text-center ${isLight ? "bg-[#f8f9fa] text-neutral-900" : "bg-[#06080d] text-white"}`}>
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 mb-4">
          <Package size={32} />
        </div>
        <h1 className="text-2xl font-black mb-2">Casting Specification Not Found</h1>
        <p className="text-sm text-neutral-500 max-w-md mb-6">{error ?? "The product you requested is either archived or unavailable in the public catalog."}</p>
        <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-all shadow-lg shadow-orange-500/20">
          <ArrowLeft size={16} /> Browse Full Products Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 pb-20 ${isLight ? "bg-[#f8f9fa] text-neutral-900" : "bg-[#06080d] text-white"}`}>
      <Seo
        title={`${title} | ${category} | Shakti Udyog Foundry`}
        description={`${title} (${grade}) manufactured at Shakti Udyog. High precision casting with ${tolerances} tolerance class. Request RFQ.`}
        path={`/products/${slug}`}
      />

      {/* ========================================================================= */}
      {/* 1. TOP BREADCRUMB & SKU HEADER (Amazon/Flipkart Style)                   */}
      {/* ========================================================================= */}
      <div className={`border-b sticky top-16 z-20 backdrop-blur-md transition-colors ${
        isLight ? "bg-white/90 border-neutral-200/80" : "bg-[#080a12]/90 border-white/[0.06]"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-mono text-neutral-500 dark:text-neutral-400">
              <Link to="/" className="hover:text-orange-500 transition-colors">Home</Link>
              <ChevronRight size={12} className="opacity-50" />
              <Link to="/products" className="hover:text-orange-500 transition-colors">Products</Link>
              <ChevronRight size={12} className="opacity-50" />
              <span className="text-neutral-700 dark:text-neutral-300 font-semibold truncate max-w-[180px] sm:max-w-xs">{category}</span>
              <ChevronRight size={12} className="opacity-50" />
              <span className="text-orange-600 dark:text-orange-400 font-bold truncate max-w-[200px]">{title}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleShare}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  copied
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                    : isLight
                    ? "bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700"
                    : "bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300"
                }`}
                title="Share product link"
              >
                {copied ? <Check size={12} /> : <Share2 size={12} />}
                <span>{copied ? "Link Copied!" : "Share"}</span>
              </button>

              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[11px]">
                <CheckCircle2 size={13} />
                <span>Foundry Ready / Active Production</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-10">
        {/* ========================================================================= */}
        {/* 2. HERO SPLIT SECTION (Flipkart / Amazon 2-Column Product Layout)         */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* ──────────────────────────────────────────────────────────────────────── */}
          {/* LEFT: GALLERY & 3D ISOLATED VISUAL STAGE (Lg: 5 Cols)                   */}
          {/* ──────────────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-5 space-y-4">
            <div className={`rounded-3xl border p-6 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-xl transition-all ${
              isLight
                ? "bg-gradient-to-b from-white via-neutral-50 to-neutral-100/90 border-neutral-200/90 shadow-neutral-200/50"
                : "bg-gradient-to-b from-[#111420] via-[#0d1017] to-[#07090e] border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            }`}>
              {/* Material Standard Badge */}
              <div className="absolute top-4 left-4 z-10">
                <span className={`px-3 py-1 rounded-full font-mono text-[11px] font-extrabold uppercase tracking-wider border shadow-sm ${
                  materialType === "Ductile Iron"
                    ? "bg-blue-500/10 text-blue-600 dark:text-sky-400 border-blue-500/30"
                    : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30"
                }`}>
                  {grade} • {materialType}
                </span>
              </div>

              <div className="absolute top-4 right-4 z-10 font-mono text-[11px] font-bold text-neutral-400 dark:text-neutral-500 bg-black/5 dark:bg-white/5 px-2.5 py-0.5 rounded-md">
                {productCode}
              </div>

              {/* Main Image Stage with Hover Magnification */}
              <div className="w-full h-72 sm:h-80 flex items-center justify-center p-2 relative my-4 group cursor-zoom-in">
                <img
                  src={themedActiveImage}
                  alt={title}
                  className="max-h-64 sm:max-h-72 max-w-[90%] w-auto h-auto object-contain transition-all duration-500 group-hover:scale-110 filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_16px_36px_rgba(0,0,0,0.9)]"
                />
              </div>

              {/* View Full Resolution Link */}
              <div className="w-full flex items-center justify-between text-[11px] font-mono text-neutral-500 dark:text-neutral-400 pt-3 border-t border-neutral-200/70 dark:border-white/5">
                <span className="truncate max-w-[200px]">{activeImage.label}</span>
                <a
                  href={themedActiveImage}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 hover:underline font-bold"
                >
                  <span>Zoom Full Asset</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>

            {/* Thumbnail Carousel / Selector */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-20 rounded-2xl border p-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                      selectedImageIndex === idx
                        ? "border-orange-500 ring-2 ring-orange-500/20 bg-orange-500/5 shadow-md"
                        : isLight
                        ? "bg-white border-neutral-200 hover:border-neutral-400"
                        : "bg-white/5 border-white/10 hover:border-white/30"
                    }`}
                  >
                    <img
                      src={getThemedImage(img.url, isLight)}
                      alt={img.label}
                      className="max-h-14 max-w-[90%] object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Quick Assurance Badges below Image */}
            <div className={`p-4 rounded-2xl border grid grid-cols-3 gap-2 text-center ${
              isLight ? "bg-white border-neutral-200/90" : "bg-[#090b10] border-white/[0.08]"
            }`}>
              <div className="space-y-1">
                <Award className="w-5 h-5 mx-auto text-orange-500" />
                <span className="text-[10px] font-bold block uppercase tracking-wide">ISO 9001:2015</span>
                <span className="text-[10px] text-neutral-500 block">Foundry Standard</span>
              </div>
              <div className="space-y-1 border-x border-neutral-100 dark:border-white/5">
                <ShieldCheck className="w-5 h-5 mx-auto text-emerald-500" />
                <span className="text-[10px] font-bold block uppercase tracking-wide">100% Inspected</span>
                <span className="text-[10px] text-neutral-500 block">CMM &amp; Spectro</span>
              </div>
              <div className="space-y-1">
                <Truck className="w-5 h-5 mx-auto text-blue-500" />
                <span className="text-[10px] font-bold block uppercase tracking-wide">Pan-India Supply</span>
                <span className="text-[10px] text-neutral-500 block">Express Dispatch</span>
              </div>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────────────────── */}
          {/* RIGHT: PRODUCT INFO & AMAZON BUY/RFQ BOX (Lg: 7 Cols)                   */}
          {/* ──────────────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Title & Brand Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                  {category}
                </span>
                <span className="text-xs font-mono text-neutral-500">
                  SKU: <strong className="text-neutral-800 dark:text-neutral-200">{productCode}</strong>
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                {title}
              </h1>

              {/* Rating & Verified Bar */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                <div className="flex items-center gap-1 text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  <Star size={13} className="fill-amber-500 text-amber-500" />
                  <span>5.0</span>
                </div>
                <span className="text-neutral-500 dark:text-neutral-400">
                  Industrial Benchmark Quality • <strong>100% Foundry Tested</strong>
                </span>
              </div>
            </div>

            {/* Pricing / Commercial Box (Amazon/Flipkart Style) */}
            <div className={`p-5 sm:p-6 rounded-3xl border transition-all ${
              isLight
                ? "bg-white border-neutral-200/90 shadow-sm"
                : "bg-gradient-to-r from-[#121520] to-[#0d0f18] border-white/10"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-white/5">
                <div>
                  <div className="text-[11px] font-mono font-bold text-neutral-500 uppercase tracking-wide">
                    Commercial Terms
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    {rich?.sellingPrice ? (
                      <>
                        <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                          ₹{rich.sellingPrice.toLocaleString()}
                        </span>
                        <span className="text-xs text-neutral-500 font-mono">
                          / {rich.unit || "piece"} {rich.gstPercent ? `(+${rich.gstPercent}% GST)` : ""}
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
                        Direct Factory Quotation (B2B)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 mb-0">
                    Tiered volume discounts for pilot lots, container loads &amp; recurring OEM scheduled supply.
                  </p>
                </div>

                <div className="text-left sm:text-right font-mono text-xs">
                  <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                    MOQ: Standard Foundry Batch
                  </span>
                </div>
              </div>

              {/* CTA Action Buttons (Amazon Buy Box Action) */}
              <div className="pt-5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => openQuoteModal(title)}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-500/25 cursor-pointer"
                  >
                    <Sparkles size={18} />
                    <span>Request Instant Quote (RFQ)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openEnquiryModal(title)}
                    className={`w-full py-4 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isLight
                        ? "bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-900"
                        : "bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                    }`}
                  >
                    <MessageSquare size={17} />
                    <span>Submit Drawing / CAD</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 pt-1 font-mono">
                  <span>⚡ Quick dispatch within 7–14 days for standard batches</span>
                  <a href="tel:+919876543210" className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 hover:underline font-bold">
                    <Phone size={11} />
                    <span>Technical Desk: +91 98765 43210</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Key Product Highlights (Amazon Bullet Points) */}
            <div className={`p-6 rounded-3xl border space-y-3.5 ${
              isLight ? "bg-white border-neutral-200/90" : "bg-[#090b10] border-white/[0.08]"
            }`}>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Activity size={15} className="text-orange-500" />
                <span>Key Engineering Highlights</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-200/60 dark:border-white/5">
                  <div className="w-5 h-5 rounded-md bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Beaker size={13} />
                  </div>
                  <div>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200 block">Alloy &amp; Grade</span>
                    <span className="text-neutral-500 dark:text-neutral-400 font-mono">{grade} ({materialType})</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-200/60 dark:border-white/5">
                  <div className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Ruler size={13} />
                  </div>
                  <div>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200 block">Machining Tolerance</span>
                    <span className="text-neutral-500 dark:text-neutral-400 font-mono">{tolerances} (Precision CNC)</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-200/60 dark:border-white/5">
                  <div className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Scale size={13} />
                  </div>
                  <div>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200 block">Piece Weight</span>
                    <span className="text-neutral-500 dark:text-neutral-400 font-mono">{weight}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-200/60 dark:border-white/5">
                  <div className="w-5 h-5 rounded-md bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Layers size={13} />
                  </div>
                  <div>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200 block">Tensile &amp; Hardness</span>
                    <span className="text-neutral-500 dark:text-neutral-400 font-mono">{tensileStrength} • {hardness}</span>
                  </div>
                </div>
              </div>

              {/* Engineering Scope Description */}
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 block mb-1">Functional Engineering Scope:</span>
                <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300 m-0">
                  {description}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. IN-DEPTH TECHNICAL TABS (Amazon/Flipkart Structured Specification)     */}
        {/* ========================================================================= */}
        <div className={`rounded-3xl border overflow-hidden shadow-lg ${
          isLight ? "bg-white border-neutral-200/90" : "bg-[#090b10] border-white/[0.08]"
        }`}>
          {/* Tab Navigation Bar */}
          <div className="flex flex-wrap items-center gap-2 p-2.5 border-b border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#0d1017]">
            <button
              type="button"
              onClick={() => setActiveTab("specs")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "specs"
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <FileSpreadsheet size={16} />
              <span>Technical Specification Sheet</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("manufacturing")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "manufacturing"
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <Layers size={16} />
              <span>Foundry &amp; Machining Route</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("drawings")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "drawings"
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <FileText size={16} />
              <span>CAD Drawings &amp; Documents ({rich?.attachments?.length ?? 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("applications")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "applications"
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <Activity size={16} />
              <span>Industrial Applications</span>
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="p-6 sm:p-8">
            {activeTab === "specs" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-1">Comprehensive Metallurgical &amp; Physical Specifications</h3>
                  <p className="text-xs text-neutral-500">Every casting component is verified against IS, DIN, and ASTM equivalent foundry tolerances.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3 text-xs font-mono">
                  <SpecRow label="Product Name" value={title} />
                  <SpecRow label="Master Part Code" value={productCode} />
                  <SpecRow label="Category Classification" value={category} />
                  <SpecRow label="Base Metallurgical Group" value={materialType} />
                  <SpecRow label="Material Grade & Standard" value={grade} />
                  <SpecRow label="Casting Production Type" value={rich?.castingType || "Sand / Machine Molded Casting"} />
                  <SpecRow label="Component Piece Weight" value={weight} />
                  <SpecRow label="Dimensional Geometry" value={dimensions} />
                  <SpecRow label="Machining Tolerance Class" value={tolerances} />
                  <SpecRow label="Brinell Hardness Range" value={hardness} />
                  <SpecRow label="Tensile Strength (Yield)" value={tensileStrength} />
                  <SpecRow label="Material Density" value={rich?.density ? `${rich.density} g/cm³` : "7.15 – 7.25 g/cm³"} />
                  <SpecRow label="Heat Treatment State" value={rich?.heatTreatment || "Stress Relieved / As-Cast"} />
                  <SpecRow label="Surface Treatment & Finish" value={rich?.surfaceFinish || "Shot Blasted & Anti-Rust Primer"} />
                  <SpecRow label="HSN Code" value={rich?.hsnCode || "73259910"} />
                  <SpecRow label="Taxation / GST" value={rich?.gstPercent ? `${rich.gstPercent}%` : "18%"} />
                </div>
              </div>
            )}

            {activeTab === "manufacturing" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-1">Foundry Process &amp; Tooling Route</h3>
                  <p className="text-xs text-neutral-500">Standardized shopfloor parameters ensure repeatability across high-volume production batches.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3 text-xs font-mono">
                  <SpecRow label="Pattern Tooling Number" value={rich?.patternNumber || "SHAKTI-PAT-STD"} />
                  <SpecRow label="Core Requirement" value={rich?.coreRequired ? "Yes (Resin Coated Shell Sand Core)" : "No Core"} />
                  <SpecRow label="Secondary CNC Machining" value={rich?.machiningRequired || rich?.machineRequired ? "Yes (Multi-axis Milling & Drilling)" : "As-Cast Supply"} />
                  <SpecRow label="Cycle Time (Molding/Pouring)" value={rich?.cycleTimeMinutes ? `${rich.cycleTimeMinutes} minutes` : "Standard Foundry Cycle"} />
                  <SpecRow label="Dimensional CMM Inspection" value={rich?.inspectionRequired !== false ? "100% Critical Inspection Protocol" : "Batch Sampling"} />
                  <SpecRow label="Drawing Revision Index" value={rich?.revision || "Rev. 0"} />
                  <SpecRow label="Quality Certifications" value="ISO 9001:2015, Spectrometric Chemical Test Certificate" />
                  <SpecRow label="Traceability" value="Melt Heat Batch Stamped & Serialized" />
                </div>
              </div>
            )}

            {activeTab === "drawings" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-1">Engineering Drawings &amp; PDF Datasheets</h3>
                  <p className="text-xs text-neutral-500">Download verified 2D CAD layouts, technical inspection sheets, and customer reference drawings.</p>
                </div>

                {rich?.attachments && rich.attachments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {rich.attachments.map((att) => (
                      <div key={att.id} className="p-4 rounded-2xl border border-neutral-200/80 dark:border-white/10 flex items-center justify-between gap-3 bg-neutral-50/50 dark:bg-white/5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                            <FileText size={20} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs truncate text-neutral-900 dark:text-white">{att.fileName}</div>
                            <div className="text-[10px] font-mono text-neutral-500">{Math.round(att.sizeBytes / 1024)} KB • {att.contentType}</div>
                          </div>
                        </div>
                        <a
                          href={att.downloadUrl}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs inline-flex items-center gap-1 shrink-0 transition-colors"
                        >
                          <Download size={13} />
                          <span>Download</span>
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl border border-dashed border-neutral-300 dark:border-white/10 text-center space-y-2">
                    <FileText size={32} className="mx-auto text-neutral-400 opacity-60" />
                    <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Custom Drawing Under NDA</h4>
                    <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                      Technical CAD files for this part are restricted to authorized clients. Request official blueprints with your RFQ submission.
                    </p>
                    <button
                      type="button"
                      onClick={() => openQuoteModal(title)}
                      className="px-4 py-2 rounded-xl bg-orange-500 text-white font-bold text-xs hover:bg-orange-600 transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>Request CAD Blueprints</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "applications" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-1">Industrial Sectors &amp; Typical Assembly Applications</h3>
                  <p className="text-xs text-neutral-500">Key industries utilizing this component design and metallurgy.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <AppCard title="Industrial Machinery" desc={application || "Machine beds, drive housings, bearing housings, high-vibration equipment."} />
                  <AppCard title="Automotive &amp; Tractors" desc="Axle components, brackets, kinematic supports, suspension links." />
                  <AppCard title="Pumps, Valves &amp; Fluidics" desc="High pressure fluid chambers, valve bodies, manifolds, flange fittings." />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. FREQUENTLY COMPARED / RELATED CASTINGS (Amazon / Flipkart Carousel)    */}
        {/* ========================================================================= */}
        {relatedProducts.length > 0 && (
          <div className="space-y-5 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight">Frequently Compared Castings</h3>
                <p className="text-xs text-neutral-500">Similar engineering components manufactured in the same foundry family.</p>
              </div>
              <Link to="/products" className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 font-mono">
                <span>View All ({allProducts.length})</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => {
                const isDuctile = p.materialType === "Ductile Iron";
                const pImage = getThemedImage(p.image || "/images/products_transparent/Industrial Iron Casting.png", isLight);

                return (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/products/${p.id}`)}
                    className={`rounded-3xl p-5 border flex flex-col justify-between transition-all duration-300 group cursor-pointer hover:-translate-y-1.5 ${
                      isLight
                        ? "bg-white border-neutral-200/90 hover:border-orange-300 hover:shadow-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
                        : "bg-[#090b10] border-white/[0.08] hover:border-orange-500/40 hover:bg-[#0c0f17] hover:shadow-[0_0_30px_rgba(249,115,22,0.12)]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase border truncate ${
                          isDuctile
                            ? "bg-blue-500/10 text-blue-600 dark:text-sky-400 border-blue-500/30"
                            : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30"
                        }`}>
                          {p.grade}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">{p.weight}</span>
                      </div>

                      <div className="w-full h-36 rounded-2xl flex items-center justify-center p-3 my-2 overflow-hidden bg-neutral-100/50 dark:bg-white/5">
                        <img src={pImage} alt={p.title} className="max-h-28 max-w-[90%] object-contain group-hover:scale-105 transition-transform" />
                      </div>

                      <h4 className="text-xs font-bold line-clamp-2 mt-2 group-hover:text-orange-500 transition-colors">
                        {p.title}
                      </h4>
                      <p className="text-[11px] text-neutral-500 font-mono mt-0.5 truncate">{p.category}</p>
                    </div>

                    <div className="pt-3 border-t border-neutral-100 dark:border-white/5 mt-3 flex items-center justify-between text-xs font-bold text-orange-600 dark:text-orange-400">
                      <span>View Specifications</span>
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. BOTTOM CUSTOM CAD BANNER                                              */}
        {/* ========================================================================= */}
        <div className={`rounded-3xl p-8 sm:p-10 border transition-all ${
          isLight
            ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xl shadow-orange-500/20"
            : "bg-gradient-to-r from-[#170e06] via-[#10121c] to-[#0a0c14] border-orange-500/30 text-white shadow-[0_0_50px_rgba(249,115,22,0.15)]"
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs font-mono font-extrabold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
                Custom Pattern &amp; Metallurgy
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Need customized dimensions or a different grade?
              </h2>
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                Shakti Udyog manufactures bespoke iron casting geometries with fast in-house pattern development, spectrometer-verified metallurgy, and sub-micron CNC machining.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => openQuoteModal(title)}
                className="px-7 py-3.5 rounded-2xl bg-white text-neutral-900 font-extrabold text-sm hover:bg-neutral-100 transition-all shadow-lg cursor-pointer"
              >
                Request Custom RFQ
              </button>
              <button
                type="button"
                onClick={() => openEnquiryModal(title)}
                className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-sm transition-all cursor-pointer"
              >
                Send Drawing
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b border-neutral-200/60 dark:border-white/5 last:border-0 gap-3">
      <span className="text-neutral-500 dark:text-neutral-400 shrink-0">{label}:</span>
      <span className="font-semibold text-neutral-900 dark:text-white text-right truncate max-w-[280px]">{value ?? "—"}</span>
    </div>
  );
}

function AppCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-4 rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/50 dark:bg-white/5 space-y-1.5">
      <div className="flex items-center gap-2 text-orange-500 font-bold text-xs">
        <Check size={14} />
        <span>{title}</span>
      </div>
      <p className="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400 m-0">{desc}</p>
    </div>
  );
}
