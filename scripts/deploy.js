#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
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
    requiredEnvVars: ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID'],
  },
  redirect: {
    name: 'Redirect Service',
    path: 'packages/chop-url-redirect',
    commands: {
      dev: 'pnpm run dev',
      prod: 'pnpm run deploy --env production',
    },
    requiredEnvVars: ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID'],
  },
  frontend: {
    name: 'Frontend App',
    path: 'packages/chop-url-fe',
    commands: {
      dev: 'pnpm run dev',
      prod: 'pnpm run deploy --prod',
    },
    requiredEnvVars: ['VERCEL_TOKEN', 'VERCEL_ORG_ID', 'VERCEL_PROJECT_ID'],
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

function validateEnvironment(packageName, env) {
  const pkg = packages[packageName];

  if (!pkg) {
    logger.error(`Unknown package: ${packageName}`);
    return false;
  }

  if (env !== 'dev' && env !== 'prod') {
    logger.error(`Invalid environment: ${env}. Must be 'dev' or 'prod'`);
    return false;
  }

  // Skip environment variable validation for 'dev' environment
  if (env === 'dev') return true;

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
  const commandKey = packageName === 'lib' ? 'build' : env;
  const command = pkg.commands[commandKey];

  if (!command) {
    logger.error(`No ${env} command defined for ${pkg.name}`);
    return false;
  }

  if (!skipValidation) {
    if (!validatePackagePath(pkg)) return false;
    if (!validateEnvironment(packageName, env)) return false;
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
    if (VERBOSE && error.stdout) {
      logger.debug(`Output: ${error.stdout.toString()}`);
    }
    return false;
  }
}

// Initialize CLI
program
  .name('deploy')
  .description('Deployment helper for Chop URL monorepo')
  .version('1.0.0');

// Add deploy command
program
  .command('run')
  .description('Deploy one or all packages')
  .argument(
    '[package]',
    'Package to deploy (lib, backend, redirect, frontend, or all)',
    'all'
  )
  .option(
    '-e, --environment <env>',
    'Deployment environment (dev or prod)',
    'dev'
  )
  .option('--skip-lib', 'Skip building the library package', false)
  .option('--skip-validation', 'Skip environment validation', false)
  .action((packageName, options) => {
    const env = options.environment;
    const skipValidation = options.skipValidation || CI_MODE;

    logger.info(
      `Starting deployment in ${env} environment ${CI_MODE ? '[CI mode]' : ''}`
    );

    // Display the deployment plan
    if (packageName === 'all') {
      logger.info('Deployment plan:');
      if (!options.skipLib) logger.info('  1. Build library package');
      logger.info(`  ${!options.skipLib ? '2' : '1'}. Deploy backend package`);
      logger.info(`  ${!options.skipLib ? '3' : '2'}. Deploy redirect package`);
      logger.info(`  ${!options.skipLib ? '4' : '3'}. Deploy frontend package`);
    } else {
      logger.info(`Deploying package: ${packageName}`);
    }

    // Always build lib first if deploying backend, redirect, frontend or all
    // unless --skip-lib flag is set
    if (!options.skipLib && (packageName === 'all' || packageName !== 'lib')) {
      logger.step(1, packageName === 'all' ? 4 : 2, 'Building library package');
      const libSuccess = deployPackage('lib', 'build', { skipValidation });
      if (!libSuccess) {
        logger.error('Library build failed, stopping deployment');
        process.exit(1);
      }
    }

    if (packageName === 'all') {
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
    } else if (packages[packageName]) {
      // Deploy specific package
      const success = deployPackage(packageName, env, { skipValidation });
      if (!success && env === 'prod') {
        process.exit(1);
      }
    } else {
      logger.error(`Unknown package "${packageName}"`);
      logger.info('Available packages: lib, backend, redirect, frontend, all');
      process.exit(1);
    }

    logger.success('Deployment completed successfully!');
  });

// Parse command-line arguments or export functions for testing
if (require.main === module) {
  program.parse(process.argv);
} else {
  module.exports = {
    deployPackage,
    validateEnvironment,
    validatePackagePath,
  };
}
