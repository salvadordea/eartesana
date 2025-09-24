# 🖼️ Bucket Image Conversion Guide

This guide helps you convert all images in your Supabase bucket to JPG format for consistency and better performance.

## 📋 Prerequisites

1. **Node.js** installed on your system
2. **Sharp library** for image processing

## 🚀 Installation Steps

### 1. Install Sharp Library
```bash
cd C:\Github\Artesana\EstArtesana
npm install sharp
```

### 2. Run Dry Run (Recommended First)
```bash
node convert-bucket-to-jpg.js
```
This shows what would be converted without making changes.

### 3. Perform Actual Conversion
Edit `convert-bucket-to-jpg.js` and change the last line from:
```javascript
dryRun().catch(console.error);
```
to:
```javascript
main().catch(console.error);
```

Then run:
```bash
node convert-bucket-to-jpg.js
```

## 🔧 Configuration Options

You can modify these settings in the script:

```javascript
const JPG_QUALITY = 85; // Quality (1-100, higher = better quality)
const batchSize = 3;    // How many files to process at once
```

## 📊 What Gets Converted

- **PNG files** → JPG (good compression, loses transparency)
- **WEBP files** → JPG (universal compatibility)
- **JPEG files** → JPG (standardized extension)

**JPG files are left unchanged**

## 🎯 After Conversion

### Option 1: Use Simplified JPG-Only Detector
Replace the image detector script in your HTML files:

**Replace:**
```html
<script src="./assets/js/image-format-detector.js"></script>
```

**With:**
```html
<script src="./assets/js/image-detector-jpg-only.js"></script>
```

### Option 2: Keep Multi-Format Support
Keep existing scripts unchanged. The multi-format detector will work but will be slower since it checks multiple formats.

## 📁 Files to Update After Conversion

1. **producto.html** - Change script reference
2. **tienda.html** - Change script reference
3. **admin/inventario.html** - Change script reference
4. **mayoristas/tienda.html** - Change script reference

## ⚠️ Important Notes

### Before Running:
- **Backup your bucket** (Supabase doesn't have built-in versioning)
- **Test on a small batch** first
- **Check your storage quota** (conversion may temporarily increase usage)

### During Conversion:
- **Don't interrupt** the process
- **Monitor the logs** for errors
- **Process runs in small batches** to avoid API limits

### After Conversion:
- **Test all image loading** across your site
- **Update code** to use JPG-only detector for better performance
- **Clean up temp files** (script does this automatically)

## 🛠️ Troubleshooting

### "Sharp library not found"
```bash
npm install sharp
```

### "Connection failed"
- Check your service role key in the script
- Verify internet connection

### "Bucket not found"
- Verify the bucket name is correct: `product-images`

### Conversion failures
- Check file permissions
- Verify sufficient storage space
- Try reducing batch size

## 📈 Expected Benefits

### Performance:
- ✅ **Faster loading** (single format check)
- ✅ **Smaller cache** (no multi-format detection)
- ✅ **Reduced server requests**

### Compatibility:
- ✅ **Universal browser support** (JPG works everywhere)
- ✅ **Consistent quality** across all images
- ✅ **Simplified maintenance**

### Storage:
- 📦 **Typically 10-30% smaller** files
- 🗜️ **Better compression** than PNG
- 📊 **Consistent metadata**

## 🎯 Performance Comparison

**Before (Multi-format):**
- Check .webp → Check .png → Check .jpg → Load
- ~3-4 requests per image
- Cache complexity

**After (JPG-only):**
- Check .jpg → Load
- ~1 request per image
- Simple cache

## 📞 Support

If you encounter issues:
1. Check the console logs for specific error messages
2. Verify your Supabase connection and permissions
3. Test with a single file first using the script
4. Review the temp directory for partial conversions

---

**Ready to convert?** Start with the dry run to see what would change! 🚀