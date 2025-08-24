import { User } from '../../../models/User';
import mongoose from 'mongoose';

describe('User Model', () => {
  const validUserData = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123'
  };

  describe('Validation', () => {
    it('should create a user with valid data', async () => {
      const user = new User(validUserData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.name).toBe(validUserData.name);
      expect(savedUser.email).toBe(validUserData.email.toLowerCase());
      expect(savedUser.password).not.toBe(validUserData.password); // Should be hashed
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    it('should require name field', async () => {
      const user = new User({
        email: 'john@example.com',
        password: 'password123'
      });

      await expect(user.save()).rejects.toThrow('Name is required');
    });

    it('should require email field', async () => {
      const user = new User({
        name: 'John Doe',
        password: 'password123'
      });

      await expect(user.save()).rejects.toThrow('Email is required');
    });

    it('should require password field', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com'
      });

      await expect(user.save()).rejects.toThrow('Password is required');
    });

    it('should validate email format', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123'
      });

      await expect(user.save()).rejects.toThrow('Please enter a valid email');
    });

    it('should require minimum password length', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: '123'
      });

      await expect(user.save()).rejects.toThrow('Password must be at least 6 characters');
    });

    it('should convert email to lowercase', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'JOHN@EXAMPLE.COM',
        password: 'password123'
      });

      const savedUser = await user.save();
      expect(savedUser.email).toBe('john@example.com');
    });

    it('should enforce unique email constraint', async () => {
      const user1 = new User(validUserData);
      await user1.save();

      const user2 = new User({
        name: 'Jane Doe',
        email: validUserData.email,
        password: 'password456'
      });

      await expect(user2.save()).rejects.toThrow();
    });

    it('should limit name length', async () => {
      const user = new User({
        name: 'a'.repeat(51),
        email: 'john@example.com',
        password: 'password123'
      });

      await expect(user.save()).rejects.toThrow('Name cannot exceed 50 characters');
    });
  });

  describe('Password hashing', () => {
    it('should hash password before saving', async () => {
      const user = new User(validUserData);
      await user.save();

      expect(user.password).not.toBe(validUserData.password);
      expect(user.password.length).toBeGreaterThan(10);
    });

    it('should not rehash password if not modified', async () => {
      const user = new User(validUserData);
      await user.save();
      const originalHash = user.password;

      user.name = 'Updated Name';
      await user.save();

      expect(user.password).toBe(originalHash);
    });

    it('should rehash password if modified', async () => {
      const user = new User(validUserData);
      await user.save();
      const originalHash = user.password;

      user.password = 'newpassword123';
      await user.save();

      expect(user.password).not.toBe(originalHash);
      expect(user.password).not.toBe('newpassword123');
    });
  });

  describe('comparePassword method', () => {
    let user: any;

    beforeEach(async () => {
      user = new User(validUserData);
      await user.save();
    });

    it('should return true for correct password', async () => {
      const isMatch = await user.comparePassword(validUserData.password);
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const isMatch = await user.comparePassword('wrongpassword');
      expect(isMatch).toBe(false);
    });

    it('should return false for empty password', async () => {
      const isMatch = await user.comparePassword('');
      expect(isMatch).toBe(false);
    });
  });

  describe('Indexes', () => {
    it('should have email index', async () => {
      const indexes = await User.collection.getIndexes();
      const emailIndex = Object.keys(indexes).find(key => 
        indexes[key].some((field: any) => field[0] === 'email')
      );
      expect(emailIndex).toBeDefined();
    });
  });
});