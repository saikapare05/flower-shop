import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/i18n';
import { Plus, Minus } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const hardcodedFaqs = [
  { id: '1', qKey: 'q1', aKey: 'a1' },
  { id: '2', qKey: 'q2', aKey: 'a2' },
  { id: '3', qKey: 'q3', aKey: 'a3' },
  { id: '4', qKey: 'q4', aKey: 'a4' },
  { id: '5', qKey: 'q5', aKey: 'a5' },
  { id: '6', qKey: 'q6', aKey: 'a6' },
  { id: '7', qKey: 'q7', aKey: 'a7' },
  { id: '8', qKey: 'q8', aKey: 'a8' },
];

export function FAQ() {
  const { t } = useLanguage();
  const [faqs, setFaqs] = useState(hardcodedFaqs);
  const [openId, setOpenId] = useState<string | null>(null);

  // In a real app we'd load these from Firestore and fallback, 
  // but for translations it's tricky if data is mixed. 
  // We'll stick to translations for base FAQs, and allow dynamic ones if loaded.

  return (
    <section id="faq" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-12 bg-secondary" />
            <h4 className="text-secondary font-bold uppercase tracking-wider">{t('nav.faq')}</h4>
            <div className="h-px w-12 bg-secondary" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground">
            {t('faq.heading')}
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <motion.div 
                key={faq.id}
                initial={false}
                className={`border rounded-xl overflow-hidden transition-colors ${isOpen ? 'bg-white border-primary shadow-md' : 'bg-white border-border hover:border-primary/50'}`}
              >
                <button
                  className="w-full px-6 py-5 flex items-center justify-between text-left"
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                >
                  <span className={`font-semibold text-lg ${isOpen ? 'text-primary' : 'text-foreground'}`}>
                    {t(`faq.${faq.qKey}`)}
                  </span>
                  <div className={`shrink-0 ml-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                    {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </div>
                </button>
                
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-5 pt-0 text-muted-foreground leading-relaxed">
                        {t(`faq.${faq.aKey}`)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
