import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { User, IUser } from '../models/User';
import { JWTUtil } from '../utils/jwt';
import { authMiddleware } from '../middleware/auth';

interface RegisterBody {
  email: string;
  password: string;
  name: string;
}

interface LoginBody {
  email: string;
  password: string;
}

const registerSchema = {
  tags: ['Authentication'],
  summary: 'Register a new user',
  description: 'Create a new user account with email, password, and name. Returns user data and JWT token.',
  body: {
    type: 'object',
    required: ['email', 'password', 'name'],
    properties: {
      email: { 
        type: 'string', 
        format: 'email',
        description: 'User email address'
      },
      password: { 
        type: 'string', 
        minLength: 6,
        description: 'User password (minimum 6 characters)'
      },
      name: { 
        type: 'string', 
        maxLength: 50,
        description: 'User full name'
      }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' }
              }
            },
            token: { type: 'string' }
          }
        }
      }
    }
  }
};

const loginSchema = {
  tags: ['Authentication'],
  summary: 'Login user',
  description: 'Authenticate user with email and password. Returns user data and JWT token.',
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { 
        type: 'string', 
        format: 'email',
        description: 'User email address'
      },
      password: { 
        type: 'string',
        description: 'User password'
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' }
              }
            },
            token: { type: 'string' }
          }
        }
      }
    }
  }
};

const profileSchema = {
  tags: ['Authentication'],
  summary: 'Get user profile',
  description: 'Get current user profile information. Requires valid JWT token.',
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }]
};

export async function authRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  
  fastify.post<{ Body: RegisterBody }>('/register', {
    schema: registerSchema
  }, async (request, reply) => {
    try {
      const { email, password, name } = request.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return reply.status(409).send({
          success: false,
          error: 'Conflict',
          message: 'User already exists with this email'
        });
      }

      const user = new User({ email, password, name });
      await user.save();

      const token = JWTUtil.generateToken(user);

      return reply.status(201).send({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name
          },
          token
        }
      });

    } catch (error) {
      if (error instanceof Error && error.name === 'ValidationError') {
        return reply.status(400).send({
          success: false,
          error: 'Validation Error',
          message: error.message
        });
      }

      request.log.error(`Registration error: ${(error as Error).message}`);
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to register user'
      });
    }
  });

  fastify.post<{ Body: LoginBody }>('/login', {
    schema: loginSchema
  }, async (request, reply) => {
    try {
      const { email, password } = request.body;

      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return reply.status(401).send({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid email or password'
        });
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return reply.status(401).send({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid email or password'
        });
      }

      const token = JWTUtil.generateToken(user);

      return reply.status(200).send({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name
          },
          token
        }
      });

    } catch (error) {
      request.log.error(`Login error: ${(error as Error).message}`);
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to login'
      });
    }
  });

  fastify.get('/profile', {
    schema: profileSchema,
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    try {
      const user = await User.findById(request.user.id);
      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'Not Found',
          message: 'User not found'
        });
      }

      return reply.status(200).send({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        }
      });

    } catch (error) {
      request.log.error(`Profile error: ${(error as Error).message}`);
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get user profile'
      });
    }
  });
}