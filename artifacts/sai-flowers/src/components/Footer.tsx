import { useLanguage } from '@/lib/i18n';
import { Flower2, Facebook, Instagram, Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  const { t } = useLanguage();

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#1E5631] text-white pt-20 pb-8">
      <div className="container mx-auto px-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand */}
          <div className="space-y-6">
            <div 
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => scrollToSection('home')}
            >
              <Flower2 className="w-10 h-10 text-secondary transition-transform group-hover:rotate-45 duration-500" />
              <div className="flex flex-col">
                <span className="text-2xl font-bold leading-none text-secondary">
                  SAI FLOWERS
                </span>
                <span className="text-sm font-semibold tracking-wider leading-tight text-white">
                  AND DECORATORS
                </span>
              </div>
            </div>
            <p className="text-white/70 leading-relaxed">
              {t('footer.about')}
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-secondary hover:text-[#1E5631] transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-secondary hover:text-[#1E5631] transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xl font-bold text-secondary mb-6">{t('footer.quickLinks')}</h4>
            <ul className="space-y-3">
              {['home', 'about', 'services', 'gallery', 'contact'].map(link => (
                <li key={link}>
                  <button 
                    onClick={() => scrollToSection(link)}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    {t(`nav.${link}`)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Top Services */}
          <div>
            <h4 className="text-xl font-bold text-secondary mb-6">{t('footer.services')}</h4>
            <ul className="space-y-3">
              {['wedding', 'haldi', 'birthday', 'temple', 'funeral'].map(cat => (
                <li key={cat}>
                  <span className="text-white/70">
                    {t(`services.items.${cat}.name`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-xl font-bold text-secondary mb-6">{t('footer.contact')}</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-white/70">
                <Phone className="w-5 h-5 mt-1 shrink-0 text-secondary" />
                <span>+91 99606 29513</span>
              </li>
              <li className="flex items-start gap-3 text-white/70">
                <Mail className="w-5 h-5 mt-1 shrink-0 text-secondary" />
                <span>info@saiflowers.in</span>
              </li>
              <li className="flex items-start gap-3 text-white/70">
                <MapPin className="w-5 h-5 mt-1 shrink-0 text-secondary" />
                <span>Pune, Maharashtra, India</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-white/50 text-sm">
          <p>{t('footer.copyright')}</p>
          <p>Made with ❤️ for beautiful celebrations</p>
        </div>

      </div>
    </footer>
  );
}
