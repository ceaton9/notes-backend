import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { DatabaseConfig } from '../config/database';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Skip MongoDB Memory Server in ARM64 environments due to compatibility issues
  const isARM64 = process.arch === 'arm64';
  const isCI = process.env.CI === 'true' || process.env.CIRCLECI === 'true';
  
  // Set environment variables for all test environments
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.JWT_EXPIRE = '1h';
  process.env.NODE_ENV = 'test';
  
  if (isARM64 || isCI) {
    // Skip MongoDB setup entirely for ARM64/CI environments
    console.log('Skipping MongoDB setup for ARM64/CI environment');
    return;
  }

  mongoServer = await MongoMemoryServer.create({
    binary: {
      version: '5.0.14'
    }
  });
  const uri = mongoServer.getUri();
  
  process.env.MONGODB_URI = uri;

  await DatabaseConfig.getInstance().connect();
}, 60000); // Increase timeout for MongoDB startup

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 30000);

afterEach(async () => {
  // Skip cleanup in ARM64/CI environments where MongoDB isn't running
  const isARM64 = process.arch === 'arm64';
  const isCI = process.env.CI === 'true' || process.env.CIRCLECI === 'true';
  
  if (isARM64 || isCI) {
    return;
  }
  
  if (mongoose.connection.readyState === 1) {
    // Only clean up notes in integration tests to preserve users
    // Clean all collections in unit tests
    const testFile = expect.getState().testPath;
    const isIntegrationTest = testFile && testFile.includes('integration');
    
    if (isIntegrationTest) {
      // Only clean notes collection for integration tests
      const collections = mongoose.connection.collections;
      if (collections.notes) {
        await collections.notes.deleteMany({});
      }
    } else {
      // Clean all collections for unit tests
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
      }
    }
  }
}, 10000);