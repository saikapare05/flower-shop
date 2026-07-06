import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { ArrowDown, MessageCircle } from 'lucide-react';
import heroImg from '@assets/generated_images/hero.jpg';

// In case the image generation failed or isn't ready, fallback gracefully.
// But we'll assume it exists.

export function Hero() {
  const { t } = useLanguage();

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } },
  };

  return (
    <section id="home" className="relative w-full h-[100dvh] flex items-center justify-center overflow-hidden">
      {/* Background Image & Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#1E5631]/80 via-[#1E5631]/60 to-[#0d2e18]/90 mix-blend-multiply" />
      </div>

      {/* Floating Particles (CSS only for perf) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 10 + 5 + 'px',
              height: Math.random() * 10 + 5 + 'px',
              backgroundColor: i % 2 === 0 ? '#D4AF37' : '#FFFFFF',
              opacity: Math.random() * 0.5 + 0.2,
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              filter: 'blur(2px)',
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 50 - 25, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 text-center mt-16">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto glass-dark p-8 md:p-12 rounded-3xl border border-white/20 shadow-2xl"
        >
          <motion.p variants={itemVariants} className="text-secondary font-bold tracking-widest text-sm md:text-base uppercase mb-4">
            SAI FLOWERS AND DECORATORS
          </motion.p>
          
          <motion.h1 variants={itemVariants} className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
            {t('hero.heading')}
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            {t('hero.subheading')}
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="w-full sm:w-auto bg-secondary text-primary-foreground hover:bg-secondary/90 font-semibold rounded-full px-8 py-6 text-lg"
              onClick={() => scrollToSection('gallery')}
            >
              {t('hero.viewGallery')}
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              className="w-full sm:w-auto bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary font-semibold rounded-full px-8 py-6 text-lg"
              onClick={() => scrollToSection('enquiry')}
            >
              {t('hero.bookNow')}
            </Button>

            <Button 
              size="lg" 
              className="w-full sm:w-auto bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold rounded-full px-8 py-6 text-lg border-none"
              onClick={() => window.open('https://wa.me/919960629513', '_blank')}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              {t('hero.whatsappUs')}
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 cursor-pointer"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        onClick={() => scrollToSection('about')}
      >
        <div className="w-10 h-16 border-2 border-white/50 rounded-full flex justify-center p-2">
          <ArrowDown className="text-white w-4 h-4" />
        </div>
      </motion.div>
    </section>
  );
}
