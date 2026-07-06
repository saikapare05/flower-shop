import { useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';

export function SEOHead() {
  const { t } = useLanguage();

  useEffect(() => {
    document.title = "SAI FLOWERS AND DECORATORS - Premium Flower & Event Decoration | Pune";
    
    // Add meta tags dynamically
    const metaTags = [
      { name: 'description', content: "SAI FLOWERS AND DECORATORS specializes in premium flower decorations for weddings, birthdays, funerals, and all occasions in Pune, Maharashtra. Book now!" },
      { name: 'keywords', content: "wedding decoration, flower decoration, mandap decoration, Pune, Maharashtra, event decoration, haldi decoration, stage decoration" },
      { property: 'og:title', content: "SAI FLOWERS AND DECORATORS - Premium Flower & Event Decoration" },
      { property: 'og:description', content: "Specializing in premium flower decorations for weddings, birthdays, funerals, and all occasions in Pune, Maharashtra." },
      { property: 'og:type', content: "website" },
      { property: 'og:url', content: "https://sai-flowers.in" },
      { name: 'twitter:card', content: "summary_large_image" },
      { name: 'twitter:title', content: "SAI FLOWERS AND DECORATORS - Premium Decoration" },
      { name: 'twitter:description', content: "Premium flower decorations for weddings, birthdays, funerals, and all occasions in Pune." }
    ];

    metaTags.forEach(tagInfo => {
      const key = tagInfo.name ? `name="${tagInfo.name}"` : `property="${tagInfo.property}"`;
      let meta = document.querySelector(`meta[${key}]`);
      if (!meta) {
        meta = document.createElement('meta');
        if (tagInfo.name) meta.setAttribute('name', tagInfo.name);
        if (tagInfo.property) meta.setAttribute('property', tagInfo.property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', tagInfo.content);
    });

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "SAI FLOWERS AND DECORATORS",
      "image": "https://sai-flowers.in/logo.png",
      "telephone": "+919960629513",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Pune",
        "addressRegion": "Maharashtra",
        "addressCountry": "IN"
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
        ],
        "opens": "08:00",
        "closes": "21:00"
      },
      "sameAs": [
        "https://instagram.com",
        "https://facebook.com"
      ]
    };

    let script = document.querySelector('script[type="application/ld+json"]');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);

  }, [t]);

  return null;
}
