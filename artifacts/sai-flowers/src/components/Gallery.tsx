import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/i18n';
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';

// Mock data as fallback if firebase is empty
const mockImages = [
  { id: '1', category: 'wedding', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop', title: 'Wedding Stage' },
  { id: '2', category: 'haldi', url: 'https://images.unsplash.com/photo-1583939000340-690624471565?q=80&w=800&auto=format&fit=crop', title: 'Haldi Decor' },
  { id: '3', category: 'birthday', url: 'https://images.unsplash.com/photo-1530103862676-de8892ebe6d9?q=80&w=800&auto=format&fit=crop', title: 'Birthday Balloons' },
  { id: '4', category: 'wedding', url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=800&auto=format&fit=crop', title: 'Mandap' },
  { id: '5', category: 'temple', url: 'https://images.unsplash.com/photo-1512401867160-b9623e5cc2ed?q=80&w=800&auto=format&fit=crop', title: 'Temple Decor' },
  { id: '6', category: 'bouquet', url: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?q=80&w=800&auto=format&fit=crop', title: 'Bridal Bouquet' },
];

const categoriesList = [
  'flower', 'marriage', 'wedding', 'mandap', 'haldi', 'mehendi', 'engagement', 'reception', 
  'birthday', 'baby_shower', 'anniversary', 'naming', 'housewarming', 'corporate', 'stage', 
  'car', 'temple', 'home', 'room', 'welcome', 'bouquet', 'balloon', 'torans', 'funeral'
];

export function Gallery() {
  const { t } = useLanguage();
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function fetchImages() {
      try {
        const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (fetched.length > 0) {
          setImages(fetched);
        } else {
          setImages(mockImages);
        }
      } catch (error) {
        console.error("Error fetching gallery:", error);
        setImages(mockImages); // Fallback
      } finally {
        setLoading(false);
      }
    }
    fetchImages();
  }, []);

  const filteredImages = selectedCategory === 'all' 
    ? images 
    : images.filter(img => img.category === selectedCategory);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = 'auto';
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % filteredImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') setCurrentIndex((prev) => (prev + 1) % filteredImages.length);
      if (e.key === 'ArrowLeft') setCurrentIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, filteredImages.length]);

  return (
    <section id="gallery" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-12 bg-secondary" />
            <h4 className="text-secondary font-bold uppercase tracking-wider">{t('nav.gallery')}</h4>
            <div className="h-px w-12 bg-secondary" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-8">
            {t('gallery.heading')}
          </h2>

          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto overflow-x-auto pb-4 custom-scrollbar">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              className={`rounded-full ${selectedCategory === 'all' ? 'bg-primary text-white' : 'bg-white text-muted-foreground'}`}
              onClick={() => setSelectedCategory('all')}
            >
              {t('gallery.all')}
            </Button>
            {categoriesList.slice(0, 8).map(cat => ( // Showing only top 8 for space, ideally a scrollable row
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                className={`rounded-full whitespace-nowrap ${selectedCategory === cat ? 'bg-primary text-white' : 'bg-white text-muted-foreground'}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {t(`services.items.${cat}.name`)}
              </Button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center justify-center">
            <ImageIcon className="w-16 h-16 text-muted mb-4" />
            <h3 className="text-xl font-medium text-muted-foreground">No images found for this category</h3>
          </div>
        ) : (
          <motion.div layout className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
            <AnimatePresence>
              {filteredImages.map((img, idx) => (
                <motion.div
                  key={img.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className="break-inside-avoid relative group rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl"
                  onClick={() => openLightbox(idx)}
                  onContextMenu={(e) => e.preventDefault()} // Right-click disabled
                >
                  <img
                    src={img.url}
                    alt={img.title || "Gallery image"}
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="text-white font-medium border border-white/50 px-4 py-2 rounded-full backdrop-blur-sm">View</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <button 
              className="absolute top-6 right-6 text-white/70 hover:text-white p-2"
              onClick={closeLightbox}
            >
              <X className="w-8 h-8" />
            </button>
            
            <div className="absolute top-6 left-6 text-white/70 font-medium tracking-widest">
              {currentIndex + 1} / {filteredImages.length}
            </div>

            <button 
              className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-4"
              onClick={prevImage}
            >
              <ChevronLeft className="w-10 h-10" />
            </button>

            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="w-full max-w-5xl max-h-[80vh] flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => e.preventDefault()}
            >
              <img 
                src={filteredImages[currentIndex].url} 
                alt="Enlarged gallery view" 
                className="max-w-full max-h-[80vh] object-contain shadow-2xl"
              />
            </motion.div>

            <button 
              className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-4"
              onClick={nextImage}
            >
              <ChevronRight className="w-10 h-10" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
