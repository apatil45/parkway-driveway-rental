'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Input, Button, ImageUpload, AddressAutocomplete } from '@/components/ui';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/hooks';
import { useToast } from '@/components/ui/Toast';
import api from '@/lib/api-client';
import { UserIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

type FormState = {
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
  roles: string[];
};

const emptyForm: FormState = {
  name: '',
  email: '',
  phone: '',
  address: '',
  avatar: '',
  roles: [],
};

function userToForm(user: { name?: string | null; email?: string | null; phone?: string | null; address?: string | null; avatar?: string | null; roles?: string[] | null }): FormState {
  const roles = (user.roles ?? []).filter((r: string) => r === 'DRIVER' || r === 'OWNER');
  return {
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || '',
    avatar: user.avatar || '',
    roles: roles.length > 0 ? roles : ['DRIVER'],
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const applyUser = useCallback((u: typeof user) => {
    if (u) setForm(userToForm(u));
  }, []);

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push(`/login?redirect=${encodeURIComponent('/profile')}`);
      return;
    }
    if (user) {
      applyUser(user);
      setLoading(false);
    }
  }, [user, isAuthenticated, loading, router, applyUser]);

  const startEditing = () => {
    if (user) applyUser(user);
    setError('');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (user) applyUser(user);
    setError('');
    setIsEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await api.patch<FormState>('/auth/profile', {
        name: form.name,
        phone: form.phone || undefined,
        address: form.address || undefined,
        avatar: form.avatar || undefined,
        roles: (form.roles ?? []).length > 0 ? (form.roles ?? []) : ['DRIVER'],
      });
      const userData = res.data.data;
      if (userData && typeof userData === 'object') setForm(userToForm(userData));
      showToast('Profile updated successfully!', 'success');
      setIsEditing(false);
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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">My Profile</h1>
            {!isEditing && (
              <Button variant="primary" onClick={startEditing}>
                <PencilSquareIcon className="w-5 h-5 mr-2" />
                Edit profile
              </Button>
            )}
          </div>

          <Card>
            {!isEditing ? (
              /* View mode: read-only */
              <div className="space-y-6">
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
                  <div>
                    <p className="text-sm font-medium text-gray-500">Profile picture</p>
                    <p className="text-lg font-medium text-gray-900">{form.name || '—'}</p>
                  </div>
                </div>

                <dl className="grid gap-4 sm:grid-cols-1">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Full name</dt>
                    <dd className="mt-0.5 text-gray-900">{form.name || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-0.5 text-gray-900">{form.email || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="mt-0.5 text-gray-900">{form.phone || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                    <dd className="mt-0.5 text-gray-900">{form.address || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">I use Parkway as</dt>
                    <dd className="mt-1 flex flex-wrap gap-2">
                      {(form.roles ?? []).map((r) => (
                        <span key={r} className="px-2.5 py-0.5 bg-primary-100 text-primary-800 text-sm font-medium rounded-full">
                          {r === 'DRIVER' ? 'Driver' : r === 'OWNER' ? 'Owner' : r}
                        </span>
                      ))}
                      {(!form.roles || form.roles.length === 0) && <span className="text-gray-500">—</span>}
                    </dd>
                    {Array.isArray(user?.roles) && user.roles.includes('ADMIN') && (
                      <p className="mt-1 text-xs text-gray-500">You also have admin access (managed separately).</p>
                    )}
                  </div>
                </dl>
              </div>
            ) : (
              /* Edit mode: form */
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                  <div className="flex items-center gap-4">
                    {form.avatar ? (
                      <img src={form.avatar} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-gray-200" />
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
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

                <div>
                  <AddressAutocomplete
                    label="Address"
                    value={form.address}
                    onChange={(address) => setForm({ ...form, address })}
                    placeholder="Enter your address"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">I use Parkway as</label>
                  <p className="text-xs text-gray-500 mb-2">You can be both. At least one role is required.</p>
                  <div className="flex flex-wrap gap-4">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(form.roles ?? []).includes('DRIVER')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm((prev) => ({ ...prev, roles: Array.from(new Set([...(prev.roles ?? []), 'DRIVER'])) }));
                          } else {
                            setForm((prev) => {
                              const next = (prev.roles ?? []).filter((r) => r !== 'DRIVER');
                              return { ...prev, roles: next.length ? next : ['OWNER'] };
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        disabled={saving}
                      />
                      <span className="text-sm font-medium text-gray-700">Driver</span>
                      <span className="text-xs text-gray-500">(find & book parking)</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(form.roles ?? []).includes('OWNER')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm((prev) => ({ ...prev, roles: Array.from(new Set([...(prev.roles ?? []), 'OWNER'])) }));
                          } else {
                            setForm((prev) => {
                              const next = (prev.roles ?? []).filter((r) => r !== 'OWNER');
                              return { ...prev, roles: next.length ? next : ['DRIVER'] };
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        disabled={saving}
                      />
                      <span className="text-sm font-medium text-gray-700">Owner</span>
                      <span className="text-xs text-gray-500">(list my driveway)</span>
                    </label>
                  </div>
                  {Array.isArray(user?.roles) && user.roles.includes('ADMIN') && (
                    <p className="mt-2 text-xs text-gray-500">You also have admin access (managed separately).</p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button type="button" variant="secondary" onClick={cancelEditing} disabled={saving}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={saving}>
                    Save Changes
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

