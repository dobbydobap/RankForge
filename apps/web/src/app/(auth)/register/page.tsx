'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@rankforge/shared';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from '@/stores/toast-store';

export default function RegisterPage() {
  const router = useRouter();
  const registerUser = useAuthStore((s) => s.register);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      setError('');
      await registerUser(data);
      toast.success('Account created — welcome');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      toast.error(err.message || 'Registration failed');
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[var(--c-bg)] text-[var(--c-fg)] grid lg:grid-cols-2 selection:bg-[var(--c-fg)] selection:text-[var(--c-bg)]">
      {/* Left editorial panel */}
      <div className="hidden lg:flex flex-col justify-between border-r border-[var(--c-fg)] p-10">
        <Link href="/" className="font-display text-lg font-extrabold uppercase tracking-tight">
          RankForge<sup className="text-[9px] align-super ml-0.5">™</sup>
        </Link>
        <h1 className="font-display uppercase text-[8.5rem] leading-[0.82] tracking-tight">
          Join
          <br />
          The
          <br />
          Forge
        </h1>
        <div className="label-mono text-neutral-500">
          <div>RF / NEW MEMBER</div>
          <div>EST. 2026 · ISBN 0011—RF26</div>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-sm py-6">
          <Link href="/" className="lg:hidden font-display text-lg font-extrabold uppercase tracking-tight">
            RankForge
          </Link>
          <div className="label-mono text-neutral-400 mt-6 lg:mt-0">[ Start competing ]</div>
          <h2 className="font-display uppercase text-3xl mt-2 mb-8">Create Account</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="p-3 text-sm border border-[var(--c-fg)] bg-[var(--c-fg)] text-[var(--c-bg)]">{error}</div>
            )}

            <div>
              <label htmlFor="username" className="block label-mono text-neutral-500 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                {...register('username')}
                className="w-full px-3 py-2.5 bg-[var(--c-bg)] border border-[var(--c-fg)] text-[var(--c-fg)] placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="coolcoder42"
              />
              {errors.username && (
                <p className="mt-1 text-xs text-neutral-600">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block label-mono text-neutral-500 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="w-full px-3 py-2.5 bg-[var(--c-bg)] border border-[var(--c-fg)] text-[var(--c-fg)] placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-neutral-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block label-mono text-neutral-500 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className="w-full px-3 py-2.5 bg-[var(--c-bg)] border border-[var(--c-fg)] text-[var(--c-fg)] placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="At least 8 characters"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-neutral-600">{errors.password.message}</p>
              )}
              <p className="mt-2 label-mono text-neutral-400">
                Uppercase · lowercase · number
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[var(--c-fg)] text-[var(--c-bg)] label-mono hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>

          <p className="mt-8 label-mono text-neutral-500">
            Already a member?{' '}
            <Link href="/login" className="text-[var(--c-fg)] underline underline-offset-4 hover:opacity-50">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
