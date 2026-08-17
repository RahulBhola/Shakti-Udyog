import React, { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { submitContactRequest } from '../api/publicApi';
import { useTheme } from '../auth/ThemeContext';

interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRequirement?: string;
}

type FormStatus =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'ok'; message: string }
  | { kind: 'error'; message: string };

export const EnquiryModal: React.FC<EnquiryModalProps> = ({
  isOpen,
  onClose,
  defaultRequirement = '',
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [status, setStatus] = useState<FormStatus>({ kind: 'idle' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset status on open & lock scroll
  useEffect(() => {
    if (isOpen) {
      setStatus({ kind: 'idle' });
      setErrors({});
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
      nextErrors.message = 'Please describe your requirement (10+ characters).';
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
      setStatus({ kind: 'ok', message: result.message || 'Your enquiry has been received. Our engineering team will review your requirements and respond within 24 hours.' });
      form.reset();
    } catch {
      setStatus({
        kind: 'error',
        message: 'We could not send your enquiry. Please try again or reach out to us directly.',
      });
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={`relative w-full max-w-2xl my-8 rounded-[28px] sm:rounded-[36px] p-6 sm:p-10 border shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] z-10 max-h-[90vh] overflow-y-auto ${
              isLight
                ? 'bg-white border-neutral-200/90 text-neutral-900'
                : 'bg-[#0b0e17] border-white/15 text-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className={`absolute top-5 right-5 sm:top-7 sm:right-7 p-2.5 rounded-full border transition-all ${
                isLight
                  ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-200 text-neutral-700'
                  : 'bg-white/10 hover:bg-white/20 border-white/15 text-neutral-300 hover:text-white'
              }`}
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Section */}
            <div className="mb-6 sm:mb-8 space-y-2.5 pr-10">
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
                className={`text-2xl sm:text-4xl font-extrabold tracking-tight ${
                  isLight ? 'text-neutral-900' : 'text-white'
                }`}
              >
                Send Us an Enquiry
              </h2>

              <p
                className={`text-xs sm:text-sm leading-relaxed ${
                  isLight ? 'text-neutral-600' : 'text-neutral-400'
                }`}
              >
                Submit your casting requirement or technical question. An engineer from Shakti Udyog will respond within 24 hours.
              </p>
            </div>

            {/* Status Feedback / Form */}
            {status.kind === 'ok' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 px-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 space-y-4 text-center"
              >
                <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500" />
                <div className="space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-bold">Enquiry Received Successfully</h3>
                  <p className="text-sm max-w-md mx-auto text-neutral-600 dark:text-neutral-300">
                    {status.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-4 px-8 py-3.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Done &amp; Close
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Full Name *
                    </label>
                    <input
                      name="fullName"
                      autoComplete="name"
                      placeholder="e.g. Rahul Sharma"
                      required
                      className={`w-full px-4 py-3 rounded-xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
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
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Company / Organization *
                    </label>
                    <input
                      name="companyName"
                      autoComplete="organization"
                      placeholder="e.g. Apex Industrial Machinery"
                      required
                      className={`w-full px-4 py-3 rounded-xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
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
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Work Email *
                    </label>
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="e.g. rahul@company.com"
                      required
                      className={`w-full px-4 py-3 rounded-xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
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
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Phone / WhatsApp Number *
                    </label>
                    <input
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="e.g. +91 98765 43210"
                      required
                      className={`w-full px-4 py-3 rounded-xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
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
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    City &amp; State / Location
                  </label>
                  <input
                    name="city"
                    autoComplete="address-level2"
                    placeholder="e.g. Ludhiana, Punjab or Pune, Maharashtra"
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                      isLight
                        ? 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:bg-white'
                        : 'bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus:bg-white/10'
                    }`}
                  />
                </div>

                {/* Message / Casting Requirement */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Describe Your Casting Requirement / Application *
                  </label>
                  <textarea
                    name="message"
                    rows={3}
                    defaultValue={defaultRequirement}
                    placeholder="Please specify material grade (Grey Iron / Ductile Iron), expected part weight, monthly volume, or any custom machining needs..."
                    required
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
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
                <div className="space-y-1 pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-neutral-600 dark:text-neutral-300">
                    <input
                      type="checkbox"
                      name="consent"
                      defaultChecked
                      className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-orange-500 focus:ring-orange-500 shrink-0"
                    />
                    <span className="leading-snug">
                      I agree that Shakti Udyog may contact me regarding this enquiry and provide technical quotations. *
                    </span>
                  </label>
                  {errors.consent && (
                    <span className="text-xs text-red-500 font-mono block">{errors.consent}</span>
                  )}
                </div>

                {status.kind === 'error' && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-mono flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{status.message}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`px-5 py-3 rounded-xl font-bold text-sm border transition-all cursor-pointer ${
                      isLight
                        ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700'
                        : 'bg-white/5 hover:bg-white/10 border-white/15 text-neutral-300'
                    }`}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={status.kind === 'submitting'}
                    className={`px-7 py-3 rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-md cursor-pointer ${
                      isLight
                        ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/25 disabled:opacity-50'
                        : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] disabled:opacity-50'
                    }`}
                  >
                    {status.kind === 'submitting' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Enquiry…</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Enquiry</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
