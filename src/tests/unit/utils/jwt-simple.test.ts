import { JWTUtil } from '../../../utils/jwt';
import jwt from 'jsonwebtoken';

describe('JWT Utility - Simple Tests', () => {
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashedPassword'
  };

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_EXPIRE = '1h';
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = JWTUtil.generateToken(mockUser as any);
      
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include correct user data in payload', () => {
      const token = JWTUtil.generateToken(mockUser as any);
      const decoded = jwt.decode(token) as any;

      expect(decoded.id).toBe(mockUser._id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.name).toBe(mockUser.name);
      expect(decoded.iss).toBe('notes-api');
    });

    it('should set expiration time', () => {
      const token = JWTUtil.generateToken(mockUser as any);
      const decoded = jwt.decode(token) as any;

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });
  });

  describe('verifyToken', () => {
    let validToken: string;

    beforeEach(() => {
      validToken = JWTUtil.generateToken(mockUser as any);
    });

    it('should verify valid token and return payload', () => {
      const payload = JWTUtil.verifyToken(validToken);

      expect(payload.id).toBe(mockUser._id);
      expect(payload.email).toBe(mockUser.email);
      expect(payload.name).toBe(mockUser.name);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        JWTUtil.verifyToken('invalid.token.here');
      }).toThrow('Invalid token');
    });

    it('should throw error for malformed token', () => {
      expect(() => {
        JWTUtil.verifyToken('not-a-jwt-token');
      }).toThrow('Invalid token');
    });

    it('should throw error for expired token', () => {
      // Create token with past expiration using expiresIn option
      const expiredToken = jwt.sign(
        {
          id: mockUser._id,
          email: mockUser.email,
          name: mockUser.name
        },
        'test-secret-key',
        {
          expiresIn: -1, // Expired immediately
          issuer: 'notes-api'
        }
      );

      expect(() => {
        JWTUtil.verifyToken(expiredToken);
      }).toThrow(); // Just check that it throws an error, not specific message
    });

    it('should throw error for token with wrong issuer', () => {
      const wrongIssuerToken = jwt.sign(
        {
          id: mockUser._id,
          email: mockUser.email,
          name: mockUser.name
        },
        'test-secret-key',
        {
          expiresIn: '1h',
          issuer: 'wrong-issuer'
        }
      );

      expect(() => {
        JWTUtil.verifyToken(wrongIssuerToken);
      }).toThrow('Invalid token');
    });

    it('should throw error for token signed with wrong secret', () => {
      const wrongSecretToken = jwt.sign(
        {
          id: mockUser._id,
          email: mockUser.email,
          name: mockUser.name
        },
        'wrong-secret-key',
        {
          expiresIn: '1h',
          issuer: 'notes-api'
        }
      );

      expect(() => {
        JWTUtil.verifyToken(wrongSecretToken);
      }).toThrow('Invalid token');
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'sample.jwt.token';
      const authHeader = `Bearer ${token}`;

      const extractedToken = JWTUtil.extractTokenFromHeader(authHeader);
      expect(extractedToken).toBe(token);
    });

    it('should throw error for missing authorization header', () => {
      expect(() => {
        JWTUtil.extractTokenFromHeader(undefined);
      }).toThrow('Authorization header is missing');
    });

    it('should throw error for invalid header format', () => {
      expect(() => {
        JWTUtil.extractTokenFromHeader('InvalidFormat token');
      }).toThrow('Invalid authorization header format');
    });

    it('should throw error for Bearer header without token', () => {
      expect(() => {
        JWTUtil.extractTokenFromHeader('Bearer ');
      }).toThrow('Token is missing');
    });

    it('should throw error for Bearer header with only spaces', () => {
      expect(() => {
        JWTUtil.extractTokenFromHeader('Bearer   ');
      }).toThrow('Token is missing');
    });

    it('should handle header with extra spaces', () => {
      const token = 'sample.jwt.token';
      const authHeader = `Bearer  ${token}`;

      const extractedToken = JWTUtil.extractTokenFromHeader(authHeader);
      expect(extractedToken).toBe(token);
    });
  });

  describe('Environment variables', () => {
    it('should use fallback secret when JWT_SECRET is not set', () => {
      delete process.env.JWT_SECRET;
      
      const token = JWTUtil.generateToken(mockUser as any);
      expect(typeof token).toBe('string');
      
      // Should still be able to verify with fallback secret
      const payload = JWTUtil.verifyToken(token);
      expect(payload.id).toBe(mockUser._id);
    });

    it('should use fallback expire time when JWT_EXPIRE is not set', () => {
      delete process.env.JWT_EXPIRE;
      
      const token = JWTUtil.generateToken(mockUser as any);
      const decoded = jwt.decode(token) as any;
      
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      
      // Should default to 24h (86400 seconds)
      expect(decoded.exp - decoded.iat).toBe(86400);
    });
  });
});