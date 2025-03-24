#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get environment variables
const { VERCEL_PROJECT_ID, VERCEL_ORG_ID } = process.env;

if (!VERCEL_PROJECT_ID || !VERCEL_ORG_ID) {
  console.error(
    'Error: Missing required environment variables VERCEL_PROJECT_ID or VERCEL_ORG_ID'
  );
  process.exit(1);
}

// Create .vercel directory if it doesn't exist
const vercelDir = path.join(process.cwd(), '.vercel');
if (!fs.existsSync(vercelDir)) {
  fs.mkdirSync(vercelDir, { recursive: true });
}

// Create project.json file
const projectConfig = {
  projectId: VERCEL_PROJECT_ID,
  orgId: VERCEL_ORG_ID,
};

fs.writeFileSync(
  path.join(vercelDir, 'project.json'),
  JSON.stringify(projectConfig, null, 2)
);

console.log('Vercel project configuration created successfully');
