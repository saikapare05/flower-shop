import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Sparkles, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

interface ServiceModalProps {
  serviceId: string | null;
  serviceImg: string;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}

export function ServiceModal({ serviceId, serviceImg, triggerRef, onClose }: ServiceModalProps) {
  const { t, tArray } = useLanguage();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const titleId = 'service-modal-title';

  // Move focus into modal on open; restore to trigger on close
  useEffect(() => {
    if (serviceId) {
      // Defer so AnimatePresence has rendered the element
      const raf = requestAnimationFrame(() => closeBtnRef.current?.focus());
      return () => cancelAnimationFrame(raf);
    } else {
      triggerRef?.current?.focus();
    }
  }, [serviceId, triggerRef]);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!serviceId) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      // Focus trap — keep Tab / Shift+Tab inside dialog
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    },
    [serviceId, onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = serviceId ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [serviceId]);

  const includes = serviceId ? tArray(`services.items.${serviceId}.includes`) : [];

  const handleWhatsApp = () => {
    if (!serviceId) return;
    const name = t(`services.items.${serviceId}.name`);
    const msg = encodeURIComponent(
      `Hello SAI FLOWERS AND DECORATORS,\n\nI am interested in your *${name}* service. Please share more details and pricing.\n\nThank you!`,
    );
    window.open(`https://wa.me/919960629513?text=${msg}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      {serviceId && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <motion.div
              ref={dialogRef}
              className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.92, y: 32, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 32, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            >
              {/* Hero image */}
              <div className="relative h-52 rounded-t-3xl overflow-hidden flex-shrink-0">
                <img
                  src={serviceImg}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Close button */}
                <button
                  ref={closeBtnRef}
                  onClick={onClose}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white transition-colors"
                  aria-label={t('services.close')}
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Title over image */}
                <div className="absolute bottom-0 left-0 p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                    <span className="text-[#D4AF37] text-xs font-semibold uppercase tracking-widest">
                      SAI FLOWERS
                    </span>
                  </div>
                  <h2 id={titleId} className="text-2xl font-bold text-white leading-tight">
                    {t(`services.items.${serviceId}.name`)}
                  </h2>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Description */}
                <p className="text-gray-600 leading-relaxed text-base">
                  {t(`services.items.${serviceId}.details`)}
                </p>

                {/* What's included */}
                {includes.length > 0 && (
                  <div>
                    <h3 className="font-bold text-[#1E5631] text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      {t('services.includes')}
                    </h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {includes.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#D4AF37] flex-shrink-0" aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Ideal for */}
                <div className="bg-[#1E5631]/5 rounded-2xl px-4 py-3 border border-[#1E5631]/10">
                  <span className="text-xs font-semibold text-[#1E5631] uppercase tracking-wider">
                    {t('services.idealFor')}
                  </span>
                  <p className="text-sm text-gray-700 mt-1">
                    {t(`services.items.${serviceId}.idealFor`)}
                  </p>
                </div>

                {/* CTA */}
                <Button
                  onClick={handleWhatsApp}
                  className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white py-6 rounded-xl font-semibold text-base flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
                >
                  <MessageCircle className="w-5 h-5" aria-hidden="true" />
                  {t('services.whatsappEnquiry')}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
