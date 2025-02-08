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
      url: 'https://api.chop-url.com',
      description: 'Production server',
    },
    {
      url: 'http://localhost:8787',
      description: 'Development server',
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
    '/api/shorten': {
      post: {
        tags: ['URL'],
        summary: 'Shorten a URL',
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
        },
      },
    },
    '/api/urls': {
      get: {
        tags: ['URLs'],
        summary: 'Get all URLs for current user',
        security: [
          {
            bearerAuth: [],
          },
        ],
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
    '/api/{shortId}': {
      get: {
        tags: ['URLs'],
        summary: 'Redirect to original URL',
        parameters: [
          {
            name: 'shortId',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
            description: 'Short URL identifier',
          },
        ],
        responses: {
          '302': {
            description: 'Redirect to original URL',
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
        parameters: [
          {
            name: 'shortId',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
            description: 'Short URL identifier',
          },
        ],
        responses: {
          '200': {
            description: 'URL statistics retrieved successfully',
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
    },
  },
};
