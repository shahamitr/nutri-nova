# NutriVoice AI Diet Planner

Production-quality conversational AI nutritionist application that provides personalized diet planning through real-time voice interactions.

## Features

- 🔐 **Secure Authentication**: TOTP-based two-factor authentication
- 🎤 **Real-time Voice Interaction**: Natural conversations with AI nutritionist
- 📊 **Health Metrics**: BMI calculation and health profile tracking
- 🍽️ **Personalized Diet Plans**: AI-generated meal plans based on your profile
- 🎮 **Gamification**: Progress tracking with stages, badges, and points
- 🎨 **Customizable Voice**: Choose accent, gender, and speech speed
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **Frontend**: Next.js 14+ with App Router, TypeScript, React 18+
- **Backend**: Bun runtime with Hono framework
- **Database**: MySQL 8.0+
- **Cache**: Redis (optional)
- **AI Models**: Amazon Nova Sonic (voice), Amazon Nova Lite (reasoning)
- **Authentication**: TOTP (speakeasy)
- **Testing**: Vitest, fast-check (property-based testing)

## Prerequisites

- Node.js 18+ (for frontend)
- Bun 1.0+ (for backend)
- MySQL 8.0+
- Redis (optional, for session caching)
- Docker and Docker Compose (for containerized development)

## Quick Start with Docker

1. Clone the repository:
```bash
git clone <repository-url>
cd nutrivoice-ai-diet-planner
```

2. Start all services:
```bash
npm run docker:up
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- MySQL: localhost:3306
- Redis: localhost:6379

4. Stop all services:
```bash
npm run docker:down
```

## Local Development Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && bun install

# Install shared types dependencies
cd ../shared && npm install
```

### 2. Configure Environment Variables

Create `.env` files in both frontend and backend directories:

**Backend `.env`:**
```env
NODE_ENV=development
PORT=3001

# Database
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=nutrivoice_dev
DATABASE_USER=nutrivoice
DATABASE_PASSWORD=nutrivoice_password

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
JWT_SECRET=your-jwt-secret-change-in-production
TOTP_ENCRYPTION_KEY=your-totp-encryption-key-change-in-production

# AWS Nova API (configure with your credentials)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

**Frontend `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Set Up Database

```bash
# Run database migrations
npm run db:migrate

# (Optional) Seed test data
npm run db:seed
```

### 4. Start Development Servers

```bash
# Start both frontend and backend
npm run dev

# Or start individually:
npm run dev:backend  # Backend on port 3001
npm run dev:frontend # Frontend on port 3000
```

## Project Structure

```
nutrivoice-ai-diet-planner/
├── frontend/              # Next.js frontend application
│   ├── src/
│   │   ├── app/          # Next.js App Router pages
│   │   ├── components/   # React components
│   │   ├── lib/          # Utilities and helpers
│   │   └── types/        # TypeScript types
│   ├── public/           # Static assets
│   └── package.json
├── backend/              # Bun + Hono backend API
│   ├── src/
│   │   ├── routes/       # API route handlers
│   │   ├── services/     # Business logic services
│   │   ├── middleware/   # Express middleware
│   │   ├── db/           # Database migrations and queries
│   │   └── utils/        # Utilities and helpers
│   ├── tests/            # Test files
│   └── package.json
├── shared/               # Shared TypeScript types
│   ├── src/
│   │   └── types/        # Common type definitions
│   └── package.json
├── docker-compose.yml    # Docker services configuration
└── package.json          # Root package.json with workspaces
```

## Testing

```bash
# Run all tests
npm test

# Run backend tests
npm run test:backend

# Run frontend tests
npm run test:frontend

# Run with coverage
npm run test:coverage
```

## Linting and Formatting

```bash
# Lint all code
npm run lint

# Format all code
npm run format
```

## Building for Production

```bash
# Build all packages
npm run build

# Build individually
npm run build:backend
npm run build:frontend
npm run build:shared
```

## API Documentation

API documentation is available at `/api/docs` when running the backend server.

Key endpoints:
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/voice/start-session` - Start voice conversation
- `POST /api/health/save-profile` - Save health profile
- `POST /api/diet/generate-plan` - Generate diet plan
- `GET /api/progress/user` - Get user progress

## Architecture

The application follows a three-tier architecture:

1. **Frontend Layer**: Next.js with React for UI and user interactions
2. **API Layer**: Hono framework on Bun runtime for RESTful API
3. **Data Layer**: MySQL for persistence, Redis for caching

Voice processing pipeline:
```
User Speech → Nova Sonic STT → Conversation Manager →
Nova Lite AI → Response Text → Nova Sonic TTS → Audio Output
```

## Security

- Passwords hashed with bcrypt (cost factor 12)
- TOTP secrets encrypted with AES-256-GCM
- JWT tokens for session management (30-minute expiration)
- Rate limiting on authentication endpoints
- Input validation and sanitization
- HTTPS/TLS for all connections

## Performance

- Target latencies:
  - Authentication: < 500ms
  - Voice STT: < 2 seconds
  - Voice TTS: < 2 seconds
  - AI reasoning: < 3 seconds
  - Diet plan generation: < 5 seconds
- Supports 100+ concurrent voice sessions
- Database connection pooling
- Redis caching for frequently accessed data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

[Your License Here]

## Support

For issues and questions, please open an issue on GitHub.
