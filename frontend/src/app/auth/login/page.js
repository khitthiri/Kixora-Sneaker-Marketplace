'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { toast } from '../../../components/ui/Toaster';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.push('/marketplace');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Invalid email or password';
      setError(msg);
    }
  };

  return (
    <main className="min-h-screen bg-kixora-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="block text-center mb-8">
          <span className="font-display text-4xl tracking-widest text-kixora-amber">KIX<span className="text-kixora-white">ORA</span></span>
        </Link>

        <div className="bg-kixora-surface border border-kixora-border rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-kixora-white mb-1">Welcome back</h1>
          <p className="text-sm text-kixora-gray mb-8">Sign in to your KIXORA account</p>

          {/* Google OAuth */}
          <a href={`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`}
            className="flex items-center justify-center gap-3 w-full bg-kixora-surface2 border border-kixora-border rounded-xl py-3 text-sm font-medium text-kixora-white hover:border-kixora-gray transition-all mb-6">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </a>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-kixora-border" />
            <span className="text-xs text-kixora-gray uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-kixora-border" />
          </div>

          {error && (
            <div className="bg-kixora-red bg-opacity-10 border border-kixora-red border-opacity-30 rounded-xl px-4 py-3 mb-5">
              <p className="text-sm text-kixora-red">{error}</p>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-kixora-gray uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="input-dark" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-xs font-bold text-kixora-gray uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  className="input-dark pr-10" placeholder="Your password" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-kixora-gray hover:text-kixora-white">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className="text-xs text-kixora-amber hover:underline">Forgot password?</Link>
            </div>

            <button type="submit" disabled={isLoading}
              className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
              {isLoading ? (
                <><div className="w-4 h-4 border-2 border-kixora-black border-t-transparent rounded-full animate-spin" /> Signing in...</>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-kixora-gray mt-6">
            No account?{' '}
            <Link href="/auth/register" className="text-kixora-amber font-semibold hover:underline">Create one free</Link>
          </p>

          <div className="mt-6 p-3 bg-kixora-surface2 border border-kixora-border rounded-xl">
            <p className="text-xs text-kixora-gray text-center">Test: buyer@kixora.com / buyer123!</p>
          </div>
        </div>
      </div>
    </main>
  );
}
