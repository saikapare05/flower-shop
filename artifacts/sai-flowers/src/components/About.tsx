import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Calendar, HeartHandshake, ShieldCheck, Clock } from 'lucide-react';
import aboutImg from '@assets/generated_images/about.jpg';

export function About() {
  const { t } = useLanguage();

  const stats = [
    { icon: <Calendar className="w-6 h-6" />, label: t('about.stats.events') },
    { icon: <Clock className="w-6 h-6" />, label: t('about.stats.experience') },
    { icon: <HeartHandshake className="w-6 h-6" />, label: t('about.stats.clients') },
    { icon: <ShieldCheck className="w-6 h-6" />, label: t('about.stats.support') },
  ];

  return (
    <section id="about" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Image Side */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-1/2 relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/5]">
              <img 
                src={aboutImg} 
                alt="About Sai Flowers and Decorators" 
                className="object-cover w-full h-full"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
            
            {/* Floating Badge */}
            <motion.div 
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, type: "spring" }}
              className="absolute -bottom-8 -right-8 md:-bottom-10 md:-right-10 bg-white p-6 rounded-2xl shadow-xl max-w-[200px] border-l-4 border-secondary"
            >
              <h3 className="text-4xl font-bold text-primary mb-1">10+</h3>
              <p className="text-sm text-muted-foreground font-medium">Years of Excellence in Decoration</p>
            </motion.div>
          </motion.div>

          {/* Text Side */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-1/2"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px w-12 bg-secondary" />
              <h4 className="text-secondary font-bold uppercase tracking-wider">{t('nav.about')}</h4>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              {t('about.heading')}
            </h2>
            
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              {t('about.content1')}
            </p>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              {t('about.content2')}
            </p>

            <div className="grid grid-cols-2 gap-6 mb-10">
              {stats.map((stat, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-white shadow-sm border border-border/50">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {stat.icon}
                  </div>
                  <span className="font-bold text-foreground">{stat.label}</span>
                </div>
              ))}
            </div>

            <Button 
              size="lg" 
              className="bg-primary text-white hover:bg-primary/90 rounded-full px-8"
              onClick={() => document.getElementById('enquiry')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('hero.bookNow')}
            </Button>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
