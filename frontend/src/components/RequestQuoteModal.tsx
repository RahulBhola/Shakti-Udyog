import React, { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCheck,
  ShieldCheck,
  Layers,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useTheme } from '../auth/ThemeContext';
import { submitEnquiry, enquiryProductTypes, type SubmissionAccepted } from '../api/publicApi';

const allowedExtensions = ['pdf', 'dwg', 'dxf', 'step', 'stp', 'iges', 'igs', 'jpg', 'jpeg', 'png', 'zip'];
const maxFileMb = 10;
const maxFiles = 10;

export interface RequestQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPartName?: string;
}

type FormStatus =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'ok'; message: string; reference: string | null }
  | { kind: 'error'; message: string };

export const RequestQuoteModal: React.FC<RequestQuoteModalProps> = ({
  isOpen,
  onClose,
  defaultPartName,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [status, setStatus] = useState<FormStatus>({ kind: 'idle' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  function handleFilesChosen(files: FileList | null) {
    setFileError(null);
    if (!files || files.length === 0) return;
    const newFiles: File[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (!allowedExtensions.includes(ext)) {
        setFileError(`"${file.name}": .${ext} is not supported. Please upload CAD (STEP, IGES, DWG) or PDF files.`);
        return;
      }
      if (file.size > maxFileMb * 1024 * 1024) {
        setFileError(`"${file.name}": exceeds the ${maxFileMb} MB size limit.`);
        return;
      }
      newFiles.push(file);
    }
    const total = selectedFiles.length + newFiles.length;
    if (total > maxFiles) {
      setFileError(`Maximum ${maxFiles} files allowed.`);
      return;
    }
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const get = (name: string) => (data.get(name) as string | null)?.trim() ?? '';

    const nextErrors: Record<string, string> = {};
    if (get('fullName').length < 2) nextErrors.fullName = 'Please enter your full name.';
    if (get('companyName').length < 2) nextErrors.companyName = 'Please enter your company name.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(get('email'))) nextErrors.email = 'Please enter a valid work email.';
    if (get('phone').length < 7) nextErrors.phone = 'Please enter a phone or WhatsApp number.';
    if (!get('productType')) nextErrors.productType = 'Please select a requirement type.';
    if (!get('quantity')) nextErrors.quantity = 'Please enter the required quantity.';
    if (get('requirementDetails').length < 10) nextErrors.requirementDetails = 'Please describe the part or application (10+ characters).';
    if (!data.get('consent')) nextErrors.consent = 'Consent is required so our engineers can respond with a quote.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || fileError) return;

    setStatus({ kind: 'submitting' });

    try {
      const result: SubmissionAccepted = await submitEnquiry({
        fullName: get('fullName'),
        companyName: get('companyName'),
        email: get('email'),
        phone: get('phone'),
        productType: get('productType'),
        materialGrade: get('materialGrade') || undefined,
        quantity: get('quantity'),
        deliveryLocation: get('deliveryLocation') || undefined,
        requirementDetails: get('requirementDetails'),
        consentGiven: true,
        website: get('website') || undefined,
      });

      setStatus({
        kind: 'ok',
        message: result.message || 'Your quote request has been received. Our foundry engineering team will review your drawings and provide an itemized quote within 24 hours.',
        reference: result.id,
      });
      form.reset();
      setSelectedFiles([]);
    } catch {
      setStatus({
        kind: 'error',
        message: 'We could not submit your quote request. Please try again or reach out to us directly.',
      });
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto no-scrollbar">
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
            className={`relative w-full max-w-3xl my-auto rounded-[28px] sm:rounded-[36px] p-6 sm:p-9 border shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] z-10 max-h-[92vh] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
              isLight
                ? 'bg-white border-neutral-200/90 text-neutral-900'
                : 'bg-[#0a0d14] border-white/15 text-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className={`absolute top-5 right-5 sm:top-7 sm:right-7 p-2.5 rounded-full border transition-all cursor-pointer ${
                isLight
                  ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-200 text-neutral-700'
                  : 'bg-white/10 hover:bg-white/20 border-white/15 text-neutral-300 hover:text-white'
              }`}
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Section */}
            <div className="mb-5 sm:mb-6 space-y-2 pr-10">
              <div
                className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full font-mono text-xs font-bold tracking-wider uppercase ${
                  isLight
                    ? 'bg-orange-50 text-orange-700 border border-orange-200'
                    : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>DIRECT FOUNDRY RFQ &amp; QUOTATION</span>
              </div>

              <h2
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                  isLight ? 'text-neutral-900' : 'text-white'
                }`}
              >
                Request a Custom Quote
              </h2>

              <p
                className={`text-xs sm:text-sm leading-relaxed ${
                  isLight ? 'text-neutral-600' : 'text-neutral-400'
                }`}
              >
                Share your CAD drawings, material grade, and estimated batch volumes. Our metallurgical engineers will review your part for DFM feasibility and provide an itemized quote within 24 hours.
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
                  <h3 className="text-xl sm:text-2xl font-bold">Quote Request Received!</h3>
                  <p className="text-sm max-w-md mx-auto text-neutral-600 dark:text-neutral-300">
                    {status.message}
                  </p>
                  {status.reference && (
                    <div className="inline-block mt-2 px-4 py-1.5 rounded-lg bg-white/60 dark:bg-black/40 border border-emerald-500/20 font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      RFQ Reference: {status.reference}
                    </div>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-4 px-8 py-3.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    Done &amp; Close
                  </button>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {/* 2-Column Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Full Name *
                    </label>
                    <input
                      name="fullName"
                      autoComplete="name"
                      placeholder="e.g. Rahul Sharma"
                      required
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
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
                  <div className="space-y-1">
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Company Name *
                    </label>
                    <input
                      name="companyName"
                      autoComplete="organization"
                      placeholder="e.g. Apex Industrial Machinery"
                      required
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
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
                  <div className="space-y-1">
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Work Email *
                    </label>
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="e.g. rahul@company.com"
                      required
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
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
                  <div className="space-y-1">
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Phone / WhatsApp Number *
                    </label>
                    <input
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="e.g. +91 98765 43210"
                      required
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
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

                {/* 3-Column Technical Params */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Requirement Type */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Requirement Type *
                    </label>
                    <select
                      name="productType"
                      required
                      defaultValue={defaultPartName ? 'Custom Casting Requirement' : ''}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                        isLight
                          ? 'bg-neutral-50 border-neutral-200 text-neutral-900 focus:bg-white'
                          : 'bg-white/5 border-white/10 text-white focus:bg-white/10'
                      }`}
                    >
                      <option value="" disabled>Select requirement type</option>
                      {enquiryProductTypes.map((type) => (
                        <option key={type} value={type} className={isLight ? 'text-black' : 'text-black'}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {errors.productType && (
                      <span className="text-xs text-red-500 font-mono">{errors.productType}</span>
                    )}
                  </div>

                  {/* Material Grade */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Material Grade / Standard
                    </label>
                    <input
                      name="materialGrade"
                      placeholder="e.g. IS 210 FG 260 / SG 500/7"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                        isLight
                          ? 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:bg-white'
                          : 'bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus:bg-white/10'
                      }`}
                    />
                  </div>

                  {/* Required Quantity */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Required Quantity / Volume *
                    </label>
                    <input
                      name="quantity"
                      placeholder="e.g. 50 pcs sample / 2,000/mo"
                      required
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                        isLight
                          ? 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:bg-white'
                          : 'bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus:bg-white/10'
                      }`}
                    />
                    {errors.quantity && (
                      <span className="text-xs text-red-500 font-mono">{errors.quantity}</span>
                    )}
                  </div>
                </div>

                {/* Delivery Location & Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1 sm:col-span-1">
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Delivery Location
                    </label>
                    <input
                      name="deliveryLocation"
                      placeholder="e.g. Ludhiana, Pune, Global"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                        isLight
                          ? 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:bg-white'
                          : 'bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus:bg-white/10'
                      }`}
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Part &amp; Machining Details *
                    </label>
                    <input
                      name="requirementDetails"
                      defaultValue={defaultPartName ? `Quotation request for ${defaultPartName}.` : ''}
                      placeholder="Piece weight, critical machined bores, surface finish, pressure test specs..."
                      required
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                        isLight
                          ? 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:bg-white'
                          : 'bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus:bg-white/10'
                      }`}
                    />
                    {errors.requirementDetails && (
                      <span className="text-xs text-red-500 font-mono">{errors.requirementDetails}</span>
                    )}
                  </div>
                </div>

                {/* CAD Drawing / File Upload Box */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Upload 2D / 3D CAD Drawings or Specs (Max {maxFiles} files, 10MB each)
                  </label>
                  
                  <div
                    className={`relative border-2 border-dashed rounded-2xl p-3.5 text-center transition-all ${
                      isLight
                        ? 'border-neutral-300 hover:border-orange-500 bg-neutral-50/50'
                        : 'border-white/15 hover:border-orange-500/60 bg-white/[0.02]'
                    }`}
                  >
                    <input
                      type="file"
                      multiple
                      accept={allowedExtensions.map((e) => `.${e}`).join(',')}
                      onChange={(e) => handleFilesChosen(e.target.files)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex items-center justify-center gap-3">
                      <UploadCloud className="w-6 h-6 text-orange-500 shrink-0" />
                      <div className="text-left">
                        <span className="text-xs font-bold text-orange-500">Click or drag &amp; drop files</span>
                        <span className="text-[11px] text-neutral-500 block">
                          Accepted: STEP, IGES, DWG, DXF, PDF, PNG, JPG, ZIP
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Selected Files List */}
                  {selectedFiles.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {selectedFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono ${
                            isLight
                              ? 'bg-neutral-100 border-neutral-200 text-neutral-800'
                              : 'bg-white/5 border-white/10 text-neutral-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span className="truncate">{file.name}</span>
                            <span className="text-[10px] text-neutral-400">({(file.size / 1024).toFixed(0)}KB)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="text-neutral-400 hover:text-red-500 p-1 transition-colors cursor-pointer"
                            title="Remove file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {fileError && (
                    <span className="text-xs text-red-500 font-mono block">{fileError}</span>
                  )}
                </div>

                {/* Honeypot field */}
                <div className="hidden" aria-hidden="true">
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </div>

                {/* Consent Checkbox */}
                <div className="space-y-0.5 pt-0.5">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-neutral-600 dark:text-neutral-300">
                    <input
                      type="checkbox"
                      name="consent"
                      defaultChecked
                      className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-orange-500 focus:ring-orange-500 shrink-0"
                    />
                    <span className="leading-snug text-[11px] sm:text-xs">
                      I agree that Shakti Udyog may review my submitted drawings and provide technical quotations. *
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
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm border transition-all cursor-pointer ${
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
                    className={`px-7 py-2.5 rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-md cursor-pointer ${
                      isLight
                        ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/25 disabled:opacity-50'
                        : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] disabled:opacity-50'
                    }`}
                  >
                    {status.kind === 'submitting' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting RFQ…</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Quote Request</span>
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
