'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input, Card, ErrorMessage, GoogleSignInButton } from '@/components/ui';
import { useAuth } from '@/hooks';
import { loginSchema, type LoginInput } from '@/lib/validations';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'You cancelled the sign-in. Please try again.',
  google_oauth_not_configured: 'Google sign-in is not configured. Please use email and password.',
  token_exchange_failed: 'Google sign-in failed. Please try again.',
  userinfo_failed: 'Could not get your profile from Google. Please try again.',
  no_email: 'Your Google account has no email. Please use a different account.',
  account_disabled: 'Your account has been disabled. Please contact support.',
  oauth_failed: 'Something went wrong. Please try again.',
  missing_code: 'Invalid sign-in attempt. Please try again.',
};

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const errorParam = searchParams.get('error');
  const { login } = useAuth();

  useEffect(() => {
    if (errorParam) {
      const hint = searchParams.get('hint');
      const msg = GOOGLE_ERROR_MESSAGES[errorParam] || 'Sign-in failed. Please try again.';
      setError(hint ? `${msg} (${hint})` : msg);
    }
  }, [errorParam, searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setError(''); // Clear any Google error

    const result = await login(data.email, data.password);
    
    if (result.success) {
      let redirectPath = '/search';
      if (redirect) {
        try {
          redirectPath = decodeURIComponent(redirect);
          if (!redirectPath.startsWith('/')) redirectPath = '/search';
        } catch {
          redirectPath = '/search';
        }
      }
      router.push(redirectPath);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <Card className="shadow-md">
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <ErrorMessage message={error} />
        )}
        
        <div className="space-y-4">
          <Input
            label="Email address"
            type="email"
            placeholder="Enter your email"
            error={errors.email?.message}
            {...register('email')}
          />
          
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              Forgot password?
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            type="submit"
            loading={loading}
            fullWidth
          >
            Sign in
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <GoogleSignInButton fullWidth redirect={redirect || undefined} />
        </div>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Sign in to your account
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link href="/register" className="font-medium text-primary-600 hover:text-primary-700 transition-colors">
              create a new account
            </Link>
          </p>
        </div>
        
        <Suspense fallback={
          <Card className="shadow-md">
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary-200 border-t-primary-600"></div>
              <p className="mt-4 text-gray-600 text-sm">Loading...</p>
            </div>
          </Card>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
