# Stripe Webhook Setup Guide

**Date**: 2024-12-27

---

## 🎯 Webhook Destination URL

When Stripe asks you to "Add destination", enter this URL:

### **For Production (Vercel Deployment)**
```
https://your-domain.vercel.app/api/payments/webhook
```

**Replace `your-domain.vercel.app` with your actual Vercel domain.**

### **How to Find Your Vercel Domain**

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Click on your project
3. Look at the **Domains** section
4. Your domain will be something like:
   - `parkway-driveway-rental.vercel.app` (default)
   - Or your custom domain if configured

### **Example URLs**
- Default: `https://parkway-driveway-rental.vercel.app/api/payments/webhook`
- Custom domain: `https://yourdomain.com/api/payments/webhook`

---

## 📋 Step-by-Step Setup

### **Step 1: Get Your Vercel Domain**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Check the **Domains** section
4. Copy your production domain

### **Step 2: Add Webhook in Stripe**
1. Go to https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"** or **"Add destination"**
3. In the **"Endpoint URL"** field, paste:
   ```
   https://YOUR-VERCEL-DOMAIN/api/payments/webhook
   ```
4. Click **"Add endpoint"**

### **Step 3: Select Events**
After adding the endpoint, select these events:
- ✅ `payment_intent.succeeded`
- ✅ `payment_intent.payment_failed`
- ✅ `charge.refunded`

### **Step 4: Get Signing Secret**
1. After creating the endpoint, click on it
2. Find **"Signing secret"** section
3. Click **"Reveal"** or **"Copy"**
4. Copy the secret (starts with `whsec_`)

### **Step 5: Update Environment Variables**
1. Update your `.env.local` file:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_... (paste the real secret here)
   ```
2. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
3. Add or update `STRIPE_WEBHOOK_SECRET` with the real value
4. Make sure it's set for **Production**, **Preview**, and **Development**
5. Redeploy your application

---

## 🧪 Testing the Webhook

### **Option 1: Use Stripe Dashboard**
1. Go to your webhook endpoint in Stripe Dashboard
2. Click **"Send test webhook"**
3. Select event: `payment_intent.succeeded`
4. Check Vercel logs to see if webhook was received

### **Option 2: Use Stripe CLI (Local Testing)**
```bash
# Install Stripe CLI
# Then run:
stripe listen --forward-to localhost:3000/api/payments/webhook
```

### **Option 3: Make a Test Payment**
1. Create a test booking
2. Use Stripe test card: `4242 4242 4242 4242`
3. Complete payment
4. Check if webhook event appears in Stripe Dashboard
5. Verify booking status updates to CONFIRMED

---

## ✅ Verification Checklist

After setup, verify:
- [ ] Webhook endpoint URL is correct
- [ ] Events are selected (payment_intent.succeeded, etc.)
- [ ] Signing secret is copied
- [ ] Environment variable is updated in `.env.local`
- [ ] Environment variable is set in Vercel
- [ ] Application is redeployed
- [ ] Test webhook works

---

## 🚨 Common Issues

### **Issue: "Webhook endpoint not found"**
**Solution**: 
- Check that URL is exactly: `/api/payments/webhook`
- Make sure your Vercel deployment is live
- Verify the domain is correct

### **Issue: "Invalid signature"**
**Solution**:
- Make sure `STRIPE_WEBHOOK_SECRET` is set correctly
- Use the signing secret from Stripe Dashboard (not the publishable key)
- Secret should start with `whsec_`

### **Issue: "Webhook not receiving events"**
**Solution**:
- Check that events are selected in Stripe Dashboard
- Verify webhook endpoint is active (not disabled)
- Check Vercel function logs for errors

---

## 📝 Quick Reference

**Webhook Endpoint Path**: `/api/payments/webhook`  
**Full URL Format**: `https://[YOUR-DOMAIN]/api/payments/webhook`  
**Required Events**: 
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

**Environment Variable**: `STRIPE_WEBHOOK_SECRET=whsec_...`

---

## 🔗 Helpful Links

- **Stripe Webhooks**: https://dashboard.stripe.com/webhooks
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Stripe Webhook Docs**: https://stripe.com/docs/webhooks

