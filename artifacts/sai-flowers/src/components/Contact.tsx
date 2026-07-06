import { useLanguage } from '@/lib/i18n';
import { Phone, MessageCircle, Mail, Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export function Contact() {
  const { t } = useLanguage();

  return (
    <section id="contact" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-12 bg-secondary" />
            <h4 className="text-secondary font-bold uppercase tracking-wider">{t('nav.contact')}</h4>
            <div className="h-px w-12 bg-secondary" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground">
            {t('contact.heading')}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          <div className="space-y-6">
            <motion.a 
              href="tel:+919960629513"
              whileHover={{ scale: 1.02 }}
              className="flex items-center p-6 bg-muted/30 rounded-2xl border border-border hover:border-primary transition-colors cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-6 group-hover:bg-primary group-hover:text-white transition-colors">
                <Phone className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-sm text-muted-foreground font-medium mb-1">{t('contact.phone')}</h4>
                <p className="text-2xl font-bold text-foreground">+91 99606 29513</p>
              </div>
            </motion.a>

            <motion.a 
              href="https://wa.me/919960629513"
              target="_blank"
              rel="noreferrer"
              whileHover={{ scale: 1.02 }}
              className="flex items-center p-6 bg-[#25D366]/5 rounded-2xl border border-[#25D366]/20 hover:border-[#25D366] transition-colors cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full bg-[#25D366]/20 text-[#25D366] flex items-center justify-center mr-6 group-hover:bg-[#25D366] group-hover:text-white transition-colors">
                <MessageCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-sm text-muted-foreground font-medium mb-1">{t('contact.whatsapp')}</h4>
                <p className="text-2xl font-bold text-foreground">+91 99606 29513</p>
              </div>
            </motion.a>

            <div className="flex items-center p-6 bg-muted/30 rounded-2xl border border-border">
              <div className="w-16 h-16 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mr-6">
                <Clock className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-sm text-muted-foreground font-medium mb-1">{t('contact.hours')}</h4>
                <p className="text-xl font-bold text-foreground">Mon-Sun: 8:00 AM - 9:00 PM</p>
              </div>
            </div>
          </div>

          {/* Map Embed */}
          <div className="h-[400px] rounded-3xl overflow-hidden shadow-lg border border-border relative group">
            <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-md flex items-center text-sm font-bold text-primary">
              <MapPin className="w-4 h-4 mr-2" /> Pune, Maharashtra
            </div>
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d121059.04360434!2d73.78056543940428!3d18.524603553258597!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2bf2e67461101%3A0x828d43bf9d9ee343!2sPune%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={false} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

        </div>
      </div>
    </section>
  );
}
