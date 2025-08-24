import dotenv from 'dotenv';
import { AppConfig } from './config/app';
import { authRoutes } from './routes/auth';
import { noteRoutes } from './routes/notes';

// Load environment variables
dotenv.config();

const start = async () => {
  try {
    const fastify = await AppConfig.createApp();
    
    // Register routes
    await fastify.register(authRoutes, { prefix: '/auth' });
    await fastify.register(noteRoutes, { prefix: '/notes' });

    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    
    console.log(`🚀 Server ready at http://${host}:${port}`);
    console.log(`📚 Documentation: http://${host}:${port}/docs`);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
};

start();