'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input, Card, ErrorMessage } from '@/components/ui';
import PasswordStrengthMeter from '@/components/ui/PasswordStrengthMeter';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '@/lib/api-client';

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'At least one uppercase letter')
      .regex(/[a-z]/, 'At least one lowercase letter')
      .regex(/\d/, 'At least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  const newPassword = watch('newPassword');

  useEffect(() => {
    if (!token && typeof window !== 'undefined') {
      router.replace('/forgot-password');
    }
  }, [token, router]);

  const onSubmit = async (data: FormData) => {
    if (!token) return;
    setLoading(true);
    setApiError('');
    try {
      await api.post('/auth/reset-password', { token, newPassword: data.newPassword });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Something went wrong. Please try again.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Card className="shadow-md">
        <p className="text-gray-600 text-center">Invalid or missing reset link. Redirecting...</p>
        <Link href="/forgot-password" className="block mt-4 text-center text-primary-600 hover:text-primary-700 text-sm">
          Request a new link
        </Link>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="shadow-md">
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-green-800 text-sm text-center">
          Your password has been reset. Redirecting you to sign in...
        </div>
        <Link href="/login" className="block mt-4 text-center">
          <Button variant="outline" fullWidth>Go to sign in</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {apiError && <ErrorMessage message={apiError} />}
        <div>
          <Input
            label="New password"
            type="password"
            placeholder="Enter new password"
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          {newPassword && (
            <div className="mt-2">
              <PasswordStrengthMeter password={newPassword} />
            </div>
          )}
        </div>
        <Input
          label="Confirm new password"
          type="password"
          placeholder="Confirm new password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" loading={loading} fullWidth>
          Reset password
        </Button>
        <Link href="/forgot-password" className="block text-center text-sm text-gray-600 hover:text-gray-900">
          Request a new reset link
        </Link>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Set new password
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new password below.
          </p>
        </div>
        <Suspense
          fallback={
            <Card className="shadow-md">
              <div className="py-8 text-center text-gray-500">Loading...</div>
            </Card>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
