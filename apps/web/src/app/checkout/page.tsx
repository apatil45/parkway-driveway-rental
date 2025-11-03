'use client';

import { Card } from '@/components/ui';
import StripeCheckout from '@/components/ui/StripeCheckout';

export default function CheckoutPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      <Card>
        <StripeCheckout amount={1500} />
      </Card>
    </div>
  );
}


