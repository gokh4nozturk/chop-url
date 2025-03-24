import { writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import app from '../src';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get OpenAPI document from the app
const openApiDoc = app.getOpenAPIDocument({
  openapi: '3.0.0',
  info: {
    title: 'Chop URL API',
    version: '1.0.0',
    description: 'URL Shortener Service API Documentation',
  },
  servers: [
    {
      url: 'http://localhost:8787',
      description: 'Development server',
    },
    {
      url: 'https://api.chop-url.com',
      description: 'Production server',
    },
  ],
});

// Debug: Check tags in paths
console.log('Debugging tags in OpenAPI document:');
for (const [path, methods] of Object.entries(openApiDoc.paths || {})) {
  for (const [method, config] of Object.entries(methods)) {
    console.log(`Path: ${path}, Method: ${method}, Tags:`, config.tags);
  }
}

// Write to file
const OUTPUT_FILE = resolve(__dirname, '../src/openapi.json');

try {
  writeFileSync(OUTPUT_FILE, JSON.stringify(openApiDoc, null, 2));
  console.log('✅ OpenAPI documentation generated successfully!');
} catch (error) {
  console.error('❌ Error generating OpenAPI documentation:', error);
  process.exit(1);
}
