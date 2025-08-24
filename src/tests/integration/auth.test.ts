import { FastifyInstance } from 'fastify';
import { AppConfig } from '../../config/app';
import { authRoutes } from '../../routes/auth';
import { User } from '../../models/User';

describe('Authentication Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await AppConfig.createApp();
    await app.register(authRoutes, { prefix: '/auth' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    const validUserData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    };

    it('should register a new user successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: validUserData
      });

      expect(response.statusCode).toBe(201);
      
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.message).toBe('User registered successfully');
      expect(body.data.user.email).toBe(validUserData.email);
      expect(body.data.user.name).toBe(validUserData.name);
      expect(body.data.user.id).toBeDefined();
      expect(body.data.token).toBeDefined();

      const user = await User.findOne({ email: validUserData.email });
      expect(user).toBeTruthy();
    });

    it('should return 409 for duplicate email', async () => {
      await User.create(validUserData);

      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: validUserData
      });

      expect(response.statusCode).toBe(409);
      
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.message).toBe('User already exists with this email');
    });

    it('should return 400 for missing name', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'john@example.com',
          password: 'password123'
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid email format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          name: 'John Doe',
          email: 'invalid-email',
          password: 'password123'
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for short password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          name: 'John Doe',
          email: 'john@example.com',
          password: '123'
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    const userData = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123'
    };

    beforeEach(async () => {
      const user = new User(userData);
      await user.save();
    });

    it('should login user with valid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: userData.email,
          password: userData.password
        }
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Login successful');
      expect(body.data.user.email).toBe(userData.email);
      expect(body.data.user.name).toBe(userData.name);
      expect(body.data.token).toBeDefined();
    });

    it('should return 401 for non-existent user', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'password123'
        }
      });

      expect(response.statusCode).toBe(401);
      
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Invalid email or password');
    });

    it('should return 401 for wrong password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: userData.email,
          password: 'wrongpassword'
        }
      });

      expect(response.statusCode).toBe(401);
      
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Invalid email or password');
    });

    it('should return 400 for missing email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          password: 'password123'
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for missing password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: userData.email
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /auth/profile', () => {
    let user: any;
    let token: string;

    beforeEach(async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          name: 'Profile User',
          email: 'profile@example.com',
          password: 'password123'
        }
      });

      const body = JSON.parse(response.payload);
      token = body.data.token;
      user = body.data.user;
    });

    it('should return user profile with valid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/profile',
        headers: {
          authorization: `Bearer ${token}`
        }
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.user.id).toBe(user.id);
      expect(body.data.user.email).toBe(user.email);
      expect(body.data.user.name).toBe(user.name);
      expect(body.data.user.createdAt).toBeDefined();
      expect(body.data.user.updatedAt).toBeDefined();
    });

    it('should return 401 for missing authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/profile'
      });

      expect(response.statusCode).toBe(401);
      
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('Unauthorized');
      expect(body.message).toBe('Authorization header is missing');
    });

    it('should return 401 for invalid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/profile',
        headers: {
          authorization: 'Bearer invalid.token.here'
        }
      });

      expect(response.statusCode).toBe(401);
      
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('Unauthorized');
      expect(body.message).toBe('Invalid token');
    });

    it('should return 401 for malformed authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/profile',
        headers: {
          authorization: 'InvalidFormat token'
        }
      });

      expect(response.statusCode).toBe(401);
      
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('Unauthorized');
      expect(body.message).toBe('Invalid authorization header format');
    });
  });
});