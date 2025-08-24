import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { DatabaseConfig } from './database';

export class AppConfig {
  private static instance: FastifyInstance;

  public static async createApp(): Promise<FastifyInstance> {
    if (AppConfig.instance) {
      return AppConfig.instance;
    }

    const app = Fastify({
      logger: true,
      trustProxy: true
    });

    await app.register(cors, {
      origin: true,
      credentials: true
    });

    await app.register(swagger, {
      openapi: {
        openapi: '3.0.0',
        info: {
          title: 'Notes API',
          description: 'CRUD API for Notes with JWT Authentication',
          version: '1.0.0'
        },
        servers: [
          {
            url: 'http://localhost:3000',
            description: 'Local development server'
          },
          {
            url: 'https://your-app-name.vercel.app',
            description: 'Production server (Vercel)'
          }
        ],
        tags: [
          {
            name: 'Authentication',
            description: 'User authentication and profile management'
          },
          {
            name: 'Notes',
            description: 'Notes CRUD operations with search and filtering'
          },
          {
            name: 'Health',
            description: 'Health check and monitoring endpoints'
          }
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT'
            }
          }
        }
      }
    });

    await app.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'full',
        deepLinking: false
      },
      staticCSP: true,
      transformStaticCSP: (header) => header
    });

    // Add health check route first
    app.get('/health', {
      schema: {
        tags: ['Health'],
        summary: 'Health check endpoint',
        description: 'Check if the API is running and healthy',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['ok'] },
              timestamp: { type: 'string', format: 'date-time' }
            },
            required: ['status', 'timestamp']
          }
        }
      }
    }, async (request, reply) => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Only connect to DB for routes that need it
    app.addHook('preHandler', async (request, reply) => {
      // Skip DB connection for health check and docs
      if (request.url === '/health' || request.url.startsWith('/docs')) {
        return;
      }
      
      try {
        const dbConfig = DatabaseConfig.getInstance();
        if (!dbConfig.getConnectionStatus()) {
          await dbConfig.connect();
        }
      } catch (error) {
        console.error('Database connection failed:', (error as Error).message);
        reply.status(503).send({
          error: 'Service Unavailable',
          message: 'Database connection failed'
        });
        return;
      }
    });

    app.setErrorHandler((error, request, reply) => {
      request.log.error(error);
      
      if (error.validation) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.message,
          details: error.validation
        });
      }

      if (error.statusCode) {
        return reply.status(error.statusCode).send({
          error: error.name || 'Error',
          message: error.message
        });
      }

      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Something went wrong'
      });
    });

    AppConfig.instance = app;
    return app;
  }

  public static getInstance(): FastifyInstance {
    if (!AppConfig.instance) {
      throw new Error('App instance not created. Call createApp() first.');
    }
    return AppConfig.instance;
  }
}