# Notes App Backend API

A robust Node.js backend API for the collaborative notes application, featuring real-time collaboration, secure authentication, and comprehensive note management capabilities.

## ✨ Features

### Core Features
- 🔐 **JWT Authentication**: Secure user registration and login with bcrypt password hashing
- 📝 **Notes CRUD**: Complete Create, Read, Update, Delete operations for notes
- 👥 **Note Sharing**: Share notes with other users with configurable permissions
- 🔄 **Real-time Collaboration**: Live editing and synchronization using Socket.IO
- 📊 **User Analytics**: Note statistics and user activity tracking
- 🛡️ **Input Validation**: Comprehensive request validation with express-validator
- 🔒 **Secure Routes**: Protected endpoints with JWT middleware

### Technical Features
- **RESTful API**: Well-structured REST endpoints following best practices
- **WebSocket Support**: Real-time bidirectional communication
- **Error Handling**: Centralized error handling with descriptive messages
- **CORS Support**: Configurable cross-origin resource sharing
- **MongoDB Integration**: Efficient data storage with Mongoose ODM
- **Middleware Chain**: Modular request processing architecture

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken) with bcrypt
- **Real-time**: Socket.IO
- **Validation**: express-validator
- **Environment**: dotenv for configuration
- **Development**: nodemon for auto-restart

## 📋 Prerequisites

- **Node.js**: 18.17+ or 20.0+
- **MongoDB**: Local installation or MongoDB Atlas account
- **Package Manager**: npm, yarn, or pnpm

## 🚀 Quick Start

### 1. Installation
```bash
# Clone the repository
git clone [repository-url]
cd backend

# Install dependencies
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
```

### 3. Database Setup

#### Option A: Local MongoDB
```bash
# Install MongoDB Community Edition
# Start MongoDB service
mongod --dbpath /path/to/your/data

# MongoDB will be available at mongodb://localhost:27017
```

#### Option B: MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster
3. Get connection string and update `MONGODB_URI` in `.env`

### 4. Start Development Server
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

### 5. Verify Installation
```bash
# Check if server is running
curl http://localhost:3052/api/health

# Expected response: {"status": "OK", "message": "Server is running"}
```

## ⚙️ Environment Variables

Create a `.env` file in the backend root directory:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/collab_notes

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3052
NODE_ENV=development
```

### Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `MONGODB_URI` | MongoDB connection string | ✅ | `mongodb://localhost:27017/collab_notes` |
| `JWT_SECRET` | Secret key for JWT signing | ✅ | - |
| `JWT_EXPIRES_IN` | JWT token expiration time | ⭕ | `1d` |
| `PORT` | Server port number | ⭕ | `3052` |
| `NODE_ENV` | Application environment | ⭕ | `development` |

## 📜 Available Scripts

```bash
npm run dev       # Start development server with nodemon
npm start         # Start production server
npm run lint      # Run ESLint (if configured)
npm test          # Run tests (if configured)
```

## 📁 Project Structure

```
backend/
├── controllers/              # Business logic controllers
│   ├── authController.js    # Authentication logic (register, login)
│   └── noteController.js    # Notes CRUD operations
├── middleware/              # Express middleware functions
│   ├── auth.js             # JWT authentication middleware
│   └── validate.js         # Input validation middleware
├── models/                 # MongoDB/Mongoose data models
│   ├── user.model.js       # User schema and model
│   └── notes.model.js      # Notes schema and model
├── routes/                 # API route definitions
│   ├── authRoutes.js       # Authentication endpoints
│   └── noteRoutes.js       # Notes API endpoints
├── sockets/                # Socket.IO event handlers
│   └── notesSocket.js      # Real-time collaboration logic
├── utils/                  # Utility functions and helpers
│   └── response.js         # Standardized API response format
├── config.js               # Application configuration
├── server.js               # Express server setup and startup
├── package.json            # Dependencies and scripts
├── .env.example            # Environment variables template
└── README.md               # This file
```

## 🔗 API Endpoints

### Authentication Routes
```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
```

### Notes Routes (Protected)
```
GET    /api/notes           # Get all user notes
GET    /api/notes/:id       # Get specific note
POST   /api/notes           # Create new note
PUT    /api/notes/:id       # Update note
DELETE /api/notes/:id       # Delete note
POST   /api/notes/:id/share # Share note with user
GET    /api/notes/stats     # Get user statistics
```

