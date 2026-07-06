import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { auth, db, storage } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n';
import { LogOut, Image as ImageIcon, MessageSquare, HelpCircle, Upload, Trash2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const categoriesList = [
  'flower', 'marriage', 'wedding', 'mandap', 'haldi', 'mehendi', 'engagement', 'reception', 
  'birthday', 'baby_shower', 'anniversary', 'naming', 'housewarming', 'corporate', 'stage', 
  'car', 'temple', 'home', 'room', 'welcome', 'bouquet', 'balloon', 'torans', 'funeral'
];

export default function Admin() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('gallery');

  // Gallery state
  const [images, setImages] = useState<any[]>([]);
  const [uploadCategory, setUploadCategory] = useState(categoriesList[0]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

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
    try {
      const querySnapshot = await getDocs(collection(db, 'gallery'));
      setImages(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error("Please select a file");
      return;
    }
    
    try {
      const storageRef = ref(storage, `gallery/${uploadCategory}/${Date.now()}_${uploadFile.name}`);
      const uploadTask = uploadBytesResumable(storageRef, uploadFile);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (error) => {
          toast.error("Upload failed: " + error.message);
          setUploadProgress(0);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await addDoc(collection(db, 'gallery'), {
            category: uploadCategory,
            url: downloadURL,
            title: uploadFile.name,
            createdAt: serverTimestamp()
          });
          toast.success("Image uploaded successfully");
          setUploadFile(null);
          setUploadProgress(0);
          fetchGallery();
        }
      );
    } catch (e: any) {
      toast.error("Error: " + e.message);
    }
  };

  const handleDelete = async (id: string, url: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;
    try {
      // 1. Delete from Firestore
      await deleteDoc(doc(db, 'gallery', id));
      // 2. Try to delete from Storage (might fail if URL is external, but safe to try)
      try {
        const fileRef = ref(storage, url);
        await deleteObject(fileRef);
      } catch (storageErr) {
        console.log("Storage delete skipped", storageErr);
      }
      toast.success("Image deleted");
      fetchGallery();
    } catch (e: any) {
      toast.error("Delete failed: " + e.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return null;

  return (
    <div className="min-h-[100dvh] flex bg-muted/20">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#1E5631] text-white flex flex-col shadow-xl">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-secondary">SAI FLOWERS</h2>
          <p className="text-xs text-white/60">Admin Dashboard</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'gallery' ? 'bg-secondary text-[#1E5631] font-bold' : 'hover:bg-white/10'}`}
            onClick={() => setActiveTab('gallery')}
          >
            <ImageIcon className="w-5 h-5 mr-3" /> Gallery
          </button>
          <button 
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'testimonials' ? 'bg-secondary text-[#1E5631] font-bold' : 'hover:bg-white/10'}`}
            onClick={() => setActiveTab('testimonials')}
          >
            <MessageSquare className="w-5 h-5 mr-3" /> Testimonials
          </button>
          <button 
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'faqs' ? 'bg-secondary text-[#1E5631] font-bold' : 'hover:bg-white/10'}`}
            onClick={() => setActiveTab('faqs')}
          >
            <HelpCircle className="w-5 h-5 mr-3" /> FAQs
          </button>
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
      <main className="flex-1 p-8 overflow-y-auto">
        
        {activeTab === 'gallery' && (
          <div className="space-y-8 max-w-6xl">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Gallery Management</h1>
                <p className="text-muted-foreground">Upload and manage images across all service categories.</p>
              </div>
            </div>

            {/* Upload Box */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
              <h3 className="text-lg font-bold mb-4">Upload New Image</h3>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-1/3">
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <Select value={uploadCategory} onValueChange={setUploadCategory}>
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
                <div className="w-full md:w-1/3">
                  <label className="block text-sm font-medium mb-1">File</label>
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                </div>
                <Button 
                  onClick={handleUpload}
                  disabled={!uploadFile || uploadProgress > 0}
                  className="bg-primary text-white shrink-0"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </div>
              {uploadProgress > 0 && (
                <div className="mt-4">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-right mt-1 text-muted-foreground">{Math.round(uploadProgress)}%</p>
                </div>
              )}
            </div>

            {/* Image Grid */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
              <h3 className="text-lg font-bold mb-6">Current Images ({images.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.map(img => (
                  <div key={img.id} className="group relative rounded-xl overflow-hidden aspect-square border border-border">
                    <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                      <span className="text-xs text-white bg-black/50 px-2 py-1 rounded self-start">{img.category}</span>
                      <button 
                        onClick={() => handleDelete(img.id, img.url)}
                        className="bg-red-500 text-white p-2 rounded-full self-end hover:bg-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'testimonials' && (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-muted-foreground mb-4">Testimonials Management</h2>
            <p>Module to be implemented. Data can be modified in Firebase Console.</p>
          </div>
        )}

        {activeTab === 'faqs' && (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-muted-foreground mb-4">FAQs Management</h2>
            <p>Module to be implemented. Data can be modified in Firebase Console.</p>
          </div>
        )}

      </main>
    </div>
  );
}
