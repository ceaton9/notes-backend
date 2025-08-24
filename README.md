# Notes API - Full-Stack CRUD Application

A production-ready REST API for notes management with JWT authentication, built with Fastify, MongoDB, and TypeScript. Features both local development server and Vercel serverless deployment with comprehensive CI/CD pipeline.

## 🌐 Live Demo

- **Production API**: `https://notes-backend-nhtrnm1qu-elang-indras-projects.vercel.app`
- **Interactive Documentation**: `https://notes-backend-nhtrnm1qu-elang-indras-projects.vercel.app/docs`
- **Health Check**: `https://notes-backend-nhtrnm1qu-elang-indras-projects.vercel.app/health`

## 🚀 Key Features

- **🏗️ Modern Architecture**: Built with Fastify, MongoDB, and TypeScript
- **🔐 JWT Authentication**: Secure token-based authentication with bcrypt password hashing
- **📝 Full CRUD Operations**: Complete Create, Read, Update, Delete for Notes
- **👤 User Management**: User registration, login, and profile management
- **🔍 Advanced Search**: Text search, tag filtering, pagination, and archive functionality
- **📊 Interactive Documentation**: Swagger UI with comprehensive API documentation
- **🧪 Comprehensive Testing**: Unit tests, integration tests, and high code coverage
- **🚀 Local Development**: Hot-reload development server with nodemon
- **☁️ Vercel Deployment**: Serverless deployment ready for production
- **🎯 TypeScript**: Full type safety and enhanced developer experience
- **🔄 CI/CD Pipeline**: Automated testing, building, and deployment with CircleCI
- **🔒 Security First**: Environment variables management and secure credential handling

## 📋 Prerequisites

