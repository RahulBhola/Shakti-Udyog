import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { submitContactRequest } from '../api/publicApi';
import { Seo, localBusinessJsonLd } from '../components/Seo';
import { Breadcrumb } from '../components/ui';
import { company } from '../content/company';
import { seoPages } from '../content/seo';
import { useTheme } from '../auth/ThemeContext';
import {
  Clock,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Sparkles,
  ArrowRight,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

type FormStatus =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'ok'; message: string }
  | { kind: 'error'; message: string };

export default function ContactPage() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [status, setStatus] = useState<FormStatus>({ kind: 'idle' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const get = (name: string) => (data.get(name) as string | null)?.trim() ?? '';

    const nextErrors: Record<string, string> = {};
    if (get('fullName').length < 2) nextErrors.fullName = 'Please enter your full name.';
    if (get('companyName').length < 2) nextErrors.companyName = 'Please enter your company name.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(get('email')))
      nextErrors.email = 'Please enter a valid work email.';
    if (get('phone').length < 7) nextErrors.phone = 'Please enter a phone or WhatsApp number.';
    if (get('message').length < 10)
      nextErrors.message = 'Please describe how we can help (10+ characters).';
    if (!data.get('consent')) nextErrors.consent = 'Consent is required so we can respond to you.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus({ kind: 'submitting' });
    try {
      const result = await submitContactRequest({
        fullName: get('fullName'),
        companyName: get('companyName'),
        email: get('email'),
        phone: get('phone'),
        city: get('city') || undefined,
        message: get('message'),
        consentGiven: true,
        website: get('website') || undefined, // honeypot
      });
      setStatus({ kind: 'ok', message: result.message });
      form.reset();
    } catch {
      setStatus({
        kind: 'error',
        message: 'We could not send your enquiry. Please try again or call us directly.',
      });
    }
  }

  const googleMapsUrl =
    'https://www.google.com/maps/search/?api=1&query=Shakti+Udyog+Daba+Road+near+SPS+Hospital+Ludhiana+Punjab';

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isLight ? 'bg-[#f4f7fb] text-neutral-900' : 'bg-[#06070a] text-white'
      }`}
    >
      <Seo
        title={seoPages.contact.title}
        description={seoPages.contact.description}
        path="/contact"
        jsonLd={[localBusinessJsonLd()]}
      />

      {/* Hero Header — Perfectly Centered Matching Applications by Industry */}
      <section
        className={`relative pt-32 pb-16 sm:pt-40 sm:pb-24 border-b overflow-hidden transition-colors ${
          isLight ? 'bg-white border-neutral-200/80' : 'bg-[#08090d] border-white/[0.08]'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10 text-center flex flex-col items-center">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-mono font-bold tracking-wider uppercase text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/30 mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span>Direct Foundry Contact &amp; Metallurgical Enquiries</span>
          </div>

          {/* Centered Main Title */}
          <h1
            className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl ${
              isLight ? 'text-neutral-900' : 'text-white'
            }`}
          >
            Let&apos;s Discuss Your <span className="text-orange-500">Casting Requirement</span>
          </h1>

          {/* Centered Subtitle */}
          <p
            className={`text-lg sm:text-2xl max-w-3xl mx-auto leading-relaxed ${
              isLight ? 'text-neutral-600' : 'text-neutral-300'
            }`}
          >
            Tell us about your component, application, material, and volume. We will connect you with the appropriate team member.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12 sm:py-16 space-y-12 sm:space-y-16">
        
        {/* Breadcrumb Navigation */}
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Contact', href: '/contact' }]} />

        {/* ========================================================================= */}
        {/* TALK TO OUR TEAM & MAP SECTION */}
        {/* ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className={`rounded-[32px] p-8 sm:p-12 lg:p-14 border transition-all duration-300 shadow-2xl ${
            isLight
              ? 'bg-white border-neutral-200/90 shadow-[0_10px_40px_rgba(0,0,0,0.04)] text-neutral-900'
              : 'bg-[#080a0f] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.9)] text-white'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Column: Get In Touch Info */}
            <div className="lg:col-span-5 space-y-8">
              
              <div className="space-y-3">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-mono text-xs font-bold tracking-wider uppercase ${
                    isLight
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-blue-500/10 text-sky-400 border border-blue-500/20'
                  }`}
                >
                  <span>GET IN TOUCH</span>
                </div>

                <h2
                  className={`text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.08] ${
                    isLight ? 'text-neutral-900' : 'text-white'
                  }`}
                >
                  Talk to Our Team
                </h2>

                <p
                  className={`text-sm sm:text-base leading-relaxed ${
                    isLight ? 'text-neutral-600' : 'text-neutral-400'
                  }`}
                >
                  We&apos;re here to help! Reach out to us for enquiries, quotes, or any assistance you need.
                </p>
              </div>

              {/* Contact Details List with Circular Icon Badges */}
              <div className="space-y-5">
                
                {/* Working Hours */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isLight
                        ? 'bg-blue-50 border-blue-200 text-blue-600'
                        : 'bg-blue-500/10 border-blue-500/20 text-sky-400'
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-mono font-bold tracking-wider uppercase text-neutral-400">
                      WORKING HOURS
                    </div>
                    <div className={`text-base sm:text-lg font-bold ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                      Mon–Sat, 11 AM – 9 PM
                    </div>
                    <div className="text-xs text-neutral-500">Ludhiana, Punjab</div>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isLight
                        ? 'bg-blue-50 border-blue-200 text-blue-600'
                        : 'bg-blue-500/10 border-blue-500/20 text-sky-400'
                    }`}
                  >
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-mono font-bold tracking-wider uppercase text-neutral-400">
                      PHONE
                    </div>
                    <a
                      href={company.contact.phoneHref}
                      className={`text-base sm:text-lg font-bold hover:underline ${
                        isLight ? 'text-neutral-900' : 'text-white'
                      }`}
                    >
                      {company.contact.phone}
                    </a>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isLight
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-mono font-bold tracking-wider uppercase text-neutral-400">
                      WHATSAPP
                    </div>
                    <a
                      href={company.contact.whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-base sm:text-lg font-bold hover:underline ${
                        isLight ? 'text-neutral-900' : 'text-white'
                      }`}
                    >
                      {company.contact.whatsapp}
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isLight
                        ? 'bg-blue-50 border-blue-200 text-blue-600'
                        : 'bg-blue-500/10 border-blue-500/20 text-sky-400'
                    }`}
                  >
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-mono font-bold tracking-wider uppercase text-neutral-400">
                      EMAIL
                    </div>
                    <a
                      href={`mailto:${company.contact.email}`}
                      className={`text-base sm:text-lg font-bold hover:underline break-all ${
                        isLight ? 'text-neutral-900' : 'text-white'
                      }`}
                    >
                      {company.contact.email}
                    </a>
                  </div>
                </div>

              </div>

              {/* Action Button */}
              <div className="pt-2">
                <a
                  href={company.contact.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-xs sm:text-sm transition-all transform hover:scale-105 shadow-md ${
                    isLight
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                      : 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white shadow-[0_0_25px_rgba(56,189,248,0.4)]'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat with Us on WhatsApp</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>

            </div>

            {/* Right Column: Interactive Map Visualizer Container */}
            <div className="lg:col-span-7">
              <div
                className={`relative w-full h-[400px] sm:h-[460px] rounded-3xl overflow-hidden border shadow-xl ${
                  isLight ? 'border-neutral-200 bg-neutral-100' : 'border-white/10 bg-[#0c0f18]'
                }`}
              >
                {/* Embedded Live Map */}
                <iframe
                  title="Shakti Udyog Location Map"
                  src="https://maps.google.com/maps?q=St%20No.%205%2C%20Daba%20Road%2C%20near%20SPS%20Hospital%2C%20Ludhiana%2C%20Punjab%20141013&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  className={`w-full h-full border-0 ${
                    isLight ? 'contrast-105' : 'invert-[0.9] hue-rotate-180 contrast-125'
                  }`}
                  loading="lazy"
                  allowFullScreen
                />

                {/* Floating "Our Location" Pill Tag */}
                <div className="absolute top-4 left-4 z-10">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-[#0f172a]/90 text-sky-400 backdrop-blur-md border border-sky-500/30 shadow-lg">
                    <MapPin className="w-3.5 h-3.5 text-sky-400" />
                    <span>Our Location</span>
                  </div>
                </div>

                {/* Floating Bottom Location Card */}
                <div className="absolute bottom-4 left-4 right-4 z-10">
                  <div
                    className={`rounded-2xl p-4 sm:p-5 border backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl ${
                      isLight
                        ? 'bg-white/95 border-neutral-200 text-neutral-900'
                        : 'bg-[#0b0f19]/95 border-white/15 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm sm:text-base">Shakti Udyog</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 leading-snug">
                          St No. 5, Daba Road, near SPS Hospital, Ludhiana, Punjab 141013
                        </div>
                      </div>
                    </div>

                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-4 py-2 rounded-xl text-xs font-mono font-bold shrink-0 border transition-all inline-flex items-center justify-center gap-1.5 ${
                        isLight
                          ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-900'
                          : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                      }`}
                    >
                      <span>Get Directions</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* WRITE TO US — SEND AN ENQUIRY FORM SECTION */}
        {/* ========================================================================= */}
        <section id="enquiry-form-section">
          <div
            className={`rounded-[32px] p-8 sm:p-12 lg:p-14 border transition-all duration-300 ${
              isLight
                ? 'bg-white border-neutral-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] text-neutral-900'
                : 'bg-[#080a0f] border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.7)] text-white'
            }`}
          >
            <div className="max-w-3xl mb-10 space-y-3">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-mono text-xs font-bold tracking-wider uppercase ${
                  isLight
                    ? 'bg-orange-50 text-orange-700 border border-orange-200'
                    : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>DIRECT FOUNDRY ENQUIRY</span>
              </div>

              <h2
                className={`text-3xl sm:text-5xl font-extrabold tracking-tight ${
                  isLight ? 'text-neutral-900' : 'text-white'
                }`}
              >
                Send Us an Enquiry
              </h2>

              <p
                className={`text-sm sm:text-base leading-relaxed ${
                  isLight ? 'text-neutral-600' : 'text-neutral-400'
                }`}
              >
                Submit your casting requirement or technical question. An engineer from Shakti Udyog will respond within 24 hours.
              </p>
            </div>

            {status.kind === 'ok' ? (
              <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 space-y-2 text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
                <h3 className="text-xl font-bold">Enquiry Received Successfully</h3>
                <p className="text-sm">{status.message}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">
                      Full Name *
                    </label>
                    <input
                      name="fullName"
                      autoComplete="name"
                      placeholder="e.g. Rahul Sharma"
                      required
                      className={`w-full px-4 py-3.5 rounded-2xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                        isLight
                          ? 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:bg-white'
                          : 'bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus:bg-white/10'
                      }`}
                    />
                    {errors.fullName && (
                      <span className="text-xs text-red-500 font-mono">{errors.fullName}</span>
                    )}
                  </div>

                  {/* Company Name */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">
                      Company / Organization *
                    </label>
                    <input
                      name="companyName"
                      autoComplete="organization"
                      placeholder="e.g. Apex Industrial Machinery"
                      required
                      className={`w-full px-4 py-3.5 rounded-2xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                        isLight
                          ? 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:bg-white'
                          : 'bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus:bg-white/10'
                      }`}
                    />
                    {errors.companyName && (
                      <span className="text-xs text-red-500 font-mono">{errors.companyName}</span>
                    )}
                  </div>

                  {/* Work Email */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">
                      Work Email *
                    </label>
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="e.g. rahul@company.com"
                      required
                      className={`w-full px-4 py-3.5 rounded-2xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                        isLight
                          ? 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:bg-white'
                          : 'bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus:bg-white/10'
                      }`}
                    />
                    {errors.email && (
                      <span className="text-xs text-red-500 font-mono">{errors.email}</span>
                    )}
                  </div>

                  {/* Phone / WhatsApp */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">
                      Phone / WhatsApp Number *
                    </label>
                    <input
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="e.g. +91 98765 43210"
                      required
                      className={`w-full px-4 py-3.5 rounded-2xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                        isLight
                          ? 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:bg-white'
                          : 'bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus:bg-white/10'
                      }`}
                    />
                    {errors.phone && (
                      <span className="text-xs text-red-500 font-mono">{errors.phone}</span>
                    )}
                  </div>

                </div>

                {/* City & State */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">
                    City &amp; State / Location
                  </label>
                  <input
                    name="city"
                    autoComplete="address-level2"
                    placeholder="e.g. Ludhiana, Punjab or Pune, Maharashtra"
                    className={`w-full px-4 py-3.5 rounded-2xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                      isLight
                        ? 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:bg-white'
                        : 'bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus:bg-white/10'
                    }`}
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">
                    Describe Your Casting Requirement / Application *
                  </label>
                  <textarea
                    name="message"
                    rows={4}
                    placeholder="Please specify material grade (Grey Iron / Ductile Iron), expected part weight, monthly volume, or any custom machining needs..."
                    required
                    className={`w-full px-4 py-3.5 rounded-2xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                      isLight
                        ? 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:bg-white'
                        : 'bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus:bg-white/10'
                    }`}
                  />
                  {errors.message && (
                    <span className="text-xs text-red-500 font-mono">{errors.message}</span>
                  )}
                </div>

                {/* Honeypot field */}
                <div className="hidden" aria-hidden="true">
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </div>

                {/* Consent Checkbox */}
                <div className="space-y-1 pt-2">
                  <label className="flex items-start gap-3 cursor-pointer text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                    <input
                      type="checkbox"
                      name="consent"
                      className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span>
                      I agree that Shakti Udyog may contact me regarding this enquiry and provide technical quotations. *
                    </span>
                  </label>
                  {errors.consent && (
                    <span className="text-xs text-red-500 font-mono block">{errors.consent}</span>
                  )}
                </div>

                {status.kind === 'error' && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-mono flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{status.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status.kind === 'submitting'}
                  className={`px-8 py-4 rounded-2xl font-bold text-sm sm:text-base inline-flex items-center justify-center gap-2 transition-all transform hover:scale-105 shadow-md ${
                    isLight
                      ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/25 disabled:opacity-50'
                      : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-[0_0_25px_rgba(249,115,22,0.3)] disabled:opacity-50'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>{status.kind === 'submitting' ? 'Sending Enquiry…' : 'Send Enquiry'}</span>
                </button>

              </form>
            )}

          </div>
        </section>

      </div>
    </div>
  );
}
