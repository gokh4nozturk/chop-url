#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { program } from 'commander';

// Configuration
const CI_MODE = process.env.CI === 'true';
const VERBOSE = process.env.VERBOSE === 'true' || process.env.DEBUG === 'true';

// Colors for console output (disabled in CI mode)
const colors = CI_MODE
  ? {
      reset: '',
      red: '',
      green: '',
      yellow: '',
      blue: '',
      magenta: '',
      cyan: '',
      dim: '',
    }
  : {
      reset: '\x1b[0m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      dim: '\x1b[2m',
    };

// Helper function to parse TOML files
function parseToml(content) {
  // Very basic TOML parser for our needs
  const result = {};
  const lines = content.split('\n');
  let currentSection = result;
  let currentSectionName = '';

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip comments and empty lines
    if (trimmedLine === '' || trimmedLine.startsWith('#')) continue;

    // Section headers [section] or [[section]]
    if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
      const sectionName = trimmedLine.replace(/\[|\]/g, '').trim();

      // Handle nested sections like [env.production]
      if (sectionName.includes('.')) {
        const parts = sectionName.split('.');
        let current = result;

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (i === parts.length - 1) {
            current[part] = current[part] || {};
            currentSection = current[part];
            currentSectionName = sectionName;
          } else {
            current[part] = current[part] || {};
            current = current[part];
          }
        }
      } else {
        result[sectionName] = result[sectionName] || {};
        currentSection = result[sectionName];
        currentSectionName = sectionName;
      }
      continue;
    }

    // Key-value pairs
    if (trimmedLine.includes('=')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      const trimmedKey = key.trim();
      const value = valueParts.join('=').trim();

      // Handle string values (remove quotes)
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        currentSection[trimmedKey] = value.slice(1, -1);
      }
      // Handle boolean values
      else if (value === 'true' || value === 'false') {
        currentSection[trimmedKey] = value === 'true';
      }
      // Handle numeric values
      else if (!Number.isNaN(Number(value))) {
        currentSection[trimmedKey] = Number(value);
      }
      // Default to string
      else {
        currentSection[trimmedKey] = value;
      }
    }
  }

  return result;
}

// Function to read Vercel project configuration
function readVercelConfig(packagePath) {
  try {
    const projectJsonPath = join(
      process.cwd(),
      packagePath,
      '.vercel/project.json'
    );

    if (existsSync(projectJsonPath)) {
      const projectJson = JSON.parse(readFileSync(projectJsonPath, 'utf8'));
      return {
        VERCEL_ORG_ID: projectJson.orgId,
        VERCEL_PROJECT_ID: projectJson.projectId,
      };
    }
  } catch (error) {
    logger.debug(`Failed to read Vercel config: ${error.message}`);
  }

  return {};
}

// Function to read Cloudflare configuration from wrangler.toml
function readWranglerConfig(packagePath, env) {
  try {
    const wranglerPath = join(process.cwd(), packagePath, 'wrangler.toml');

    if (existsSync(wranglerPath)) {
      const wranglerContent = readFileSync(wranglerPath, 'utf8');
      const config = parseToml(wranglerContent);

      // Get configuration for the specific environment or use default
      const envConfig =
        env === 'prod' && config.env && config.env.production
          ? config.env.production
          : config;

      // We'll only use the account ID, not the API token to use wrangler's login
      return {
        CLOUDFLARE_ACCOUNT_ID:
          envConfig.vars?.ACCOUNT_ID || config.vars?.ACCOUNT_ID,
      };
    }
  } catch (error) {
    logger.debug(`Failed to read wrangler.toml: ${error.message}`);
  }

  return {};
}

// Define packages and their deploy commands
const packages = {
  lib: {
    name: 'Library',
    path: 'packages/chop-url-lib',
    commands: {
      build: 'pnpm run build',
    },
    requiredEnvVars: [],
  },
  backend: {
    name: 'Backend API',
    path: 'packages/backend',
    commands: {
      dev: 'pnpm run dev',
      prod: 'pnpm run deploy:prod',
    },
    requiredEnvVars: ['CLOUDFLARE_ACCOUNT_ID'],
    configReader: readWranglerConfig,
  },
  redirect: {
    name: 'Redirect Service',
    path: 'packages/chop-url-redirect',
    commands: {
      dev: 'pnpm run dev',
      prod: 'pnpm run deploy --env production',
    },
    requiredEnvVars: ['CLOUDFLARE_ACCOUNT_ID'],
    configReader: readWranglerConfig,
  },
  frontend: {
    name: 'Frontend App',
    path: 'packages/chop-url-fe',
    commands: {
      dev: 'pnpm run dev',
      prod: 'pnpm run deploy --prod',
    },
    requiredEnvVars: [],
    configReader: readVercelConfig,
  },
};

// Utility functions
const logger = {
  info: (message) => console.log(`${colors.blue}ℹ ${colors.reset}${message}`),
  success: (message) =>
    console.log(`${colors.green}✓ ${colors.reset}${message}`),
  warn: (message) => console.log(`${colors.yellow}⚠ ${colors.reset}${message}`),
  error: (message) => console.error(`${colors.red}✗ ${colors.reset}${message}`),
  debug: (message) =>
    VERBOSE && console.log(`${colors.dim}${message}${colors.reset}`),
  step: (step, total, message) =>
    console.log(`${colors.cyan}[${step}/${total}] ${colors.reset}${message}`),
};

