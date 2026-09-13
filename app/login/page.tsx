'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';



export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      router.replace('/dashboard');
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-slate-900 flex overflow-hidden">
      {/* Left: Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-slate-950 border-r border-slate-800 relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[rgb(var(--clr-primary))] rounded-md flex items-center justify-center text-white font-bold text-sm shadow-sm border border-white/10">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 4v16m-8-8h16" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-white text-lg font-bold tracking-tight">VaidyaMD</h1>
              <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Hospital Management System</p>
            </div>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 max-w-md">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-md px-3 py-1 mb-6">
              <span className="w-2 h-2 bg-emerald-400 rounded-full" />
              <span className="text-slate-300 text-xs font-medium">Fertility &amp; Surgical Suite Active</span>
            </div>
            <h2 className="text-3xl font-bold text-white leading-tight mb-4 tracking-tight">
              Clinical Excellence &amp; Fertility Care Architecture.
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Institutional-grade EMR platform purpose-built for reproductive medicine, IVF laboratories, and multi-specialty clinical operations.
            </p>
          </div>

          {/* Feature Badges */}
          <div className="flex flex-wrap gap-2">
            {[
              'WHO 6th Ed. Semen Analysis',
              'ICSI & Embryo Witnessing',
              'Liquid Nitrogen Cryobank',
              'ART Act 2021 Consents',
              'HL7 Equipment Ingestion'
            ].map((f) => (
              <span key={f} className="bg-slate-900/80 border border-slate-800 text-slate-300 text-xs font-medium px-2.5 py-1 rounded-md">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-slate-500 text-xs font-mono">
          VaidyaMD HMS v2.4 · Halelabs · Authorized Medical Personnel Only
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-[rgb(var(--clr-primary))] rounded-md flex items-center justify-center text-white font-bold text-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 4v16m-8-8h16" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-slate-900 font-bold">VaidyaMD HMS</h1>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Clinical Portal Sign In</h2>
            <p className="text-slate-500 text-sm">Enter your institutional credentials to access your clinical workspace</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="vmd-input rounded-md"
                placeholder="clinician@vaidyamd.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="vmd-input rounded-md"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2.5 rounded-md">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[rgb(var(--clr-primary))] text-white font-semibold py-2.5 rounded-md hover:bg-[rgb(var(--clr-primary)/0.9)] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : 'Sign In to Clinical Suite'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
