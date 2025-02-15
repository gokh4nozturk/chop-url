# Chop URL Backend

## Architecture Overview

The backend follows a Clean Architecture with Middleware Pattern approach, combining several architectural patterns:

### 1. Layered Architecture
```
src/
├── moduleName/           # Her modül kendi içinde bağımsız
│   ├── routes.ts        # HTTP endpoints ve request/response handling
│   ├── middleware.ts    # Service injection ve cross-cutting concerns
│   ├── service.ts       # Business logic
│   └── types.ts         # Type definitions
└── types.ts             # Shared types
```

### 2. Module Structure

Her modül şu katmanlardan oluşur:

#### Routes Layer (Presentation)
```typescript
export const createModuleRoutes = () => {
  const router = new Hono<{ Bindings: Env; Variables: ModuleVariables }>();
  
  router.use('*', withModuleService);
  
  router.post('/', async (c) => {
    const result = await c.var.moduleService.doSomething();
    return c.json(result);
  });
  
  return router;
};
```

#### Middleware Layer (DI)
```typescript
export const withModuleService: MiddlewareHandler<{
  Bindings: Env;
  Variables: Variables & { moduleService: ModuleService };
}> = async (c, next) => {
  const service = new ModuleService(c.get('db'));
  c.set('moduleService', service);
  await next();
};
```

#### Service Layer (Business)
```typescript
export class ModuleService {
  constructor(private readonly db: Database) {}
  
  async doSomething() {
    // Business logic
  }
}
```

### 3. Key Benefits

- **Separation of Concerns**: Her katmanın net bir sorumluluğu var
- **Dependency Injection**: Service'ler middleware üzerinden inject ediliyor
- **Type Safety**: Her katman için özel type tanımları
- **Testability**: Her katman bağımsız test edilebilir
- **Maintainability**: Kod organizasyonu ve okunabilirlik
- **Scalability**: Yeni modüller kolayca eklenebilir

### 4. Usage Example

Yeni bir modül eklemek için:

1. Modül klasörü oluştur: `src/newModule/`
2. Service layer implement et: `service.ts`
3. Middleware oluştur: `middleware.ts`
4. Route'ları tanımla: `routes.ts`
5. Ana uygulamaya ekle: `src/index.ts`

```typescript
// src/index.ts
app.route('/api/newModule', createNewModuleRoutes());
```

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

## Environment Variables

Gerekli environment variable'lar:

```env
DB=
BUCKET=
R2_PUBLIC_URL=
BASE_URL=
FRONTEND_URL=
JWT_SECRET=
```

## Development Setup

1. Clone the repository
2. Install dependencies:
```bash
pnpm install
```

3. Configure Wrangler:
   - Copy `wrangler.example.toml` to `wrangler.toml`:
   ```bash
   cp wrangler.example.toml wrangler.toml
   ```
   - Update the following values in your `wrangler.toml`:
     - `RESEND_API_KEY`: Your Resend API key
     - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
     - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: Your Google OAuth credentials
     - `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`: Your GitHub OAuth credentials
     - `database_id`: Your D1 database IDs for both local and production environments

4. Start the development server:
```bash
pnpm run dev
```

## Security Note

The `wrangler.toml` file contains sensitive information and is not tracked in git. Make sure to never commit this file and keep your API keys and secrets secure. 