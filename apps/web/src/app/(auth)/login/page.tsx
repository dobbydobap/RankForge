'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@rankforge/shared';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from '@/stores/toast-store';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setError('');
      await login(data);
      toast.success('Signed in');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
      toast.error(err.message || 'Login failed');
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[var(--c-bg)] text-[var(--c-fg)] grid lg:grid-cols-2 selection:bg-[var(--c-fg)] selection:text-[var(--c-bg)]">
      {/* Left editorial panel */}
      <div className="hidden lg:flex flex-col justify-between border-r border-[var(--c-fg)] p-10">
        <Link href="/" className="font-display text-lg font-extrabold uppercase tracking-tight">
          RankForge<sup className="text-[9px] align-super ml-0.5">™</sup>
        </Link>
        <h1 className="font-display uppercase text-[10rem] leading-[0.82] tracking-tight">
          Sign
          <br />
          In
        </h1>
        <div className="label-mono text-neutral-500">
          <div>RF / ACCESS</div>
          <div>EST. 2026 · ISBN 0011—RF26</div>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden font-display text-lg font-extrabold uppercase tracking-tight">
            RankForge
          </Link>
          <div className="label-mono text-neutral-400 mt-6 lg:mt-0">[ Welcome back ]</div>
          <h2 className="font-display uppercase text-3xl mt-2 mb-8">Account Login</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="p-3 text-sm border border-[var(--c-fg)] bg-[var(--c-fg)] text-[var(--c-bg)]">{error}</div>
            )}

            <div>
              <label htmlFor="emailOrUsername" className="block label-mono text-neutral-500 mb-2">
                Email or Username
              </label>
              <input
                id="emailOrUsername"
                type="text"
                {...register('emailOrUsername')}
                className="w-full px-3 py-2.5 bg-[var(--c-bg)] border border-[var(--c-fg)] text-[var(--c-fg)] placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="you@example.com"
              />
              {errors.emailOrUsername && (
                <p className="mt-1 text-xs text-neutral-600">{errors.emailOrUsername.message}</p>
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
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-neutral-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[var(--c-fg)] text-[var(--c-bg)] label-mono hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <p className="mt-8 label-mono text-neutral-500">
            No account?{' '}
            <Link href="/register" className="text-[var(--c-fg)] underline underline-offset-4 hover:opacity-50">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
