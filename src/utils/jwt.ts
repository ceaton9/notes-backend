import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';

export interface JWTPayload {
  id: string;
  email: string;
  name: string;
}

export class JWTUtil {
  private static readonly SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
  private static readonly EXPIRE = process.env.JWT_EXPIRE || '24h';

  public static generateToken(user: IUser): string {
    const payload: JWTPayload = {
      id: (user._id as any).toString(),
      email: user.email,
      name: user.name
    };

    return jwt.sign(payload, this.SECRET, {
      expiresIn: this.EXPIRE,
      issuer: 'notes-api'
    } as jwt.SignOptions);
  }

  public static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.SECRET, { 
        issuer: 'notes-api' 
      }) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw new Error('Token verification failed');
    }
  }

  public static extractTokenFromHeader(authHeader: string | undefined): string {
    if (!authHeader) {
      throw new Error('Authorization header is missing');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new Error('Invalid authorization header format');
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      throw new Error('Token is missing');
    }

    return token;
  }
}