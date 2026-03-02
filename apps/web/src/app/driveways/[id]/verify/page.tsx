'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, ErrorMessage } from '@/components/ui';
import { AppLayout } from '@/components/layout';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks';
import api from '@/lib/api-client';
import {
  ShieldCheckIcon,
  DocumentArrowUpIcon,
  ClockIcon,
  XCircleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

type VerificationStatus = 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';

interface VerificationState {
  verificationStatus: VerificationStatus;
  submittedAt: string | null;
  verifiedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
}

export default function VerifyDrivewayPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const drivewayId = params?.id as string;

  const [driveway, setDriveway] = useState<{ id: string; title: string; address: string } | null>(null);
  const [status, setStatus] = useState<VerificationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push(`/login?redirect=${encodeURIComponent(`/driveways/${drivewayId}/verify`)}`);
      return;
    }
  }, [isAuthenticated, authLoading, router, drivewayId]);

  useEffect(() => {
    if (!drivewayId || !isAuthenticated) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [drivewayRes, verifyRes] = await Promise.all([
          api.get<{ id: string; title: string; address: string }>(`/driveways/${drivewayId}`),
          api.get<VerificationState>(`/driveways/${drivewayId}/verify`),
        ]);
        setDriveway(drivewayRes.data.data);
        setStatus(verifyRes.data.data);
      } catch (e: any) {
        if (e.response?.status === 403 || e.response?.status === 404) {
          setError('You can only verify your own listings.');
        } else {
          setError('Failed to load verification status.');
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [drivewayId, isAuthenticated]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []).slice(0, 2);
    const allowed = selected.filter(
      (f) =>
        f.type === 'application/pdf' ||
        f.type === 'image/jpeg' ||
        f.type === 'image/png' ||
        f.type === 'image/webp'
    );
    setFiles(allowed);
    setUploadedUrls([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drivewayId || files.length === 0) {
      showToast('Please upload at least one document (PDF or image).', 'error');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
const res = await api.post<{ url: string }>('/upload/verification-document', formData);
        urls.push(res.data.data.url);
      }

      await api.post(`/driveways/${drivewayId}/verify`, { documentUrls: urls });
      showToast('Documents submitted. We’ll review them shortly.', 'success');
const verifyRes = await api.get<VerificationState>(`/driveways/${drivewayId}/verify`);
      setStatus(verifyRes.data.data);
      setFiles([]);
      setUploadedUrls([]);
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Failed to submit verification.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated || error) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          {error && (
            <ErrorMessage
              title="Error"
              message={error}
              onRetry={() => window.location.reload()}
            />
          )}
          <Link href="/driveways" className="inline-flex items-center gap-2 text-primary-600 hover:underline mt-4">
            <ArrowLeftIcon className="w-4 h-4" /> Back to My Driveways
          </Link>
        </div>
      </AppLayout>
    );
  }

  const isPending = status?.verificationStatus === 'PENDING';
  const isVerified = status?.verificationStatus === 'VERIFIED';
  const isRejected = status?.verificationStatus === 'REJECTED';

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link
          href={`/driveways/${drivewayId}/edit`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to listing
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify this listing</h1>
        {driveway && (
          <p className="text-gray-600 mb-6">{driveway.title} — {driveway.address}</p>
        )}

        {isVerified && (
          <Card className="mb-6 p-6 border-green-200 bg-green-50">
            <div className="flex items-center gap-3 text-green-800">
              <ShieldCheckIcon className="w-8 h-8" />
              <div>
                <p className="font-semibold">This listing is verified</p>
                <p className="text-sm">Renters will see a Verified badge on your listing.</p>
              </div>
            </div>
          </Card>
        )}

        {isRejected && status?.rejectionReason && (
          <Card className="mb-6 p-6 border-amber-200 bg-amber-50">
            <div className="flex items-start gap-3 text-amber-800">
              <XCircleIcon className="w-6 h-6 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Verification was not approved</p>
                <p className="text-sm mt-1">{status.rejectionReason}</p>
                <p className="text-sm mt-2">You can upload a different document and try again below.</p>
              </div>
            </div>
          </Card>
        )}

        {isPending && (
          <Card className="mb-6 p-6 border-blue-200 bg-blue-50">
            <div className="flex items-center gap-3 text-blue-800">
              <ClockIcon className="w-8 h-8" />
              <div>
                <p className="font-semibold">Review in progress</p>
                <p className="text-sm">We’ll usually review within 1–2 business days. You’ll see the result here.</p>
              </div>
            </div>
          </Card>
        )}

        {(status?.verificationStatus === 'NONE' || isRejected) && (
          <Card className="p-6">
            <p className="text-gray-700 mb-4">
              Upload a document that shows your name and this address (e.g. deed, lease, or utility bill).
              We’ll check it and, when approved, renters will see a Verified badge.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document (PDF or image, max 5MB each, 1–2 files)
                </label>
                <input
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary-50 file:text-primary-700"
                />
                {files.length > 0 && (
                  <p className="text-sm text-gray-500 mt-1">{files.length} file(s) selected</p>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={files.length === 0 || submitting}
                  loading={submitting}
                >
                  Submit for verification
                </Button>
                <Link href="/driveways">
                  <Button type="button" variant="secondary">Cancel</Button>
                </Link>
              </div>
            </form>
          </Card>
        )}

        {isVerified && (
          <p className="text-sm text-gray-500 mt-4">
            If you need to update your proof (e.g. new address), edit the listing address first; verification will reset and you can submit again.
          </p>
        )}
      </div>
    </AppLayout>
  );
}
