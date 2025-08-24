import { FastifyRequest, FastifyReply } from 'fastify';
import { JWTUtil, JWTPayload } from '../utils/jwt';
import { User } from '../models/User';

declare module 'fastify' {
  interface FastifyRequest {
    user: JWTPayload;
  }
}

export async function authMiddleware(
  request: FastifyRequest, 
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    const token = JWTUtil.extractTokenFromHeader(authHeader);
    const payload = JWTUtil.verifyToken(token);
    
    const user = await User.findById(payload.id).select('_id email name');
    if (!user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'User not found'
      });
    }

    request.user = payload;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    return reply.status(401).send({
      error: 'Unauthorized',
      message
    });
  }
}

export async function optionalAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return;
    }

    const token = JWTUtil.extractTokenFromHeader(authHeader);
    const payload = JWTUtil.verifyToken(token);
    
    const user = await User.findById(payload.id).select('_id email name');
    if (user) {
      request.user = payload;
    }
  } catch (error) {
    // Optional auth - ignore errors and continue without user context
  }
}