import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/i18n';
import {
  X, ChevronLeft, ChevronRight, Image as ImageIcon,
  Download, Share2, Copy, Check, Loader2,
  ExternalLink, MessageCircle, Mail, Facebook
} from 'lucide-react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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

interface GalleryImage {
  id: string;
  url: string;
  title?: string;
  description?: string;
  category: string;
  featured?: boolean;
  order?: number;
}

// Lazy image with error fallback
function LazyImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <div className="relative w-full h-full">
      {!loaded && !errored && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      {errored ? (
        <div className="absolute inset-0 bg-muted flex flex-col items-center justify-center gap-2">
          <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
          <span className="text-xs text-muted-foreground">Image unavailable</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => { setErrored(true); setLoaded(true); }}
        />
      )}
    </div>
  );
}

// Share dialog component
function ShareDialog({
  open, onClose, imageUrl, imageTitle
}: {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  imageTitle: string;
}) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(imageUrl);
  const encodedText = encodeURIComponent(`Check out this beautiful decoration from SAI FLOWERS AND DECORATORS! 🌸`);

  const shareOptions = [
    {
      label: 'WhatsApp',
      icon: <MessageCircle className="w-5 h-5" />,
      color: 'bg-green-500 hover:bg-green-600',
      href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    },
    {
      label: 'Facebook',
      icon: <Facebook className="w-5 h-5" />,
      color: 'bg-blue-600 hover:bg-blue-700',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: 'Telegram',
      icon: <ExternalLink className="w-5 h-5" />,
      color: 'bg-sky-500 hover:bg-sky-600',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    },
    {
      label: 'Email',
      icon: <Mail className="w-5 h-5" />,
      color: 'bg-gray-600 hover:bg-gray-700',
      href: `mailto:?subject=${encodeURIComponent(imageTitle || 'SAI FLOWERS AND DECORATORS')}&body=${encodedText}%20${encodedUrl}`,
    },
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(imageUrl);
      setCopied(true);
      toast.success('Image link copied successfully.');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Could not copy link. Please copy manually.');
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-sm p-6 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-gray-900">Share Image</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {shareOptions.map((opt) => (
              <a
                key={opt.label}
                href={opt.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 text-white ${opt.color} px-4 py-3 rounded-xl text-sm font-medium transition-colors`}
              >
                {opt.icon}
                {opt.label}
              </a>
            ))}
          </div>

          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-gray-300 text-gray-700 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
          >
            {copied ? (
              <><Check className="w-4 h-4 text-green-600" /><span className="text-green-600">Link Copied!</span></>
            ) : (
              <><Copy className="w-4 h-4" />Copy Image Link</>
            )}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function Gallery() {
  const { t } = useLanguage();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Swipe tracking
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  useEffect(() => {
    async function fetchImages() {
      try {
        // Try fetching ordered by `order` first; fall back to `createdAt` if index missing
        let fetched: GalleryImage[] = [];
        try {
          const q = query(collection(db, 'gallery'), orderBy('order', 'asc'));
          const snap = await getDocs(q);
          fetched = snap.docs.map(d => ({ id: d.id, ...d.data() } as GalleryImage));
        } catch {
          const q2 = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
          const snap2 = await getDocs(q2);
          fetched = snap2.docs.map(d => ({ id: d.id, ...d.data() } as GalleryImage));
        }
        setImages(fetched.length > 0 ? fetched : mockImages);
      } catch {
        setImages(mockImages);
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

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setShareOpen(false);
    document.body.style.overflow = 'auto';
  }, []);

  const nextImage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % filteredImages.length);
    setShareOpen(false);
  }, [filteredImages.length]);

  const prevImage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
    setShareOpen(false);
  }, [filteredImages.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, closeLightbox, nextImage, prevImage]);

  // Touch / swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = touchStartX.current - e.changedTouches[0].clientX;
    const deltaY = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
    if (Math.abs(deltaX) > 50 && deltaY < 100) {
      if (deltaX > 0) nextImage();
      else prevImage();
    }
  };

  // Download handler
  const handleDownload = async () => {
    const img = filteredImages[currentIndex];
    setIsDownloading(true);
    try {
      const response = await fetch(img.url);
      if (!response.ok) throw new Error('Fetch failed');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      // Build a clean filename
      const rawName = img.title || `sai-flowers-${currentIndex + 1}`;
      const ext = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
      const safeName = rawName.replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
      a.download = safeName.match(/\.(jpg|jpeg|png|webp)$/i) ? safeName : `${safeName}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Share handler
  const handleShare = async () => {
    const img = filteredImages[currentIndex];
    if (navigator.share) {
      try {
        await navigator.share({
          title: img.title || 'SAI FLOWERS AND DECORATORS',
          text: 'Check out this beautiful decoration from SAI FLOWERS AND DECORATORS! 🌸',
          url: img.url,
        });
      } catch {
        // User dismissed — do nothing
      }
    } else {
      setShareOpen(true);
    }
  };

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

          {/* Filters — all 24 categories with horizontal scroll */}
          <div className="flex items-center gap-2 max-w-5xl mx-auto overflow-x-auto pb-4 custom-scrollbar snap-x">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              className={`rounded-full shrink-0 snap-start ${selectedCategory === 'all' ? 'bg-primary text-white' : 'bg-white text-muted-foreground'}`}
              onClick={() => setSelectedCategory('all')}
            >
              {t('gallery.all')}
            </Button>
            {categoriesList.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                className={`rounded-full whitespace-nowrap shrink-0 snap-start ${selectedCategory === cat ? 'bg-primary text-white' : 'bg-white text-muted-foreground'}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {t(`services.items.${cat}.name`)}
              </Button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={`break-inside-avoid rounded-xl bg-muted animate-pulse ${i % 3 === 0 ? 'h-80' : i % 2 === 0 ? 'h-56' : 'h-64'}`} />
            ))}
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center justify-center">
            <ImageIcon className="w-16 h-16 text-muted mb-4" />
            <h3 className="text-xl font-medium text-muted-foreground">No images found for this category</h3>
            <p className="text-sm text-muted-foreground mt-2">Try selecting a different filter above.</p>
          </div>
        ) : (
          <motion.div layout className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
            <AnimatePresence>
              {filteredImages.map((img, idx) => (
                <motion.div
                  key={img.id}
                  layout
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.3 }}
                  className="break-inside-avoid relative group rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl"
                  onClick={() => openLightbox(idx)}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <LazyImage
                    src={img.url}
                    alt={img.title || 'Gallery image'}
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    {img.title && (
                      <span className="text-white font-medium text-sm truncate">{img.title}</span>
                    )}
                    <span className="text-white/70 text-xs mt-0.5 capitalize">{img.category}</span>
                  </div>
                  {img.featured && (
                    <div className="absolute top-3 left-3 bg-secondary text-white text-xs px-2 py-1 rounded-full font-medium shadow">
                      ★ Featured
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

      </div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxOpen && filteredImages[currentIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center select-none"
            onClick={closeLightbox}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-4 bg-gradient-to-b from-black/50 to-transparent z-10">
              <span className="text-white/70 font-medium tracking-widest text-sm">
                {currentIndex + 1} / {filteredImages.length}
              </span>

              {/* Action buttons */}
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {/* Download */}
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  title="Download image"
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors backdrop-blur-sm disabled:opacity-50"
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{isDownloading ? 'Downloading…' : 'Download'}</span>
                </button>

                {/* Share */}
                <button
                  onClick={handleShare}
                  title="Share image"
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors backdrop-blur-sm"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                </button>

                {/* Close */}
                <button
                  onClick={closeLightbox}
                  title="Close"
                  className="bg-white/10 hover:bg-white/20 text-white rounded-lg p-2 transition-colors backdrop-blur-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Prev */}
            <button
              className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white bg-black/30 hover:bg-black/60 p-3 rounded-full transition-all z-10"
              onClick={prevImage}
            >
              <ChevronLeft className="w-7 h-7" />
            </button>

            {/* Image */}
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="w-full max-w-5xl max-h-[80vh] flex items-center justify-center p-4 pt-16 pb-16"
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => e.preventDefault()}
            >
              <img
                src={filteredImages[currentIndex].url}
                alt={filteredImages[currentIndex].title || 'Gallery image'}
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                draggable={false}
              />
            </motion.div>

            {/* Next */}
            <button
              className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white bg-black/30 hover:bg-black/60 p-3 rounded-full transition-all z-10"
              onClick={nextImage}
            >
              <ChevronRight className="w-7 h-7" />
            </button>

            {/* Bottom title bar */}
            {(filteredImages[currentIndex].title || filteredImages[currentIndex].description) && (
              <div
                className="absolute bottom-0 left-0 right-0 px-6 py-5 bg-gradient-to-t from-black/70 to-transparent"
                onClick={(e) => e.stopPropagation()}
              >
                {filteredImages[currentIndex].title && (
                  <p className="text-white font-semibold text-base">{filteredImages[currentIndex].title}</p>
                )}
                {filteredImages[currentIndex].description && (
                  <p className="text-white/70 text-sm mt-1">{filteredImages[currentIndex].description}</p>
                )}
              </div>
            )}

            {/* Swipe hint on mobile (first open only) */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/30 text-xs pointer-events-none sm:hidden">
              ← Swipe to navigate →
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Dialog */}
      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        imageUrl={lightboxOpen && filteredImages[currentIndex] ? filteredImages[currentIndex].url : ''}
        imageTitle={lightboxOpen && filteredImages[currentIndex] ? (filteredImages[currentIndex].title || 'SAI FLOWERS') : 'SAI FLOWERS'}
      />
    </section>
  );
}
