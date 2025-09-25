# 🖼️ Cloudinary Setup Guide for Parkway.com

This guide will help you set up Cloudinary for image uploads in your driveway rental platform.

## 🚀 Step 1: Create Cloudinary Account

1. **Visit [Cloudinary.com](https://cloudinary.com)**
2. **Click "Sign Up For Free"**
3. **Fill in your details:**
   - Name
   - Email
   - Password
   - Company (optional)
4. **Verify your email** when prompted

## 🔑 Step 2: Get Your Credentials

After signing up, you'll see your dashboard with these credentials:

```
Cloud Name: your-cloud-name
API Key: 123456789012345
API Secret: abcdefghijklmnopqrstuvwxyz123456
```

**Important:** Keep your API Secret secure and never share it publicly!

## 📝 Step 3: Set Up Environment Variables

### For Local Development

Create a `.env` file in your project root:

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here
CLOUDINARY_API_KEY=your_cloudinary_api_key_here
CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here

# Other required variables
DATABASE_URL=postgresql://username:password@localhost:5432/parkway_db
JWT_SECRET=your-super-secure-jwt-secret-key-here
NODE_ENV=development
PORT=3000
```

### For Production (Render.com)

In your Render dashboard, add these environment variables:

```
CLOUDINARY_CLOUD_NAME = your_cloudinary_cloud_name
CLOUDINARY_API_KEY = your_cloudinary_api_key
CLOUDINARY_API_SECRET = your_cloudinary_api_secret
```

## 🧪 Step 4: Test Your Setup

1. **Start your server:**
   ```bash
   npm run dev
   ```

2. **Check the console** - you should see:
   ```
   ✅ Cloudinary configured successfully
   ```

3. **Test the upload endpoint:**
   ```bash
   curl -X GET http://localhost:3000/api/upload/test \
     -H "x-auth-token: YOUR_JWT_TOKEN"
   ```

4. **Try uploading an image** through the frontend

## 🔧 Step 5: Cloudinary Dashboard Features

### Upload Settings
- **Folder Structure:** Images are stored in `parkway_driveways/` folder
- **Auto-optimization:** Images are automatically resized and compressed
- **Format Conversion:** Automatic format optimization (WebP, AVIF)
- **Quality Settings:** Auto quality adjustment

### Security Settings
- **Access Control:** Set to "Restricted" for security
- **Signed URLs:** Used for secure uploads
- **CORS Configuration:** Configured for your domain

## 📊 Step 6: Monitor Usage

In your Cloudinary dashboard, you can:
- **View upload statistics**
- **Monitor bandwidth usage**
- **See storage usage**
- **Track API calls**

## 🆓 Free Tier Limits

Cloudinary's free tier includes:
- **25 GB storage**
- **25 GB bandwidth/month**
- **25,000 transformations/month**
- **Unlimited uploads**

## 🚨 Troubleshooting

### Common Issues:

1. **"Cloudinary configuration missing"**
   - Check your environment variables are set correctly
   - Restart your server after adding variables

2. **"Upload failed"**
   - Verify your API credentials
   - Check your internet connection
   - Ensure file size is under 10MB

3. **"CORS error"**
   - This is normal for local development
   - Will work fine in production

### Test Commands:

```bash
# Test if environment variables are loaded
node -e "console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME)"

# Test upload endpoint
curl -X GET http://localhost:3000/api/upload/test
```

## 🔒 Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use different credentials** for development and production
3. **Rotate API secrets** regularly
4. **Monitor usage** for unusual activity
5. **Set up billing alerts** to avoid unexpected charges

## 📱 Mobile Optimization

Cloudinary automatically:
- **Detects device type** and serves optimized images
- **Adjusts quality** based on connection speed
- **Provides responsive images** for different screen sizes
- **Compresses images** for faster loading

## 🎯 Next Steps

Once Cloudinary is set up:
1. **Test image uploads** in your driveway creation form
2. **Verify images display** correctly in search results
3. **Check image optimization** is working
4. **Monitor your usage** in the Cloudinary dashboard

## 📞 Support

If you need help:
- **Cloudinary Documentation:** https://cloudinary.com/documentation
- **Cloudinary Support:** https://support.cloudinary.com
- **Community Forum:** https://support.cloudinary.com/hc/en-us/community/topics

---

**Your image upload functionality is now ready to use!** 🎉
