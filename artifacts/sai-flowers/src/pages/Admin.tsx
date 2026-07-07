import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  LogOut, Image as ImageIcon, MessageSquare, HelpCircle, Upload,
  Trash2, Loader2, CheckCircle2, AlertCircle, Pencil, Star,
  RefreshCw, ChevronUp, ChevronDown, X, Plus, FileImage
} from 'lucide-react';
import {
  isLoggedIn, clearToken, fetchGallery, saveImageMetadata,
  deleteImage, reorderImages, type GalleryImage
} from '@/lib/api';
import { uploadToCloudinary } from '@/lib/cloudinary';

const categoriesList = [
  'flower', 'marriage', 'wedding', 'mandap', 'haldi', 'mehendi', 'engagement', 'reception',
  'birthday', 'baby_shower', 'anniversary', 'naming', 'housewarming', 'corporate', 'stage',
  'car', 'temple', 'home', 'room', 'welcome', 'bouquet', 'balloon', 'torans', 'funeral'
];

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_MB = 10;
const MAX_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface UploadItem {
  localId: string;
  file: File;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  preview: string;
}

interface EditState {
  id: string;         // publicId
  title: string;
  description: string;
  category: string;
  featured: boolean;
}

function validateFile(f: File): string | null {
  if (!ALLOWED_TYPES.includes(f.type))
    return `"${f.name}" — unsupported format. Use JPG, PNG, or WEBP.`;
  if (f.size > MAX_BYTES)
    return `"${f.name}" — exceeds ${MAX_FILE_SIZE_MB}MB (${(f.size / 1024 / 1024).toFixed(1)}MB).`;
  return null;
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('gallery');

  // Gallery state
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  // Multi-upload queue
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [isUploadingAll, setIsUploadingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit state
  const [editState, setEditState] = useState<EditState | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Replace
  const [replacingImg, setReplacingImg] = useState<GalleryImage | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Auth check — token-based (no Firebase)
  useEffect(() => {
    if (!isLoggedIn()) {
      setLocation('/admin/login');
      return;
    }
    setLoading(false);
    loadGallery();
  }, [setLocation]);

  const loadGallery = async () => {
    setGalleryLoading(true);
    try {
      const imgs = await fetchGallery();
      setImages(imgs);
    } catch (e: any) {
      console.error('[Admin] fetchGallery error:', e.message);
      toast.error('Failed to load gallery: ' + e.message);
    } finally {
      setGalleryLoading(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    setLocation('/admin/login');
  };

  // ── File selection ──
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newItems: UploadItem[] = [];
    files.forEach(f => {
      const err = validateFile(f);
      if (err) { toast.error(err); return; }
      newItems.push({
        localId: Math.random().toString(36).slice(2),
        file: f,
        title: f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
        description: '',
        category: categoriesList[0],
        status: 'pending',
        progress: 0,
        preview: URL.createObjectURL(f),
      });
    });
    setUploadQueue(prev => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFromQueue = (localId: string) => {
    setUploadQueue(prev => {
      const item = prev.find(i => i.localId === localId);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter(i => i.localId !== localId);
    });
  };

  const updateQueueItem = (localId: string, patch: Partial<UploadItem>) => {
    setUploadQueue(prev => prev.map(i => i.localId === localId ? { ...i, ...patch } : i));
  };

  // ── Upload All ──
  const handleUploadAll = async () => {
    const pending = uploadQueue.filter(i => i.status === 'pending');
    if (pending.length === 0) { toast.error('No files ready to upload.'); return; }
    setIsUploadingAll(true);

    const maxOrder = images.length > 0 ? Math.max(...images.map(i => i.order)) : -1;

    for (let idx = 0; idx < pending.length; idx++) {
      const item = pending[idx];
      updateQueueItem(item.localId, { status: 'uploading', progress: 0 });

      try {
        // 1. Upload file directly to Cloudinary
        const { publicId, secureUrl } = await uploadToCloudinary(
          item.file,
          (pct) => updateQueueItem(item.localId, { progress: pct })
        );
        console.info('[Admin] Cloudinary upload OK:', publicId, secureUrl);

        // 2. Save metadata to Cloudinary via backend
        await saveImageMetadata({
          publicId,
          title: item.title,
          description: item.description,
          category: item.category,
          order: maxOrder + idx + 1,
          featured: false,
        });
        console.info('[Admin] Metadata saved for:', publicId);

        updateQueueItem(item.localId, { status: 'success', progress: 100 });
        toast.success(`"${item.title}" uploaded!`);
      } catch (err: any) {
        console.error('[Admin] Upload failed:', err.message);
        updateQueueItem(item.localId, { status: 'error', error: err.message });
        toast.error(`"${item.title}": ${err.message}`);
      }
    }

    setIsUploadingAll(false);
    await loadGallery();
    setTimeout(() => setUploadQueue(prev => prev.filter(i => i.status !== 'success')), 3000);
  };

  // ── Delete ──
  const handleDelete = async (img: GalleryImage) => {
    if (!confirm(`Delete "${img.title || 'this image'}"?`)) return;
    try {
      await deleteImage(img.publicId);
      toast.success('Image deleted.');
      setImages(prev => prev.filter(i => i.id !== img.id));
    } catch (e: any) {
      console.error('[Admin] delete error:', e.message);
      toast.error('Delete failed: ' + e.message);
    }
  };

  // ── Edit ──
  const openEdit = (img: GalleryImage) => {
    setEditState({ id: img.publicId, title: img.title, description: img.description, category: img.category, featured: img.featured });
  };

  const saveEdit = async () => {
    if (!editState) return;
    setIsSavingEdit(true);
    const img = images.find(i => i.publicId === editState.id);
    try {
      await saveImageMetadata({
        publicId: editState.id,
        title: editState.title,
        description: editState.description,
        category: editState.category,
        order: img?.order ?? 0,
        featured: editState.featured,
      });
      setImages(prev => prev.map(i =>
        i.publicId === editState.id
          ? { ...i, title: editState.title, description: editState.description, category: editState.category, featured: editState.featured }
          : i
      ));
      toast.success('Image updated.');
      setEditState(null);
    } catch (e: any) {
      console.error('[Admin] edit save error:', e.message);
      toast.error('Save failed: ' + e.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ── Featured toggle ──
  const toggleFeatured = async (img: GalleryImage) => {
    const next = !img.featured;
    try {
      await saveImageMetadata({ publicId: img.publicId, title: img.title, description: img.description, category: img.category, order: img.order, featured: next });
      setImages(prev => prev.map(i => i.id === img.id ? { ...i, featured: next } : i));
      toast.success(next ? 'Marked as featured.' : 'Removed from featured.');
    } catch (e: any) {
      console.error('[Admin] featured toggle error:', e.message);
      toast.error('Update failed: ' + e.message);
    }
  };

  // ── Reorder ──
  const reorder = async (idx: number, direction: 'up' | 'down') => {
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= images.length) return;

    const newImages = [...images];
    const aOrder = newImages[idx].order;
    const bOrder = newImages[swapIdx].order;

    newImages[idx] = { ...newImages[idx], order: bOrder };
    newImages[swapIdx] = { ...newImages[swapIdx], order: aOrder };
    newImages.sort((a, b) => a.order - b.order);
    setImages(newImages);

    try {
      await reorderImages([
        { publicId: newImages[idx].publicId, order: newImages[idx].order },
        { publicId: newImages[swapIdx].publicId, order: newImages[swapIdx].order },
      ]);
    } catch (e: any) {
      console.error('[Admin] reorder error:', e.message);
      toast.error('Reorder failed: ' + e.message);
      await loadGallery(); // revert
    }
  };

  // ── Replace image ──
  const handleReplaceSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingImg) return;
    const err = validateFile(file);
    if (err) { toast.error(err); return; }

    toast.info('Replacing image…');
    const oldImg = replacingImg;
    setReplacingImg(null);
    if (replaceInputRef.current) replaceInputRef.current.value = '';

    try {
      // 1. Upload new file to Cloudinary
      const { publicId: newPublicId, secureUrl: newUrl } = await uploadToCloudinary(file);
      console.info('[Admin] Replace upload OK:', newPublicId);

      // 2. Save metadata for the new image using the same meta as the old one
      await saveImageMetadata({
        publicId: newPublicId,
        title: oldImg.title,
        description: oldImg.description,
        category: oldImg.category,
        order: oldImg.order,
        featured: oldImg.featured,
      });

      // 3. Delete old image
      await deleteImage(oldImg.publicId);
      console.info('[Admin] Old image deleted:', oldImg.publicId);

      // 4. Update local state
      setImages(prev => prev.map(i =>
        i.id === oldImg.id
          ? { ...i, id: newPublicId, publicId: newPublicId, url: newUrl }
          : i
      ));
      toast.success('Image replaced successfully.');
    } catch (e: any) {
      console.error('[Admin] replace error:', e.message);
      toast.error('Replace failed: ' + e.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingCount = uploadQueue.filter(i => i.status === 'pending').length;
  const successCount = uploadQueue.filter(i => i.status === 'success').length;
  const errorCount = uploadQueue.filter(i => i.status === 'error').length;

  return (
    <div className="min-h-[100dvh] flex bg-muted/20">

      {/* Hidden inputs */}
      <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleFileSelect} />
      <input ref={replaceInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="hidden" onChange={handleReplaceSelect} />

      {/* Sidebar */}
      <aside className="w-64 bg-[#1E5631] text-white flex flex-col shadow-xl shrink-0">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-secondary">SAI FLOWERS</h2>
          <p className="text-xs text-white/60">Admin Dashboard</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'gallery', icon: ImageIcon, label: 'Gallery' },
            { id: 'testimonials', icon: MessageSquare, label: 'Testimonials' },
            { id: 'faqs', icon: HelpCircle, label: 'FAQs' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === tab.id ? 'bg-secondary text-[#1E5631] font-bold' : 'hover:bg-white/10'}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="w-5 h-5 mr-3" /> {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center px-4 py-3 text-red-300 hover:bg-white/10 rounded-xl transition-colors">
            <LogOut className="w-5 h-5 mr-3" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">

        {/* ── GALLERY TAB ── */}
        {activeTab === 'gallery' && (
          <div className="space-y-6 max-w-6xl">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">Gallery Management</h1>
              <p className="text-muted-foreground text-sm">Images are stored on Cloudinary. Upload, edit, reorder and delete from here.</p>
            </div>

            {/* Upload Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-border">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h3 className="text-base font-bold">Upload New Images</h3>
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                  <Plus className="w-4 h-4" /> Add Files
                </button>
              </div>

              {uploadQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 cursor-pointer hover:bg-muted/20 transition-colors rounded-b-2xl" onClick={() => fileInputRef.current?.click()}>
                  <FileImage className="w-12 h-12 text-muted-foreground/40" />
                  <p className="text-muted-foreground text-sm">Click or drag JPG, PNG, WEBP files here</p>
                  <p className="text-muted-foreground/60 text-xs">Max {MAX_FILE_SIZE_MB}MB per file · Multiple files supported</p>
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{uploadQueue.length} file{uploadQueue.length !== 1 ? 's' : ''}</span>
                    {successCount > 0 && <span className="text-green-600 font-medium">✓ {successCount} uploaded</span>}
                    {errorCount > 0 && <span className="text-red-600 font-medium">✗ {errorCount} failed</span>}
                  </div>

                  <div className="space-y-3">
                    {uploadQueue.map((item) => (
                      <div key={item.localId} className={`rounded-xl border p-4 ${item.status === 'success' ? 'border-green-200 bg-green-50' : item.status === 'error' ? 'border-red-200 bg-red-50' : 'border-border bg-muted/20'}`}>
                        <div className="flex gap-4">
                          <img src={item.preview} alt="" className="w-16 h-16 object-cover rounded-lg shrink-0" />
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
                              <Input value={item.title} onChange={e => updateQueueItem(item.localId, { title: e.target.value })} disabled={item.status !== 'pending'} className="h-8 text-sm" placeholder="Image title" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
                              <Input value={item.description} onChange={e => updateQueueItem(item.localId, { description: e.target.value })} disabled={item.status !== 'pending'} className="h-8 text-sm" placeholder="Optional" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
                              <Select value={item.category} onValueChange={v => updateQueueItem(item.localId, { category: v })} disabled={item.status !== 'pending'}>
                                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>{categoriesList.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex flex-col items-center justify-between shrink-0">
                            {item.status === 'pending' && <button onClick={() => removeFromQueue(item.localId)} className="text-muted-foreground hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>}
                            {item.status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                            {item.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                            {item.status === 'uploading' && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                          </div>
                        </div>
                        {item.status === 'uploading' && (
                          <div className="mt-3">
                            <Progress value={item.progress} className="h-1.5" />
                            <p className="text-xs text-right mt-1 text-muted-foreground">{Math.round(item.progress)}%</p>
                          </div>
                        )}
                        {item.status === 'error' && item.error && <p className="mt-2 text-xs text-red-600">{item.error}</p>}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Button onClick={handleUploadAll} disabled={isUploadingAll || pendingCount === 0} className="bg-primary text-white min-w-[140px]">
                      {isUploadingAll ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading…</> : <><Upload className="w-4 h-4 mr-2" />Upload {pendingCount > 0 ? `${pendingCount} File${pendingCount !== 1 ? 's' : ''}` : 'All'}</>}
                    </Button>
                    <button onClick={() => fileInputRef.current?.click()} className="text-sm text-primary hover:underline">+ Add more files</button>
                    {uploadQueue.every(i => i.status !== 'pending' && i.status !== 'uploading') && uploadQueue.length > 0 && (
                      <button onClick={() => setUploadQueue([])} className="text-sm text-muted-foreground hover:text-foreground ml-auto">Clear all</button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Image Grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-border">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h3 className="text-base font-bold">Current Images <span className="text-muted-foreground font-normal text-sm">({images.length})</span></h3>
                <button onClick={loadGallery} disabled={galleryLoading} className="text-muted-foreground hover:text-foreground transition-colors" title="Refresh">
                  <RefreshCw className={`w-4 h-4 ${galleryLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="p-5">
                {galleryLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">{[1,2,3,4,5].map(i => <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />)}</div>
                ) : images.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No images yet. Upload your first image above.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {images.map((img, idx) => (
                      <div key={img.id} className="group relative rounded-xl overflow-hidden border border-border bg-muted/30">
                        <div className="aspect-square relative">
                          <img src={img.url} alt={img.title} className="w-full h-full object-cover" loading="lazy"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23f1f5f9%22 width=%22100%22 height=%22100%22/%3E%3C/svg%3E'; }} />
                          {img.featured && <div className="absolute top-1.5 left-1.5 bg-secondary text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow">★</div>}
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-medium truncate" title={img.title}>{img.title || '—'}</p>
                          <p className="text-[11px] text-muted-foreground capitalize">{img.category}</p>
                        </div>
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                          <div className="flex items-start justify-between">
                            <button onClick={() => toggleFeatured(img)} title={img.featured ? 'Remove featured' : 'Mark as featured'} className={`p-1.5 rounded-lg transition-colors ${img.featured ? 'bg-secondary text-white' : 'bg-white/20 text-white hover:bg-secondary'}`}>
                              <Star className="w-3.5 h-3.5" fill={img.featured ? 'currentColor' : 'none'} />
                            </button>
                            <div className="flex flex-col gap-1">
                              <button onClick={() => reorder(idx, 'up')} disabled={idx === 0} className="bg-white/20 text-white hover:bg-white/40 rounded p-1 disabled:opacity-30 transition-colors"><ChevronUp className="w-3 h-3" /></button>
                              <button onClick={() => reorder(idx, 'down')} disabled={idx === images.length - 1} className="bg-white/20 text-white hover:bg-white/40 rounded p-1 disabled:opacity-30 transition-colors"><ChevronDown className="w-3 h-3" /></button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <button onClick={() => openEdit(img)} title="Edit" className="flex-1 flex items-center justify-center bg-white/20 hover:bg-blue-500 text-white rounded-lg p-2 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => { setReplacingImg(img); replaceInputRef.current?.click(); }} title="Replace" className="flex-1 flex items-center justify-center bg-white/20 hover:bg-amber-500 text-white rounded-lg p-2 transition-colors"><RefreshCw className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDelete(img)} title="Delete" className="flex-1 flex items-center justify-center bg-white/20 hover:bg-red-500 text-white rounded-lg p-2 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'testimonials' && (
          <div className="text-center py-20 max-w-md mx-auto">
            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-muted-foreground mb-2">Testimonials</h2>
            <p className="text-muted-foreground text-sm">Testimonials are managed in code. Edit <code className="bg-muted px-1 rounded">src/components/Testimonials.tsx</code> to update them.</p>
          </div>
        )}

        {activeTab === 'faqs' && (
          <div className="text-center py-20 max-w-md mx-auto">
            <HelpCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-muted-foreground mb-2">FAQs</h2>
            <p className="text-muted-foreground text-sm">FAQs are managed in the translation files. Edit <code className="bg-muted px-1 rounded">src/translations/en.json</code> and <code className="bg-muted px-1 rounded">mr.json</code>.</p>
          </div>
        )}
      </main>

      {/* Edit Modal */}
      <AnimatePresence>
        {editState && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setEditState(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold">Edit Image</h3>
                <button onClick={() => setEditState(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <Input value={editState.title} onChange={e => setEditState(p => p ? { ...p, title: e.target.value } : p)} placeholder="Image title" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Input value={editState.description} onChange={e => setEditState(p => p ? { ...p, description: e.target.value } : p)} placeholder="Optional description" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <Select value={editState.category} onValueChange={v => setEditState(p => p ? { ...p, category: v } : p)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{categoriesList.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="featured-edit" checked={editState.featured} onChange={e => setEditState(p => p ? { ...p, featured: e.target.checked } : p)} className="w-4 h-4 accent-primary" />
                  <label htmlFor="featured-edit" className="text-sm font-medium cursor-pointer">Mark as Featured</label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button onClick={saveEdit} disabled={isSavingEdit} className="flex-1 bg-primary text-white">
                  {isSavingEdit ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={() => setEditState(null)} className="flex-1">Cancel</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
