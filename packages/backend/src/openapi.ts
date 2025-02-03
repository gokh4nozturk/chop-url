export const openApiSchema = {
  openapi: '3.0.0',
  info: {
    title: 'Chop URL API',
    version: '1.0.0',
    description: 'API for URL shortening service'
  },
  servers: [
    {
      url: 'https://chop-url-backend.gokhaanozturk.workers.dev',
      description: 'Production server'
    }
  ],
  paths: {
    '/health': {
      get: {
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
                      example: 'ok'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/urls': {
      post: {
        summary: 'Create a short URL',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  url: {
                    type: 'string',
                    format: 'uri',
                    example: 'https://example.com'
                  }
                },
                required: ['url']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Short URL created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    shortId: {
                      type: 'string',
                      example: 'abc123'
                    },
                    originalUrl: {
                      type: 'string',
                      format: 'uri',
                      example: 'https://example.com'
                    },
                    shortUrl: {
                      type: 'string',
                      format: 'uri',
                      example: 'https://chop-url.workers.dev/abc123'
                    },
                    createdAt: {
                      type: 'string',
                      format: 'date-time'
                    },
                    visits: {
                      type: 'integer',
                      example: 0
                    }
                  }
                }
              }
            }
          },
          '500': {
            description: 'Error creating short URL',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/urls/{shortId}': {
      get: {
        summary: 'Get URL information',
        parameters: [
          {
            name: 'shortId',
            in: 'path',
            required: true,
            schema: {
              type: 'string'
            },
            description: 'Short URL identifier'
          }
        ],
        responses: {
          '200': {
            description: 'URL information retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    shortId: {
                      type: 'string',
                      example: 'abc123'
                    },
                    originalUrl: {
                      type: 'string',
                      format: 'uri',
                      example: 'https://example.com'
                    },
                    shortUrl: {
                      type: 'string',
                      format: 'uri',
                      example: 'https://chop-url.workers.dev/abc123'
                    },
                    createdAt: {
                      type: 'string',
                      format: 'date-time'
                    },
                    visits: {
                      type: 'integer',
                      example: 42
                    }
                  }
                }
              }
            }
          },
          '404': {
            description: 'URL not found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/{shortId}': {
      get: {
        summary: 'Redirect to original URL',
        parameters: [
          {
            name: 'shortId',
            in: 'path',
            required: true,
            schema: {
              type: 'string'
            },
            description: 'Short URL identifier'
          }
        ],
        responses: {
          '302': {
            description: 'Redirect to original URL'
          },
          '404': {
            description: 'URL not found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}; 