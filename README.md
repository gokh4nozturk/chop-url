# Chop URL

[![CI/CD](https://github.com/gokh4nozturk/chop-url/actions/workflows/ci.yml/badge.svg)](https://github.com/gokh4nozturk/chop-url/actions/workflows/ci.yml)  ![](https://api.checklyhq.com/v1/badges/checks/8dab41ef-69f8-4a6f-8ef4-53d788f0816f?style=flat&theme=default)

A modern, scalable URL shortening service built with serverless architecture using Cloudflare Workers and Vercel.

## Overview

Chop URL is a comprehensive URL shortening solution that includes:

- Fast and reliable URL shortening service
- Modern web interface
- Reusable core library
- Enterprise-grade features

## Project Structure

```
packages/
  ├── backend/             # Backend service (Cloudflare Workers)
  ├── chop-url-fe/         # Frontend application (Next.js)
  ├── chop-url-lib/        # Core URL shortening library (NPM package)
  └── chop-url-redirect/   # URL redirection service
```

## Prerequisites

- Node.js >= 18
- pnpm >= 8
- Cloudflare account (for deployment)
- Vercel account (for frontend deployment)

## Development

### Installation

```bash
# Install pnpm if you haven't already
npm install -g pnpm

# Install dependencies
pnpm install
```

### Available Scripts

```bash
# Development
pnpm dev              # Start all services in development mode

# Building
pnpm build           # Build all packages

# Testing
pnpm test            # Run tests for all packages

# Code Quality
pnpm format          # Check code formatting
pnpm format:fix      # Fix code formatting
pnpm lint            # Check code linting
pnpm lint:fix        # Fix code linting issues

# Deployment
pnpm deploy:lib      # Deploy the core library
pnpm deploy:backend  # Deploy the backend service
pnpm deploy:redirect # Deploy the redirect service
pnpm deploy:frontend # Deploy the frontend application
pnpm deploy:all      # Deploy all services
```

## Deployment

Chop URL uses a specialized deployment system that can be used in both local development and CI/CD environments.

### Deployment Script

We provide a powerful deployment CLI tool for deploying packages individually or all at once:

```bash
# Deploy all packages in production mode
pnpm run deploy -- -e prod all

# Deploy only backend in development mode
pnpm run deploy -- -e dev backend

# Deploy frontend in production mode
pnpm run deploy -- -e prod frontend
```

### Available Options

The deployment script supports several options:

| Option | Description |
|--------|-------------|
| `-e, --environment <env>` | Deployment environment (`dev` or `prod`), default: `dev` |
| `--skip-lib` | Skip building the library package |
| `--skip-validation` | Skip environment variable validation (automatic in CI mode) |

### Environment Variables

Each package requires specific environment variables for deployment in production mode:

#### Backend & Redirect Service
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

#### Frontend
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### CI/CD Integration

The deployment script is fully integrated with our GitHub Actions CI/CD pipeline. For CI runs, the script automatically detects the CI environment and adjusts its behavior accordingly.

## Environment Variables

### Backend
- `BASE_URL`: Base URL for shortened links
- `DATABASE_URL`: D1 database connection URL

### Frontend
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_BASE_URL`: Base URL for the frontend application

### Redirect Service
- `BACKEND_URL`: URL of the backend service

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
