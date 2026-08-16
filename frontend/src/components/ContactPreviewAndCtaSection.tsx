import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from '../auth/ThemeContext';

export const ContactPreviewAndCtaSection: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const contactChannels = [
    {
      label: 'Foundry Works & Office',
      value: 'D-22, Focal Point, Batala – 143505, Punjab, India',
      icon: <MapPin className="w-5 h-5 text-blue-500" />,
      actionText: 'Get Directions',
      actionUrl: 'https://maps.google.com/?q=Batala,Punjab,India',
    },
    {
      label: 'Direct Phone & WhatsApp',
      value: '+91 98140 50222 / +91 98880 50222',
      icon: <Phone className="w-5 h-5 text-emerald-500" />,
      actionText: 'Call Works',
      actionUrl: 'tel:+919814050222',
    },
    {
      label: 'RFQ & Technical Sales',
      value: 'sales@shaktiudyog.com',
      icon: <Mail className="w-5 h-5 text-sky-500" />,
      actionText: 'Send Email',
      actionUrl: 'mailto:sales@shaktiudyog.com',
    },
    {
      label: 'Operating Hours',
      value: 'Mon – Sat: 8:00 AM – 7:30 PM IST',
      icon: <Clock className="w-5 h-5 text-amber-500" />,
      actionText: 'Working Days',
      actionUrl: '/contact',
    },
  ];

  return (
    <section className={`pt-6 sm:pt-8 pb-4 sm:pb-6 transition-colors duration-300 ${
      isLight ? 'bg-[#f4f7fb]' : 'bg-[#050608]'
    }`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-6 sm:space-y-8">
        
        {/* 1. Talk to Our Team Card with Scroll Animation */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={`rounded-3xl p-7 sm:p-10 lg:p-12 border transition-all duration-300 ${
            isLight
              ? 'bg-white border-neutral-200/90 shadow-[0_10px_40px_rgba(0,0,0,0.04)] text-neutral-900'
              : 'bg-[#080a0f] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.9)] text-white'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Heading + Channels Grid */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-xs font-bold tracking-wider uppercase ${
                  isLight
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-blue-500/10 text-sky-400 border border-blue-500/20'
                }`}>
                  DIRECT FACTORY CONTACT
                </div>

                <h2 className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] ${
                  isLight ? 'text-neutral-900' : 'text-white'
                }`}>
                  Talk to Our Metallurgical Team
                </h2>

                <p className={`text-sm sm:text-base leading-relaxed ${
                  isLight ? 'text-neutral-600' : 'text-neutral-400'
                }`}>
                  Connect directly with our casting engineers for drawing analysis, grade selection, pattern development, and volume production quotes.
                </p>
              </div>

              {/* 4 Contact Channels Grid with Staggered Scroll Animation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {contactChannels.map((c, idx) => (
                  <motion.div
                    key={c.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: idx * 0.08 }}
                    className={`rounded-2xl p-4 border transition-all ${
                      isLight
                        ? 'bg-neutral-50/80 border-neutral-200/80 hover:bg-white hover:shadow-md'
                        : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-white/10 dark:bg-white/5 shrink-0 mt-0.5">
                        {c.icon}
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-mono text-neutral-400 font-medium">
                          {c.label}
                        </div>
                        <div className={`text-xs sm:text-sm font-bold leading-snug ${
                          isLight ? 'text-neutral-800' : 'text-white'
                        }`}>
                          {c.value}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right Column: Google Maps Interactive Embed Stage */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="lg:col-span-5 h-full flex flex-col"
            >
              <div className={`relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden border shadow-xl ${
                isLight ? 'border-neutral-200' : 'border-white/10'
              }`}>
                <iframe
                  title="Shakti Udyog Foundry Map"
                  src="https://maps.google.com/maps?q=Batala,Punjab,India&t=&z=13&ie=UTF8&iwloc=&output=embed"
                  className="w-full h-full border-0 filter contrast-[1.05] grayscale-[0.2]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                
                {/* Floating Map Pin Badge */}
                <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-black/80 backdrop-blur-md border border-white/15 text-white flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
                    <span className="font-bold truncate">Focal Point Works, Batala</span>
                  </div>
                  <a
                    href="https://maps.google.com/?q=Batala,Punjab,India"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 hover:text-sky-300 font-bold inline-flex items-center gap-1 shrink-0"
                  >
                    <span>Open Map</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </motion.div>

          </div>
        </motion.div>

        {/* 2. Have a Casting Requirement? CTA Banner Card with Scroll Animation */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={`relative rounded-3xl p-8 sm:p-12 lg:p-14 overflow-hidden border shadow-2xl transition-all ${
            isLight
              ? 'bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 border-blue-600 text-white shadow-blue-500/20'
              : 'bg-gradient-to-r from-[#0c1222] via-[#090e1a] to-[#060810] border-blue-500/30 text-white shadow-[0_0_50px_rgba(59,130,246,0.15)]'
          }`}
        >
          {/* Ambient Glowing Highlights */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-sky-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sky-300 text-xs font-mono font-bold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>RAPID RFQ RESPONSE WITHIN 24 HOURS</span>
              </div>

              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08]">
                Have a Casting Requirement?
              </h2>

              <p className="text-sm sm:text-base text-neutral-200 leading-relaxed max-w-xl">
                Upload your CAD drawings or component specifications. Receive a comprehensive metallurgical review, tooling plan, and custom batch quote.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 shrink-0">
              <Link
                to="/request-a-quote"
                className="px-8 py-4 rounded-2xl bg-white hover:bg-neutral-100 text-neutral-950 font-extrabold text-sm sm:text-base text-center inline-flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
              >
                <span>Request Custom Quote</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/contact"
                className="px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold text-sm sm:text-base text-center transition-colors"
              >
                Contact Engineers
              </Link>
            </div>
          </div>

          {/* Bottom Trust Guarantee Chips */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10 text-xs font-mono text-neutral-300">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
              <span>IS 210 &amp; IS 1865 Compliant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
              <span>3.1 Mill Test Certification</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
              <span>In-House Pattern Facility</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Pan-India Logistics</span>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
