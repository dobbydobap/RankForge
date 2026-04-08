'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@rankforge/shared';
import { useAuthStore } from '@/stores/auth-store';

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
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-rf-black px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-rf-sage">
            RankForge
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-rf-cream">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-rf-gray">
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="emailOrUsername" className="block text-sm font-medium text-rf-sage mb-1">
              Email or Username
            </label>
            <input
              id="emailOrUsername"
              type="text"
              {...register('emailOrUsername')}
              className="w-full px-3 py-2 bg-rf-dark border border-rf-iron rounded-lg text-rf-cream placeholder-rf-iron focus:outline-none focus:ring-2 focus:ring-rf-sage focus:border-transparent"
              placeholder="you@example.com"
            />
            {errors.emailOrUsername && (
              <p className="mt-1 text-sm text-red-400">{errors.emailOrUsername.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-rf-sage mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register('password')}
              className="w-full px-3 py-2 bg-rf-dark border border-rf-iron rounded-lg text-rf-cream placeholder-rf-iron focus:outline-none focus:ring-2 focus:ring-rf-sage focus:border-transparent"
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-rf-accent hover:bg-rf-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-rf-gray">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-rf-sage hover:text-rf-cream">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
