import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/i18n';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const hardcodedTestimonials = [
  { id: '1', name: 'Priya Sharma', event: 'Wedding Decoration', text: 'Absolutely breathtaking! Every detail was perfect. The fresh flowers smelled amazing all day.', rating: 5 },
  { id: '2', name: 'Rahul Patil', event: 'Birthday Decoration', text: 'Best birthday decoration we have ever seen! The kids loved the balloons and floral mix.', rating: 5 },
  { id: '3', name: 'Sunita Desai', event: 'Haldi Ceremony', text: 'Beautiful and vibrant yellow marigolds, exactly what we wanted for the haldi.', rating: 5 },
  { id: '4', name: 'Amit Joshi', event: 'Corporate Event', text: 'Professional, creative, and delivered on time. Highly recommended for corporate setups.', rating: 5 },
  { id: '5', name: 'Kavita More', event: 'Reception Decoration', text: 'Our guests were amazed. Truly world-class stage decoration!', rating: 5 },
  { id: '6', name: 'Suresh Kulkarni', event: 'Temple Decoration', text: 'Devotional and beautiful, we were deeply moved by the floral arrangements.', rating: 5 },
];

export function Testimonials() {
  const { t } = useLanguage();
  const [testimonials, setTestimonials] = useState(hardcodedTestimonials);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function fetchTestimonials() {
      try {
        const querySnapshot = await getDocs(collection(db, 'testimonials'));
        const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        if (fetched.length > 0) {
          setTestimonials(fetched);
        }
      } catch (error) {
        console.error("Error fetching testimonials", error);
      }
    }
    fetchTestimonials();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const next = () => setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  return (
    <section id="testimonials" className="py-24 bg-[#1E5631] relative overflow-hidden">
      {/* Decorative BG pattern */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            {t('testimonials.heading')}
          </h2>
          <div className="w-24 h-1 bg-secondary mx-auto rounded-full" />
        </div>

        <div className="max-w-4xl mx-auto relative">
          <div className="flex justify-center items-center h-[300px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 md:p-12 rounded-3xl w-full text-center relative"
              >
                <Quote className="absolute top-6 left-6 w-12 h-12 text-secondary/30 rotate-180" />
                <Quote className="absolute bottom-6 right-6 w-12 h-12 text-secondary/30" />
                
                <div className="flex justify-center gap-1 mb-6">
                  {[...Array(testimonials[currentIndex].rating || 5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-secondary text-secondary" />
                  ))}
                </div>
                
                <p className="text-xl md:text-2xl text-white font-medium mb-8 italic leading-relaxed">
                  "{testimonials[currentIndex].text}"
                </p>
                
                <div>
                  <h4 className="text-secondary font-bold text-lg">{testimonials[currentIndex].name}</h4>
                  <p className="text-white/70 text-sm">{testimonials[currentIndex].event}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-center gap-4 mt-8">
            <button 
              onClick={prev}
              className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center text-white hover:bg-white hover:text-primary transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={next}
              className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center text-white hover:bg-white hover:text-primary transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
