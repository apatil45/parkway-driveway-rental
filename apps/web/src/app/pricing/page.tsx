'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { Card } from '@/components/ui';
import {
  CheckCircleIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const pricingPlans = {
    drivers: {
      title: 'For Drivers',
      subtitle: 'Find parking with transparent pricing',
      plans: [
        {
          name: 'Pay Per Use',
          price: billingCycle === 'monthly' ? '$0' : '$0',
          period: 'No subscription',
          description: 'Perfect for occasional parking needs',
          features: [
            'No monthly fees',
            'Pay only when you park',
            'Transparent pricing',
            '24/7 customer support',
            'Secure payment processing',
            'Instant booking confirmation',
            'Cancel anytime with full refund',
            'Access to all available driveways',
          ],
          cta: 'Start Searching',
          ctaLink: '/search',
          popular: false,
        },
      ],
    },
    owners: {
      title: 'For Property Owners',
      subtitle: 'Earn passive income from your driveway',
      plans: [
        {
          name: 'Free Listing',
          price: billingCycle === 'monthly' ? '$0' : '$0',
          period: 'No fees',
          description: 'List your driveway and start earning',
          features: [
            'Free to list',
            'No monthly subscription',
            'Set your own rates',
            'Keep 85% of earnings',
            '15% platform fee',
            'Instant payouts',
            '24/7 support',
            'Manage availability easily',
            'Real-time booking notifications',
          ],
          cta: 'List Your Driveway',
          ctaLink: '/driveways/new',
          popular: true,
        },
        {
          name: 'Premium Host',
          price: billingCycle === 'monthly' ? '$9.99' : '$99.99',
          period: billingCycle === 'monthly' ? 'per month' : 'per year',
          description: 'Maximize your earnings with premium features',
          features: [
            'Everything in Free Listing',
            'Keep 90% of earnings (10% platform fee)',
            'Priority listing placement',
            'Advanced analytics dashboard',
            'Bulk availability management',
            'Custom pricing rules',
            'Featured in search results',
            'Dedicated support line',
            'Marketing tools & insights',
          ],
          cta: 'Upgrade to Premium',
          ctaLink: '/register',
          popular: false,
        },
      ],
    },
  };

  const feeStructure = [
    {
      title: 'Platform Fees',
      items: [
        {
          role: 'Free Listing',
          fee: '15% of each booking',
          description: 'Standard platform fee for free hosts',
    },
    {
          role: 'Premium Host',
          fee: '10% of each booking',
          description: 'Reduced platform fee for premium subscribers',
    },
      ],
    },
    {
      title: 'Payment Processing',
      items: [
        {
          role: 'All Users',
          fee: '2.9% + $0.30 per transaction',
          description: 'Stripe processing fee (industry standard)',
        },
      ],
    },
  ];

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Simple, Transparent Pricing
              </h1>
              <p className="text-xl md:text-2xl text-primary-100 mb-8">
                No hidden fees. No surprises. Just fair pricing for everyone.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Plans */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            {/* Drivers Section */}
            <div className="mb-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {pricingPlans.drivers.title}
                </h2>
                <p className="text-xl text-gray-600">
                  {pricingPlans.drivers.subtitle}
                </p>
              </div>
              <div className="grid md:grid-cols-1 gap-8 max-w-2xl mx-auto">
                {pricingPlans.drivers.plans.map((plan, index) => (
                  <Card
                    key={index}
                    className={`relative p-8 ${plan.popular ? 'ring-2 ring-primary-500 shadow-xl' : ''}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {plan.name}
                      </h3>
                      <div className="mb-2">
                        <span className="text-4xl font-bold text-gray-900">
                          {plan.price}
                        </span>
                        {plan.period && (
                          <span className="text-gray-600 ml-2">{plan.period}</span>
                        )}
                      </div>
                      <p className="text-gray-600">{plan.description}</p>
                    </div>
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={plan.ctaLink}
                      className="block w-full text-center bg-primary-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-primary-700 transition-colors"
                    >
                      {plan.cta}
                    </Link>
                  </Card>
                ))}
              </div>
            </div>

            {/* Owners Section */}
            <div>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {pricingPlans.owners.title}
                </h2>
                <p className="text-xl text-gray-600">
                  {pricingPlans.owners.subtitle}
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {pricingPlans.owners.plans.map((plan, index) => (
                  <Card
                    key={index}
                    className={`relative p-8 ${plan.popular ? 'ring-2 ring-primary-500 shadow-xl' : ''}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {plan.name}
                      </h3>
                      <div className="mb-2">
                        <span className="text-4xl font-bold text-gray-900">
                          {plan.price}
                        </span>
                        {plan.period && (
                          <span className="text-gray-600 ml-2">{plan.period}</span>
                        )}
                      </div>
                      <p className="text-gray-600">{plan.description}</p>
                    </div>
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={plan.ctaLink}
                      className="block w-full text-center bg-primary-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-primary-700 transition-colors"
                    >
                      {plan.cta}
                    </Link>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Fee Structure */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Fee Structure
                </h2>
                <p className="text-xl text-gray-600">
                  Clear, upfront pricing with no surprises
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                {feeStructure.map((section, index) => (
                  <Card key={index} className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">
                      {section.title}
                    </h3>
                    <div className="space-y-6">
                      {section.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="border-b border-gray-200 pb-4 last:border-0">
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-semibold text-gray-900">
                              {item.role}
                            </span>
                            <span className="text-primary-600 font-semibold">
                              {item.fee}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Why Choose Parkway?
                </h2>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                <Card className="text-center p-6">
                  <ShieldCheckIcon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Secure Payments</h3>
                  <p className="text-gray-600 text-sm">
                    All transactions are encrypted and secure. Your payment information is never stored on our servers.
                  </p>
                </Card>
                <Card className="text-center p-6">
                  <ClockIcon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Instant Payouts</h3>
                  <p className="text-gray-600 text-sm">
                    Property owners receive payments instantly after each booking. No waiting, no delays.
                  </p>
                </Card>
                <Card className="text-center p-6">
                  <ChartBarIcon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Transparent Pricing</h3>
                  <p className="text-gray-600 text-sm">
                    See exactly what you'll pay or earn before booking. No hidden fees or surprise charges.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Frequently Asked Questions
                </h2>
              </div>
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Are there any hidden fees?
                  </h3>
                  <p className="text-gray-600">
                    No. All fees are clearly displayed before you book. Drivers pay the listed price plus standard payment processing fees. Property owners keep 85-90% of the booking price depending on their plan.
                  </p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    When do property owners get paid?
                  </h3>
                  <p className="text-gray-600">
                    Payments are processed instantly after a booking is completed. Funds are transferred directly to your connected bank account or payment method.
                  </p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Can I cancel a booking?
                  </h3>
                  <p className="text-gray-600">
                    Yes. Drivers can cancel bookings and receive a full refund if cancelled at least 24 hours before the booking start time. Property owners can also cancel, but may be subject to penalties if done frequently.
                  </p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Is there a minimum commitment?
                  </h3>
                  <p className="text-gray-600">
                    No. There are no long-term contracts or minimum commitments. You can use Parkway as much or as little as you want.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join thousands of users who are already using Parkway. Sign up is free and takes less than 2 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-md text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-white text-primary-600 hover:bg-gray-100 px-6 py-3 shadow-sm"
              >
                Create Free Account
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-md text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 border border-white text-white hover:bg-white hover:text-primary-600 px-6 py-3 shadow-sm"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
