'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Input, Card, ErrorMessage } from '@/components/ui';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '@/lib/api-client';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [devResetLink, setDevResetLink] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setApiError('');
    setSuccess(false);
    setDevResetLink(null);
    try {
      // API returns { data: { message?, resetLink? (dev only) } }; client types res.data as { data: T }
      const res = await api.post<{ message?: string; resetLink?: string }>('/auth/forgot-password', { email: data.email });
      setSuccess(true);
      const resetLink = res.data?.data?.resetLink;
      if (resetLink) setDevResetLink(resetLink);
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Something went wrong. Please try again.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        <Card className="shadow-md">
          {success ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-green-800 text-sm">
                If an account exists with that email, you will receive reset instructions. Check your inbox and spam folder.
              </div>
              {devResetLink && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm">
                  <p className="font-medium text-blue-800 mb-2">Development only: use this link to reset</p>
                  <a
                    href={devResetLink}
                    className="text-primary-600 hover:text-primary-700 underline break-all"
                  >
                    {devResetLink}
                  </a>
                </div>
              )}
              <Link href="/login" className="block">
                <Button variant="outline" fullWidth>Back to sign in</Button>
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {apiError && <ErrorMessage message={apiError} />}
              <Input
                label="Email address"
                type="email"
                placeholder="Enter your email"
                error={errors.email?.message}
                {...register('email')}
              />
              <Button type="submit" loading={loading} fullWidth>
                Send reset link
              </Button>
              <Link href="/login" className="block text-center text-sm text-gray-600 hover:text-gray-900">
                Back to sign in
              </Link>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
