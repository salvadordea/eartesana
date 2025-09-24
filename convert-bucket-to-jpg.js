/**
 * SUPABASE BUCKET IMAGE CONVERTER
 * ==============================
 * Converts all images in the product-images bucket to JPG format
 * Supports PNG, WEBP, JPEG → JPG conversion with quality optimization
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Check if sharp is available (for image conversion)
let sharp;
try {
    sharp = require('sharp');
    console.log('✅ Sharp library loaded for image conversion');
} catch (error) {
    console.error('❌ Sharp library not found. Install with: npm install sharp');
    process.exit(1);
}

// Supabase configuration
const SUPABASE_URL = 'https://yrmfrfpyqctvwyhrhivl.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybWZyZnB5cWN0dnd5aHJoaXZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk1ODkzNSwiZXhwIjoyMDczNTM0OTM1fQ.2Mz8WaiP-I3MWFjt1VxbbK2Kg2AlMqZaMpmrd9XZO8s';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const BUCKET_NAME = 'product-images';
const JPG_QUALITY = 85; // Quality for JPG compression (1-100)
const TEMP_DIR = './temp-conversions';

// Statistics tracking
let stats = {
    total: 0,
    converted: 0,
    skipped: 0,
    errors: 0,
    sizeBefore: 0,
    sizeAfter: 0
};

// Supported image formats to convert
const CONVERTIBLE_FORMATS = ['.png', '.webp', '.jpeg'];

async function setupTempDirectory() {
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
        console.log(`📁 Created temp directory: ${TEMP_DIR}`);
    }
}

async function cleanupTempDirectory() {
    if (fs.existsSync(TEMP_DIR)) {
        fs.rmSync(TEMP_DIR, { recursive: true });
        console.log(`🧹 Cleaned up temp directory: ${TEMP_DIR}`);
    }
}

async function listAllFiles(path = '') {
    const allFiles = [];

    try {
        const { data, error } = await supabase
            .storage
            .from(BUCKET_NAME)
            .list(path, {
                limit: 1000,
                sortBy: { column: 'name', order: 'asc' }
            });

        if (error) {
            throw error;
        }

        for (const item of data) {
            const fullPath = path ? `${path}/${item.name}` : item.name;

            if (item.metadata === null) {
                // It's a folder, recurse into it
                console.log(`📁 Exploring folder: ${fullPath}`);
                const subFiles = await listAllFiles(fullPath);
                allFiles.push(...subFiles);
            } else {
                // It's a file
                allFiles.push({
                    path: fullPath,
                    size: item.metadata.size,
                    lastModified: item.metadata.lastModified
                });
            }
        }

    } catch (error) {
        console.error(`❌ Error listing path ${path}:`, error);
    }

    return allFiles;
}

function getFileExtension(filePath) {
    return path.extname(filePath).toLowerCase();
}

function shouldConvert(filePath) {
    const ext = getFileExtension(filePath);
    return CONVERTIBLE_FORMATS.includes(ext);
}

function getJpgPath(originalPath) {
    const ext = getFileExtension(originalPath);
    return originalPath.replace(new RegExp(`${ext}$`, 'i'), '.jpg');
}

async function downloadFile(filePath) {
    try {
        const { data, error } = await supabase
            .storage
            .from(BUCKET_NAME)
            .download(filePath);

        if (error) {
            throw error;
        }

        return data;
    } catch (error) {
        console.error(`❌ Error downloading ${filePath}:`, error);
        return null;
    }
}

async function convertToJpg(imageBuffer, originalPath) {
    try {
        const tempInputPath = path.join(TEMP_DIR, `input-${Date.now()}${getFileExtension(originalPath)}`);
        const tempOutputPath = path.join(TEMP_DIR, `output-${Date.now()}.jpg`);

        // Convert Blob to Buffer if needed
        let buffer;
        if (imageBuffer instanceof Blob) {
            const arrayBuffer = await imageBuffer.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
        } else {
            buffer = Buffer.from(imageBuffer);
        }

        // Write input file
        fs.writeFileSync(tempInputPath, buffer);

        // Convert using Sharp
        await sharp(tempInputPath)
            .jpeg({
                quality: JPG_QUALITY,
                progressive: true,
                mozjpeg: true // Better compression
            })
            .toFile(tempOutputPath);

        // Read the converted file
        const convertedBuffer = fs.readFileSync(tempOutputPath);

        // Cleanup temp files
        fs.unlinkSync(tempInputPath);
        fs.unlinkSync(tempOutputPath);

        return convertedBuffer;

    } catch (error) {
        console.error(`❌ Error converting image:`, error);
        return null;
    }
}

async function uploadFile(filePath, buffer) {
    try {
        const { data, error } = await supabase
            .storage
            .from(BUCKET_NAME)
            .upload(filePath, buffer, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) {
            throw error;
        }

        return true;
    } catch (error) {
        console.error(`❌ Error uploading ${filePath}:`, error);
        return false;
    }
}

async function deleteFile(filePath) {
    try {
        const { error } = await supabase
            .storage
            .from(BUCKET_NAME)
            .remove([filePath]);

        if (error) {
            throw error;
        }

        return true;
    } catch (error) {
        console.error(`❌ Error deleting ${filePath}:`, error);
        return false;
    }
}

async function convertSingleFile(fileInfo) {
    const { path: filePath, size } = fileInfo;

    console.log(`🔄 Converting: ${filePath} (${(size / 1024).toFixed(1)}KB)`);

    // Download original file
    const imageBuffer = await downloadFile(filePath);
    if (!imageBuffer) {
        stats.errors++;
        return false;
    }

    // Convert to JPG
    const jpgBuffer = await convertToJpg(imageBuffer, filePath);
    if (!jpgBuffer) {
        stats.errors++;
        return false;
    }

    // Generate new path
    const jpgPath = getJpgPath(filePath);
    const newSize = jpgBuffer.byteLength;

    // Upload converted file
    const uploaded = await uploadFile(jpgPath, jpgBuffer);
    if (!uploaded) {
        stats.errors++;
        return false;
    }

    // Delete original file if it has a different name
    if (jpgPath !== filePath) {
        await deleteFile(filePath);
    }

    // Update statistics
    stats.converted++;
    stats.sizeBefore += size;
    stats.sizeAfter += newSize;

    const sizeReduction = ((size - newSize) / size * 100).toFixed(1);
    console.log(`✅ Converted: ${filePath} → ${jpgPath}`);
    console.log(`   Size: ${(size / 1024).toFixed(1)}KB → ${(newSize / 1024).toFixed(1)}KB (${sizeReduction}% reduction)`);

    return true;
}

async function convertAllImages() {
    console.log('🚀 Starting bucket-wide JPG conversion...');

    // Setup
    await setupTempDirectory();

    // Get all files
    console.log('📋 Getting complete file list...');
    const allFiles = await listAllFiles();

    console.log(`📊 Found ${allFiles.length} total files`);

    // Filter convertible images
    const convertibleFiles = allFiles.filter(file => shouldConvert(file.path));
    const jpgFiles = allFiles.filter(file => getFileExtension(file.path) === '.jpg');

    console.log(`🔄 Files to convert: ${convertibleFiles.length}`);
    console.log(`✅ Already JPG: ${jpgFiles.length}`);

    stats.total = allFiles.length;
    stats.skipped = jpgFiles.length;

    if (convertibleFiles.length === 0) {
        console.log('🎉 All images are already in JPG format!');
        await cleanupTempDirectory();
        return;
    }

    // Ask for confirmation
    console.log('\n⚠️  CONVERSION PREVIEW ⚠️');
    console.log('This will convert the following file types to JPG:');

    const formatCounts = {};
    convertibleFiles.forEach(file => {
        const ext = getFileExtension(file.path);
        formatCounts[ext] = (formatCounts[ext] || 0) + 1;
    });

    Object.entries(formatCounts).forEach(([format, count]) => {
        console.log(`  ${format.toUpperCase()}: ${count} files`);
    });

    console.log(`\nQuality setting: ${JPG_QUALITY}%`);
    console.log('Original files will be replaced with JPG versions.');
    console.log('\n🔄 Starting conversion process...\n');

    // Process files in batches
    const batchSize = 3; // Small batches to avoid overwhelming the API
    for (let i = 0; i < convertibleFiles.length; i += batchSize) {
        const batch = convertibleFiles.slice(i, i + batchSize);

        console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(convertibleFiles.length/batchSize)}`);

        const promises = batch.map(file => convertSingleFile(file));
        await Promise.allSettled(promises);

        // Small delay between batches
        if (i + batchSize < convertibleFiles.length) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    // Cleanup
    await cleanupTempDirectory();

    // Final statistics
    console.log('\n📊 Conversion Summary:');
    console.log(`✅ Successfully converted: ${stats.converted} files`);
    console.log(`❌ Failed conversions: ${stats.errors} files`);
    console.log(`⏭️  Skipped (already JPG): ${stats.skipped} files`);
    console.log(`📁 Total files processed: ${stats.total} files`);

    if (stats.converted > 0) {
        const totalSizeBefore = (stats.sizeBefore / 1024 / 1024).toFixed(2);
        const totalSizeAfter = (stats.sizeAfter / 1024 / 1024).toFixed(2);
        const totalReduction = ((stats.sizeBefore - stats.sizeAfter) / stats.sizeBefore * 100).toFixed(1);

        console.log(`\n💾 Storage Impact:`);
        console.log(`   Before: ${totalSizeBefore} MB`);
        console.log(`   After: ${totalSizeAfter} MB`);
        console.log(`   Savings: ${totalReduction}% reduction`);
    }
}

// The main function should actually do conversions, let's rename the current main to dryRun
async function dryRun() {
    console.log('🧪 DRY RUN MODE - No conversions will be performed');
    console.log('==================================================');

    const allFiles = await listAllFiles();
    const convertibleFiles = allFiles.filter(file => shouldConvert(file.path));
    const jpgFiles = allFiles.filter(file => getFileExtension(file.path) === '.jpg');

    console.log(`\n📊 Conversion Preview:`);
    console.log(`Total files: ${allFiles.length}`);
    console.log(`Already JPG: ${jpgFiles.length}`);
    console.log(`To convert: ${convertibleFiles.length}`);

    if (convertibleFiles.length > 0) {
        console.log('\nFiles that would be converted:');

        const formatCounts = {};
        convertibleFiles.forEach(file => {
            const ext = getFileExtension(file.path);
            formatCounts[ext] = (formatCounts[ext] || 0) + 1;
        });

        Object.entries(formatCounts).forEach(([format, count]) => {
            console.log(`  ${format.toUpperCase()}: ${count} files`);
        });

        console.log('\nSample files:');
        convertibleFiles.slice(0, 10).forEach(file => {
            const newPath = getJpgPath(file.path);
            console.log(`  ${file.path} → ${newPath}`);
        });

        if (convertibleFiles.length > 10) {
            console.log(`  ... and ${convertibleFiles.length - 10} more files`);
        }
    }
}

// Now create the real main function that does actual conversions
async function main() {
    try {
        console.log('🎯 Supabase Bucket JPG Converter');
        console.log('=================================');

        // Test connection
        console.log('🔗 Testing Supabase connection...');
        const { data: buckets, error } = await supabase.storage.listBuckets();

        if (error) {
            throw new Error(`Connection failed: ${error.message}`);
        }

        console.log('✅ Connected to Supabase');

        if (!buckets.find(b => b.name === BUCKET_NAME)) {
            throw new Error(`Bucket '${BUCKET_NAME}' not found`);
        }

        await convertAllImages();

    } catch (error) {
        console.error('💥 Conversion failed:', error);
        await cleanupTempDirectory();
        process.exit(1);
    }
}

// Export functions for use
module.exports = {
    main,
    dryRun,
    convertAllImages
};

// Run if called directly
if (require.main === module) {
    // Change this to main() to actually perform conversions
    main().catch(console.error);
}