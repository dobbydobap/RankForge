'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@rankforge/shared';
import { useAuthStore } from '@/stores/auth-store';

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
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
            Create your account
          </h1>
          <p className="mt-1 text-sm text-rf-gray">
            Start competing and tracking your progress
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-rf-sage mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              {...register('username')}
              className="w-full px-3 py-2 bg-rf-dark border border-rf-iron rounded-lg text-rf-cream placeholder-rf-iron focus:outline-none focus:ring-2 focus:ring-rf-sage focus:border-transparent"
              placeholder="coolcoder42"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-400">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-rf-sage mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="w-full px-3 py-2 bg-rf-dark border border-rf-iron rounded-lg text-rf-cream placeholder-rf-iron focus:outline-none focus:ring-2 focus:ring-rf-sage focus:border-transparent"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
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
              placeholder="At least 8 characters"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
            )}
            <p className="mt-1 text-xs text-rf-muted">
              Must contain uppercase, lowercase, and a number
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-rf-accent hover:bg-rf-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-rf-gray">
          Already have an account?{' '}
          <Link href="/login" className="text-rf-sage hover:text-rf-cream">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
