'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input, Card, ErrorMessage } from '@/components/ui';
import { useAuth } from '@/hooks';
import { loginSchema, type LoginInput } from '@/lib/validations';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setError('');

    const result = await login(data.email, data.password);
    
    if (result.success) {
      let redirectPath = '/dashboard';
      if (redirect) {
        try {
          redirectPath = decodeURIComponent(redirect);
          if (!redirectPath.startsWith('/')) redirectPath = '/dashboard';
        } catch {
          redirectPath = '/dashboard';
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
        </div>

        <Button
          type="submit"
          loading={loading}
          fullWidth
        >
          Sign in
        </Button>
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