## 📝 API Documentation

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "user_id_here"
  }
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "_id": "user_id_here",
      "username": "johndoe",
      "email": "john@example.com"
    }
  }
}
```

### Notes Management

#### Create Note
```http
POST /api/notes
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "title": "My New Note",
  "content": "# Hello World\n\nThis is my note content."
}
```

#### Get All Notes
```http
GET /api/notes
Authorization: Bearer jwt_token_here
```

#### Update Note
```http
PUT /api/notes/:id
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content here"
}
```

## 🔄 Real-time Features

### Socket.IO Events

#### Client to Server Events
```javascript
// Join a note room for collaboration
socket.emit('note:join', { noteId: 'note_id_here' });

// Leave a note room
socket.emit('note:leave', { noteId: 'note_id_here' });

// Send note updates
socket.emit('note:update', {
  noteId: 'note_id_here',
  content: 'updated content',
  title: 'updated title'
});
```

#### Server to Client Events
```javascript
// Receive note updates from other users
socket.on('note:updated', (data) => {
  // Handle real-time note updates
  console.log('Note updated:', data);
});

// User joined the note
socket.on('user:joined', (data) => {
  console.log('User joined:', data.username);
});

// User left the note
socket.on('user:left', (data) => {
  console.log('User left:', data.username);
});
```

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure, stateless authentication
- **Password Hashing**: bcrypt with salt rounds for secure password storage
- **Protected Routes**: Middleware-based route protection
- **Token Expiration**: Configurable JWT expiration times

### Input Validation
- **Request Validation**: express-validator for all inputs
- **Data Sanitization**: Automatic sanitization of user inputs
- **Error Handling**: Secure error messages without information leakage

### CORS & Security Headers
- **CORS Configuration**: Controlled cross-origin access
- **Security Middleware**: Additional security headers and protections

## 🧪 Development

### Code Structure Guidelines
- **MVC Pattern**: Controllers handle business logic, models define data structure
- **Middleware Chain**: Use middleware for cross-cutting concerns
- **Error Handling**: Centralized error handling with proper status codes
- **Response Format**: Consistent API response structure

### Adding New Features

1. **Models**: Define data structure in `/models`
2. **Controllers**: Implement business logic in `/controllers`
3. **Routes**: Define endpoints in `/routes`
4. **Middleware**: Add validation/auth in `/middleware`
5. **Testing**: Add tests for new functionality

### Database Schema

#### User Model
```javascript
{
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

#### Note Model
```javascript
{
  title: { type: String, required: true },
  content: { type: String, default: '' },
  author: { type: ObjectId, ref: 'User', required: true },
  collaborators: [{ type: ObjectId, ref: 'User' }],
  isPublic: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

## 🚀 Production Deployment

### Pre-deployment Checklist
- [ ] Set strong `JWT_SECRET` in production
- [ ] Configure production MongoDB URI
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS and secure cookies
- [ ] Configure proper CORS origins
- [ ] Set up monitoring and logging

### Deployment Platforms

#### Heroku
```bash
# Install Heroku CLI
heroku create your-app-name
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-production-secret
heroku config:set MONGODB_URI=your-production-mongodb-uri
git push heroku main
```

#### Railway
```bash
# Install Railway CLI
railway login
railway init
railway add
railway deploy
```

#### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3052
CMD ["npm", "start"]
```

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/prod_db
JWT_SECRET=super-secure-production-secret-key
PORT=3052
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
```
tests/
├── unit/                   # Unit tests for individual functions
├── integration/           # Integration tests for API endpoints
├── fixtures/              # Test data and fixtures
└── helpers/               # Test utilities and helpers
```

## 📊 Monitoring & Logging

### Development Logging
- Console logs for debugging
- Request/response logging middleware
- Error stack traces in development

### Production Monitoring
- Consider integrating with services like:
  - **Sentry** for error tracking
  - **LogRocket** for session replay
  - **DataDog** for performance monitoring
  - **New Relic** for application monitoring

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Follow** the existing code style and patterns
4. **Add** tests for new functionality
5. **Update** documentation as needed
6. **Commit** changes (`git commit -m 'Add amazing feature'`)
7. **Push** to the branch (`git push origin feature/amazing-feature`)
8. **Create** a Pull Request

### Code Style Guidelines
- Use consistent naming conventions
- Add JSDoc comments for functions
- Follow the established project structure
- Handle errors appropriately
- Write meaningful commit messages

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🆘 Support & Troubleshooting

### Common Issues

#### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh  # or mongo for older versions

# Check connection string format
mongodb://localhost:27017/collab_notes
```

#### JWT Issues
```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Port Already in Use
```bash
# Find process using port 3052
lsof -i :3052

# Kill the process
kill -9 <PID>
```

### Getting Help
1. **Check logs** for detailed error messages
2. **Verify environment variables** are set correctly
3. **Ensure MongoDB** is running and accessible
4. **Check network connectivity** between frontend and backend
5. **Create an issue** with detailed error information

---

**Built with ❤️ using Node.js, Express.js, and MongoDB** 