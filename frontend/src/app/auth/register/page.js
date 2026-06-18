'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../store/authStore';
import { toast } from '../../../components/ui/Toaster';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: '', username: '', password: '', displayName: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    try {
      await register(form);
      toast.success('Welcome to KIXORA!');
      router.push('/marketplace');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    }
  };

  return (
    <main className="min-h-screen bg-kixora-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="block text-center mb-8">
          <span className="font-display text-4xl tracking-widest text-kixora-amber">KIX<span className="text-kixora-white">ORA</span></span>
        </Link>

        <div className="bg-kixora-surface border border-kixora-border rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-kixora-white mb-1">Create account</h1>
          <p className="text-sm text-kixora-gray mb-8">Join the world's most trusted sneaker marketplace</p>

          {error && (
            <div className="bg-kixora-red bg-opacity-10 border border-kixora-red border-opacity-30 rounded-xl px-4 py-3 mb-5">
              <p className="text-sm text-kixora-red">{error}</p>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {[
              { key: 'displayName', label: 'Display Name', type: 'text', placeholder: 'How you appear to others', required: false },
              { key: 'email', label: 'Email *', type: 'email', placeholder: 'you@example.com', required: true },
              { key: 'username', label: 'Username *', type: 'text', placeholder: 'lowercase, no spaces', required: true },
              { key: 'password', label: 'Password *', type: 'password', placeholder: 'Min 8 characters', required: true },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-bold text-kixora-gray uppercase tracking-wider mb-1.5">{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={set(f.key)} required={f.required}
                  className="input-dark" placeholder={f.placeholder}
                  autoCapitalize={f.key === 'username' || f.key === 'email' ? 'none' : 'words'} />
              </div>
            ))}

            <p className="text-xs text-kixora-gray">By creating an account you agree to our Terms of Service.</p>

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
              {isLoading ? (
                <><div className="w-4 h-4 border-2 border-kixora-black border-t-transparent rounded-full animate-spin" /> Creating account...</>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-kixora-gray mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-kixora-amber font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
