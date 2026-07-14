import fs from 'node:fs';
import sharp from 'sharp';

async function generate() {
  const inputFile = 'public/logo.png';
  if (!fs.existsSync(inputFile)) {
    console.log("Please save your logo as public/logo.png first.");
    return;
  }

  console.log("Generating PWA icons...");
  
  // 192x192
  await sharp(inputFile)
    .resize(192, 192, { fit: 'contain', background: { r: 17, g: 17, b: 17, alpha: 1 } })
    .toFile('public/pwa-icon-192.png');
    
  // 512x512
  await sharp(inputFile)
    .resize(512, 512, { fit: 'contain', background: { r: 17, g: 17, b: 17, alpha: 1 } })
    .toFile('public/pwa-icon-512.png');
    
  // Maskable 512x512 (with some padding)
  await sharp(inputFile)
    .resize(400, 400, { fit: 'contain', background: { r: 17, g: 17, b: 17, alpha: 1 } })
    .extend({ top: 56, bottom: 56, left: 56, right: 56, background: { r: 17, g: 17, b: 17, alpha: 1 } })
    .toFile('public/maskable-icon-512.png');
    
  console.log("Icons generated successfully!");
}

generate().catch(console.error);
