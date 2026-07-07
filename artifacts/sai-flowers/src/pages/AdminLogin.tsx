import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Flower2, Lock } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { login } from '@/lib/api';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(password);
      toast.success('Login successful');
      setLocation('/admin');
    } catch (err: any) {
      console.error('[AdminLogin] error:', err.message);
      // Map common server errors to user-friendly messages
      const msg = err.message?.includes('not set')
        ? 'Server configuration error — ADMIN_PASSWORD secret not set in Replit.'
        : err.message?.includes('Incorrect')
          ? 'Incorrect password. Please try again.'
          : err.message ?? 'Login failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative bg */}
      <div className="absolute inset-0 bg-[#1E5631]/5" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl relative z-10 border border-border">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">SAI FLOWERS</h2>
          <p className="text-muted-foreground">{t('admin.login')}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password">{t('admin.password')}</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-muted/50"
              placeholder="Enter admin password"
              autoComplete="current-password"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white py-6"
            disabled={loading}
          >
            {loading ? 'Signing in…' : t('admin.signIn')}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-primary hover:underline font-medium flex items-center justify-center">
            <Flower2 className="w-4 h-4 mr-2" />
            {t('admin.backToSite')}
          </Link>
        </div>
      </div>
    </div>
  );
}