function validateEnvironment(packageName, env, skipValidation = false) {
  const pkg = packages[packageName];

  if (!pkg) {
    logger.error(`Unknown package: ${packageName}`);
    return false;
  }

  // Special case for library package which uses 'build' instead of 'dev' or 'prod'
  if (packageName === 'lib' && env === 'build') {
    return true;
  }

  if (env !== 'dev' && env !== 'prod') {
    logger.error(`Invalid environment: ${env}. Must be 'dev' or 'prod'`);
    return false;
  }

  // Skip environment variable validation for 'dev' environment or if skipValidation is true
  if (env === 'dev' || skipValidation) return true;

  // Try to read config from config files if available
  if (pkg.configReader) {
    const configValues = pkg.configReader(pkg.path, env);

    // Temporarily add the config values to process.env
    for (const [key, value] of Object.entries(configValues)) {
      if (value) process.env[key] = value;
    }
  }

  // Check if any required environment variables are missing
  const missingEnvVars = pkg.requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  );

  if (missingEnvVars.length > 0) {
    logger.error(`Missing required environment variables for ${pkg.name}:`);
    for (const envVar of missingEnvVars) {
      logger.error(`  - ${envVar}`);
    }
    return false;
  }

  return true;
}

function validatePackagePath(pkg) {
  const absolutePath = join(process.cwd(), pkg.path);

  if (!existsSync(absolutePath)) {
    logger.error(`Package path does not exist: ${pkg.path}`);
    return false;
  }

  return true;
}

// Function to deploy a single package
function deployPackage(packageName, env, options = {}) {
  const { skipValidation = false } = options;
  const pkg = packages[packageName];

  // Handle special case for lib package which uses 'build' command
  const commandKey = packageName === 'lib' ? 'build' : env;
  const command = pkg.commands[commandKey];

  if (!command) {
    logger.error(`No ${commandKey} command defined for ${pkg.name}`);
    return false;
  }

  if (!skipValidation) {
    if (!validatePackagePath(pkg)) return false;
    if (!validateEnvironment(packageName, commandKey, skipValidation))
      return false;
  }

  logger.info(`Deploying ${pkg.name}...`);

  try {
    logger.debug(`> cd ${pkg.path} && ${command}`);
    execSync(`cd ${pkg.path} && ${command}`, {
      stdio: VERBOSE ? 'inherit' : 'pipe',
      env: process.env,
    });
    logger.success(`${pkg.name} deployed successfully`);
    return true;
  } catch (error) {
    logger.error(`${pkg.name} deployment failed: ${error.message}`);
    if (error.stdout) {
      logger.error(`Command output: ${error.stdout.toString()}`);
    }
    if (error.stderr) {
      logger.error(`Command error output: ${error.stderr.toString()}`);
    }
    return false;
  }
}

// Filter out any '--' argument which might be passed when script is called from npm
const args = process.argv.filter((arg) => arg !== '--');

// Initialize CLI
program
  .name('deploy')
  .description('Deployment helper for Chop URL monorepo')
  .version('1.0.0');

// Add deploy command
program
  .command('run [package]')
  .description('Deploy one or all packages')
  .option(
    '-e, --environment <env>',
    'Deployment environment (dev or prod)',
    'dev'
  )
  .option('--skip-lib', 'Skip building the library package', false)
  .option('--skip-validation', 'Skip environment validation', false)
  .action((packageName, options) => {
    // Set default package name to 'all' if not provided
    const pkgName = packageName || 'all';
    const env = options.environment;
    const skipValidation = options.skipValidation || CI_MODE;

    logger.info(
      `Starting deployment in ${env} environment ${CI_MODE ? '[CI mode]' : ''}`
    );

    // Display the deployment plan
    if (pkgName === 'all') {
      logger.info('Deployment plan:');
      if (!options.skipLib) logger.info('  1. Build library package');
      logger.info(`  ${!options.skipLib ? '2' : '1'}. Deploy backend package`);
      logger.info(`  ${!options.skipLib ? '3' : '2'}. Deploy redirect package`);
      logger.info(`  ${!options.skipLib ? '4' : '3'}. Deploy frontend package`);
    } else {
      logger.info(`Deploying package: ${pkgName}`);
    }

    // Always build lib first if deploying backend, redirect, frontend or all
    // unless --skip-lib flag is set
    if (!options.skipLib && (pkgName === 'all' || pkgName !== 'lib')) {
      logger.step(1, pkgName === 'all' ? 4 : 2, 'Building library package');
      const libSuccess = deployPackage('lib', 'build', { skipValidation });
      if (!libSuccess) {
        logger.error('Library build failed, stopping deployment');
        process.exit(1);
      }
    }

    if (pkgName === 'all') {
      // Deploy all packages in the correct order
      const stepOffset = options.skipLib ? 0 : 1;

      logger.step(1 + stepOffset, 4, 'Deploying backend package');
      const backendSuccess = deployPackage('backend', env, { skipValidation });
      if (!backendSuccess && env === 'prod') {
        logger.error('Backend deployment failed, stopping deployment');
        process.exit(1);
      }

      logger.step(2 + stepOffset, 4, 'Deploying redirect package');
      const redirectSuccess = deployPackage('redirect', env, {
        skipValidation,
      });
      if (!redirectSuccess && env === 'prod') {
        logger.error('Redirect service deployment failed, stopping deployment');
        process.exit(1);
      }

      logger.step(3 + stepOffset, 4, 'Deploying frontend package');
      const frontendSuccess = deployPackage('frontend', env, {
        skipValidation,
      });
      if (!frontendSuccess && env === 'prod') {
        logger.error('Frontend deployment failed');
        process.exit(1);
      }
    } else if (packages[pkgName]) {
      // Deploy specific package
      const success = deployPackage(pkgName, env, { skipValidation });
      if (!success && env === 'prod') {
        process.exit(1);
      }
    } else {
      logger.error(`Unknown package "${pkgName}"`);
      logger.info('Available packages: lib, backend, redirect, frontend, all');
      process.exit(1);
    }

    logger.success('Deployment completed successfully!');
  });

// Execute the program
program.parse(args);
