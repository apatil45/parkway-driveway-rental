'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { Card, Button, ButtonLink, LoadingSpinner, AddressAutocomplete, ImageWithPlaceholder } from '@/components/ui';
import { useAuth } from '@/hooks';
import api from '@/lib/api-client';
import { getPrimaryMarket } from '@/lib/market-config';
import {
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  ClockIcon,
  StarIcon,
  HomeIcon,
  BookOpenIcon,
  ChartBarIcon,
  CheckCircleIcon,
  UserGroupIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

interface PublicStats {
  totalUsers: number;
  totalDriveways: number;
  activeDriveways: number;
  totalBookings: number;
  completedBookings: number;
  totalEarnings: number;
  averageRating: number;
}

export default function Home() {
  const primaryMarket = getPrimaryMarket();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState('');
  const [searchCoords, setSearchCoords] = useState<{ lat: number; lon: number } | null>(null);

  const isOwner = user?.roles.includes('OWNER');
  const isDriver = user?.roles.includes('DRIVER');

  useEffect(() => {
    // Fetch public stats (non-blocking - page can render without stats)
    const fetchStats = async () => {
      try {
        const response = await api.get<PublicStats>('/stats/public');
        setStats(response.data.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Don't block page rendering if stats fail
      } finally {
        setStatsLoading(false);
      }
    };

    // Fetch real reviews for testimonials
    const fetchTestimonials = async () => {
      try {
        const response = await api.get<{ reviews?: any[] }>('/reviews?limit=3&page=1');
        setTestimonials(response.data.data?.reviews ?? []);
      } catch (error) {
        console.error('Failed to fetch testimonials:', error);
        // Don't block page rendering if testimonials fail
      } finally {
        setTestimonialsLoading(false);
      }
    };

    fetchStats();
    fetchTestimonials();
  }, []);

  const handleSearch = (lat: number, lon: number) => {
    setSearchCoords({ lat, lon });
    router.push(`/search?latitude=${lat}&longitude=${lon}`);
  };

  const handleLocationInputChange = (value: string) => {
    setSearchLocation(value);
  };

  const handleSearchSubmit = () => {
    if (searchCoords) {
      router.push(`/search?latitude=${searchCoords.lat}&longitude=${searchCoords.lon}`);
    } else {
      router.push(searchLocation ? `/search?location=${encodeURIComponent(searchLocation)}` : '/search');
    }
  };

  // Only wait for auth to load, not stats (stats can load in background)
  // Add timeout to prevent infinite loading
  const [authTimeout, setAuthTimeout] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (authLoading) {
        setAuthTimeout(true);
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timer);
  }, [authLoading]);

  // Show loading only if auth is still loading and hasn't timed out
  if (authLoading && !authTimeout) {
    return (
      <AppLayout showFooter={false}>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </AppLayout>
    );
  }

  // Logged-in user view
  if (isAuthenticated && user) {
    return (
      <AppLayout showFooter={false}>
        <div className="min-h-screen" role="presentation">
          {/* Hero: primary action above the fold — search/list. Minimal scroll on mobile. */}
          <section className="bg-white border-b border-gray-200">
            <div className="container py-5 sm:py-8 md:py-10">
              <div className="grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-center">
                <div className="max-w-md">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                    Welcome back, {user.name?.split(' ')[0]}
                  </h1>
                  <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                    {isOwner && isDriver
                      ? 'Book a spot or manage your listings'
                      : isOwner
                      ? 'Your listings and payouts in one place'
                      : 'Find and book nearby driveway parking fast'}
                  </p>
                  {/* Search block: location + CTA — primary conversion point */}
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 sm:p-4 md:p-5 shadow-sm">
                    <p className="text-sm font-medium text-gray-700 mb-2 sm:mb-3">Where are you going?</p>
                    <AddressAutocomplete
                      value={searchLocation}
                      onChange={handleLocationInputChange}
                      onLocationSelect={handleSearch}
                      placeholder="Address, landmark, or transit stop..."
                      className="w-full"
                      variant="hero"
                    />
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button
                        type="button"
                        onClick={handleSearchSubmit}
                        className="flex-1 min-w-0"
                      >
                        Find parking
                      </Button>
                      {isOwner && (
                        <Link
                          href="/driveways/new"
                          className="inline-flex items-center justify-center font-medium rounded-lg border border-[color:rgb(var(--color-border))] bg-[color:rgb(var(--color-surface))] text-[color:rgb(var(--color-surface-foreground))] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 min-h-[44px] min-w-[44px] flex-1 min-w-0 touch-manipulation transition-colors shadow-sm"
                        >
                          List a spot
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
                <div className="relative hidden md:block aspect-[4/3] max-h-[280px] lg:max-h-[320px] rounded-xl overflow-hidden bg-gray-100">
                  <Image
                    src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80"
                    alt="Car parked in a driveway — find or list parking near you"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 0px, 50vw"
                    priority
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Quick Actions: shortcuts (redundant with nav). Compact on mobile to reduce scroll. */}
          <section className="py-6 sm:py-8 md:py-12 bg-gray-50">
            <div className="container">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {isDriver && (
                  <Link href="/search">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full p-3 sm:p-4 md:p-6">
                      <div className="flex items-start gap-3">
                        <div className="p-2 sm:p-3 bg-primary-100 rounded-lg shrink-0">
                          <MagnifyingGlassIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-700" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-0.5 md:mb-2">Find Parking</h3>
                          <p className="text-gray-600 text-xs sm:text-sm hidden sm:block">
                            Search driveways near your destination
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                )}

                {isOwner && (
                  <Link href="/driveways/new">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full p-3 sm:p-4 md:p-6">
                      <div className="flex items-start gap-3">
                        <div className="p-2 sm:p-3 bg-green-100 rounded-lg shrink-0">
                          <HomeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-700" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-0.5 md:mb-2">List Driveway</h3>
                          <p className="text-gray-600 text-xs sm:text-sm hidden sm:block">
                            Earn from your unused space
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                )}

                <Link href="/bookings">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full p-3 sm:p-4 md:p-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 sm:p-3 bg-blue-100 rounded-lg shrink-0">
                        <BookOpenIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-0.5 md:mb-2">My Bookings</h3>
                        <p className="text-gray-600 text-xs sm:text-sm hidden sm:block">
                          View and manage bookings
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>

                <Link href="/dashboard">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full p-3 sm:p-4 md:p-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 sm:p-3 bg-purple-100 rounded-lg shrink-0">
                        <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-700" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-0.5 md:mb-2">Dashboard</h3>
                        <p className="text-gray-600 text-xs sm:text-sm hidden sm:block">
                          Stats and account overview
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              </div>
            </div>
          </section>

          {/* Platform Stats: secondary for logged-in users. Compact on mobile to avoid scroll. */}
          <section className="py-6 sm:py-8 md:py-12">
            <div className="container">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-6">Platform at a Glance</h2>
              {statsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="text-center p-3 md:p-6">
                      <div className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 md:mb-2 skeleton rounded"></div>
                      <div className="h-6 md:h-8 w-12 md:w-16 mx-auto mb-1 md:mb-2 skeleton rounded"></div>
                      <div className="h-3 md:h-4 w-14 md:w-20 mx-auto skeleton rounded"></div>
                    </Card>
                  ))}
                </div>
              ) : stats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <Card className="text-center p-3 md:p-6">
                    <UserGroupIcon className="w-6 h-6 md:w-8 md:h-8 text-primary-600 mx-auto mb-1 md:mb-2" aria-hidden="true" />
                    <div className="text-lg md:text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</div>
                    <div className="text-xs md:text-sm text-gray-600">Active Users</div>
                  </Card>
                  <Card className="text-center p-3 md:p-6">
                    <BuildingOfficeIcon className="w-6 h-6 md:w-8 md:h-8 text-primary-600 mx-auto mb-1 md:mb-2" aria-hidden="true" />
                    <div className="text-lg md:text-2xl font-bold text-gray-900">{stats.activeDriveways.toLocaleString()}</div>
                    <div className="text-xs md:text-sm text-gray-600">Available Spaces</div>
                  </Card>
                  <Card className="text-center p-3 md:p-6">
                    <CheckCircleIcon className="w-6 h-6 md:w-8 md:h-8 text-green-600 mx-auto mb-1 md:mb-2" aria-hidden="true" />
                    <div className="text-lg md:text-2xl font-bold text-gray-900">{stats.completedBookings.toLocaleString()}</div>
                    <div className="text-xs md:text-sm text-gray-600">Completed</div>
                  </Card>
                  <Card className="text-center p-3 md:p-6">
                    <StarIcon className="w-6 h-6 md:w-8 md:h-8 text-yellow-500 mx-auto mb-1 md:mb-2" aria-hidden="true" />
                    <div className="text-lg md:text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</div>
                    <div className="text-xs md:text-sm text-gray-600">Avg Rating</div>
                  </Card>
                </div>
              ) : null}
            </div>
          </section>

          {/* Benefits: trust copy. Logged-in users already chose; keep compact on mobile. */}
          <section className="py-6 sm:py-8 md:py-12 bg-gray-50">
            <div className="container">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Why Choose ParkwayAi?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <Card className="p-4 md:p-6">
                  <ShieldCheckIcon className="w-8 h-8 md:w-10 md:h-10 text-primary-600 mb-2 md:mb-4" />
                  <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">Verified & backed</h3>
                  <p className="text-gray-600 text-sm md:text-base">
                    We verify hosts and listings where we can. Payments run through Stripe; you’re not paying cash on the curb.
                  </p>
                </Card>
                <Card className="p-4 md:p-6">
                  <ClockIcon className="w-8 h-8 md:w-10 md:h-10 text-primary-600 mb-2 md:mb-4" />
                  <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">Built for quick stops</h3>
                  <p className="text-gray-600 text-sm md:text-base">
                    See what’s open near you, lock a window, and head over—no circling the block.
                  </p>
                </Card>
                <Card className="p-4 md:p-6">
                  <CurrencyDollarIcon className="w-8 h-8 md:w-10 md:h-10 text-primary-600 mb-2 md:mb-4" />
                  <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">Straightforward pricing</h3>
                  <p className="text-gray-600 text-sm md:text-base">
                    You see the total before you pay. Hosts set hourly rates; platform fees are spelled out upfront.
                  </p>
                </Card>
              </div>
            </div>
          </section>
        </div>
      </AppLayout>
    );
  }

  // Logged-out user view (marketing page)
  return (
    <AppLayout showFooter={true} footerVariant="marketing">
      <div className="min-h-screen" role="presentation">
        {/* Hero: headline, subcopy, search, trust line */}
        <section className="relative bg-[rgb(var(--color-surface))] border-b border-[rgb(var(--color-border))] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary-50/50 to-transparent pointer-events-none" aria-hidden />
          <div className="container relative py-8 sm:py-12 md:py-16 lg:py-20">
            <div className="grid md:grid-cols-2 gap-6 md:gap-10 lg:gap-16 items-center">
              <div className="max-w-lg order-2 md:order-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[rgb(var(--color-surface-foreground))] tracking-tight mb-5 md:mb-6" style={{ letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                  Book driveway parking in minutes.
                </h1>
                <p className="text-base sm:text-lg text-gray-600 mb-4 md:mb-6 max-w-md">
                  Secure, verified driveway rentals in {primaryMarket.displayName}. Book instantly or list your space for free.
                </p>
                {/* Search block — primary conversion, prominent */}
                <div className="rounded-2xl border-2 border-[rgb(var(--color-border))] bg-white p-5 sm:p-6 md:p-7 shadow-xl shadow-primary-900/10 ring-1 ring-black/5">
                  <p className="text-base sm:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Where are you going?</p>
                  <AddressAutocomplete
                    value={searchLocation}
                    onChange={handleLocationInputChange}
                    onLocationSelect={handleSearch}
                    placeholder="Address, landmark, or transit stop..."
                    className="w-full"
                    variant="hero"
                  />
                  <div className="mt-4 sm:mt-5 flex flex-wrap gap-3">
                    <Button
                      type="button"
                      onClick={handleSearchSubmit}
                      variant="accent"
                      size="lg"
                      className="flex-1 min-w-0 rounded-xl px-5"
                    >
                      Find parking
                    </Button>
                    <Link
                      href="/search"
                      className="inline-flex items-center justify-center font-medium rounded-xl border border-[color:rgb(var(--color-border))] bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 min-h-[48px] flex-1 min-w-0 px-5 transition-colors shadow-sm"
                    >
                      Browse all
                    </Link>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  Secure checkout · Verified hosts · Free to list your spot
                </p>
              </div>
              <div className="relative hidden md:block aspect-[4/3] max-h-[320px] lg:max-h-[380px] rounded-2xl overflow-hidden bg-primary-100/50 order-1 md:order-2 ring-1 ring-black/5">
                <Image
                  src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80"
                  alt="Park your car in a driveway — find or list on ParkwayAi"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 0px, 50vw"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Guest: clear next steps — search, list, sign up (no waitlist tone). */}
        <section className="py-8 sm:py-10 bg-gray-50 border-b border-gray-100">
          <div className="container">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="max-w-lg">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Get started</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Now live in {primaryMarket.displayName}. Search spots, list your driveway for free, or create an account.
                </p>
                {stats && !statsLoading && stats.activeDriveways > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    {stats.activeDriveways} spot{stats.activeDriveways === 1 ? '' : 's'} on the map right now.
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:items-center">
                <ButtonLink href="/search" variant="primary" size="lg">
                  Search parking
                </ButtonLink>
                <ButtonLink href="/driveways/new" variant="outline" size="lg">
                  List your driveway
                </ButtonLink>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center text-sm font-medium text-primary-700 hover:text-primary-800 min-h-[44px] px-2 sm:px-3"
                >
                  Sign up free →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works: high scroll cost. Tighter on mobile — same info, less padding and smaller cards. */}
        <section className="py-10 sm:py-16 md:py-24 bg-white">
          <div className="container">
            <div className="text-center mb-6 sm:mb-10 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 mb-2 md:mb-4">
                How ParkwayAi Works
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
                Simple, secure, and profitable for everyone. Get started in minutes.
              </p>
            </div>
            
            {/* For Drivers */}
            <div id="for-drivers" className="mb-10 sm:mb-14 md:mb-20 scroll-mt-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 md:mb-8 text-center">For Drivers</h3>
              <p className="text-center text-gray-600 mb-4 md:mb-8 max-w-lg mx-auto text-sm sm:text-base">
                Example: Book a driveway 2 minutes from Newport PATH for $18.
              </p>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto">
                <div className="relative">
                  <div className="absolute -top-3 -left-3 w-6 h-6 md:w-8 md:h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm md:text-lg z-10">
                    1
                  </div>
                  <Card className="text-center p-4 sm:p-6 md:p-8 h-full hover:shadow-xl transition-shadow">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-6">
                      <MagnifyingGlassIcon className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-primary-700" />
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2 md:mb-3">Search & Find</h3>
                    <p className="text-gray-600 text-sm sm:text-base">
                      Search for available driveways near your destination with real-time availability. 
                      Filter by price, distance, and amenities.
                    </p>
                  </Card>
                </div>
                
                <div className="relative">
                  <div className="absolute -top-3 -left-3 w-6 h-6 md:w-8 md:h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm md:text-lg z-10">
                    2
                  </div>
                  <Card className="text-center p-4 sm:p-6 md:p-8 h-full hover:shadow-xl transition-shadow">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-6">
                      <ClockIcon className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-green-700" />
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2 md:mb-3">Book Instantly</h3>
                    <p className="text-gray-600 text-sm sm:text-base">
                      Reserve your spot with a few clicks. Instant confirmation and directions. Cancel anytime with a full refund.
                    </p>
                  </Card>
                </div>
                
                <div className="relative sm:col-span-2 md:col-span-1">
                  <div className="absolute -top-3 -left-3 w-6 h-6 md:w-8 md:h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm md:text-lg z-10">
                    3
                  </div>
                  <Card className="text-center p-4 sm:p-6 md:p-8 h-full hover:shadow-xl transition-shadow">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-6">
                      <CheckCircleIcon className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-blue-700" />
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2 md:mb-3">Park & Go</h3>
                    <p className="text-gray-600 text-sm sm:text-base">
                      Arrive at your reserved spot, park safely, and go. Secure payments are handled automatically.
                    </p>
                  </Card>
                </div>
              </div>
            </div>

            {/* For Owners */}
            <div id="for-owners" className="scroll-mt-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 md:mb-8 text-center">For Property Owners</h3>
              <p className="text-center text-gray-600 mb-4 md:mb-8 max-w-lg mx-auto text-sm sm:text-base">
                Example: Earn $300–$800/month renting your unused driveway.
              </p>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto">
                <div className="relative">
                  <div className="absolute -top-3 -left-3 w-6 h-6 md:w-8 md:h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm md:text-lg z-10">
                    1
                  </div>
                  <Card className="text-center p-4 sm:p-6 md:p-8 h-full hover:shadow-xl transition-shadow">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-6">
                      <HomeIcon className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-green-700" />
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2 md:mb-3">List Your Space</h3>
                    <p className="text-gray-600 text-sm sm:text-base">
                      Create a free listing in minutes. Add photos, set rates, define availability. No upfront costs.
                    </p>
                  </Card>
                </div>
                
                <div className="relative">
                  <div className="absolute -top-3 -left-3 w-6 h-6 md:w-8 md:h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm md:text-lg z-10">
                    2
                  </div>
                  <Card className="text-center p-4 sm:p-6 md:p-8 h-full hover:shadow-xl transition-shadow">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-6">
                      <CurrencyDollarIcon className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-primary-700" />
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2 md:mb-3">Get Bookings</h3>
                    <p className="text-gray-600 text-sm sm:text-base">
                      Receive booking requests from verified drivers. Accept or decline based on your availability.
                    </p>
                  </Card>
                </div>
                
                <div className="relative sm:col-span-2 md:col-span-1">
                  <div className="absolute -top-3 -left-3 w-6 h-6 md:w-8 md:h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm md:text-lg z-10">
                    3
                  </div>
                  <Card className="text-center p-4 sm:p-6 md:p-8 h-full hover:shadow-xl transition-shadow">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-6">
                      <ChartBarIcon className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-blue-700" />
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2 md:mb-3">Earn Money</h3>
                    <p className="text-gray-600 text-sm sm:text-base">
                      Get paid instantly after each booking. Keep 85-90% of earnings with automatic payouts.
                    </p>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits — trust. Compact on mobile to reduce scroll before CTA. */}
        <section className="py-10 sm:py-16 md:py-24 bg-white">
          <div className="container">
            <div className="text-center mb-6 sm:mb-10 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-4">
                Why Choose ParkwayAi?
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
                Built for trust and simplicity in {primaryMarket.displayName}.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card className="p-4 md:p-6">
                <LockClosedIcon className="w-8 h-8 md:w-10 md:h-10 text-primary-600 mb-2 md:mb-4" />
                <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">Secure Payments</h3>
                <p className="text-gray-600 text-sm">
                  Payments are processed securely. Your card and payout details are protected.
                </p>
              </Card>

              <Card className="p-4 md:p-6">
                <ShieldCheckIcon className="w-8 h-8 md:w-10 md:h-10 text-primary-600 mb-2 md:mb-4" />
                <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">ID Verification</h3>
                <p className="text-gray-600 text-sm">
                  Users and listings are verified. We confirm identity so you know who you're dealing with.
                </p>
              </Card>

              <Card className="p-4 md:p-6">
                <CheckCircleIcon className="w-8 h-8 md:w-10 md:h-10 text-primary-600 mb-2 md:mb-4" />
                <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">Instant Booking Confirmation</h3>
                <p className="text-gray-600 text-sm">
                  Reserve a spot and get confirmation right away. No waiting or back-and-forth.
                </p>
              </Card>

              <Card className="p-4 md:p-6">
                <CurrencyDollarIcon className="w-8 h-8 md:w-10 md:h-10 text-primary-600 mb-2 md:mb-4" />
                <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">Transparent Pricing</h3>
                <p className="text-gray-600 text-sm">
                  See the full price before you book. No hidden fees. Owners set their own rates.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials: only show when we have real, authentic reviews */}
        {!testimonialsLoading && testimonials && testimonials.length > 0 && testimonials.some((r: any) => {
          const name = (r.user?.name || '').trim();
          const comment = (r.comment || '').trim();
          return comment.length >= 15 && name.toLowerCase() !== 'tester' && name.length > 0;
        }        ) && (
          <section className="py-10 sm:py-16 md:py-24 bg-gray-50">
            <div className="container">
              <div className="text-center mb-6 sm:mb-10 md:mb-16">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-4">
                  What Our Users Say
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-gray-600">
                  Real feedback from real users
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                {testimonials
                  .filter((r: any) => {
                    const name = (r.user?.name || '').trim();
                    const comment = (r.comment || '').trim();
                    return comment.length >= 15 && name.toLowerCase() !== 'tester' && name.length > 0;
                  })
                  .slice(0, 3)
                  .map((review: any) => {
                    const initials = review.user?.name
                      ?.split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || 'U';
                    const displayName = review.user?.name?.trim() || 'Anonymous';
                    return (
                      <Card key={review.id} className="p-4 md:p-6">
                        <div className="flex items-center mb-3 md:mb-4" role="img" aria-label={`${review.rating} out of 5 stars`}>
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`w-5 h-5 ${
                                i < review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                        <p className="text-gray-700 mb-3 md:mb-4 italic text-sm md:text-base">
                          &ldquo;{review.comment}&rdquo;
                        </p>
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                            {review.user?.avatar ? (
                              <ImageWithPlaceholder
                                src={review.user.avatar}
                                alt=""
                                className="w-10 h-10 rounded-full"
                                fallbackText={initials}
                              />
                            ) : (
                              <span className="text-primary-700 font-semibold text-sm" aria-hidden="true">
                                {initials}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold">
                              {displayName.includes(' ')
                                ? `${displayName.split(' ')[0]} ${(displayName.split(' ').pop() ?? '')[0]}.`
                                : displayName}
                              , {primaryMarket.displayName}
                            </div>
                            <div className="text-sm text-gray-600">Verified User</div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            </div>
          </section>
        )}

        {/* CTA — primary conversion. Tighter on mobile so it appears sooner. */}
        <section className="py-10 sm:py-16 md:py-24 bg-primary-600 text-white">
          <div className="container text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-primary-100 mb-6 md:mb-8 max-w-2xl mx-auto">
              Book secure driveway parking in minutes or start earning from your unused space.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link
                href="/search"
                className="inline-flex items-center justify-center rounded-lg text-base font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white bg-white text-primary-600 hover:bg-gray-50 px-8 py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Find Parking
              </Link>
              <Link
                href="/driveways/new"
                className="inline-flex items-center justify-center rounded-lg text-base font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4"
              >
                List Your Driveway
              </Link>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
