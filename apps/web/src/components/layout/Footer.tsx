import Link from 'next/link';
import { Logo } from '@/components/ui';
import { getPrimaryMarket } from '@/lib/market-config';

interface FooterProps {
  variant?: 'default' | 'marketing';
}

export default function Footer({ variant = 'default' }: FooterProps) {
  const isMarketing = variant === 'marketing';
  const marketName = isMarketing ? getPrimaryMarket().displayName : '';

  if (isMarketing) {
    return (
      <footer className="bg-gray-900 text-white mt-auto">
        <div className="container mx-auto px-4 py-8 sm:py-10 md:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">ParkwayAi</h3>
              <p className="text-gray-400 text-sm md:text-base">
                The easiest way to find and rent driveways in {marketName}. Connecting drivers with property owners.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 md:mb-4 text-sm md:text-base">For Drivers</h4>
              <ul className="space-y-1.5 md:space-y-2 text-gray-400 text-sm">
                <li><Link href="/search" className="hover:text-white transition-colors">Find Parking</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 md:mb-4 text-sm md:text-base">For Owners</h4>
              <ul className="space-y-1.5 md:space-y-2 text-gray-400 text-sm">
                <li><Link href="/register" className="hover:text-white transition-colors">List Your Driveway</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">Host Guide</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 md:mb-4 text-sm md:text-base">Support</h4>
              <ul className="space-y-1.5 md:space-y-2 text-gray-400 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 md:mt-8 pt-6 md:pt-8 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} ParkwayAi. All rights reserved.</p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-primary-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="mb-4">
              <Logo variant="full" size="md" dark href="/" />
            </div>
            <p className="text-gray-300 text-sm">
              The easiest way to find and rent driveways.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">For Drivers</h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li><Link href="/search" className="hover:text-white transition-colors">Find Parking</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/bookings" className="hover:text-white transition-colors">My Bookings</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">For Owners</h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li><Link href="/driveways/new" className="hover:text-white transition-colors">List Your Driveway</Link></li>
              <li><Link href="/driveways" className="hover:text-white transition-colors">Manage Listings</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">View Earnings</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-300 text-sm">
          <p>&copy; {new Date().getFullYear()} ParkwayAi. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

