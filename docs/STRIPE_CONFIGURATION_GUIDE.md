# Stripe Payment Configuration Guide

## Quick Setup Checklist

### ✅ Step 1: Get Stripe API Keys

1. **Sign up/Login to Stripe**: https://dashboard.stripe.com
2. **Get API Keys**:
   - Go to: https://dashboard.stripe.com/apikeys
   - Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)

### ✅ Step 2: Set Environment Variables in Vercel

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project**
3. **Go to Settings → Environment Variables**
4. **Add these three variables**:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Important Notes**:
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Must be prefixed with `NEXT_PUBLIC_` (exposed to client)
- `STRIPE_SECRET_KEY` - Server-side only (never exposed)
- `STRIPE_WEBHOOK_SECRET` - Get this after setting up webhook (Step 3)

### ✅ Step 3: Set Up Stripe Webhook

1. **Go to Stripe Dashboard → Developers → Webhooks**
2. **Click "Add endpoint"**
3. **Endpoint URL**: `https://your-domain.vercel.app/api/payments/webhook`
   - Replace `your-domain.vercel.app` with your actual Vercel domain
4. **Select events to listen to**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. **Copy the "Signing secret"** (starts with `whsec_`)
6. **Add to Vercel environment variables** as `STRIPE_WEBHOOK_SECRET`

### ✅ Step 4: Redeploy Application

After adding environment variables:
1. Go to Vercel Dashboard → Deployments
2. Click "Redeploy" on the latest deployment
3. Or push a new commit to trigger redeploy

---

## Testing Stripe Configuration

### Test Mode vs Live Mode

**Test Mode** (Development):
- Use keys starting with `pk_test_` and `sk_test_`
- Test cards: https://stripe.com/docs/testing
- Example test card: `4242 4242 4242 4242`

**Live Mode** (Production):
- Use keys starting with `pk_live_` and `sk_live_`
- Real payments will be processed
- Switch in Stripe Dashboard → Toggle "Test mode"

---

## Verification

### Check if Stripe is Configured

The application will show:
- ✅ **Configured**: Payment form appears
- ❌ **Not Configured**: Yellow warning box with "Payment Processing Not Available"

### Test Payment Flow

1. Create a booking
2. Go to checkout page
3. Use test card: `4242 4242 4242 4242`
4. Expiry: Any future date (e.g., `12/34`)
5. CVC: Any 3 digits (e.g., `123`)
6. ZIP: Any 5 digits (e.g., `12345`)

---

## Troubleshooting

### Issue: "Stripe not configured" message

**Solution**:
1. Check environment variables in Vercel
2. Ensure `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
3. Redeploy application after adding variables

### Issue: Payment fails with "STRIPE_NOT_CONFIGURED"

**Solution**:
1. Check `STRIPE_SECRET_KEY` is set in Vercel
2. Ensure it's the correct key (test vs live)
3. Check server logs for detailed error

### Issue: Webhook not working

**Solution**:
1. Verify `STRIPE_WEBHOOK_SECRET` is set
2. Check webhook endpoint URL is correct
3. Ensure webhook events are selected in Stripe Dashboard
4. Check Vercel function logs for webhook errors

---

## Environment Variables Summary

| Variable | Location | Required | Format |
|----------|----------|----------|--------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client + Server | ✅ Yes | `pk_test_...` or `pk_live_...` |
| `STRIPE_SECRET_KEY` | Server only | ✅ Yes | `sk_test_...` or `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Server only | ✅ Yes | `whsec_...` |

---

## Security Notes

⚠️ **Never commit API keys to git**
- Keys are stored in Vercel environment variables
- `.env.local` is gitignored
- Public keys (publishable) are safe to expose in client code
- Secret keys must NEVER be exposed

---

## Next Steps

After configuration:
1. ✅ Test payment flow with test card
2. ✅ Verify webhook receives events
3. ✅ Check booking status updates after payment
4. ✅ Switch to live mode when ready for production
