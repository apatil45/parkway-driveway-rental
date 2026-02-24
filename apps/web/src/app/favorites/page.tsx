'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api-client';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/hooks';
import { Button, ImageWithPlaceholder } from '@/components/ui';
import FavoriteButton from '@/components/ui/FavoriteButton';
import { HeartIcon } from '@heroicons/react/24/outline';



interface FavoriteRecord {
  id: string;
  userId: string;
  drivewayId: string;
  createdAt: string;
  driveway: {
    id: string;
    title: string;
    description?: string;
    address: string;
    pricePerHour: number;
    capacity: number;
    carSize: string[];
    amenities: string[];
    images: string[];
    owner: { id: string; name: string; avatar?: string };
    reviews: Array<{ rating: number }>;
  };
}

export default function FavoritesPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // send to login if not authn
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, authLoading, router]);

  // get favorites when user is authn
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    let cancelled = false;
    setLoading(true);
    setError('');

    api
      .get<{ success: boolean; data: FavoriteRecord[] }>('/favorites')
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data;
        setFavorites(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err.response?.data?.message || 'Failed to load favorites';
        setError(msg);
        setFavorites([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  
  const handleRemoveFavorite = (drivewayId: string) => {
    setFavorites((prev) => prev.filter((f) => f.driveway.id !== drivewayId));
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

  const averageRating = (reviews: Array<{ rating: number }>) => {
    if (!reviews?.length) return 0;
    const sum = reviews.reduce((a, r) => a + r.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}
      >
        ★
      </span>
    ));

  // Still loading auth or we're about to redirect
  if (authLoading || !isAuthenticated) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-6" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Favorites</h1>
          <p className="text-gray-600 mb-6">
            Driveways you saved. Click one to view details or remove it from favorites.
          </p>

          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
              <p className="font-medium">Couldn&apos;t load favorites</p>
              <p className="text-sm mt-1">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
                Try again
              </Button>
            </div>
          )}

          {!loading && !error && favorites.length === 0 && (
            <div className="text-center py-12 rounded-xl border border-[color:rgb(var(--color-border))] bg-[color:rgb(var(--color-surface))] shadow-sm">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <HeartIcon className="w-7 h-7 text-gray-500" aria-hidden />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No favorites yet</h3>
              <p className="text-gray-600 text-sm mb-6 max-w-sm mx-auto">
                Save driveways from search or a listing page to see them here.
              </p>
              <Link href="/search" className="btn btn-primary inline-flex items-center justify-center min-h-[44px] px-6">
                Browse driveways
              </Link>
            </div>
          )}

          {!loading && !error && favorites.length > 0 && (
            <div className="space-y-3">
              {favorites.map((fav) => {
                const d = fav.driveway;
                const rating = averageRating(d.reviews);
                const reviewCount = d.reviews?.length ?? 0;
                return (
                  <div
                    key={fav.id}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="flex">
                      <Link href={`/driveway/${d.id}`} className="w-28 sm:w-36 flex-shrink-0 block">
                        <ImageWithPlaceholder
                          src={d.images?.length ? d.images[0] : ''}
                          alt={d.title}
                          className="w-full h-24 sm:h-28 object-cover"
                          fallbackText={(d.title?.charAt(0) ?? '?').toUpperCase()}
                        />
                      </Link>
                      <div className="flex-1 p-3 sm:p-4 flex flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link
                              href={`/driveway/${d.id}`}
                              className="font-semibold text-gray-900 hover:text-primary-600 line-clamp-1"
                            >
                              {d.title}
                            </Link>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{d.address}</p>
                          </div>
                          <FavoriteButton
                            drivewayId={d.id}
                            isFavorite={true}
                            onToggle={(newState) => {
                              if (!newState) handleRemoveFavorite(d.id);
                            }}
                          />
                        </div>
                        <div className="mt-1.5 flex items-center gap-3 text-sm">
                          <span className="font-semibold text-primary-600">
                            {formatPrice(d.pricePerHour)}/hr
                          </span>
                          {reviewCount > 0 && (
                            <span className="flex items-center gap-1 text-gray-600">
                              {renderStars(rating)}
                              <span className="text-xs">({reviewCount})</span>
                            </span>
                          )}
                        </div>
                        {d.amenities?.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {d.amenities.slice(0, 3).map((a) => (
                              <span
                                key={a}
                                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full"
                              >
                                {a.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
