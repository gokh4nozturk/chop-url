# Contributing to Chop URL

Thank you for your interest in contributing to Chop URL! This document provides guidelines and instructions for contributing to our project.

## Project Structure

The project is organized as a monorepo using PNPM workspaces with the following packages:

- `packages/backend`: Main API service built with Hono and Cloudflare Workers
- `packages/chop-url-fe`: Next.js frontend application
- `packages/chop-url-lib`: Shared library package
- `packages/chop-url-redirect`: URL redirection service
- `packages/example`: Example implementation

## Prerequisites

- Node.js >= 18
- PNPM >= 8
- Wrangler CLI (for Cloudflare Workers development)

## Database Setup

The project uses Cloudflare D1 (SQLite) for data storage. To set up the development database:

1. Install Wrangler CLI:
```bash
pnpm install -g wrangler
```

2. Create a local D1 database:
```bash
cd packages/backend
wrangler d1 create chop-url-db-local
```

3. Apply the database schema:
```bash
wrangler d1 execute chop-url-db-local --file=./schema.sql
```

The database schema includes the following main tables:
- `users`: User accounts and authentication
- `urls`: URL shortening records
- `visits`: Analytics data for URL visits
- `sessions`: User sessions
- `recovery_codes`: 2FA recovery codes
- `auth_attempts`: Authentication attempt tracking

## Development Setup

1. Clone the repository and its submodules:
```bash
git clone --recursive https://github.com/gokh4nozturk/chop-url.git
cd chop-url
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
- Copy `.env.example` to `.env` in each package that requires it
- Configure the necessary environment variables

4. Start the development servers:
```bash
# Start all services
pnpm dev

# Or start individual services
pnpm -F backend dev
pnpm -F chop-url-fe dev
pnpm -F chop-url-redirect dev
```

## Code Quality Standards

We use Biome for code formatting and linting. Before submitting your changes:

1. Format your code:
```bash
pnpm format
# or to fix issues automatically
pnpm format:fix
```

2. Lint your code:
```bash
pnpm lint
# or to fix issues automatically
pnpm lint:fix
```

The project is configured with husky and lint-staged to automatically run these checks on commit.

## Pull Request Process

1. Fork the repository and create a new branch from `main`:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and ensure:
- Code follows the project's style (enforced by Biome)
- All tests pass (`pnpm test`)
- Documentation is updated
- Commit messages follow conventional commits format

3. Push your changes and create a Pull Request:
- Provide a clear description of the changes
- Reference any related issues
- Wait for review and address any feedback

## Testing

- Write unit tests for new features using Vitest
- Ensure all existing tests pass:
```bash
pnpm test
```

## Deployment

The project supports different deployment environments:

```bash
# Deploy all services (development)
pnpm deploy:all

# Deploy all services (production)
pnpm deploy:all:prod

# Deploy individual services
pnpm deploy:backend
pnpm deploy:frontend
pnpm deploy:redirect
pnpm deploy:lib
```

## Documentation

- Update relevant README files
- Document new API endpoints in OpenAPI/Swagger
- Include JSDoc comments for new functions
- Update wiki documentation if necessary

## Questions or Problems?

- Open an issue for bugs or feature requests
- Check existing issues and wiki documentation
- Join our community discussions

## License

By contributing to Chop URL, you agree that your contributions will be licensed under the project's license.

Thank you for contributing to make Chop URL better! 🚀
