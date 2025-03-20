import { writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import app from '../src';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define custom tags
const tags = [
  {
    name: 'AUTH',
    description: 'Authentication endpoints',
  },
  {
    name: 'TWO_FACTOR',
    description: 'Two-factor authentication endpoints',
  },
  {
    name: 'PROFILE',
    description: 'User profile management endpoints',
  },
  {
    name: 'EMAIL',
    description: 'Email verification endpoints',
  },
  {
    name: 'OAUTH',
    description: 'OAuth authentication endpoints',
  },
  {
    name: 'PASSWORD',
    description: 'Password reset endpoints',
  },
  {
    name: 'WAITLIST',
    description: 'Waitlist management endpoints',
  },
  {
    name: 'URL_SHORTENING',
    description: 'URL shortening endpoints',
  },
  {
    name: 'URL_MANAGEMENT',
    description: 'URL management endpoints',
  },
  {
    name: 'URL_STATISTICS',
    description: 'URL statistics endpoints',
  },
  {
    name: 'URL_GROUPS',
    description: 'URL group management endpoints',
  },
  {
    name: 'DOMAINS',
    description: 'Custom domain management endpoints',
  },
  {
    name: 'EVENTS',
    description: 'Event tracking endpoints',
  },
  {
    name: 'URL_ANALYTICS',
    description: 'URL analytics endpoints',
  },
  {
    name: 'DETAILED_ANALYTICS',
    description: 'Detailed analytics endpoints',
  },
  {
    name: 'USER_ANALYTICS',
    description: 'User analytics endpoints',
  },
  {
    name: 'STORAGE',
    description: 'Storage management endpoints',
  },
  {
    name: 'QR_CODES',
    description: 'QR code generation endpoints',
  },
  {
    name: 'USER_FEEDBACK',
    description: 'User feedback submission endpoints',
  },
  {
    name: 'ADMIN_FEEDBACK',
    description: 'Admin feedback management endpoints',
  },
];

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
  tags: tags,
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