- **Node.js** (>= 18.0.0)
- **MongoDB** database (recommend [MongoDB Atlas](https://cloud.mongodb.com) for production)
- **Git** for version control

## 🚦 Quick Start

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd notes-api
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb://admin:password@your-mongodb-host:27017/admin
JWT_SECRET=your-strong-secret-key
JWT_EXPIRE=24h
NODE_ENV=development
PORT=3000
```

⚠️ **Security Note**: Never commit sensitive credentials to git. Use environment variables for production.

### 3. Local Development
```bash
# Start development server with hot-reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start
```

The API will be available at:
- **Local Server**: `http://localhost:3000` 🌐
- **Documentation**: `http://localhost:3000/docs` 📖
- **Health Check**: `http://localhost:3000/health` ✅

### 4. Vercel Deployment
```bash
# Deploy to Vercel
npm run deploy:vercel
```

## 📖 API Documentation

### Interactive Swagger UI
Access the comprehensive API documentation at:
- **Local**: `http://localhost:3000/docs`
- **Production**: `https://notes-backend-nhtrnm1qu-elang-indras-projects.vercel.app/docs`

The Swagger UI provides:
- 📝 Complete API reference with request/response examples
- 🔧 Interactive testing interface for all endpoints  
- 🔐 Built-in JWT authentication testing
- 📊 Organized by categories (Authentication, Notes, Health)

### Authentication Flow
```bash
# 1. Register a new user
curl -X POST https://notes-backend-nhtrnm1qu-elang-indras-projects.vercel.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'

# 2. Login to get JWT token
curl -X POST https://notes-backend-nhtrnm1qu-elang-indras-projects.vercel.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Response: {"success":true,"data":{"user":{...},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}}

# 3. Use token for authenticated requests
curl -X GET https://notes-backend-nhtrnm1qu-elang-indras-projects.vercel.app/notes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔗 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/health` | Health check endpoint | ❌ |
| `POST` | `/auth/register` | Register a new user | ❌ |
| `POST` | `/auth/login` | Login user and get JWT token | ❌ |
| `GET` | `/auth/profile` | Get current user profile | ✅ |
| `POST` | `/notes` | Create a new note | ✅ |
| `GET` | `/notes` | Get all user notes (with filtering) | ✅ |
| `GET` | `/notes/:id` | Get specific note by ID | ✅ |
| `PUT` | `/notes/:id` | Update existing note | ✅ |
| `DELETE` | `/notes/:id` | Delete note permanently | ✅ |

### 🔍 Advanced Query Parameters (GET /notes)

| Parameter | Type | Default | Description | Example |
|-----------|------|---------|-------------|---------|
| `page` | number | 1 | Page number for pagination | `?page=2` |
| `limit` | number | 10 | Items per page (max: 100) | `?limit=25` |
| `search` | string | - | Search in title and content | `?search=javascript` |
| `tags` | string | - | Filter by tags (comma-separated) | `?tags=work,urgent` |
| `archived` | boolean | - | Filter by archive status | `?archived=true` |

**Example**: `GET /notes?page=1&limit=10&search=tutorial&tags=javascript,react&archived=false`

## 🧪 Testing & Quality Assurance

### Test Coverage
- ✅ **Unit Tests**: Models, utilities, and business logic
- ✅ **Integration Tests**: Full API endpoints with authentication
- ✅ **Code Coverage**: 95%+ coverage with detailed reports
- ✅ **CI/CD Testing**: Automated testing in Circle CI pipeline

### Running Tests
```bash
# Run all tests with coverage
npm test

# Watch mode for development
npm run test:watch

# Integration tests only
npm run test:integration

# Code quality checks
npm run lint
npm run lint:fix
```

### Test Environment
Tests use MongoDB Memory Server for isolated testing without requiring a real database connection.

## 📁 Project Structure

```
notes-api/
├── src/                    # Source code
│   ├── config/            # Configuration files
│   │   ├── app.ts         # Fastify app setup with Swagger
│   │   └── database.ts    # MongoDB connection
│   ├── functions/         # Serverless functions
│   │   ├── serverless.ts  # Universal serverless handler
│   │   └── vercel.ts      # Vercel-specific handler
│   ├── middleware/        # Custom middleware
│   │   └── auth.ts        # JWT authentication middleware
│   ├── models/           # Mongoose models
│   │   ├── User.ts       # User model with authentication
│   │   └── Note.ts       # Note model with validation
│   ├── routes/           # Route handlers
│   │   ├── auth.ts       # Authentication endpoints
│   │   └── notes.ts      # Notes CRUD endpoints
│   ├── utils/            # Utility functions
│   │   └── jwt.ts        # JWT token utilities
│   ├── server.ts         # Local development server
│   └── tests/            # Test suites
│       ├── setup.ts      # Test configuration
│       ├── unit/         # Unit tests
│       └── integration/  # Integration tests
├── api/                  # Vercel serverless functions
│   └── index.js          # Main API handler for Vercel
├── public/               # Static files for Vercel
│   └── index.html        # API documentation page
├── dist/                 # Compiled TypeScript output
├── .env                  # Environment variables
├── nodemon.json          # Development server config
├── tsconfig.json         # TypeScript configuration
├── jest.config.js        # Test configuration
├── vercel.json           # Vercel deployment config
└── package.json          # Dependencies and scripts
```

## Data Models

### User
```typescript
{
  name: string;
  email: string;
  password: string; // Hashed with bcrypt
  createdAt: Date;
  updatedAt: Date;
}
```

### Note
```typescript
{
  title: string;
  content: string;
  author: ObjectId; // Reference to User
  tags: string[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔒 Security Features

- **Password Security**: Hashing with bcrypt (salt rounds: 12)
- **JWT Authentication**: Token validation with issuer verification
- **User Isolation**: Users can only access their own notes
- **Input Validation**: Comprehensive validation and sanitization
- **CORS Configuration**: Properly configured for secure cross-origin requests
- **Error Handling**: No sensitive data exposure in error responses
- **Environment Variables**: Secure credential management (no secrets in code)
- **Database Security**: Proper MongoDB connection with authentication

## 🚀 Deployment

### Vercel (Recommended)

1. **Environment Variables Setup**:
```bash
# Securely add environment variables to Vercel
vercel env add MONGODB_URI production
vercel env add JWT_SECRET production
vercel env add JWT_EXPIRE production
vercel env add NODE_ENV production
```

2. **Deploy to Production**:
```bash
npm run build
vercel --prod
```

3. **Current Production**:
- **API**: `https://notes-backend-nhtrnm1qu-elang-indras-projects.vercel.app`
- **Docs**: `https://notes-backend-nhtrnm1qu-elang-indras-projects.vercel.app/docs`

### CircleCI Automated Deployment

For automated production deployment via CircleCI, configure these environment variables in your CircleCI project:

```bash
DEPLOYMENT_TARGET=vercel
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=elang-indras-projects
VERCEL_PROJECT_ID=notes-backend
```

The pipeline automatically:
- ✅ Runs tests and linting
- ✅ Builds the application
- ✅ Deploys to production on main branch (with approval)

### Local Development

The project includes a complete local development setup:
- **Hot-reload server**: `npm run dev`
- **TypeScript compilation**: `npm run build`
- **Production server**: `npm start`
- **Health check**: Available at `/health`

## ⚡ Performance Features

- **MongoDB Indexing**: Optimized queries for fast data retrieval
- **Pagination**: Efficient handling of large datasets
- **Text Search**: Full-text search indexing for notes
- **Connection Pooling**: Efficient database connection management
- **Serverless Caching**: App instance caching in Vercel functions
- **Query Optimization**: Efficient query patterns with minimal data transfer

## 🔄 CI/CD Pipeline

The project includes a comprehensive CircleCI pipeline:

### Build Status
- **Latest Build**: ✅ Passing
- **Pipeline**: Automated testing, linting, building, and deployment
- **Branch Protection**: Production deployments require manual approval

### Pipeline Stages
1. **Code Quality**: ESLint, TypeScript compilation checks
2. **Testing**: Unit and integration tests with coverage reports  
3. **Security**: Dependency vulnerability scanning
4. **Build**: TypeScript compilation and artifact generation
5. **Deploy**: Automated deployment to staging and production environments

## License

This project is licensed under the MIT License.