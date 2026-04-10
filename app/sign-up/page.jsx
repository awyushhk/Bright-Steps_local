'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Brain, Users, Stethoscope } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'parent' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error);
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-indigo-50 flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4 border-b border-indigo-100 bg-white/70 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-1 hover:opacity-90 transition">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center">
            <Brain className="h-7 w-7 text-indigo-600" />
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
            <span className="text-indigo-600">Bright</span>
            <span className="ml-1 text-slate-900">Steps</span>
          </h1>
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-3xl">

          {/* Role Selection */}
          <div className="mb-10 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Create Your Account
            </h2>
            <p className="text-slate-600 mb-8">Choose how you will be using BrightSteps</p>

            <div className="flex gap-6 justify-center max-w-2xl mx-auto">
              {/* Parent */}
              <button
                onClick={() => setForm({ ...form, role: 'parent' })}
                className={`flex-1 p-5 rounded-xl border-2 transition-all text-left ${
                  form.role === 'parent'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-indigo-100 hover:border-indigo-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    form.role === 'parent' ? 'bg-indigo-600' : 'bg-indigo-100'
                  }`}>
                    <Users className={`w-5 h-5 ${form.role === 'parent' ? 'text-white' : 'text-indigo-600'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Parent or Guardian</h3>
                    <p className="text-sm text-slate-600">Complete guided screenings and upload observations</p>
                  </div>
                </div>
              </button>

              {/* Clinician */}
              <button
                onClick={() => setForm({ ...form, role: 'clinician' })}
                className={`flex-1 p-5 rounded-xl border-2 transition-all text-left ${
                  form.role === 'clinician'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-indigo-100 hover:border-indigo-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    form.role === 'clinician' ? 'bg-indigo-600' : 'bg-indigo-100'
                  }`}>
                    <Stethoscope className={`w-5 h-5 ${form.role === 'clinician' ? 'text-white' : 'text-indigo-600'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Clinician</h3>
                    <p className="text-sm text-slate-600">Review structured cases and manage workflows</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 p-8 space-y-4 max-w-md mx-auto">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {form.role === 'parent' ? 'Parent / Guardian Account' : 'Clinician Account'}
              </h3>
              <p className="text-slate-500 text-sm mt-1">Fill in your details to get started</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Full Name</label>
              <input
                placeholder="John Smith"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-semibold text-sm transition disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            <p className="text-sm text-center text-slate-500">
              Already have an account?{' '}
              <a href="/sign-in" className="text-indigo-600 hover:underline font-medium">Sign in</a>
            </p>
          </div>

          {/* Info */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="bg-white border border-indigo-100 rounded-xl p-6">
              <h3 className="font-semibold text-slate-900 mb-2">
                {form.role === 'parent' ? 'For Parents and Guardians' : 'For Healthcare Professionals'}
              </h3>
              <p className="text-sm text-slate-600">
                {form.role === 'parent'
                  ? 'BrightSteps helps you document early developmental behaviors through structured guidance and home observations.'
                  : 'BrightSteps supports structured case review and organized screening workflows within clinical settings.'}
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}