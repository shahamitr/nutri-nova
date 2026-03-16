'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupForm() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [totpData, setTotpData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePassword = (password: string) => {
    return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[!@#$%^&*(),.?":{}|<>]/.test(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateEmail(formData.email)) { setError('Please enter a valid email address'); return; }
    if (!validatePassword(formData.password)) { setError('Password must be at least 8 characters with uppercase, lowercase, number, and special character'); return; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }

    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password }),
      });
      const data = await response.json();
      if (!data.success) { setError(data.error || 'Signup failed'); return; }
      setTotpData({ secret: data.data.totp_secret, qrCodeUrl: data.data.qr_code_url });
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (totpData) {
    return (
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-3xl shadow-lg shadow-emerald-500/30 mb-4">&#x1f510;</div>
          <h1 className="text-2xl font-bold text-slate-800">Setup Two-Factor Auth</h1>
          <p className="text-slate-500 mt-1">Scan the QR code with your authenticator app</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-8">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-white border-2 border-slate-200 rounded-xl">
              <img src={totpData.qrCodeUrl} alt="TOTP QR Code" className="w-48 h-48" />
            </div>
          </div>
          <div className="mb-6">
            <p className="text-sm font-semibold text-slate-700 mb-2">Or enter this secret manually:</p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm text-slate-700 break-all select-all">{totpData.secret}</div>
          </div>
          <button onClick={() => router.push('/login')} className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-emerald-700 transition-all shadow-lg shadow-teal-500/25">
            Continue to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-2xl font-bold shadow-lg shadow-teal-500/30 mb-4">N</div>
        <h1 className="text-2xl font-bold text-slate-800">Create your account</h1>
        <p className="text-slate-500 mt-1">Start your nutrition journey with Dr. Nova</p>
      </div>
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-slate-800 placeholder-slate-400" placeholder="John Doe" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-slate-800 placeholder-slate-400" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
            <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-slate-800 placeholder-slate-400" placeholder="Min 8 chars" required />
            <p className="text-xs text-slate-500 mt-2">Uppercase, lowercase, number, special char required</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
            <input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-slate-800 placeholder-slate-400" required />
          </div>
          <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-500/25">
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
      </div>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-teal-600 hover:text-teal-700 transition-colors">Sign in</Link>
      </p>
    </div>
  );
}
