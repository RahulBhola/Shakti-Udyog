import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  ShieldCheck,
  ChevronRight,
  Phone,
  MessageCircle,
  Mail,
  Clock,
  FileText,
} from 'lucide-react';
import { useTheme } from '../auth/ThemeContext';
import { useEnquiryModal } from '../context/EnquiryModalContext';

export const SiteFooter: React.FC = () => {
  const { theme } = useTheme();
  const { openQuoteModal } = useEnquiryModal();
  const isLight = theme === 'light';
  const year = new Date().getFullYear();

  const quickLinks = [
    { label: 'Products', path: '/products' },
    { label: 'Capabilities', path: '/capabilities' },
    { label: 'Industries', path: '/industries' },
    { label: 'Contact', path: '/contact' },
    { label: 'Request a Quote', action: () => openQuoteModal() },
  ];

  const legalLinks = [
    { label: 'Privacy Policy', path: '/privacy-policy' },
    { label: 'Terms of Use', path: '/terms-of-use' },
    { label: 'Cookie Policy', path: '/cookie-policy' },
  ];

  return (
    <footer className={`relative pt-4 pb-12 transition-colors duration-300 ${
      isLight ? 'bg-[#f4f7fb]' : 'bg-[#050608]'
    }`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        
        {/* Main Rounded Footer Card Container */}
        <div className={`rounded-3xl p-8 sm:p-12 lg:p-14 border transition-all duration-300 ${
          isLight
            ? 'bg-white border-neutral-200/90 shadow-[0_10px_40px_rgba(0,0,0,0.04)] text-neutral-900'
            : 'bg-[#080a0f] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.9)] text-white'
        }`}>
          
          {/* Top 4-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12">
            
            {/* Column 1: Brand Info & Address (lg:col-span-4) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Logo */}
              <Link to="/" className="inline-flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 shadow-sm group-hover:scale-105 transition-transform">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 19H5V8h14v11zM19 6H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z" opacity="0.3"/>
                    <path d="M12 2a4 4 0 0 0-4 4h8a4 4 0 0 0-4-4zm7 4H5v2h14V6z"/>
                    <circle cx="12" cy="14" r="3" fill="#ff6d00" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className={`text-xl font-black tracking-tight leading-none ${
                    isLight ? 'text-neutral-900' : 'text-white'
                  }`}>
                    Shakti
                  </span>
                  <span className="text-xl font-black tracking-tight leading-none text-orange-500">
                    Udyog
                  </span>
                </div>
              </Link>

              {/* Tagline Paragraph */}
              <p className={`text-sm leading-relaxed max-w-sm ${
                isLight ? 'text-neutral-600' : 'text-neutral-400'
              }`}>
                Shakti Udyog supplies quality-focused iron casting solutions for industrial and OEM applications.
              </p>

              {/* Orange Accent Bar */}
              <div className="w-10 h-1 bg-orange-500 rounded-full" />

              {/* Address Box */}
              <div className="flex items-start gap-3.5 pt-1">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className={`text-xs sm:text-sm leading-relaxed ${
                  isLight ? 'text-neutral-700' : 'text-neutral-300'
                }`}>
                  <div>St No. 5, Daba Road,</div>
                  <div>near SPS Hospital</div>
                  <div className="text-neutral-400">Ludhiana, Punjab 141013, India</div>
                </div>
              </div>

              {/* Tagline Pill */}
              <div>
                <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-xl border text-xs font-mono font-medium ${
                  isLight
                    ? 'border-neutral-200 bg-neutral-50 text-neutral-700'
                    : 'border-white/10 bg-white/5 text-neutral-300'
                }`}>
                  <ShieldCheck className="w-4 h-4 text-orange-500" />
                  <span>Quality. Precision. Trust.</span>
                </div>
              </div>

            </div>

            {/* Column 2: Quick Links (lg:col-span-3) */}
            <div className="lg:col-span-3 space-y-5">
              <h3 className={`text-base sm:text-lg font-bold tracking-tight ${
                isLight ? 'text-neutral-900' : 'text-white'
              }`}>
                Quick Links
              </h3>

              <ul className="space-y-3.5">
                {quickLinks.map((item) => (
                  <li key={item.label}>
                    {'path' in item ? (
                      <Link
                        to={item.path}
                        className={`flex items-center justify-between text-sm transition-colors py-1 group ${
                          isLight
                            ? 'text-neutral-600 hover:text-orange-500'
                            : 'text-neutral-400 hover:text-orange-400'
                        }`}
                      >
                        <span>{item.label}</span>
                        <ChevronRight className="w-4 h-4 text-orange-500 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={item.action}
                        className={`w-full flex items-center justify-between text-sm transition-colors py-1 group cursor-pointer text-left ${
                          isLight
                            ? 'text-neutral-600 hover:text-orange-500'
                            : 'text-neutral-400 hover:text-orange-400'
                        }`}
                      >
                        <span>{item.label}</span>
                        <ChevronRight className="w-4 h-4 text-orange-500 group-hover:translate-x-1 transition-transform" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Legal (lg:col-span-2) */}
            <div className="lg:col-span-2 space-y-5">
              <h3 className={`text-base sm:text-lg font-bold tracking-tight ${
                isLight ? 'text-neutral-900' : 'text-white'
              }`}>
                Legal
              </h3>

              <ul className="space-y-4">
                {legalLinks.map((item) => (
                  <li key={item.label} className="border-b border-neutral-100 dark:border-white/5 pb-3">
                    <Link
                      to={item.path}
                      className={`flex items-center gap-2.5 text-sm transition-colors group ${
                        isLight
                          ? 'text-neutral-600 hover:text-orange-500'
                          : 'text-neutral-400 hover:text-orange-400'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-neutral-400 group-hover:text-orange-500 transition-colors shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Contact & Business Hours (lg:col-span-3) */}
            <div className="lg:col-span-3 space-y-5">
              <h3 className={`text-base sm:text-lg font-bold tracking-tight ${
                isLight ? 'text-neutral-900' : 'text-white'
              }`}>
                Contact
              </h3>

              <div className="space-y-3.5">
                
                {/* Phone */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                      Phone
                    </div>
                    <a
                      href="tel:+918043848014"
                      className={`text-xs sm:text-sm font-semibold transition-colors hover:text-orange-500 ${
                        isLight ? 'text-neutral-900' : 'text-white'
                      }`}
                    >
                      +91 8043848014
                    </a>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                      WhatsApp
                    </div>
                    <a
                      href="https://wa.me/918283041140"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-xs sm:text-sm font-semibold transition-colors hover:text-orange-500 ${
                        isLight ? 'text-neutral-900' : 'text-white'
                      }`}
                    >
                      +91 8283041140
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                      Email
                    </div>
                    <a
                      href="mailto:iamrahulbhola@gmail.com"
                      className={`text-xs sm:text-sm font-semibold transition-colors hover:text-orange-500 truncate block max-w-[180px] ${
                        isLight ? 'text-neutral-900' : 'text-white'
                      }`}
                    >
                      iamrahulbhola@gmail.com
                    </a>
                  </div>
                </div>

                {/* Business Hours Card */}
                <div className={`rounded-2xl p-4 border flex items-center gap-3.5 mt-4 ${
                  isLight
                    ? 'border-neutral-200 bg-neutral-50/80 text-neutral-900'
                    : 'border-white/10 bg-white/[0.03] text-white'
                }`}>
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-neutral-400 font-medium">Business Hours</div>
                    <div className="text-xs sm:text-sm font-bold">
                      Mon–Sat, <span className="text-orange-500">11 AM – 9 PM</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* Bottom Divider (Orange Accent) */}
          <div className="border-t border-orange-500/20 dark:border-orange-500/25 mt-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Left: Copyright */}
            <div className="flex items-center gap-3 text-xs sm:text-sm text-neutral-400">
              <div className="w-7 h-7 rounded-full border border-neutral-400/30 flex items-center justify-center font-serif text-xs shrink-0">
                ©
              </div>
              <div>
                © {year} Shakti Udyog. All rights reserved.
              </div>
            </div>

            {/* Center: Social Media Links */}
            <div className="flex flex-col items-center gap-2.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                Follow Us
              </span>
              <div className="flex items-center gap-3">
                {/* LinkedIn */}
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all transform hover:scale-110 ${
                    isLight
                      ? 'border-neutral-300 bg-neutral-50 text-neutral-700 hover:bg-white hover:text-blue-600 hover:border-blue-400 shadow-sm'
                      : 'border-white/15 bg-white/5 text-neutral-200 hover:bg-white/15 hover:text-white hover:border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                  }`}
                >
                  <svg className="w-4 h-4 fill-current" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.6 1.6 0 0 0-1.6 1.6 1.6 1.6 0 0 0 1.6 1.6 1.6 1.6 0 0 0 1.6-1.6 1.6 1.6 0 0 0-1.6-1.6z"/>
                  </svg>
                </a>

                {/* Facebook */}
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all transform hover:scale-110 ${
                    isLight
                      ? 'border-neutral-300 bg-neutral-50 text-neutral-700 hover:bg-white hover:text-blue-600 hover:border-blue-400 shadow-sm'
                      : 'border-white/15 bg-white/5 text-neutral-200 hover:bg-white/15 hover:text-white hover:border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                  }`}
                >
                  <svg className="w-4 h-4 fill-current" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/>
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all transform hover:scale-110 ${
                    isLight
                      ? 'border-neutral-300 bg-neutral-50 text-neutral-700 hover:bg-white hover:text-pink-500 hover:border-pink-300 shadow-sm'
                      : 'border-white/15 bg-white/5 text-neutral-200 hover:bg-white/15 hover:text-white hover:border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                  }`}
                >
                  <svg className="w-4 h-4 fill-current" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
                  </svg>
                </a>

                {/* YouTube */}
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all transform hover:scale-110 ${
                    isLight
                      ? 'border-neutral-300 bg-neutral-50 text-neutral-700 hover:bg-white hover:text-red-500 hover:border-red-300 shadow-sm'
                      : 'border-white/15 bg-white/5 text-neutral-200 hover:bg-white/15 hover:text-white hover:border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                  }`}
                >
                  <svg className="w-4 h-4 fill-current" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Right: GST Certificate Registration */}
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-mono text-neutral-400">
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <span>GST: 03********1Z0</span>
            </div>

          </div>

        </div>

      </div>
    </footer>
  );
};
