'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, ErrorMessage } from '@/components/ui';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/hooks';
import api from '@/lib/api-client';
import {
  DocumentMagnifyingGlassIcon,
  ArrowLeftIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

interface VerificationItem {
  id: string;
  title: string;
  address: string;
  verificationSubmittedAt: string | null;
  verificationDocumentUrls: string[];
  verificationExtractedAddress: string | null;
  verificationExtractedName: string | null;
  owner: { id: string; name: string; email: string };
}

export default function AdminVerificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [items, setItems] = useState<VerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  const isAdmin = user?.roles?.includes('ADMIN');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent('/admin/verifications')}`);
      return;
    }
    if (!authLoading && isAuthenticated && !isAdmin) {
      setError('Admin access required.');
      setLoading(false);
      return;
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<{ verifications?: VerificationItem[] }>('/admin/verifications');
        const payload = (res as { data?: { data?: { verifications?: VerificationItem[] } } }).data;
        setItems(Array.isArray(payload?.data?.verifications) ? payload.data.verifications : []);
      } catch (e: any) {
        if (e.response?.status === 403) {
          setError('Admin access required.');
        } else {
          setError('Failed to load verifications.');
        }
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAdmin]);

  const handleApprove = async (drivewayId: string) => {
    setActioningId(drivewayId);
    try {
      await api.patch(`/admin/verifications/${drivewayId}`, { action: 'approve' });
      setItems((prev) => prev.filter((i) => i.id !== drivewayId));
    } catch {
      setError('Failed to approve.');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (drivewayId: string) => {
    setActioningId(drivewayId);
    try {
      await api.patch(`/admin/verifications/${drivewayId}`, {
        action: 'reject',
        rejectionReason: rejectReason[drivewayId] || undefined,
      });
      setItems((prev) => prev.filter((i) => i.id !== drivewayId));
      setRejectReason((prev) => ({ ...prev, [drivewayId]: '' }));
    } catch {
      setError('Failed to reject.');
    } finally {
      setActioningId(null);
    }
  };

  if (authLoading || (isAuthenticated && loading && items.length === 0)) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification queue</h1>
        <p className="text-gray-600 mb-6">
          Review pending address-proof submissions. Open the document, then approve or reject.
        </p>

        {error && (
          <ErrorMessage
            title="Error"
            message={error}
            onRetry={() => window.location.reload()}
          />
        )}

        {!error && items.length === 0 && (
          <Card className="p-8 text-center text-gray-600">
            No pending verifications.
          </Card>
        )}

        {!error && items.length > 0 && (
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{item.address}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Owner: {item.owner.name} ({item.owner.email})
                    </p>
                    {item.verificationExtractedAddress && (
                      <p className="text-xs text-gray-500 mt-1">
                        Extracted address: {item.verificationExtractedAddress}
                      </p>
                    )}
                    {item.verificationExtractedName && (
                      <p className="text-xs text-gray-500">
                        Extracted name: {item.verificationExtractedName}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {item.verificationDocumentUrls?.length > 0 &&
                      item.verificationDocumentUrls.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setViewerUrl(url)}
                          className="inline-flex items-center gap-2 text-sm text-primary-600 hover:underline"
                        >
                          <DocumentMagnifyingGlassIcon className="w-4 h-4" />
                          View document {item.verificationDocumentUrls.length > 1 ? idx + 1 : ''}
                        </button>
                      ))}
                    <div className="flex flex-wrap gap-2 items-end">
                      <input
                        type="text"
                        placeholder="Rejection reason (optional)"
                        value={rejectReason[item.id] ?? ''}
                        onChange={(e) =>
                          setRejectReason((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        className="input text-sm max-w-xs"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleReject(item.id)}
                        disabled={actioningId !== null}
                      >
                        {actioningId === item.id ? 'Rejecting…' : 'Reject'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(item.id)}
                        disabled={actioningId !== null}
                      >
                        {actioningId === item.id ? 'Approving…' : 'Approve'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* In-page document viewer modal */}
        {viewerUrl && (
          <div
            className="fixed inset-0 z-modal flex items-center justify-center bg-black/70 p-4"
            onClick={() => setViewerUrl(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Document viewer"
          >
            <div
              className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-3 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">Document</span>
                <button
                  type="button"
                  onClick={() => setViewerUrl(null)}
                  className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  aria-label="Close"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-auto p-4 bg-gray-100">
                {(() => {
                  const proxyUrl = `/api/admin/verification-document?url=${encodeURIComponent(viewerUrl)}`;
                  const isImage = /\.(jpe?g|png|webp|gif)(\?|$)/i.test(viewerUrl);
                  if (isImage) {
                    return (
                      <img
                        src={proxyUrl}
                        alt="Verification document"
                        className="max-w-full max-h-[75vh] mx-auto rounded object-contain"
                      />
                    );
                  }
                  return (
                    <div className="flex flex-col gap-4 h-[75vh]">
                      <embed
                        src={proxyUrl}
                        type="application/pdf"
                        className="flex-1 min-h-0 w-full rounded border border-gray-200 bg-white"
                        title="Verification document"
                      />
                      <a
                        href={proxyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
                      >
                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        Open PDF in new tab
                      </a>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
