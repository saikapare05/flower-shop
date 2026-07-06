import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/i18n';
import { Menu, X, Flower2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const { lang, setLang, t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'home', label: t('nav.home') },
    { id: 'about', label: t('nav.about') },
    { id: 'services', label: t('nav.services') },
    { id: 'gallery', label: t('nav.gallery') },
    { id: 'testimonials', label: t('nav.testimonials') },
    { id: 'faq', label: t('nav.faq') },
    { id: 'contact', label: t('nav.contact') },
  ];

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-300 ${
        isScrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        {/* Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => scrollToSection('home')}
        >
          <Flower2 className={`w-8 h-8 ${isScrolled ? 'text-primary' : 'text-secondary'} transition-transform group-hover:rotate-45 duration-500`} />
          <div className="flex flex-col">
            <span className={`text-xl font-bold leading-none ${isScrolled ? 'text-secondary' : 'text-secondary'}`}>
              SAI FLOWERS
            </span>
            <span className={`text-xs font-semibold tracking-wider leading-tight ${isScrolled ? 'text-primary' : 'text-white'}`}>
              AND DECORATORS
            </span>
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          <ul className="flex items-center gap-6">
            {navLinks.map((link) => (
              <li key={link.id}>
                <button
                  onClick={() => scrollToSection(link.id)}
                  className={`text-sm font-medium transition-colors hover:text-secondary ${
                    isScrolled ? 'text-foreground' : 'text-white'
                  }`}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setLang(lang === 'en' ? 'mr' : 'en')}
              className={`text-sm font-medium px-2 py-1 rounded transition-colors ${
                isScrolled ? 'bg-muted text-foreground' : 'bg-black/20 text-white backdrop-blur-md'
              }`}
            >
              {lang === 'en' ? 'EN | मर' : 'मराठी | EN'}
            </button>
            <Button 
              className="bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full font-semibold px-6"
              onClick={() => window.open('https://wa.me/919960629513', '_blank')}
            >
              {t('nav.enquiry')}
            </Button>
          </div>
        </div>

        {/* Mobile Toggle */}
        <div className="flex lg:hidden items-center gap-4">
          <button
            onClick={() => setLang(lang === 'en' ? 'mr' : 'en')}
            className={`text-xs font-medium px-2 py-1 rounded ${
              isScrolled ? 'bg-muted text-foreground' : 'bg-black/20 text-white backdrop-blur-md'
            }`}
          >
            {lang === 'en' ? 'EN' : 'मर'}
          </button>
          <button 
            className={isScrolled ? 'text-foreground' : 'text-white'}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden bg-white shadow-xl overflow-hidden"
          >
            <div className="flex flex-col p-4 gap-4">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className="text-left text-lg font-medium text-foreground py-2 border-b border-border"
                >
                  {link.label}
                </button>
              ))}
              <Button 
                className="bg-[#25D366] hover:bg-[#128C7E] text-white w-full mt-2"
                onClick={() => window.open('https://wa.me/919960629513', '_blank')}
              >
                {t('nav.enquiry')} (WhatsApp)
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
