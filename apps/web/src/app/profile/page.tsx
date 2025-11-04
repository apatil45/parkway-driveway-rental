'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Input, Button, ImageUpload, AddressAutocomplete } from '@/components/ui';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/hooks';
import { useToast } from '@/components/ui/Toast';
import api from '@/lib/api';
import { UserIcon, EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    avatar: ''
  });

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push('/login');
      return;
    }

    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        avatar: user.avatar || ''
      });
      setLoading(false);
    }
  }, [user, isAuthenticated, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.patch('/auth/profile', {
        name: form.name,
        phone: form.phone || undefined,
        address: form.address || undefined,
        avatar: form.avatar || undefined
      });
      
      showToast('Profile updated successfully!', 'success');
      // Refresh user data
      window.location.reload();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to update profile';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="h-8 w-64 skeleton mb-6"></div>
            <div className="space-y-4">
              <div className="h-20 skeleton"></div>
              <div className="h-20 skeleton"></div>
              <div className="h-20 skeleton"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">My Profile</h1>

          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Avatar Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture
                </label>
                <div className="flex items-center gap-4">
                  {form.avatar ? (
                    <img
                      src={form.avatar}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <ImageUpload
                    value={form.avatar ? [form.avatar] : []}
                    onChange={(urls) => setForm({ ...form, avatar: urls[0] || '' })}
                    maxImages={1}
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Name */}
              <div>
                <Input
                  label="Full Name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  leftIcon={<UserIcon className="w-5 h-5" />}
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <EnvelopeIcon className="w-5 h-5" />
                  </span>
                  <input
                    type="email"
                    value={form.email}
                    disabled
                    className="w-full pl-9 pr-3 py-2.5 text-base border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
              </div>

              {/* Phone */}
              <div>
                <Input
                  label="Phone Number"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Enter your phone number"
                  leftIcon={<PhoneIcon className="w-5 h-5" />}
                />
              </div>

              {/* Address */}
              <div>
                <AddressAutocomplete
                  label="Address"
                  value={form.address}
                  onChange={(address) => setForm({ ...form, address })}
                  placeholder="Enter your address"
                  disabled={saving}
                />
              </div>

              {/* Roles Display (Read-only) */}
              {user?.roles && user.roles.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Roles
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {user.roles.map((role) => (
                      <span
                        key={role}
                        className="px-3 py-1 bg-primary-100 text-primary-800 text-sm font-medium rounded-full"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.back()}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

