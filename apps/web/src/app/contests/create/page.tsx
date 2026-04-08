'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';

export default function CreateContestPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    duration: 120,
    isPublic: true,
    penaltyTime: 20,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const startDateTime = new Date(`${form.startDate}T${form.startTime}`).toISOString();

      const result = await api.post<any>(
        '/contests',
        {
          title: form.title,
          description: form.description || undefined,
          startTime: startDateTime,
          duration: form.duration,
          isPublic: form.isPublic,
          penaltyTime: form.penaltyTime,
        },
        { token: token ?? undefined },
      );

      router.push(`/contests/${result.slug}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create contest');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-rf-cream">Create Contest</h1>
          <p className="text-sm text-rf-gray mt-1">
            Set up a new competitive programming contest
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-rf-sage mb-1">
              Contest Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full px-3 py-2 bg-rf-dark border border-rf-iron rounded-lg text-rf-cream placeholder-rf-iron focus:outline-none focus:ring-2 focus:ring-rf-sage focus:border-transparent"
              placeholder="RankForge Round #3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-rf-sage mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-rf-dark border border-rf-iron rounded-lg text-rf-cream placeholder-rf-iron focus:outline-none focus:ring-2 focus:ring-rf-sage focus:border-transparent"
              placeholder="A brief description of the contest..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-rf-sage mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
                className="w-full px-3 py-2 bg-rf-dark border border-rf-iron rounded-lg text-rf-cream focus:outline-none focus:ring-2 focus:ring-rf-sage"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-rf-sage mb-1">
                Start Time *
              </label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                required
                className="w-full px-3 py-2 bg-rf-dark border border-rf-iron rounded-lg text-rf-cream focus:outline-none focus:ring-2 focus:ring-rf-sage"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-rf-sage mb-1">
                Duration (minutes) *
              </label>
              <input
                type="number"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 120 })}
                min={10}
                max={600}
                className="w-full px-3 py-2 bg-rf-dark border border-rf-iron rounded-lg text-rf-cream focus:outline-none focus:ring-2 focus:ring-rf-sage"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-rf-sage mb-1">
                Penalty per WA (minutes)
              </label>
              <input
                type="number"
                value={form.penaltyTime}
                onChange={(e) => setForm({ ...form, penaltyTime: parseInt(e.target.value) || 20 })}
                min={0}
                max={60}
                className="w-full px-3 py-2 bg-rf-dark border border-rf-iron rounded-lg text-rf-cream focus:outline-none focus:ring-2 focus:ring-rf-sage"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPublic"
              checked={form.isPublic}
              onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
              className="w-4 h-4 rounded bg-rf-dark border-rf-iron text-rf-sage focus:ring-rf-sage"
            />
            <label htmlFor="isPublic" className="text-sm text-rf-sage">
              Public contest (anyone can register)
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-sm font-medium bg-rf-accent hover:bg-rf-accent-hover disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Contest'}
            </button>
            <Link
              href="/contests"
              className="px-6 py-2.5 text-sm font-medium border border-rf-iron hover:border-rf-gray text-rf-sage rounded-lg transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>

        <div className="mt-8 p-4 border border-rf-border rounded-xl bg-rf-dark/50">
          <h3 className="text-sm font-semibold text-rf-sage mb-2">After creating:</h3>
          <ol className="text-xs text-rf-gray space-y-1 list-decimal list-inside">
            <li>Add problems to the contest from the contest detail page</li>
            <li>Transition status: Draft &rarr; Published &rarr; Registration Open &rarr; Live</li>
            <li>Contest goes live at start time, participants can submit solutions</li>
            <li>After contest ends, calculate ratings from the results page</li>
          </ol>
        </div>
      </main>
    </>
  );
}
