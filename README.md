# Chop URL Monorepo

This monorepo contains the following packages:

- `@chop-url/backend`: The backend service for URL shortening
- `@chop-url/frontend`: The frontend application (to be implemented)
- `@chop-url/lib`: The core URL shortening library that can be used as an NPM package

## Project Structure

```
packages/
  ├── backend/     # Backend service
  ├── frontend/    # Frontend application
  └── chop-url-lib/# NPM package library
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

## License

MIT 