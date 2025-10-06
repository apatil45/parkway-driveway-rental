const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const sharp = require('sharp');
const { authenticateToken: auth } = require('../middleware/auth');
const router = express.Router();

// Configure Cloudinary (you'll need to set these environment variables)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Check Cloudinary configuration
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn('⚠️  Cloudinary configuration missing. Image uploads will fail.');
  console.warn('Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
} else {
  console.log('✅ Cloudinary configured successfully');
}

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Image optimization function
const optimizeImage = async (buffer) => {
  try {
    return await sharp(buffer)
      .resize(1200, 800, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ 
        quality: 85,
        progressive: true 
      })
      .toBuffer();
  } catch (error) {
    throw new Error('Image optimization failed');
  }
};

// Upload single image
router.post('/single', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Optimize the image
    const optimizedBuffer = await optimizeImage(req.file.buffer);

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'parkway/driveways',
          public_id: `driveway_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          transformation: [
            { width: 1200, height: 800, crop: 'fill', quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(optimizedBuffer);
    });

    res.json({
      success: true,
      imageUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    });

  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload image',
      message: error.message 
    });
  }
});

// Upload multiple images
router.post('/multiple', auth, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    const uploadPromises = req.files.map(async (file) => {
      try {
        // Optimize the image
        const optimizedBuffer = await optimizeImage(file.buffer);

        // Upload to Cloudinary
        return new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              folder: 'parkway/driveways',
              public_id: `driveway_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              transformation: [
                { width: 1200, height: 800, crop: 'fill', quality: 'auto' },
                { fetch_format: 'auto' }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve({
                imageUrl: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height
              });
            }
          ).end(optimizedBuffer);
        });
      } catch (error) {
        throw new Error(`Failed to process image: ${error.message}`);
      }
    });

    const results = await Promise.all(uploadPromises);

    res.json({
      success: true,
      images: results
    });

  } catch (error) {
    console.error('Multiple image upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload images',
      message: error.message 
    });
  }
});

// Delete image
router.delete('/:publicId', auth, async (req, res) => {
  try {
    const { publicId } = req.params;
    
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      res.json({ success: true, message: 'Image deleted successfully' });
    } else {
      res.status(404).json({ error: 'Image not found' });
    }
  } catch (error) {
    console.error('Image deletion error:', error);
    res.status(500).json({ 
      error: 'Failed to delete image',
      message: error.message 
    });
  }
});

// Get image info
router.get('/info/:publicId', auth, async (req, res) => {
  try {
    const { publicId } = req.params;
    
    const result = await cloudinary.api.resource(publicId);
    
    res.json({
      success: true,
      image: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes
      }
    });
  } catch (error) {
    console.error('Image info error:', error);
    res.status(500).json({ 
      error: 'Failed to get image info',
      message: error.message 
    });
  }
});

// Upload multiple images (alias for /images endpoint)
router.post('/images', auth, upload.array('images', 8), async (req, res) => {
  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({ 
        success: false,
        msg: 'Image upload service is not configured. Please contact support.' 
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false,
        msg: 'No image files uploaded.' 
      });
    }

    console.log(`Processing ${req.files.length} images for upload`);

    const uploadPromises = req.files.map(async (file, index) => {
      try {
        console.log(`Processing image ${index + 1}: ${file.originalname}`);
        
        // Optimize image
        const optimizedBuffer = await optimizeImage(file.buffer);
        
        // Upload to Cloudinary
        return new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'parkway_driveways',
              resource_type: 'image',
              public_id: `driveway_${Date.now()}_${index}`,
              transformation: [
                { width: 1200, height: 800, crop: 'limit' },
                { quality: 'auto' },
                { format: 'auto' }
              ]
            },
            (error, result) => {
              if (error) {
                console.error(`Cloudinary upload error for image ${index + 1}:`, error);
                reject(error);
              } else {
                console.log(`Successfully uploaded image ${index + 1}:`, result.secure_url);
                resolve({
                  imageUrl: result.secure_url,
                  publicId: result.public_id
                });
              }
            }
          ).end(optimizedBuffer);
        });
      } catch (error) {
        console.error(`Error processing image ${index + 1}:`, error);
        throw error;
      }
    });

    const results = await Promise.all(uploadPromises);
    const imageUrls = results.map(result => result.imageUrl);

    console.log(`Successfully uploaded ${imageUrls.length} images`);

    res.json({
      success: true,
      imageUrls: imageUrls,
      count: imageUrls.length
    });

  } catch (error) {
    console.error('Multiple image upload error:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Server error during image upload.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Test endpoint to check upload configuration
router.get('/test', auth, (req, res) => {
  const config = {
    cloudinary: {
      configured: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
      cloudName: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not Set'
    },
    multer: {
      configured: true,
      maxFileSize: '10MB',
      allowedTypes: 'image/*'
    }
  };
  
  res.json({
    success: true,
    message: 'Upload service status',
    config
  });
});

module.exports = router;
