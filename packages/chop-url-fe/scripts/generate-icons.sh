#!/bin/bash

# Install dependencies if needed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is required but not installed. Please install it first."
    echo "On macOS: brew install imagemagick"
    echo "On Ubuntu: sudo apt-get install imagemagick"
    exit 1
fi

cd "$(dirname "$0")/../public"

# Generate favicon.ico (multi-size ico file)
convert favicon-16.svg -background none -define icon:auto-resize=16,32,48,64 favicon.ico

# Generate PNG favicons
convert favicon-16.svg -background none favicon-16.png
convert favicon-32.svg -background none favicon-32.png
convert icon.svg -background none -resize 192x192 favicon-192.png
convert icon.svg -background none -resize 512x512 favicon-512.png

# Generate maskable icons
convert icon.svg -background none -resize 192x192 -gravity center -extent 192x192 favicon-maskable-192.png
convert icon.svg -background none -resize 512x512 -gravity center -extent 512x512 favicon-maskable-512.png

# Generate Apple Touch Icon
convert apple-touch-icon.svg -background none -resize 180x180 apple-touch-icon.png

# Generate OG Image
convert og-image.svg -background none og-image.png

echo "All icons generated successfully!" 