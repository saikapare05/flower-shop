import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { auth, db, storage } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection, getDocs, addDoc, deleteDoc, doc,
  serverTimestamp, updateDoc, writeBatch, query, orderBy
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
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

const categoriesList = [
  'flower', 'marriage', 'wedding', 'mandap', 'haldi', 'mehendi', 'engagement', 'reception',
  'birthday', 'baby_shower', 'anniversary', 'naming', 'housewarming', 'corporate', 'stage',
  'car', 'temple', 'home', 'room', 'welcome', 'bouquet', 'balloon', 'torans', 'funeral'
];

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

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

interface GalleryImage {
  id: string;
  url: string;
  title?: string;
  description?: string;
  category: string;
  featured?: boolean;
  order?: number;
  createdAt?: any;
}

interface EditState {
  id: string;
  title: string;
  description: string;
  category: string;
}

const storageErrorMap: Record<string, string> = {
  'storage/unauthorized': 'Permission denied. Check Firebase Storage rules allow authenticated uploads.',
  'storage/canceled': 'Upload was cancelled.',
  'storage/unknown': 'Firebase Storage may not be enabled. Enable it in your Firebase Console.',
  'storage/object-not-found': 'Storage bucket not found. Enable Firebase Storage in the Firebase Console.',
  'storage/bucket-not-found': 'Storage bucket not found. Enable Firebase Storage in the Firebase Console.',
  'storage/quota-exceeded': 'Storage quota exceeded.',
  'storage/unauthenticated': 'You must be logged in to upload.',
  'storage/retry-limit-exceeded': 'Upload timed out. Check your internet connection.',
  'storage/invalid-checksum': 'File corrupted during upload. Please try again.',
  'storage/cannot-slice-blob': 'File changed during upload. Please try again.',
  'storage/server-file-wrong-size': 'File size mismatch. Please try again.',
};

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `"${file.name}" — unsupported format. Use JPG, PNG, or WEBP.`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `"${file.name}" — exceeds ${MAX_FILE_SIZE_MB}MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB).`;
  }
  return null;
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
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

  // Replace state
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        setLocation('/admin/login');
      } else {
        setUser(currentUser);
        fetchGallery();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setLocation]);

  const fetchGallery = async () => {
    setGalleryLoading(true);
    try {
      const q = query(collection(db, 'gallery'), orderBy('order', 'asc'));
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as GalleryImage));
      // Assign order if missing
      setImages(docs.map((img, i) => ({ ...img, order: img.order ?? i })));
    } catch {
      // fallback: fetch without order
      try {
        const snap = await getDocs(collection(db, 'gallery'));
        setImages(snap.docs.map((d, i) => ({ id: d.id, order: i, ...d.data() } as GalleryImage)));
      } catch (e: any) {
        console.error(e);
      }
    } finally {
      setGalleryLoading(false);
    }
  };

  // ── File selection ──
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newItems: UploadItem[] = [];
    files.forEach(f => {
      const err = validateFile(f);
      if (err) {
        toast.error(err);
        return;
      }
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

  // ── Upload all ──
  const handleUploadAll = async () => {
    const pending = uploadQueue.filter(i => i.status === 'pending');
    if (pending.length === 0) {
      toast.error('No files ready to upload.');
      return;
    }
    setIsUploadingAll(true);
    const maxOrder = images.length > 0 ? Math.max(...images.map(i => i.order ?? 0)) : -1;

    for (let idx = 0; idx < pending.length; idx++) {
      const item = pending[idx];
      updateQueueItem(item.localId, { status: 'uploading', progress: 0 });

      await new Promise<void>((resolve) => {
        const storageRef = ref(storage, `gallery/${item.category}/${Date.now()}_${item.file.name}`);
        const task = uploadBytesResumable(storageRef, item.file);

        task.on(
          'state_changed',
          (snap) => {
            const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
            updateQueueItem(item.localId, { progress: pct });
          },
          (err) => {
            const msg = storageErrorMap[err.code] ?? `Upload failed: ${err.message}`;
            updateQueueItem(item.localId, { status: 'error', error: msg });
            toast.error(`"${item.title}": ${msg}`);
            resolve();
          },
          async () => {
            try {
              const url = await getDownloadURL(task.snapshot.ref);
              await addDoc(collection(db, 'gallery'), {
                url,
                title: item.title,
                description: item.description,
                category: item.category,
                featured: false,
                order: maxOrder + idx + 1,
                createdAt: serverTimestamp(),
              });
              updateQueueItem(item.localId, { status: 'success', progress: 100 });
              toast.success(`"${item.title}" uploaded!`);
            } catch (firestoreErr: any) {
              const msg = `Uploaded but failed to save: ${firestoreErr.message}`;
              updateQueueItem(item.localId, { status: 'error', error: msg });
              toast.error(msg);
            }
            resolve();
          }
        );
      });
    }

    setIsUploadingAll(false);
    fetchGallery();
    // Clear successful items after delay
    setTimeout(() => {
      setUploadQueue(prev => prev.filter(i => i.status !== 'success'));
    }, 3000);
  };

  // ── Delete ──
  const handleDelete = async (img: GalleryImage) => {
    if (!confirm(`Delete "${img.title || 'this image'}"?`)) return;
    try {
      await deleteDoc(doc(db, 'gallery', img.id));
      try {
        const fileRef = ref(storage, img.url);
        await deleteObject(fileRef);
      } catch { /* external or already deleted */ }
      toast.success('Image deleted.');
      setImages(prev => prev.filter(i => i.id !== img.id));
    } catch (e: any) {
      toast.error('Delete failed: ' + e.message);
    }
  };

  // ── Edit ──
  const openEdit = (img: GalleryImage) => {
    setEditState({ id: img.id, title: img.title || '', description: img.description || '', category: img.category });
  };

  const saveEdit = async () => {
    if (!editState) return;
    setIsSavingEdit(true);
    try {
      await updateDoc(doc(db, 'gallery', editState.id), {
        title: editState.title,
        description: editState.description,
        category: editState.category,
      });
      setImages(prev => prev.map(i =>
        i.id === editState.id
          ? { ...i, title: editState.title, description: editState.description, category: editState.category }
          : i
      ));
      toast.success('Image updated.');
      setEditState(null);
    } catch (e: any) {
      toast.error('Save failed: ' + e.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ── Toggle featured ──
  const toggleFeatured = async (img: GalleryImage) => {
    try {
      const next = !img.featured;
      await updateDoc(doc(db, 'gallery', img.id), { featured: next });
      setImages(prev => prev.map(i => i.id === img.id ? { ...i, featured: next } : i));
      toast.success(next ? 'Marked as featured.' : 'Removed from featured.');
    } catch (e: any) {
      toast.error('Update failed: ' + e.message);
    }
  };

  // ── Reorder ──
  const reorder = async (idx: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= newImages.length) return;

    // Swap order values
    const aOrder = newImages[idx].order ?? idx;
    const bOrder = newImages[swapIdx].order ?? swapIdx;

    newImages[idx] = { ...newImages[idx], order: bOrder };
    newImages[swapIdx] = { ...newImages[swapIdx], order: aOrder };
    newImages.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    setImages(newImages);

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'gallery', newImages[idx].id), { order: newImages[idx].order });
      batch.update(doc(db, 'gallery', newImages[swapIdx].id), { order: newImages[swapIdx].order });
      await batch.commit();
    } catch (e: any) {
      toast.error('Reorder failed: ' + e.message);
      fetchGallery(); // revert
    }
  };

  // ── Replace image ──
  const handleReplaceSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingId) return;
    const err = validateFile(file);
    if (err) { toast.error(err); return; }

    const img = images.find(i => i.id === replacingId);
    if (!img) return;

    toast.info('Replacing image…');
    try {
      const storageRef = ref(storage, `gallery/${img.category}/${Date.now()}_${file.name}`);
      const task = uploadBytesResumable(storageRef, file);

      await new Promise<void>((resolve, reject) => {
        task.on('state_changed', null,
          (err) => reject(err),
          async () => {
            try {
              const newUrl = await getDownloadURL(task.snapshot.ref);
              await updateDoc(doc(db, 'gallery', replacingId), { url: newUrl });
              // Try to delete old file from storage
              try { await deleteObject(ref(storage, img.url)); } catch { /* OK */ }
              setImages(prev => prev.map(i => i.id === replacingId ? { ...i, url: newUrl } : i));
              toast.success('Image replaced successfully.');
            } catch (e) { reject(e); }
            resolve();
          }
        );
      });
    } catch (e: any) {
      const msg = storageErrorMap[e.code] ?? e.message;
      toast.error('Replace failed: ' + msg);
    } finally {
      setReplacingId(null);
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return null;

  const pendingCount = uploadQueue.filter(i => i.status === 'pending').length;
  const successCount = uploadQueue.filter(i => i.status === 'success').length;
  const errorCount = uploadQueue.filter(i => i.status === 'error').length;

  return (
    <div className="min-h-[100dvh] flex bg-muted/20">

      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleReplaceSelect}
      />

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
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-red-300 hover:bg-white/10 rounded-xl transition-colors"
          >
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
              <p className="text-muted-foreground text-sm">Upload, edit, reorder and manage all gallery images.</p>
            </div>

            {/* ── Upload Section ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-border">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h3 className="text-base font-bold">Upload New Images</h3>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Files
                </button>
              </div>

              {uploadQueue.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-12 gap-3 cursor-pointer hover:bg-muted/20 transition-colors rounded-b-2xl"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileImage className="w-12 h-12 text-muted-foreground/40" />
                  <p className="text-muted-foreground text-sm">Click or drag JPG, PNG, WEBP files here</p>
                  <p className="text-muted-foreground/60 text-xs">Max {MAX_FILE_SIZE_MB}MB per file · Multiple files supported</p>
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  {/* Queue summary */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{uploadQueue.length} file{uploadQueue.length !== 1 ? 's' : ''}</span>
                    {successCount > 0 && <span className="text-green-600 font-medium">✓ {successCount} uploaded</span>}
                    {errorCount > 0 && <span className="text-red-600 font-medium">✗ {errorCount} failed</span>}
                  </div>

                  {/* Queue items */}
                  <div className="space-y-3">
                    {uploadQueue.map((item) => (
                      <div key={item.localId} className={`rounded-xl border p-4 ${
                        item.status === 'success' ? 'border-green-200 bg-green-50' :
                        item.status === 'error' ? 'border-red-200 bg-red-50' :
                        'border-border bg-muted/20'
                      }`}>
                        <div className="flex gap-4">
                          {/* Preview */}
                          <img
                            src={item.preview}
                            alt=""
                            className="w-16 h-16 object-cover rounded-lg shrink-0"
                          />

                          {/* Fields */}
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
                              <Input
                                value={item.title}
                                onChange={e => updateQueueItem(item.localId, { title: e.target.value })}
                                disabled={item.status !== 'pending'}
                                className="h-8 text-sm"
                                placeholder="Image title"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
                              <Input
                                value={item.description}
                                onChange={e => updateQueueItem(item.localId, { description: e.target.value })}
                                disabled={item.status !== 'pending'}
                                className="h-8 text-sm"
                                placeholder="Optional description"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
                              <Select
                                value={item.category}
                                onValueChange={v => updateQueueItem(item.localId, { category: v })}
                                disabled={item.status !== 'pending'}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {categoriesList.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Status / remove */}
                          <div className="flex flex-col items-center justify-between shrink-0">
                            {item.status === 'pending' && (
                              <button onClick={() => removeFromQueue(item.localId)} className="text-muted-foreground hover:text-red-500 transition-colors">
                                <X className="w-4 h-4" />
                              </button>
                            )}
                            {item.status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                            {item.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                            {item.status === 'uploading' && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                          </div>
                        </div>

                        {/* Progress bar */}
                        {item.status === 'uploading' && (
                          <div className="mt-3">
                            <Progress value={item.progress} className="h-1.5" />
                            <p className="text-xs text-right mt-1 text-muted-foreground">{Math.round(item.progress)}%</p>
                          </div>
                        )}
                        {item.status === 'error' && item.error && (
                          <p className="mt-2 text-xs text-red-600">{item.error}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Upload All button */}
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      onClick={handleUploadAll}
                      disabled={isUploadingAll || pendingCount === 0}
                      className="bg-primary text-white min-w-[140px]"
                    >
                      {isUploadingAll ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading…</>
                      ) : (
                        <><Upload className="w-4 h-4 mr-2" />Upload {pendingCount > 0 ? `${pendingCount} File${pendingCount !== 1 ? 's' : ''}` : 'All'}</>
                      )}
                    </Button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm text-primary hover:underline"
                    >
                      + Add more files
                    </button>
                    {uploadQueue.every(i => i.status !== 'pending' && i.status !== 'uploading') && uploadQueue.length > 0 && (
                      <button
                        onClick={() => setUploadQueue([])}
                        className="text-sm text-muted-foreground hover:text-foreground ml-auto"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Image Grid ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-border">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h3 className="text-base font-bold">
                  Current Images{' '}
                  <span className="text-muted-foreground font-normal text-sm">({images.length})</span>
                </h3>
                <button
                  onClick={fetchGallery}
                  disabled={galleryLoading}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${galleryLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="p-5">
                {galleryLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
                    ))}
                  </div>
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
                          <img
                            src={img.url}
                            alt={img.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23f1f5f9%22 width=%22100%22 height=%22100%22/%3E%3C/svg%3E'; }}
                          />
                          {img.featured && (
                            <div className="absolute top-1.5 left-1.5 bg-secondary text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow">
                              ★
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-2">
                          <p className="text-xs font-medium truncate" title={img.title}>{img.title || '—'}</p>
                          <p className="text-[11px] text-muted-foreground capitalize">{img.category}</p>
                        </div>

                        {/* Action overlay */}
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                          {/* Top row: featured + reorder */}
                          <div className="flex items-start justify-between">
                            <button
                              onClick={() => toggleFeatured(img)}
                              title={img.featured ? 'Remove from featured' : 'Mark as featured'}
                              className={`p-1.5 rounded-lg transition-colors ${img.featured ? 'bg-secondary text-white' : 'bg-white/20 text-white hover:bg-secondary'}`}
                            >
                              <Star className="w-3.5 h-3.5" fill={img.featured ? 'currentColor' : 'none'} />
                            </button>
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => reorder(idx, 'up')}
                                disabled={idx === 0}
                                className="bg-white/20 text-white hover:bg-white/40 rounded p-1 disabled:opacity-30 transition-colors"
                              >
                                <ChevronUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => reorder(idx, 'down')}
                                disabled={idx === images.length - 1}
                                className="bg-white/20 text-white hover:bg-white/40 rounded p-1 disabled:opacity-30 transition-colors"
                              >
                                <ChevronDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Bottom row: edit + replace + delete */}
                          <div className="flex items-center justify-between gap-1">
                            <button
                              onClick={() => openEdit(img)}
                              title="Edit"
                              className="flex-1 flex items-center justify-center bg-white/20 hover:bg-blue-500 text-white rounded-lg p-2 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { setReplacingId(img.id); replaceInputRef.current?.click(); }}
                              title="Replace image"
                              className="flex-1 flex items-center justify-center bg-white/20 hover:bg-amber-500 text-white rounded-lg p-2 transition-colors"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(img)}
                              title="Delete"
                              className="flex-1 flex items-center justify-center bg-white/20 hover:bg-red-500 text-white rounded-lg p-2 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

        {/* ── TESTIMONIALS TAB ── */}
        {activeTab === 'testimonials' && (
          <div className="text-center py-20 max-w-md mx-auto">
            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-muted-foreground mb-2">Testimonials Management</h2>
            <p className="text-muted-foreground text-sm">Manage testimonials directly in your Firebase Console → Firestore → <code className="bg-muted px-1 rounded">testimonials</code> collection.</p>
          </div>
        )}

        {/* ── FAQS TAB ── */}
        {activeTab === 'faqs' && (
          <div className="text-center py-20 max-w-md mx-auto">
            <HelpCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-muted-foreground mb-2">FAQs Management</h2>
            <p className="text-muted-foreground text-sm">Manage FAQs directly in your Firebase Console → Firestore → <code className="bg-muted px-1 rounded">faqs</code> collection.</p>
          </div>
        )}
      </main>

      {/* ── Edit Modal ── */}
      <AnimatePresence>
        {editState && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setEditState(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold">Edit Image</h3>
                <button onClick={() => setEditState(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <Input
                    value={editState.title}
                    onChange={e => setEditState(prev => prev ? { ...prev, title: e.target.value } : prev)}
                    placeholder="Image title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Input
                    value={editState.description}
                    onChange={e => setEditState(prev => prev ? { ...prev, description: e.target.value } : prev)}
                    placeholder="Optional description shown in gallery viewer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <Select
                    value={editState.category}
                    onValueChange={v => setEditState(prev => prev ? { ...prev, category: v } : prev)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesList.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={saveEdit}
                  disabled={isSavingEdit}
                  className="flex-1 bg-primary text-white"
                >
                  {isSavingEdit ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={() => setEditState(null)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
