export const openApiSchema = {
  openapi: '3.0.0',
  info: {
    title: 'Chop URL API',
    version: '1.0.0',
    description:
      'Modern URL shortening service with authentication and analytics',
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
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'UUID',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
          },
          email: {
            type: 'string',
            format: 'email',
          },
          name: {
            type: 'string',
          },
          isEmailVerified: {
            type: 'boolean',
          },
          isTwoFactorEnabled: {
            type: 'boolean',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      URLInfo: {
        type: 'object',
        properties: {
          shortId: {
            type: 'string',
            example: 'abc123',
          },
          originalUrl: {
            type: 'string',
            format: 'uri',
            example: 'https://example.com',
          },
          shortUrl: {
            type: 'string',
            format: 'uri',
            example: 'https://chop-url.com/abc123',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          visits: {
            type: 'integer',
            example: 42,
          },
          expiresAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
          tags: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          groupId: {
            type: 'integer',
            nullable: true,
          },
          isActive: {
            type: 'boolean',
            default: true,
          },
        },
      },
      URLGroup: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
          },
          name: {
            type: 'string',
          },
          description: {
            type: 'string',
            nullable: true,
          },
          userId: {
            type: 'integer',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      URLStats: {
        type: 'object',
        properties: {
          visitCount: {
            type: 'integer',
          },
          lastAccessedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          originalUrl: {
            type: 'string',
            format: 'uri',
          },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: {
            $ref: '#/components/schemas/User',
          },
          token: {
            type: 'string',
          },
          expiresAt: {
            type: 'string',
            format: 'date-time',
          },
          requiresTwoFactor: {
            type: 'boolean',
          },
        },
      },
      QRCode: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
          },
          urlId: {
            type: 'integer',
          },
          imageUrl: {
            type: 'string',
          },
          logoUrl: {
            type: 'string',
            nullable: true,
          },
          logoSize: {
            type: 'integer',
            nullable: true,
          },
          logoPosition: {
            type: 'string',
            nullable: true,
          },
          downloadCount: {
            type: 'integer',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Feedback: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          category: {
            type: 'string',
            enum: ['bug', 'feature', 'improvement', 'other'],
          },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          status: { type: 'string', enum: ['open', 'in_progress', 'closed'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      example: 'ok',
                    },
                    timestamp: {
                      type: 'string',
                      format: 'date-time',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    // Auth Routes
    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current user',
        security: [{ bearerAuth: [] }],
      },
      responses: {
        '200': {
          description: 'Current user retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/User',
              },
            },
          },
        },
      },
      '401': {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'confirmPassword', 'name'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                  },
                  password: {
                    type: 'string',
                    minLength: 8,
                  },
                  confirmPassword: {
                    type: 'string',
                    minLength: 8,
                  },
                  name: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthResponse',
                },
              },
            },
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                  },
                  password: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthResponse',
                },
              },
            },
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/setup-2fa': {
      post: {
        tags: ['Authentication'],
        summary: 'Setup two-factor authentication',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: '2FA setup successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    secret: {
                      type: 'string',
                    },
                    qrCodeUrl: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/verify-2fa-setup': {
      post: {
        tags: ['Authentication'],
        summary: 'Verify 2FA setup',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['code'],
                properties: {
                  code: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: '2FA setup verified successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                    },
                  },
                },
              },
            },
          },
        },
        '400': {
          description: 'Invalid code',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    '/api/auth/recovery-codes': {
      get: {
        tags: ['Authentication'],
        summary: 'Get recovery codes',
        security: [{ bearerAuth: [] }],
      },
      responses: {
        '200': {
          description: 'Recovery codes retrieved successfully',
        },
      },
      '400': {
        description: 'Invalid request',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
      '500': {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
    },
    '/api/auth/verify-2fa': {
      post: {
        tags: ['Authentication'],
        summary: 'Verify two-factor authentication code',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'code'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                  },
                  code: {
                    type: 'string',
                    pattern: '^[0-9]{6}$',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: '2FA verification successful',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthResponse',
                },
              },
            },
          },
          '400': {
            description: 'Invalid code',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/enable-2fa': {
      post: {
        tags: ['Authentication'],
        summary: 'Enable 2FA',
        security: [{ bearerAuth: [] }],
      },
      responses: {
        '200': {
          description: '2FA enabled successfully',
        },
      },
      '400': {
        description: 'Invalid code',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
      '500': {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
    },
    '/api/auth/disable-2fa': {
      post: {
        tags: ['Authentication'],
        summary: 'Disable 2FA',
        security: [{ bearerAuth: [] }],
      },
      responses: {
        '200': {
          description: '2FA disabled successfully',
        },
      },
      '400': {
        description: 'Invalid code',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
      '500': {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
    },
    '/api/auth/profile': {
      put: {
        tags: ['User'],
        summary: 'Update user profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'name'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                  },
                  name: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Profile updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: {
                      $ref: '#/components/schemas/User',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/password': {
      put: {
        tags: ['User'],
        summary: 'Update user password',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['password', 'newPassword', 'confirmPassword'],
                properties: {
                  password: {
                    type: 'string',
                    format: 'email',
                  },
                  newPassword: {
                    type: 'string',
                  },
                  confirmPassword: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Password updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/verify-email': {
      post: {
        tags: ['Authentication'],
        summary: 'Verify email address',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token'],
                properties: {
                  token: {
                    type: 'string',
                    description: 'Email verification token',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Email verified successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Email verified successfully',
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid token',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/resend-verification-email': {
      post: {
        tags: ['Authentication'],
        summary: 'Resend verification email',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Verification email sent successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Verification email sent successfully',
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Error sending verification email',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/oauth/{provider}': {
      get: {
        tags: ['Authentication'],
        summary: 'Initiate OAuth flow',
        parameters: [
          {
            name: 'provider',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              enum: ['google', 'github'],
            },
            description: 'OAuth provider',
          },
        ],
        responses: {
          '302': {
            description: 'Redirect to OAuth provider',
          },
          '400': {
            description: 'Invalid provider',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/oauth/{provider}/callback': {
      get: {
        tags: ['Authentication'],
        summary: 'OAuth callback',
        parameters: [
          {
            name: 'provider',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              enum: ['google', 'github'],
            },
            description: 'OAuth provider',
          },
          {
            name: 'code',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
            },
            description: 'OAuth authorization code',
          },
          {
            name: 'state',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
            },
            description: 'OAuth state for CSRF protection',
          },
        ],
        responses: {
          '200': {
            description: 'OAuth authentication successful',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthResponse',
                },
              },
            },
          },
          '400': {
            description: 'Invalid OAuth callback',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    // URL Routes
    '/api/shorten': {
      post: {
        tags: ['URL'],
        summary: 'Create a short URL (authenticated)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['url'],
                properties: {
                  url: {
                    type: 'string',
                    format: 'uri',
                  },
                  customSlug: {
                    type: 'string',
                    pattern: '^[a-zA-Z0-9-_]+$',
                  },
                  expiresAt: {
                    type: 'string',
                    format: 'date-time',
                  },
                  tags: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                  },
                  groupId: {
                    type: 'integer',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'URL shortened successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/URLInfo',
                },
              },
            },
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '409': {
            description: 'Custom slug already exists',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/chop': {
      post: {
        tags: ['URL'],
        summary: 'Create a short URL (public)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['url'],
                properties: {
                  url: {
                    type: 'string',
                    format: 'uri',
                  },
                  customSlug: {
                    type: 'string',
                    pattern: '^[a-zA-Z0-9-_]+$',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'URL shortened successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    shortUrl: {
                      type: 'string',
                      format: 'uri',
                    },
                    shortId: {
                      type: 'string',
                    },
                    expiresAt: {
                      type: 'string',
                      format: 'date-time',
                      nullable: true,
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '409': {
            description: 'Custom slug already exists',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/urls': {
      get: {
        tags: ['URL'],
        summary: 'Get all URLs for current user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'URLs retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/URLInfo',
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/urls/{shortId}': {
      get: {
        tags: ['URL'],
        summary: 'Get URL details',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'shortId',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'URL details retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/URLInfo',
                },
              },
            },
          },
          '404': {
            description: 'URL not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
      patch: {
        tags: ['URL'],
        summary: 'Update URL',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'shortId',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  originalUrl: {
                    type: 'string',
                    format: 'uri',
                  },
                  customSlug: {
                    type: 'string',
                    pattern: '^[a-zA-Z0-9-_]+$',
                  },
                  expiresAt: {
                    type: 'string',
                    format: 'date-time',
                  },
                  tags: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                  },
                  groupId: {
                    type: 'integer',
                  },
                  isActive: {
                    type: 'boolean',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'URL updated successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/URLInfo',
                },
              },
            },
          },
          '404': {
            description: 'URL not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ['URL'],
        summary: 'Delete URL',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'shortId',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'URL deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
          '404': {
            description: 'URL not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/stats/{shortId}': {
      get: {
        tags: ['Statistics'],
        summary: 'Get URL statistics',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'shortId',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
          {
            name: 'period',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['24h', '7d', '30d', '90d'],
              default: '7d',
            },
          },
        ],
        responses: {
          '200': {
            description: 'URL statistics retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/URLStats',
                },
              },
            },
          },
          '404': {
            description: 'URL not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/stats/{shortId}/visits': {
      get: {
        tags: ['Statistics'],
        summary: 'Get URL visit history',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'shortId',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
          {
            name: 'period',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['24h', '7d', '30d', '90d'],
              default: '7d',
            },
          },
        ],
        responses: {
          '200': {
            description: 'URL visit history retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      date: {
                        type: 'string',
                        format: 'date-time',
                      },
                      visits: {
                        type: 'integer',
                      },
                    },
                  },
                },
              },
            },
          },
          '404': {
            description: 'URL not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/analytics': {
      get: {
        tags: ['Statistics'],
        summary: 'Get user analytics',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'period',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['24h', '7d', '30d', '90d'],
              default: '7d',
            },
          },
        ],
        responses: {
          '200': {
            description: 'User analytics retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    totalVisits: {
                      type: 'integer',
                    },
                    totalUrls: {
                      type: 'integer',
                    },
                    topUrls: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/URLInfo',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/url-groups': {
      get: {
        tags: ['URL Groups'],
        summary: 'Get all URL groups for current user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'URL groups retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/URLGroup',
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['URL Groups'],
        summary: 'Create a new URL group',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: {
                    type: 'string',
                  },
                  description: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'URL group created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/URLGroup',
                },
              },
            },
          },
        },
      },
    },
    '/api/url-groups/{id}': {
      put: {
        tags: ['URL Groups'],
        summary: 'Update a URL group',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                  description: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'URL group updated successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/URLGroup',
                },
              },
            },
          },
          '400': {
            description: 'Invalid request body',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '404': {
            description: 'URL group not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ['URL Groups'],
        summary: 'Delete a URL group',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer',
            },
          },
        ],
        responses: {
          '200': {
            description: 'URL group deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'URL group not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/qr': {
      post: {
        tags: ['QR Code'],
        summary: 'Create a QR code for a URL',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  urlId: {
                    type: 'integer',
                  },
                  imageUrl: {
                    type: 'string',
                  },
                },
                required: ['urlId', 'imageUrl'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'QR code created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/QRCode',
                },
              },
            },
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/qr/url/{urlId}': {
      get: {
        tags: ['QR Code'],
        summary: 'Get QR code by URL ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'urlId',
            in: 'path',
            required: true,
            schema: {
              type: 'integer',
            },
          },
        ],
        responses: {
          '200': {
            description: 'QR code retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/QRCode',
                },
              },
            },
          },
          '204': {
            description: 'No QR code found for this URL',
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/qr/{id}': {
      get: {
        tags: ['QR Code'],
        summary: 'Get QR code by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer',
            },
          },
        ],
        responses: {
          '200': {
            description: 'QR code retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/QRCode',
                },
              },
            },
          },
          '404': {
            description: 'QR code not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
      put: {
        tags: ['QR Code'],
        summary: 'Update QR code',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  imageUrl: {
                    type: 'string',
                  },
                  logoUrl: {
                    type: 'string',
                  },
                  logoSize: {
                    type: 'integer',
                  },
                  logoPosition: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'QR code updated successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/QRCode',
                },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/qr/{id}/download': {
      post: {
        tags: ['QR Code'],
        summary: 'Increment download count for QR code',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Download count incremented successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/storage/generate-presigned-url': {
      post: {
        tags: ['Storage'],
        summary: 'Generate a presigned URL for file upload/download',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  path: {
                    type: 'string',
                    description: 'Path where the file will be stored',
                  },
                  operation: {
                    type: 'string',
                    enum: ['read', 'write'],
                    default: 'write',
                    description: 'Operation type (read or write)',
                  },
                },
                required: ['path'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Presigned URL generated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    url: {
                      type: 'string',
                      description: 'Presigned URL',
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/storage/public-url': {
      get: {
        tags: ['Storage'],
        summary: 'Get public URL for a file',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'path',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
            },
            description: 'Path of the file',
          },
        ],
        responses: {
          '200': {
            description: 'Public URL retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    url: {
                      type: 'string',
                      description: 'Public URL',
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/ws': {
      get: {
        tags: ['WebSocket'],
        summary: 'WebSocket connection endpoint',
        description: 'Establish a WebSocket connection for real-time updates',
        parameters: [
          {
            name: 'Upgrade',
            in: 'header',
            required: true,
            schema: {
              type: 'string',
              enum: ['websocket'],
            },
            description: 'WebSocket upgrade header',
          },
        ],
        responses: {
          '101': {
            description: 'WebSocket connection established',
          },
          '426': {
            description: 'Upgrade Required',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: {
                      type: 'string',
                      example: 'Expected Upgrade: websocket',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/analytics/export': {
      get: {
        tags: ['Statistics'],
        summary: 'Export analytics data',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'period',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['24h', '7d', '30d', '90d'],
              default: '7d',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Analytics data exported successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          shortUrl: { type: 'string' },
                          originalUrl: { type: 'string' },
                          visits: { type: 'integer' },
                          createdAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '500': {
            description: 'Failed to export analytics',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/urls/{shortId}/stats': {
      get: {
        tags: ['Statistics'],
        summary: 'Get detailed URL statistics',
        parameters: [
          {
            name: 'shortId',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
          {
            name: 'timeRange',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['24h', '7d', '30d', '90d'],
              default: '7d',
            },
          },
        ],
        responses: {
          '200': {
            description: 'URL statistics retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    visits: { type: 'integer' },
                    uniqueVisitors: { type: 'integer' },
                    topReferrers: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          referrer: { type: 'string' },
                          count: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid time range',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '404': {
            description: 'URL not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/urls/{shortId}/events': {
      get: {
        tags: ['Statistics'],
        summary: 'Get URL events',
        parameters: [
          {
            name: 'shortId',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
          {
            name: 'timeRange',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['24h', '7d', '30d', '90d'],
              default: '7d',
            },
          },
          {
            name: 'eventType',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'URL events retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string' },
                      timestamp: { type: 'string', format: 'date-time' },
                      data: { type: 'object' },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid time range',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '404': {
            description: 'URL not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/domains': {
      get: {
        tags: ['Domains'],
        summary: 'Get all domains for current user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Domains retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      domain: { type: 'string' },
                      isVerified: { type: 'boolean' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Domains'],
        summary: 'Add a new domain',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['domain'],
                properties: {
                  domain: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Domain added successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    domain: { type: 'string' },
                    isVerified: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid domain',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/domains/{id}': {
      delete: {
        tags: ['Domains'],
        summary: 'Delete a domain',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Domain deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Domain not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/domains/{id}/verify': {
      post: {
        tags: ['Domains'],
        summary: 'Verify domain ownership',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Domain verified successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Domain not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/admin/waitlist': {
      get: {
        tags: ['Admin'],
        summary: 'Get waitlist entries',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Waitlist entries retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      email: { type: 'string' },
                      status: {
                        type: 'string',
                        enum: ['pending', 'approved', 'rejected'],
                      },
                      createdAt: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Admin'],
        summary: 'Add to waitlist',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Added to waitlist successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid email',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/admin/waitlist/{id}/approve': {
      post: {
        tags: ['Admin'],
        summary: 'Approve waitlist entry',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Waitlist entry approved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Waitlist entry not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/admin/waitlist/{id}/reject': {
      post: {
        tags: ['Admin'],
        summary: 'Reject waitlist entry',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Waitlist entry rejected successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Waitlist entry not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/domains/{id}/dns': {
      post: {
        tags: ['Domains'],
        summary: 'Add DNS record',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type', 'name', 'content'],
                properties: {
                  type: {
                    type: 'string',
                    enum: ['A', 'AAAA', 'CNAME', 'TXT', 'MX'],
                  },
                  name: { type: 'string' },
                  content: { type: 'string' },
                  priority: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'DNS record added successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    type: { type: 'string' },
                    name: { type: 'string' },
                    content: { type: 'string' },
                    proxied: { type: 'boolean' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid request body',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '404': {
            description: 'Domain not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/domains/{id}/get': {
      get: {
        tags: ['Domains'],
        summary: 'Get domain details',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Domain details retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    domain: { type: 'string' },
                    isVerified: { type: 'boolean' },
                    settings: {
                      type: 'object',
                      properties: {
                        customDomain: { type: 'boolean' },
                        ssl: { type: 'boolean' },
                      },
                    },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Domain not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/domains/{id}/patch': {
      patch: {
        tags: ['Domains'],
        summary: 'Update domain settings',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  domain: { type: 'string' },
                  settings: {
                    type: 'object',
                    properties: {
                      customDomain: { type: 'boolean' },
                      ssl: { type: 'boolean' },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Domain updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    domain: { type: 'string' },
                    isVerified: { type: 'boolean' },
                    settings: {
                      type: 'object',
                      properties: {
                        customDomain: { type: 'boolean' },
                        ssl: { type: 'boolean' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid request body',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '404': {
            description: 'Domain not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/admin/feedback': {
      post: {
        tags: ['Admin'],
        summary: 'Submit feedback',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'description', 'category'],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  category: {
                    type: 'string',
                    enum: ['bug', 'feature', 'improvement', 'other'],
                  },
                  priority: {
                    type: 'string',
                    enum: ['low', 'medium', 'high'],
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Feedback submitted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    id: { type: 'string' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid request body',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      get: {
        tags: ['Admin'],
        summary: 'Get user feedback',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'User feedback retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      content: { type: 'string' },
                      type: { type: 'string' },
                      status: { type: 'string' },
                      createdAt: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/admin/feedback/all': {
      get: {
        tags: ['Admin'],
        summary: 'Get all feedback (Admin)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'All feedback retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      content: { type: 'string' },
                      type: { type: 'string' },
                      status: { type: 'string' },
                      userId: { type: 'string' },
                      createdAt: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/admin/feedback/{id}/status': {
      patch: {
        tags: ['Admin'],
        summary: 'Update feedback status (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['pending', 'in_progress', 'completed', 'rejected'],
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Feedback status updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/admin/feedback/{id}/priority': {
      patch: {
        tags: ['Admin'],
        summary: 'Update feedback priority (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['priority'],
                properties: {
                  priority: {
                    type: 'string',
                    enum: ['low', 'medium', 'high', 'urgent'],
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Feedback priority updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/request-password-reset': {
      post: {
        tags: ['Authentication'],
        summary: 'Request password reset',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Password reset request sent successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/reset-password': {
      put: {
        tags: ['Authentication'],
        summary: 'Reset password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'newPassword', 'confirmPassword'],
                properties: {
                  token: { type: 'string' },
                  newPassword: { type: 'string' },
                  confirmPassword: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Password reset successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/analytics/events': {
      post: {
        tags: ['Analytics'],
        summary: 'Track analytics event',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type', 'urlId'],
                properties: {
                  type: { type: 'string' },
                  urlId: { type: 'integer' },
                  metadata: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Event tracked successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/analytics/custom-events': {
      post: {
        tags: ['Analytics'],
        summary: 'Create custom analytics event',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'userId'],
                properties: {
                  name: { type: 'string' },
                  userId: { type: 'integer' },
                  metadata: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Custom event created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/analytics/events/{urlId}': {
      get: {
        tags: ['Analytics'],
        summary: 'Get URL events',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'urlId',
            in: 'path',
            required: true,
            schema: {
              type: 'integer',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Events retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      type: { type: 'string' },
                      urlId: { type: 'integer' },
                      metadata: { type: 'object' },
                      createdAt: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/analytics/custom-events/{userId}': {
      get: {
        tags: ['Analytics'],
        summary: 'Get user custom events',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: {
              type: 'integer',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Custom events retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      name: { type: 'string' },
                      userId: { type: 'integer' },
                      metadata: { type: 'object' },
                      createdAt: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
