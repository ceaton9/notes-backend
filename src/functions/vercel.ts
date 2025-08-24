import { VercelRequest, VercelResponse } from '@vercel/node';
import { FastifyInstance } from 'fastify';
import { AppConfig } from '../config/app';
import { authRoutes } from '../routes/auth';
import { noteRoutes } from '../routes/notes';

let cachedApp: FastifyInstance | null = null;

const getApp = async (): Promise<FastifyInstance> => {
  if (cachedApp) {
    return cachedApp;
  }

  const app = await AppConfig.createApp();
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(noteRoutes, { prefix: '/notes' });
  await app.ready();
  
  cachedApp = app;
  return app;
};

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const app = await getApp();
    
    // Handle the request with Fastify
    const fastifyResponse = await app.inject({
      method: req.method as any,
      url: req.url || '/',
      headers: req.headers as any,
      payload: req.body,
      query: req.query as any
    });

    // Set response headers
    Object.entries(fastifyResponse.headers).forEach(([key, value]) => {
      res.setHeader(key, Array.isArray(value) ? value.join(', ') : String(value));
    });

    // Send response
    res.status(fastifyResponse.statusCode);
    res.send(fastifyResponse.payload);

  } catch (error) {
    console.error('Vercel handler error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Something went wrong'
    });
  }
};