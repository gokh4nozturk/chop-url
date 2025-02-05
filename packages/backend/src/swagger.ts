export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Chop-URL API',
    version: '1.0.0',
    description: 'A modern URL shortening service API',
  },
  servers: [
    {
      url: process.env.BASE_URL || 'http://localhost:3000',
      description: 'Development server',
    },
  ],
  paths: {
    '/api/urls': {
      post: {
        tags: ['URLs'],
        summary: 'Create a short URL',
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
                    example: 'https://www.google.com',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Short URL created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    shortUrl: {
                      type: 'string',
                      example: 'http://localhost:3000/abc123',
                    },
                    originalUrl: {
                      type: 'string',
                      example: 'https://www.google.com',
                    },
                    shortId: {
                      type: 'string',
                      example: 'abc123',
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
                  type: 'object',
                  properties: {
                    error: {
                      type: 'string',
                      example: 'URL is required',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/{shortId}': {
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
                  type: 'object',
                  properties: {
                    error: {
                      type: 'string',
                      example: 'URL not found',
                    },
                  },
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
            description: 'URL statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    shortId: {
                      type: 'string',
                      example: 'abc123',
                    },
                    originalUrl: {
                      type: 'string',
                      example: 'https://www.google.com',
                    },
                    created: {
                      type: 'string',
                      format: 'date-time',
                    },
                    lastAccessed: {
                      type: 'string',
                      format: 'date-time',
                      nullable: true,
                    },
                    visitCount: {
                      type: 'integer',
                      example: 42,
                    },
                    totalVisits: {
                      type: 'integer',
                      example: 42,
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
                  type: 'object',
                  properties: {
                    error: {
                      type: 'string',
                      example: 'URL not found',
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
