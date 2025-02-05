const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function generateOgImage() {
  const publicDir = path.join(__dirname, '../public');
  const svgPath = path.join(publicDir, 'og-image.svg');

  try {
    const svg = await fs.readFile(svgPath);

    // Generate OG image
    await sharp(svg)
      .resize(1200, 630)
      .toFile(path.join(publicDir, 'og-image.png'));

    console.log('✅ Open Graph image generated successfully!');
  } catch (error) {
    console.error('Error generating Open Graph image:', error);
    process.exit(1);
  }
}

generateOgImage();
