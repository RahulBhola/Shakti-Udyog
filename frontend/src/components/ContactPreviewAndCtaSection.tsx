import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Phone,
  MessageCircle,
  Mail,
  ArrowRight,
  MapPin,
  FileText,
  CheckCircle2,
  Settings,
  ShieldCheck,
  Truck,
  Send,
} from 'lucide-react';
import { useTheme } from '../auth/ThemeContext';

export const ContactPreviewAndCtaSection: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <section className={`py-16 sm:py-24 transition-colors duration-300 ${
      isLight ? 'bg-[#f4f7fb]' : 'bg-[#050608]'
    }`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-8 sm:space-y-10">
        
        {/* 1. Talk to Our Team Card */}
        <div className={`rounded-3xl p-7 sm:p-10 lg:p-12 border transition-all duration-300 ${
          isLight
            ? 'bg-white border-neutral-200/90 shadow-[0_10px_40px_rgba(0,0,0,0.04)]'
            : 'bg-[#090b10] border-blue-950/60 shadow-[0_20px_50px_rgba(0,0,0,0.8)]'
        }`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Column: Contact Information */}
            <div className="lg:col-span-6 space-y-7">
              <div className="space-y-3">
                <div className={`text-xs font-mono font-bold tracking-widest uppercase ${
                  isLight ? 'text-blue-600' : 'text-blue-400'
                }`}>
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
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isLight ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-blue-500/10 text-blue-500'
                  }`}>
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
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isLight ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-blue-500/10 text-blue-500'
                  }`}>
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                      PHONE
                    </div>
                    <a
                      href="tel:+918043848014"
                      className={`text-sm sm:text-base font-bold transition-colors hover:text-blue-600 ${
                        isLight ? 'text-neutral-900' : 'text-white'
                      }`}
                    >
                      +91 8043848014
                    </a>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isLight ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-blue-500/10 text-blue-500'
                  }`}>
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
                      className={`text-sm sm:text-base font-bold transition-colors hover:text-blue-600 ${
                        isLight ? 'text-neutral-900' : 'text-white'
                      }`}
                    >
                      +91 8283041140
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isLight ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-blue-500/10 text-blue-500'
                  }`}>
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                      EMAIL
                    </div>
                    <a
                      href="mailto:iamrahulbhola@gmail.com"
                      className={`text-sm sm:text-base font-bold transition-colors hover:text-blue-600 ${
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

            {/* Right Column: Stylized Map Card (Light Mode & Dark Mode) */}
            <div className="lg:col-span-6">
              <div className={`relative rounded-2xl overflow-hidden border transition-all ${
                isLight
                  ? 'border-blue-100 bg-[#edf2f7] shadow-inner'
                  : 'border-blue-900/40 bg-[#070a12]'
              } aspect-[4/3] flex flex-col justify-between p-5 shadow-2xl`}>
                
                {/* SVG Stylized Road Network Map Background */}
                <div className="absolute inset-0 opacity-90 pointer-events-none">
                  <svg className="w-full h-full" viewBox="0 0 600 450" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Background Grids */}
                    <path
                      d="M0 100 H600 M0 200 H600 M0 300 H600 M0 400 H600"
                      stroke={isLight ? '#e2e8f0' : '#162032'}
                      strokeWidth="1"
                    />
                    <path
                      d="M100 0 V450 M200 0 V450 M300 0 V450 M400 0 V450 M500 0 V450"
                      stroke={isLight ? '#e2e8f0' : '#162032'}
                      strokeWidth="1"
                    />

                    {/* Major Highways & Arteries */}
                    <path
                      d="M-20 400 L250 150 L580 40"
                      stroke={isLight ? '#cbd5e1' : '#2a3952'}
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                    <path
                      d="M-20 400 L250 150 L580 40"
                      stroke={isLight ? '#ffffff' : '#1e2c42'}
                      strokeWidth="7"
                      strokeLinecap="round"
                    />
                    
                    {/* NH-44 Route */}
                    <path
                      d="M150 450 L320 200 L480 -20"
                      stroke={isLight ? '#94a3b8' : '#374b6b'}
                      strokeWidth="12"
                    />
                    <path
                      d="M150 450 L320 200 L480 -20"
                      stroke={isLight ? '#f8fafc' : '#25354e'}
                      strokeWidth="8"
                    />

                    {/* Daba Road Connecting Artery */}
                    <path
                      d="M220 280 L440 100"
                      stroke={isLight ? '#2563eb' : '#3b82f6'}
                      strokeWidth="4"
                      strokeDasharray="6 4"
                    />
                    
                    {/* Secondary Roads */}
                    <path
                      d="M50 80 L350 380"
                      stroke={isLight ? '#e2e8f0' : '#1c283b'}
                      strokeWidth="5"
                    />
                    <path
                      d="M380 420 L580 200"
                      stroke={isLight ? '#e2e8f0' : '#1c283b'}
                      strokeWidth="5"
                    />
                    <path
                      d="M50 300 L550 250"
                      stroke={isLight ? '#e2e8f0' : '#1f2d42'}
                      strokeWidth="4"
                    />

                    {/* Landmark Labels */}
                    <text
                      x="360"
                      y="80"
                      fill={isLight ? '#475569' : '#64748b'}
                      fontSize="11"
                      fontWeight="600"
                      fontFamily="monospace"
                    >
                      Sherpur Chowk
                    </text>
                    <text
                      x="470"
                      y="120"
                      fill={isLight ? '#475569' : '#64748b'}
                      fontSize="10"
                      fontWeight="600"
                      fontFamily="monospace"
                    >
                      Model Town
                    </text>
                    <text
                      x="510"
                      y="170"
                      fill={isLight ? '#64748b' : '#475569'}
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      HAIBOWAL KALAN
                    </text>
                    <text
                      x="355"
                      y="95"
                      fill={isLight ? '#0f172a' : '#94a3b8'}
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      SPS Hospital Ⓗ
                    </text>
                    <text
                      x="300"
                      y="140"
                      fill={isLight ? '#1d4ed8' : '#60a5fa'}
                      fontSize="12"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      Daba Road
                    </text>
                    <text
                      x="370"
                      y="175"
                      fill={isLight ? '#475569' : '#475569'}
                      fontSize="10"
                      fontWeight="600"
                      fontFamily="monospace"
                    >
                      NH 44
                    </text>
                    <text
                      x="305"
                      y="155"
                      fill={isLight ? '#64748b' : '#475569'}
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      BABA DEEP SINGH NAGAR
                    </text>
                  </svg>
                </div>

                {/* Top-Left Pill Badge: Our Location */}
                <div className={`relative z-10 self-start inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono font-bold backdrop-blur-md shadow-md ${
                  isLight
                    ? 'bg-white/90 border border-blue-200 text-blue-700'
                    : 'bg-blue-950/80 border border-blue-500/40 text-blue-400'
                }`}>
                  <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
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
                <div className={`relative z-10 backdrop-blur-md p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl ${
                  isLight
                    ? 'bg-white/95 border border-neutral-200/90 text-neutral-900'
                    : 'bg-[#090d16]/90 border border-blue-900/50 text-white'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className={`text-sm font-bold tracking-tight ${
                        isLight ? 'text-neutral-900' : 'text-white'
                      }`}>
                        Shakti Udyog
                      </div>
                      <div className={`text-xs leading-snug ${
                        isLight ? 'text-neutral-600' : 'text-neutral-400'
                      }`}>
                        St No. 5, Daba Road, near SPS Hospital, Ludhiana, Punjab 141001
                      </div>
                    </div>
                  </div>

                  <a
                    href="https://maps.google.com/?q=Shakti+Udyog+Daba+Road+Ludhiana"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-semibold shrink-0 transition-colors ${
                      isLight
                        ? 'border-blue-600 text-blue-600 hover:bg-blue-50'
                        : 'border-blue-500/40 text-blue-400 hover:bg-blue-500/10'
                    }`}
                  >
                    <span>Get Directions</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* 2. Have a Casting Requirement? Banner */}
        <div className={`rounded-3xl p-7 sm:p-9 lg:p-11 border transition-all duration-300 ${
          isLight
            ? 'bg-white border-neutral-200/90 shadow-[0_10px_40px_rgba(0,0,0,0.04)]'
            : 'bg-[#090b10] border-blue-950/60 shadow-[0_20px_50px_rgba(0,0,0,0.8)]'
        }`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  isLight ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-blue-500/10 text-blue-500'
                }`}>
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight ${
                  isLight ? 'text-neutral-900' : 'text-white'
                }`}>
                  Have a Casting Requirement?
                </h3>
              </div>

              <p className={`text-sm sm:text-base leading-relaxed ${
                isLight ? 'text-neutral-600' : 'text-neutral-400'
              }`}>
                Send us your drawing, material grade, quantity, and delivery requirement. Our team will review it and respond with the next steps.
              </p>

              {/* 4 Trust Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className={`flex items-center gap-1.5 text-xs font-mono font-medium ${
                  isLight ? 'text-neutral-700' : 'text-neutral-400'
                }`}>
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-500 shrink-0" />
                  <span>Quick Response</span>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-mono font-medium ${
                  isLight ? 'text-neutral-700' : 'text-neutral-400'
                }`}>
                  <Settings className="w-4 h-4 text-blue-600 dark:text-blue-500 shrink-0" />
                  <span>Engineering Support</span>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-mono font-medium ${
                  isLight ? 'text-neutral-700' : 'text-neutral-400'
                }`}>
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-500 shrink-0" />
                  <span>Quality Assured</span>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-mono font-medium ${
                  isLight ? 'text-neutral-700' : 'text-neutral-400'
                }`}>
                  <Truck className="w-4 h-4 text-blue-600 dark:text-blue-500 shrink-0" />
                  <span>On-Time Delivery</span>
                </div>
              </div>
            </div>

            {/* Center 3D Casting Photo */}
            <div className="lg:col-span-3 flex items-center justify-center">
              <img
                src="/images/cast_iron_casting/Cast Iron Rotary Barrel Pump Casting.png"
                alt="Precision Industrial Casting"
                className="max-h-36 sm:max-h-44 object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Right Action Card Block */}
            <div className="lg:col-span-3 flex justify-center lg:justify-end">
              <Link
                to="/request-a-quote"
                className="w-full sm:w-auto lg:w-full bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white p-7 rounded-2xl flex flex-col items-center justify-center text-center gap-3 transition-all transform hover:scale-105 shadow-xl shadow-blue-600/30 group"
              >
                <Send className="w-6 h-6 text-white group-hover:-translate-y-1 transition-transform" />
                <span className="text-base sm:text-lg font-bold tracking-tight">
                  Get a<br />Custom Quote
                </span>
                <ArrowRight className="w-5 h-5 text-blue-200 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
