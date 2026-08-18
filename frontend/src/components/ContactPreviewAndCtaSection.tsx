import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock,
  Phone,
  MessageCircle,
  Mail,
  ArrowRight,
  MapPin,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from '../auth/ThemeContext';
import { useEnquiryModal } from '../context/EnquiryModalContext';
import { EnquiryModal } from './EnquiryModal';

export const ContactPreviewAndCtaSection: React.FC = () => {
  const { theme } = useTheme();
  const { openQuoteModal } = useEnquiryModal();
  const isLight = theme === 'light';
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);

  return (
    <section className={`pt-6 sm:pt-8 pb-4 sm:pb-6 transition-colors duration-300 ${
      isLight ? 'bg-[#f4f7fb]' : 'bg-[#050608]'
    }`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-6 sm:space-y-8">
        
        {/* 1. Talk to Our Team Card (Reverted Previous Design & Content) */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={`rounded-3xl p-7 sm:p-10 lg:p-12 border transition-all duration-300 ${
            isLight
              ? 'bg-white border-neutral-200/90 shadow-[0_10px_40px_rgba(0,0,0,0.04)] text-neutral-900'
              : 'bg-[#090b10] border-blue-950/60 shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-white'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Column: Contact Information */}
            <div className="lg:col-span-6 space-y-7">
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold tracking-widest uppercase text-blue-500">
                  GET IN TOUCH
                </div>
                <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight ${
                  isLight ? 'text-neutral-900' : 'text-white'
                }`}>
                  Talk to Our Team
                </h2>
                <p className={`text-sm sm:text-base leading-relaxed ${
                  isLight ? 'text-neutral-600' : 'text-neutral-400'
                }`}>
                  We&apos;re here to help! Reach out to us for enquiries, quotes, or any assistance you need.
                </p>
              </div>

              {/* 4 Contact Rows */}
              <div className="space-y-4 pt-1">
                
                {/* Working Hours */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-500 shrink-0 mt-0.5">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                      WORKING HOURS
                    </div>
                    <div className={`text-sm sm:text-base font-bold ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                      Mon–Sat, 11 AM – 9 PM
                    </div>
                    <div className="text-xs text-neutral-500">Ludhiana, Punjab</div>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-500 shrink-0 mt-0.5">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                      PHONE
                    </div>
                    <a
                      href="tel:+918043848014"
                      className={`text-sm sm:text-base font-bold transition-colors hover:text-blue-500 ${
                        isLight ? 'text-neutral-900' : 'text-white'
                      }`}
                    >
                      +91 8043848014
                    </a>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-500 shrink-0 mt-0.5">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                      WHATSAPP
                    </div>
                    <a
                      href="https://wa.me/918283041140"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-sm sm:text-base font-bold transition-colors hover:text-blue-500 ${
                        isLight ? 'text-neutral-900' : 'text-white'
                      }`}
                    >
                      +91 8283041140
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-500 shrink-0 mt-0.5">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                      EMAIL
                    </div>
                    <a
                      href="mailto:iamrahulbhola@gmail.com"
                      className={`text-sm sm:text-base font-bold transition-colors hover:text-blue-500 ${
                        isLight ? 'text-neutral-900' : 'text-white'
                      }`}
                    >
                      iamrahulbhola@gmail.com
                    </a>
                  </div>
                </div>

              </div>

              {/* Visit Contact Page CTA */}
              <div className="pt-2">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full text-sm font-semibold tracking-wide text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25"
                >
                  <span>Visit Contact Page</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right Column: Stylized Interactive Map Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="lg:col-span-6"
            >
              <div className={`relative rounded-2xl overflow-hidden border transition-all ${
                isLight ? 'border-neutral-200 bg-[#f8fafc]' : 'border-blue-900/40 bg-[#070a12]'
              } aspect-[4/3] flex flex-col justify-between p-5 shadow-2xl`}>
                
                {/* SVG Stylized Road Network Map Background */}
                <div className="absolute inset-0 opacity-80 pointer-events-none">
                  <svg className="w-full h-full" viewBox="0 0 600 450" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Background Grids */}
                    <path d="M0 100 H600 M0 200 H600 M0 300 H600 M0 400 H600" stroke={isLight ? '#e2e8f0' : '#162032'} strokeWidth="1" />
                    <path d="M100 0 V450 M200 0 V450 M300 0 V450 M400 0 V450 M500 0 V450" stroke={isLight ? '#e2e8f0' : '#162032'} strokeWidth="1" />

                    {/* Major Highways & Arteries */}
                    <path d="M-20 400 L250 150 L580 40" stroke={isLight ? '#cbd5e1' : '#2a3952'} strokeWidth="8" strokeLinecap="round" />
                    <path d="M-20 400 L250 150 L580 40" stroke={isLight ? '#e2e8f0' : '#1e2c42'} strokeWidth="6" strokeLinecap="round" />
                    
                    {/* NH-44 Route */}
                    <path d="M150 450 L320 200 L480 -20" stroke={isLight ? '#94a3b8' : '#374b6b'} strokeWidth="10" />
                    <path d="M150 450 L320 200 L480 -20" stroke={isLight ? '#cbd5e1' : '#25354e'} strokeWidth="8" />

                    {/* Daba Road Connecting Artery */}
                    <path d="M220 280 L440 100" stroke="#3b82f6" strokeWidth="3.5" strokeDasharray="6 4" />
                    
                    {/* Secondary Roads */}
                    <path d="M50 80 L350 380" stroke={isLight ? '#e2e8f0' : '#1c283b'} strokeWidth="4" />
                    <path d="M380 420 L580 200" stroke={isLight ? '#e2e8f0' : '#1c283b'} strokeWidth="4" />
                    <path d="M50 300 L550 250" stroke={isLight ? '#e2e8f0' : '#1f2d42'} strokeWidth="3" />

                    {/* Landmark Labels */}
                    <text x="360" y="80" fill={isLight ? '#64748b' : '#64748b'} fontSize="11" fontFamily="monospace">Sherpur Chowk</text>
                    <text x="470" y="120" fill={isLight ? '#64748b' : '#64748b'} fontSize="10" fontFamily="monospace">Model Town</text>
                    <text x="510" y="170" fill={isLight ? '#94a3b8' : '#475569'} fontSize="9" fontFamily="monospace">HAIBOWAL KALAN</text>
                    <text x="355" y="90" fill={isLight ? '#334155' : '#94a3b8'} fontSize="11" fontWeight="bold" fontFamily="sans-serif">SPS Hospital Ⓗ</text>
                    <text x="300" y="140" fill="#3b82f6" fontSize="12" fontWeight="bold" fontFamily="sans-serif">Daba Road</text>
                    <text x="370" y="175" fill={isLight ? '#64748b' : '#475569'} fontSize="10" fontFamily="monospace">NH 44</text>
                    <text x="305" y="140" fill={isLight ? '#94a3b8' : '#475569'} fontSize="9" fontFamily="monospace">BABA DEEP SINGH NAGAR</text>
                  </svg>
                </div>

                {/* Top-Left Pill Badge: Our Location */}
                <div className="relative z-10 self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-400 text-xs font-mono font-medium backdrop-blur-md shadow-md">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>Our Location</span>
                </div>

                {/* Center Animated Glowing Map Pin Marker */}
                <div className="absolute top-[35%] left-[58%] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center pointer-events-none">
                  <div className="relative flex items-center justify-center">
                    <div className="w-9 h-9 rounded-full bg-blue-500/30 animate-ping absolute" />
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.8)] border-2 border-white">
                      <MapPin className="w-4 h-4 fill-white" />
                    </div>
                  </div>
                </div>

                {/* Bottom Overlay Info Card */}
                <div className={`relative z-10 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl backdrop-blur-md border ${
                  isLight
                    ? 'bg-white/95 border-neutral-200 text-neutral-900 shadow-lg'
                    : 'bg-[#090d16]/90 border-blue-900/50 text-white'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className={`text-sm font-bold tracking-tight ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                        Shakti Udyog
                      </div>
                      <div className={`text-xs leading-snug ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
                        St No. 5, Daba Road, near SPS Hospital, Ludhiana, Punjab 141001
                      </div>
                    </div>
                  </div>

                  <a
                    href="https://maps.google.com/?q=Shakti+Udyog+Daba+Road+Ludhiana"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-blue-500/40 text-blue-500 hover:bg-blue-500/10 text-xs font-semibold shrink-0 transition-colors"
                  >
                    <span>Get Directions</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>

              </div>
            </motion.div>

          </div>
        </motion.div>

        {/* 2. Have a Casting Requirement? Banner */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={`relative rounded-3xl p-8 sm:p-12 lg:p-14 overflow-hidden border transition-all duration-300 ${
            isLight
              ? 'bg-white border-neutral-200/90 shadow-[0_15px_50px_rgba(0,0,0,0.05)] text-neutral-900'
              : 'bg-gradient-to-r from-[#0c1222] via-[#090e1a] to-[#060810] border-blue-500/30 text-white shadow-[0_0_50px_rgba(59,130,246,0.15)]'
          }`}
        >
          {/* Ambient Glowing Highlights */}
          <div className={`absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
            isLight ? 'bg-blue-100/60' : 'bg-sky-400/20'
          }`} />
          <div className={`absolute -bottom-24 -left-24 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
            isLight ? 'bg-indigo-100/50' : 'bg-blue-600/20'
          }`} />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3.5 max-w-2xl">
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase ${
                isLight
                  ? 'bg-blue-50 border border-blue-200 text-blue-700 shadow-sm'
                  : 'bg-white/10 backdrop-blur-md border border-white/20 text-sky-300'
              }`}>
                <Sparkles className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-blue-600' : 'text-sky-300'}`} />
                <span>RAPID ENQUIRY RESPONSE WITHIN 24 HOURS</span>
              </div>

              <h2 className={`text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] ${
                isLight ? 'text-neutral-900' : 'text-white'
              }`}>
                Have a Casting Requirement?
              </h2>

              <p className={`text-sm sm:text-base leading-relaxed max-w-xl font-normal ${
                isLight ? 'text-neutral-600' : 'text-neutral-300'
              }`}>
                Upload your CAD drawings or component specifications. Receive a comprehensive metallurgical review, tooling plan, and custom batch quote.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 shrink-0">
              <button
                type="button"
                onClick={() => openQuoteModal()}
                className={`px-8 py-4 rounded-2xl font-extrabold text-sm sm:text-base text-center inline-flex items-center justify-center gap-2.5 transition-all transform hover:scale-105 cursor-pointer ${
                  isLight
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white shadow-[0_0_30px_rgba(56,189,248,0.4)]'
                }`}
              >
                <span className="text-white font-extrabold">Request Custom Quote</span>
                <ArrowRight className="w-4 h-4 text-white shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setIsEnquiryOpen(true)}
                className={`px-7 py-4 rounded-2xl font-bold text-sm sm:text-base text-center transition-all cursor-pointer ${
                  isLight
                    ? 'bg-neutral-50 hover:bg-neutral-100 border border-neutral-300 text-neutral-800 shadow-sm hover:border-neutral-400'
                    : 'bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-sm hover:border-white/30'
                }`}
              >
                <span className={isLight ? 'text-neutral-800' : 'text-white'}>Send a Query</span>
              </button>
            </div>
          </div>

          {/* Bottom Trust Guarantee Chips */}
          <div className={`relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t text-xs font-mono font-medium ${
            isLight
              ? 'border-neutral-200/80 text-neutral-700'
              : 'border-white/15 text-neutral-300'
          }`}>
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-4 h-4 shrink-0 ${isLight ? 'text-blue-600' : 'text-sky-400'}`} />
              <span>IS 210 &amp; IS 1865 Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-4 h-4 shrink-0 ${isLight ? 'text-blue-600' : 'text-sky-400'}`} />
              <span>3.1 Mill Test Certification</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-4 h-4 shrink-0 ${isLight ? 'text-blue-600' : 'text-sky-400'}`} />
              <span>In-House Pattern Facility</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-4 h-4 shrink-0 ${isLight ? 'text-blue-600' : 'text-sky-400'}`} />
              <span>Pan-India Logistics</span>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Direct Foundry Enquiry Popup Modal */}
      <EnquiryModal
        isOpen={isEnquiryOpen}
        onClose={() => setIsEnquiryOpen(false)}
      />
    </section>
  );
};
