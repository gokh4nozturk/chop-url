const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function generateFavicons() {
  const publicDir = path.join(__dirname, '../public');
  const svgPath = path.join(publicDir, 'icon.svg');

  try {
    const svg = await fs.readFile(svgPath);

    // Generate regular favicons
    await sharp(svg)
      .resize(16, 16)
      .toFile(path.join(publicDir, 'favicon-16.png'));

    await sharp(svg)
      .resize(32, 32)
      .toFile(path.join(publicDir, 'favicon-32.png'));

    await sharp(svg)
      .resize(192, 192)
      .toFile(path.join(publicDir, 'favicon-192.png'));

    await sharp(svg)
      .resize(512, 512)
      .toFile(path.join(publicDir, 'favicon-512.png'));

    // Generate maskable icons (with padding)
    const maskableSvg = await sharp(svg)
      .resize(640, 640)
      .extend({
        top: 64,
        bottom: 64,
        left: 64,
        right: 64,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toBuffer();

    await sharp(maskableSvg)
      .resize(192, 192)
      .toFile(path.join(publicDir, 'favicon-maskable-192.png'));

    await sharp(maskableSvg)
      .resize(512, 512)
      .toFile(path.join(publicDir, 'favicon-maskable-512.png'));

    // Generate Apple Touch Icon
    await sharp(svg)
      .resize(180, 180)
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));

    // Generate ICO file
    const ico16 = await sharp(svg).resize(16, 16).toBuffer();
    const ico32 = await sharp(svg).resize(32, 32).toBuffer();
    const ico48 = await sharp(svg).resize(48, 48).toBuffer();

    await sharp(ico48).toFile(path.join(publicDir, 'favicon.ico'));

    console.log('✅ All favicons generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
    process.exit(1);
  }
}

generateFavicons();
