# Chop URL Monorepo

This monorepo contains the following packages:

- `@chop-url/backend`: The backend service for URL shortening (Cloudflare Workers)
- `@chop-url/frontend`: The frontend application (to be implemented)
- `@chop-url/lib`: The core URL shortening library that can be used as an NPM package

## Project Structure

```
packages/
  ├── backend/        # Backend service (Cloudflare Workers)
  ├── chop-url-fe/    # Frontend application
  └── chop-url-lib/   # NPM package library
```

## Development

### Installation

```bash
npm install
```

This will install dependencies for all packages.

### Building

```bash
npm run build
```

This will build all packages.

### Testing

```bash
npm test
```

This will run tests for all packages.

### Linting

```bash
npm run lint
```

This will run linting for all packages.

## Deployment

### Backend (Cloudflare Workers)

1. Install Wrangler CLI:
```bash
npm i -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

3. Create a D1 database:
```bash
wrangler d1 create chop_url_db
```

4. Update the database_id in `wrangler.toml` with the ID from step 3.

5. Deploy:
```bash
npm run deploy:backend
```

For local development:
```bash
npm run dev:backend
```

### Frontend (Vercel)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
npm run deploy:frontend
```

### NPM Package

1. Login to NPM:
```bash
npm login
```

2. Publish:
```bash
npm run publish:lib
```

## Environment Variables

### Backend (Cloudflare Workers)
- `BASE_URL`: Base URL for short links (configured in wrangler.toml)

### Frontend
- `NEXT_PUBLIC_API_URL`: Backend API URL

## License

MIT 