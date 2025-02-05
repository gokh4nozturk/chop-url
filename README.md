# Chop URL

[![CI/CD](https://github.com/gokh4nozturk/chop-url/actions/workflows/ci.yml/badge.svg)](https://github.com/gokh4nozturk/chop-url/actions/workflows/ci.yml)

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

### Backend (Cloudflare Workers)

1. Install Wrangler CLI:
```bash
pnpm add -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

3. Create a D1 database:
```bash
wrangler d1 create chop_url_db
```

4. Update the database_id in `wrangler.toml`

5. Deploy:
```bash
pnpm deploy:backend
```

### Frontend (Vercel)

1. Install Vercel CLI:
```bash
pnpm add -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
pnpm deploy:frontend
```

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