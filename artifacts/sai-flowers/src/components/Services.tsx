import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { ServiceModal } from '@/components/ServiceModal';
import { 
  Flower2, Heart, Gift, Sparkles, Star, Home, Building2, Car, Church, PartyPopper, Cake
} from 'lucide-react';

import bgWedding from '@assets/generated_images/service-wedding.jpg';
import bgHaldi from '@assets/generated_images/service-haldi.jpg';
import bgBirthday from '@assets/generated_images/service-birthday.jpg';
import bgTemple from '@assets/generated_images/service-temple.jpg';
import bgFuneral from '@assets/generated_images/service-funeral.jpg';
import bgCar from '@assets/generated_images/service-car.jpg';
import bgBouquet from '@assets/generated_images/service-bouquet.jpg';
import bgMehendi from '@assets/generated_images/service-mehendi.jpg';

export function Services() {
  const { t } = useLanguage();
  const [activeService, setActiveService] = useState<{ id: string; img: string } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const servicesMap = [
    { id: 'flower',       icon: Flower2,      img: bgWedding  },
    { id: 'marriage',     icon: Heart,        img: bgWedding  },
    { id: 'wedding',      icon: Star,         img: bgWedding  },
    { id: 'mandap',       icon: Church,       img: bgWedding  },
    { id: 'haldi',        icon: Sparkles,     img: bgHaldi    },
    { id: 'mehendi',      icon: PartyPopper,  img: bgMehendi  },
    { id: 'engagement',   icon: Heart,        img: bgWedding  },
    { id: 'reception',    icon: Star,         img: bgWedding  },
    { id: 'birthday',     icon: Cake,         img: bgBirthday },
    { id: 'baby_shower',  icon: Gift,         img: bgBirthday },
    { id: 'anniversary',  icon: Heart,        img: bgWedding  },
    { id: 'naming',       icon: Flower2,      img: bgHaldi    },
    { id: 'housewarming', icon: Home,         img: bgHaldi    },
    { id: 'corporate',    icon: Building2,    img: bgWedding  },
    { id: 'stage',        icon: Sparkles,     img: bgWedding  },
    { id: 'car',          icon: Car,          img: bgCar      },
    { id: 'temple',       icon: Church,       img: bgTemple   },
    { id: 'home',         icon: Home,         img: bgHaldi    },
    { id: 'room',         icon: Heart,        img: bgWedding  },
    { id: 'welcome',      icon: Star,         img: bgWedding  },
    { id: 'bouquet',      icon: Flower2,      img: bgBouquet  },
    { id: 'balloon',      icon: PartyPopper,  img: bgBirthday },
    { id: 'torans',       icon: Home,         img: bgHaldi    },
    { id: 'funeral',      icon: Flower2,      img: bgFuneral  },
  ];

  const openService = (id: string, img: string, btn: HTMLButtonElement) => {
    triggerRef.current = btn;
    setActiveService({ id, img });
  };

  return (
    <>
      <section id="services" className="py-24 bg-white relative">
        <div className="container mx-auto px-4">

          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px w-12 bg-secondary" />
              <h4 className="text-secondary font-bold uppercase tracking-wider">{t('nav.services')}</h4>
              <div className="h-px w-12 bg-secondary" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground">
              {t('services.heading')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {servicesMap.map((service, idx) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                  className="group relative h-80 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl focus-within:shadow-2xl transition-all duration-300"
                >
                  {/* Background Image */}
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 group-focus-within:scale-110"
                    style={{ backgroundImage: `url(${service.img})` }}
                  />

                  {/* Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 group-hover:opacity-70 group-focus-within:opacity-70" />
                  <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 mix-blend-multiply" />

                  {/* Content */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 text-white group-hover:bg-secondary group-focus-within:bg-secondary group-hover:text-primary group-focus-within:text-primary transition-colors duration-300">
                      <Icon className="w-6 h-6" aria-hidden="true" />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 group-hover:-translate-y-2 group-focus-within:-translate-y-2 transition-transform duration-300">
                      {t(`services.items.${service.id}.name`)}
                    </h3>

                    <p className="text-white/80 text-sm mb-4 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 translate-y-4 group-hover:-translate-y-2 group-focus-within:-translate-y-2 transition-all duration-300 line-clamp-2">
                      {t(`services.items.${service.id}.description`)}
                    </p>

                    <Button
                      variant="outline"
                      className="w-full bg-transparent border-white text-white hover:bg-white hover:text-primary focus-visible:bg-white focus-visible:text-primary opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 translate-y-4 group-hover:-translate-y-2 group-focus-within:-translate-y-2 transition-all duration-300"
                      onClick={(e) => openService(service.id, service.img, e.currentTarget)}
                    >
                      {t('services.learnMore')}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <ServiceModal
        serviceId={activeService?.id ?? null}
        serviceImg={activeService?.img ?? ''}
        triggerRef={triggerRef}
        onClose={() => setActiveService(null)}
      />
    </>
  );
}
