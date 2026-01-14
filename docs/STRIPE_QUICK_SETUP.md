# Stripe Payment Setup - Quick Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Stripe Keys

1. Go to: https://dashboard.stripe.com/apikeys
2. Copy:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

### Step 2: Add to Vercel

1. Go to: https://vercel.com/dashboard
2. Select your project → **Settings** → **Environment Variables**
3. Add these 3 variables:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (get from Step 3)
```

**Important**: 
- Set for **Production**, **Preview**, and **Development**
- `NEXT_PUBLIC_` prefix is required for client-side access

### Step 3: Set Up Webhook

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. **Endpoint URL**: `https://your-domain.vercel.app/api/payments/webhook`
   - Replace `your-domain.vercel.app` with your actual Vercel domain
4. **Select events**:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `charge.refunded`
5. **Copy the "Signing secret"** (starts with `whsec_`)
6. **Add to Vercel** as `STRIPE_WEBHOOK_SECRET`

### Step 4: Redeploy

After adding variables:
- Go to **Deployments** → Click **"Redeploy"** on latest deployment
- Or push a new commit

---

## ✅ Verification

### Check if Configured

**If configured correctly:**
- ✅ Payment form appears on checkout page
- ✅ No "Stripe not configured" message

**If not configured:**
- ❌ Yellow warning: "Payment Processing Not Available"
- ❌ Message: "Stripe payment gateway is not configured"

### Test Payment

1. Create a booking
2. Go to checkout
3. Use test card: `4242 4242 4242 4242`
4. Expiry: Any future date (e.g., `12/34`)
5. CVC: Any 3 digits (e.g., `123`)
6. ZIP: Any 5 digits (e.g., `12345`)

---

## 🔧 Troubleshooting

### Issue: "Stripe not configured" still showing

**Solution**:
1. ✅ Check variables are set in Vercel
2. ✅ Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` has `NEXT_PUBLIC_` prefix
3. ✅ Redeploy after adding variables
4. ✅ Clear browser cache

### Issue: Payment fails with 503 error

**Solution**:
1. ✅ Check `STRIPE_SECRET_KEY` is set in Vercel
2. ✅ Verify key format (starts with `sk_test_` or `sk_live_`)
3. ✅ Check server logs in Vercel

### Issue: Webhook not working

**Solution**:
1. ✅ Verify `STRIPE_WEBHOOK_SECRET` is set
2. ✅ Check webhook URL is correct in Stripe Dashboard
3. ✅ Ensure events are selected
4. ✅ Check Vercel function logs

---

## 📋 Environment Variables Checklist

| Variable | Status | Location |
|----------|--------|----------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ⬜ | Vercel → Environment Variables |
| `STRIPE_SECRET_KEY` | ⬜ | Vercel → Environment Variables |
| `STRIPE_WEBHOOK_SECRET` | ⬜ | Vercel → Environment Variables |

---

## 🔗 Useful Links

- **Stripe Dashboard**: https://dashboard.stripe.com
- **API Keys**: https://dashboard.stripe.com/apikeys
- **Webhooks**: https://dashboard.stripe.com/webhooks
- **Test Cards**: https://stripe.com/docs/testing
- **Vercel Dashboard**: https://vercel.com/dashboard

---

## 💡 Pro Tips

1. **Use Test Mode First**: Start with `pk_test_` and `sk_test_` keys
2. **Test Webhook Locally**: Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/payments/webhook`
3. **Monitor Webhooks**: Check Stripe Dashboard → Webhooks → Your endpoint → Events
4. **Switch to Live**: Only after thorough testing with test keys
