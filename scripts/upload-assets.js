const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configure your Supabase credentials
const SUPABASE_URL = 'https://npunmkleozeymvtckjpn.supabase.co'; // e.g., https://xxx.supabase.co
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wdW5ta2xlb3pleW12dGNranBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxNDg4MywiZXhwIjoyMDY3OTkwODgzfQ.wOsxvw5ajhB2w8AztKqOkJFiOz-Oefcd2h7hkfQ2xew'; // Get from Supabase Dashboard > Settings > API
const BUCKET_NAME = 'app-assets';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Function to upload a file
async function uploadFile(filePath, bucketPath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(bucketPath, fileBuffer, {
        contentType: getContentType(fileName),
        upsert: true, // Overwrite if exists
      });

    if (error) {
      console.error(`❌ Error uploading ${bucketPath}:`, error.message);
      return false;
    }

    console.log(`✅ Uploaded: ${bucketPath}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to upload ${filePath}:`, err.message);
    return false;
  }
}

// Get content type based on file extension
function getContentType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const types = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  };
  return types[ext] || 'application/octet-stream';
}

// Recursively upload directory
async function uploadDirectory(localDir, bucketDir) {
  const files = fs.readdirSync(localDir);

  for (const file of files) {
    const localPath = path.join(localDir, file);
    const bucketPath = path.join(bucketDir, file).replace(/\\/g, '/');

    if (fs.statSync(localPath).isDirectory()) {
      // Recursively upload subdirectory
      await uploadDirectory(localPath, bucketPath);
    } else {
      // Upload file
      await uploadFile(localPath, bucketPath);
    }
  }
}

// Main function
async function main() {
  console.log('🚀 Starting asset upload to Supabase Storage...\n');

  const assetsDir = path.join(__dirname, '..', 'assets');
  
  if (!fs.existsSync(assetsDir)) {
    console.error('❌ Assets directory not found!');
    process.exit(1);
  }

  await uploadDirectory(assetsDir, 'assets');

  console.log('\n✅ Upload complete!');
  console.log(`\nYour assets are now at: ${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/assets/`);
}

main();
