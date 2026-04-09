'use client';

import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { Card } from '@/components/ui';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

export default function TermsPage() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <DocumentTextIcon className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
          <p className="text-gray-600 mt-2">Last updated: {new Date().toLocaleDateString('en-US')}</p>
        </div>
        <Card className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h2>
            <p className="text-gray-600">
              By using ParkwayAi, you agree to these Terms of Service. If you do not agree, please do not use our platform.
            </p>
          </section>
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Description of Service</h2>
            <p className="text-gray-600">
              ParkwayAi connects drivers with private driveway owners for parking. We provide a marketplace platform
              for listing, discovering, and booking parking spaces. We are not the owner of any listed spaces.
            </p>
          </section>
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Listing and Right to List</h2>
            <p className="text-gray-600">
              By listing a parking space, you represent that you have the legal right to offer it for rent—as owner,
              tenant, or authorized manager. You are responsible for ensuring your listing complies with local laws,
              HOA rules, and lease agreements.
            </p>
          </section>
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Bookings and Payments</h2>
            <p className="text-gray-600">
              Payments are processed through Stripe. Platform fees apply as described on our pricing page. Refunds
              and cancellations are subject to our cancellation policy. Hosts receive payouts after completed bookings.
            </p>
          </section>
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">5. User Conduct</h2>
            <p className="text-gray-600">
              You agree to use the platform lawfully and respectfully. Prohibited conduct includes fraud, harassment,
              providing false information, and violating any applicable laws. We may suspend or terminate accounts
              for violations.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Contact</h2>
            <p className="text-gray-600">
              For questions about these terms, please{' '}
              <Link href="/contact" className="text-primary-600 hover:text-primary-700 font-medium">
                contact us
              </Link>
              .
            </p>
          </section>
        </Card>
      </div>
    </AppLayout>
  );
}
