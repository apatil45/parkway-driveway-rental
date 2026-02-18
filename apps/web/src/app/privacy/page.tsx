'use client';

import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { Card } from '@/components/ui';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function PrivacyPage() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <ShieldCheckIcon className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-gray-600 mt-2">Last updated: {new Date().toLocaleDateString('en-US')}</p>
        </div>
        <Card className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Information we collect</h2>
            <p className="text-gray-600">
              We collect information you provide when you register, list a driveway, make a booking, or contact us.
              This may include name, email, address, payment information, and usage data necessary to provide our
              services.
            </p>
          </section>
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">2. How we use your information</h2>
            <p className="text-gray-600">
              We use your information to operate the platform, process bookings and payments, communicate with you,
              improve our services, and comply with legal obligations. We do not sell your personal information.
            </p>
          </section>
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Data security</h2>
            <p className="text-gray-600">
              We use industry-standard measures to protect your data. Payments are processed securely through
              Stripe. We retain data only as long as necessary to provide our services and meet legal requirements.
            </p>
          </section>
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Your rights</h2>
            <p className="text-gray-600">
              You may access, correct, or delete your account data through your profile settings. You can contact us
              at any time with privacy-related questions or requests.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Contact</h2>
            <p className="text-gray-600">
              For privacy questions or to exercise your rights, please{' '}
              <Link href="/contact" className="text-primary-600 hover:underline">
                contact us
              </Link>.
            </p>
          </section>
        </Card>
      </div>
    </AppLayout>
  );
}
