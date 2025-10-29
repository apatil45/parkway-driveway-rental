'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, Card, ErrorMessage } from '@/components/ui';
import { useAuth } from '@/hooks';
import { registerSchema, type RegisterInput } from '@/lib/validations';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { register: registerUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<RegisterInput & { confirmPassword: string }>({
    resolver: zodResolver(registerSchema.extend({
      confirmPassword: registerSchema.shape.password
    }))
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterInput & { confirmPassword: string }) => {
    setLoading(true);
    setError('');

    if (data.password !== data.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const { confirmPassword, ...registerData } = data;
    const result = await registerUser(registerData);
    
    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const roleOptions = [
    { value: 'DRIVER', label: 'Driver' },
    { value: 'OWNER', label: 'Driveway Owner' },
    { value: 'ADMIN', label: 'Admin' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
              sign in to your existing account
            </Link>
          </p>
        </div>
        
        <Card>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <ErrorMessage message={error} />
            )}
            
            <div className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                placeholder="Enter your full name"
                error={errors.name?.message}
                {...register('name')}
              />
              
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
                placeholder="Create a password"
                error={errors.password?.message}
                {...register('password')}
              />
              
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I want to:
                </label>
                <div className="space-y-2">
                  {roleOptions.map((role) => (
                    <label key={role.value} className="flex items-center">
                      <input
                        type="checkbox"
                        value={role.value}
                        {...register('roles')}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{role.label}</span>
                    </label>
                  ))}
                </div>
                {errors.roles && (
                  <p className="mt-1 text-sm text-red-600">{errors.roles.message}</p>
                )}
              </div>
              
              <Input
                label="Phone Number (Optional)"
                type="tel"
                placeholder="Enter your phone number"
                error={errors.phone?.message}
                {...register('phone')}
              />
              
              <Input
                label="Address (Optional)"
                type="text"
                placeholder="Enter your address"
                error={errors.address?.message}
                {...register('address')}
              />
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full"
            >
              Create account
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
