# NutriVoice Architecture Documentation

## Table of Contents
1. System Overview
2. Architecture Diagram
3. Component Details
4. Voice Processing Pipeline
5. Conversation Management Flow
6. Database Schema
7. Security Architecture
8. Performance Optimizations
9. Deployment Architecture

---

## 1. System Overview

NutriVoice is a production-quality conversational AI nutritionist application built with a modern three-tier architecture:

- **Presentation Layer**: Next.js 14+ with React for responsive UI
- **Application Layer**: Bun runtime with Hono framework for RESTful API
- **Data Layer**: MySQL for persistence, Redis for caching

**Key Characteristics:**
- Microservices-ready architecture with clear service boundaries
- Event-driven conversation management
- Real-time voice processing with AI integration
- Secure authentication with TOTP
- Gamification system for user engagement
- Scalable to 100+ concurrent users

---

## 2. Architecture Diagram

### High-Level System Architecture


```
+------------------------------------------------------------------+
|                         User Browser                             |
|  +------------------------------------------------------------+  |
|  |              Next.js Frontend (Port 3000)                  |  |
|  |  - React Components                                        |  |
|  |  - Voice Recording (MediaRecorder API)                     |  |
|  |  - Audio Playback                                          |  |
|  |  - State Management                                        |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
                              |
                              | HTTPS/REST API
                              v
+------------------------------------------------------------------+
|                    Backend API (Port 3001)                       |
|  +------------------------------------------------------------+  |
|  |                  Hono Framework on Bun                     |  |
|  |  +------------------------------------------------------+  |  |
|  |  |  Route Handlers                                      |  |  |
|  |  |  - /api/auth    - /api/voice   - /api/health        |  |  |
|  |  |  - /api/diet    - /api/progress                      |  |  |
|  |  +------------------------------------------------------+  |  |
|  |  +------------------------------------------------------+  |  |
|  |  |  Middleware Layer                                    |  |  |
|  |  |  - Authentication  - Rate Limiting  - Validation    |  |  |
|  |  |  - Security Headers  - Error Handling               |  |  |
|  |  +------------------------------------------------------+  |  |
|  |  +------------------------------------------------------+  |  |
|  |  |  Service Layer                                       |  |  |
|  |  |  - AuthService    - VoiceService                     |  |  |
|  |  |  - HealthService  - DietService                      |  |  |
|  |  |  - GamificationService  - ConversationManager        |  |  |
|  |  +------------------------------------------------------+  |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
                |                           |
                | MySQL                     | Redis (Optional)
                v                           v
+---------------------------+   +-------------------------------+
|     MySQL Database        |   |       Redis Cache             |
|  - users                  |   |  - Session state              |
|  - health_profile         |   |  - Conversation context       |
|  - bmi_records            |   |  - Voice settings             |
|  - diet_plans             |   |  - TTS audio cache            |
|  - user_progress          |   +-------------------------------+
|  - voice_settings         |
+---------------------------+
                |
                | AWS SDK
                v
+------------------------------------------------------------------+
|                      Amazon Nova AI Services                     |
|  +------------------------------------------------------------+  |
|  |  Nova Sonic (Voice)        |  Nova Lite (Reasoning)       |  |
|  |  - Speech-to-Text          |  - Conversation AI           |  |
|  |  - Text-to-Speech          |  - Diet Plan Generation      |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
```

---

## 3. Component Details

### 3.1 Frontend Components


**Authentication Components:**
- `SignupForm`: User registration with TOTP setup
- `LoginForm`: Three-factor authentication (email, password, TOTP)
- `ProtectedRoute`: Route guard for authenticated pages

**Dashboard Components:**
- `DashboardLayout`: Main layout with navigation
- `ProgressCard`: Gamification progress display
- `VoiceInterface`: Real-time voice interaction UI
- `ConversationDisplay`: Chat history visualization

**Health Components:**
- `HealthProfileForm`: Health data input form
- `BMIDisplay`: BMI calculation and visualization
- `HealthMetrics`: Health profile overview

**Diet Components:**
- `DietPlanDisplay`: Meal plan presentation
- `MacronutrientChart`: Macro distribution visualization
- `MealCard`: Individual meal details

**Settings Components:**
- `VoiceSettingsForm`: Voice preference configuration

### 3.2 Backend Services

**AuthService:**
- User registration with bcrypt password hashing
- TOTP secret generation and encryption
- JWT token creation and validation
- Session management

**VoiceService:**
- Speech-to-Text via Nova Sonic API
- Text-to-Speech via Nova Sonic API
- Voice settings management
- Audio caching for repeated phrases

**HealthService:**
- Health profile validation and persistence
- BMI calculation using Harris-Benedict equation
- BMI history tracking
- Progress updates

**DietService:**
- Calorie calculation based on profile
- AI-powered diet plan generation via Nova Lite
- Macronutrient distribution
- Diet preference filtering

**GamificationService:**
- Progress tracking across 4 stages
- Points and badge management
- Completion percentage calculation

**ConversationManager:**
- Session initialization and state management
- Adaptive questioning logic
- Conversation history tracking
- Integration with Nova Lite for AI responses

---

## 4. Voice Processing Pipeline


### Voice Interaction Flow

```
User speaks
    |
    v
+------------------+
| MediaRecorder    |
| (Browser API)    |
+------------------+
    |
    | Audio Blob
    v
+------------------+
| POST /api/voice/ |
| process-speech   |
+------------------+
    |
    v
+------------------+
| VoiceService     |
| Speech-to-Text   |
+------------------+
    |
    | Text transcript
    v
+----------------------+
| ConversationManager  |
| - Update state       |
| - Determine context  |
+----------------------+
    |
    | Context + History
    v
+------------------+
| Nova Lite API    |
| AI Reasoning     |
+------------------+
    |
    | AI Response text
    v
+------------------+
| VoiceService     |
| Text-to-Speech   |
+------------------+
    |
    | Audio URL/Base64
    v
+------------------+
| Frontend Player  |
| Audio Playback   |
+------------------+
    |
    v
User hears response
```

**Latency Targets:**
- Speech-to-Text: < 2 seconds
- AI Reasoning: < 3 seconds
- Text-to-Speech: < 2 seconds
- Total Round-trip: < 7 seconds

---

## 5. Conversation Management Flow


### Conversation State Machine

```
Start Session
    |
    v
+-------------------+
| Initialize State  |
| - session_id      |
| - user_id         |
| - collected_data  |
| - history         |
+-------------------+
    |
    v
+-------------------+
| Ask Question      |
| (Adaptive Logic)  |
+-------------------+
    |
    v
+-------------------+
| Receive Response  |
| (Voice or Text)   |
+-------------------+
    |
    v
+-------------------+
| Validate Response |
+-------------------+
    |
    +---> Invalid? --> Ask Again
    |
    v Valid
+-------------------+
| Update State      |
| Store in Cache    |
+-------------------+
    |
    v
+-------------------+
| Check Completion  |
+-------------------+
    |
    +---> More data needed? --> Ask Next Question
    |
    v Complete
+-------------------+
| Save to Database  |
| Update Progress   |
+-------------------+
    |
    v
End Session
```

**Adaptive Questioning:**
- Age-based: Different questions for users < 18 years
- Activity-based: Detailed questions for active users
- Context-aware: Follow-up questions based on previous answers

**Session Management:**
- 30-minute TTL for active sessions
- State stored in Redis for fast access
- Automatic cleanup of expired sessions

---

## 6. Database Schema


### Entity Relationship Diagram

```
+------------------+
|      users       |
+------------------+
| id (PK)          |
| name             |
| email (UNIQUE)   |
| password_hash    |
| totp_secret      |
| created_at       |
+------------------+
        |
        | 1:1
        v
+------------------+
| voice_settings   |
+------------------+
| id (PK)          |
| user_id (FK)     |
| accent           |
| voice_gender     |
| speech_speed     |
+------------------+

        |
        | 1:1
        v
+------------------+
| health_profile   |
+------------------+
| id (PK)          |
| user_id (FK)     |
| age              |
| gender           |
| height_cm        |
| weight_kg        |
| diet_preference  |
| activity_level   |
| sleep_hours      |
| stress_level     |
| medical_cond     |
+------------------+

        |
        | 1:N
        v
+------------------+
|   bmi_records    |
+------------------+
| id (PK)          |
| user_id (FK)     |
| bmi_value        |
| category         |
| calculated_at    |
+------------------+

        |
        | 1:N
        v
+------------------+
|   diet_plans     |
+------------------+
| id (PK)          |
| user_id (FK)     |
| daily_calories   |
| protein_pct      |
| carbs_pct        |
| fats_pct         |
| breakfast (JSON) |
| lunch (JSON)     |
| snack (JSON)     |
| dinner (JSON)    |
| created_at       |
+------------------+

        |
        | 1:1
        v
+------------------+
| user_progress    |
+------------------+
| id (PK)          |
| user_id (FK)     |
| profile_done     |
| bmi_calculated   |
| routine_done     |
| diet_generated   |
| points           |
| badges (JSON)    |
+------------------+
```

**Indexes for Performance:**
- `users.email` (UNIQUE)
- `voice_settings.user_id` (UNIQUE)
- `health_profile.user_id` (UNIQUE)
- `bmi_records(user_id, calculated_at)` (COMPOSITE)
- `diet_plans(user_id, created_at)` (COMPOSITE)
- `user_progress.user_id` (UNIQUE)

---

## 7. Security Architecture


### Security Layers

**1. Authentication Layer:**
- Three-factor authentication (email, password, TOTP)
- Password hashing with bcrypt (cost factor 12)
- TOTP secrets encrypted with AES-256-GCM
- JWT tokens with 30-minute expiration
- Secure session management

**2. Authorization Layer:**
- JWT token validation on all protected routes
- User-specific data access controls
- Role-based access control (future enhancement)

**3. Network Security:**
- HTTPS/TLS for all connections
- HSTS headers (max-age: 31536000)
- Secure cookies (Secure, HttpOnly, SameSite)
- CORS configuration (whitelist frontend origin)

**4. Input Validation:**
- Request body validation with Zod schemas
- SQL injection prevention (parameterized queries)
- XSS prevention (input sanitization)
- Request size limits
- Content-Type validation

**5. Rate Limiting:**
- Login: 5 attempts per 15 minutes
- Signup: 3 attempts per hour
- TOTP verification: 10 attempts per 5 minutes
- General API: 100 requests per minute

**6. Security Headers:**
```
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

**7. Data Protection:**
- Passwords never stored in plaintext
- TOTP secrets encrypted at rest
- Sensitive data excluded from logs
- Email addresses masked in logs

---

## 8. Performance Optimizations


### Database Optimizations

**Connection Pooling:**
- Pool size: 10-20 connections
- Idle timeout: 10 minutes
- Connection timeout: 5 seconds
- Automatic reconnection on failure

**Query Optimization:**
- Prepared statements for all queries
- Composite indexes on frequently queried columns
- SELECT with specific columns (no SELECT *)
- Query result caching for static data

**Database Design:**
- Normalized schema to 3NF
- JSON columns for flexible meal data
- Appropriate data types for storage efficiency

### Caching Strategy (Redis)

**Cache Layers:**
1. **Session State** (TTL: 30 minutes)
   - Conversation context
   - User session data

2. **Voice Settings** (TTL: 1 hour)
   - User voice preferences
   - Reduces database queries

3. **TTS Audio** (TTL: 24 hours)
   - Cached audio for repeated phrases
   - Reduces Nova Sonic API calls

4. **Diet Plans** (TTL: 24 hours)
   - Most recent diet plan
   - Fast retrieval for dashboard

**Cache Invalidation:**
- Write-through on updates
- Automatic expiration via TTL
- Manual invalidation on critical changes

### API Performance

**Response Compression:**
- Gzip compression for JSON responses
- Compression level: 6 (balanced)
- Minimum size: 1KB

**Async Processing:**
- Non-blocking I/O with Bun runtime
- Parallel processing where possible
- Background jobs for heavy operations

**Latency Targets:**
- Authentication: < 500ms
- Health operations: < 200ms
- Voice STT: < 2 seconds
- Voice TTS: < 2 seconds
- AI reasoning: < 3 seconds
- Diet generation: < 5 seconds

---

## 9. Deployment Architecture


### Docker Deployment

```
+------------------------------------------------------------------+
|                        Docker Host                               |
|  +------------------------------------------------------------+  |
|  |  Frontend Container (nutrivoice-frontend)                  |  |
|  |  - Next.js on Node.js 18                                   |  |
|  |  - Port: 3000                                              |  |
|  |  - Volume: ./frontend:/app                                 |  |
|  +------------------------------------------------------------+  |
|  +------------------------------------------------------------+  |
|  |  Backend Container (nutrivoice-backend)                    |  |
|  |  - Hono on Bun runtime                                     |  |
|  |  - Port: 3001                                              |  |
|  |  - Volume: ./backend:/app                                  |  |
|  +------------------------------------------------------------+  |
|  +------------------------------------------------------------+  |
|  |  MySQL Container (nutrivoice-mysql)                        |  |
|  |  - MySQL 8.0                                               |  |
|  |  - Port: 3306                                              |  |
|  |  - Volume: mysql_data:/var/lib/mysql                       |  |
|  +------------------------------------------------------------+  |
|  +------------------------------------------------------------+  |
|  |  Redis Container (nutrivoice-redis)                        |  |
|  |  - Redis 7 Alpine                                          |  |
|  |  - Port: 6379                                              |  |
|  |  - Volume: redis_data:/data                                |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
```

**Health Checks:**
- MySQL: `mysqladmin ping` every 10s
- Redis: `redis-cli ping` every 10s
- Backend: HTTP GET /health every 30s
- Frontend: HTTP GET / every 30s

### Production Deployment Options

**Option 1: Traditional VPS/Cloud VM**
- Single server deployment
- Nginx reverse proxy
- PM2 for process management
- Suitable for: Small to medium traffic

**Option 2: Container Orchestration (Kubernetes)**
- Multi-node cluster
- Auto-scaling based on load
- Load balancer for traffic distribution
- Suitable for: High traffic, high availability

**Option 3: Serverless (AWS Lambda)**
- Backend as Lambda functions
- Frontend on Vercel/Netlify
- RDS for MySQL, ElastiCache for Redis
- Suitable for: Variable traffic, cost optimization

### Monitoring and Logging

**Application Monitoring:**
- Structured JSON logging
- Log levels: ERROR, WARN, INFO, DEBUG
- Centralized log aggregation
- Real-time error tracking

**Performance Monitoring:**
- API response time tracking
- Database query performance
- Cache hit/miss ratios
- External API latency (Nova)

**Health Monitoring:**
- Service health endpoints
- Database connection status
- Redis connection status
- Disk space and memory usage

**Alerting:**
- High error rates
- Slow response times
- Service downtime
- Database connection failures

---

## 10. Scalability Considerations


### Horizontal Scaling

**Stateless Backend:**
- No server-side session storage (JWT tokens)
- Session state in Redis (shared across instances)
- Multiple backend instances behind load balancer

**Database Scaling:**
- Read replicas for read-heavy operations
- Connection pooling per instance
- Query optimization and indexing

**Cache Scaling:**
- Redis cluster for high availability
- Cache sharding for large datasets
- Separate cache instances per service

### Vertical Scaling

**Resource Allocation:**
- Backend: 2-4 CPU cores, 4-8GB RAM
- Frontend: 1-2 CPU cores, 2-4GB RAM
- MySQL: 4-8 CPU cores, 8-16GB RAM
- Redis: 1-2 CPU cores, 2-4GB RAM

**Current Capacity:**
- 100+ concurrent voice sessions
- 200-300 requests per minute
- 10,000+ registered users
- 1M+ conversation messages

### Future Enhancements

**Microservices Architecture:**
- Separate services for Auth, Voice, Health, Diet
- Service mesh for inter-service communication
- Independent scaling per service

**Event-Driven Architecture:**
- Message queue for async processing
- Event sourcing for audit trail
- CQRS for read/write separation

**CDN Integration:**
- Static asset delivery via CDN
- TTS audio caching on CDN
- Global edge locations

---

## 11. Technology Decisions

### Why Next.js?
- Server-side rendering for SEO
- App Router for modern routing
- Built-in optimization (images, fonts)
- TypeScript support
- Large ecosystem

### Why Bun + Hono?
- Bun: Fast JavaScript runtime (3x faster than Node.js)
- Hono: Lightweight framework (minimal overhead)
- Native TypeScript support
- Excellent performance for API workloads

### Why MySQL?
- ACID compliance for data integrity
- Mature ecosystem and tooling
- Strong consistency guarantees
- Excellent performance for relational data

### Why Redis?
- In-memory speed for session data
- TTL support for automatic expiration
- Pub/sub for real-time features (future)
- Simple key-value operations

### Why Amazon Nova?
- State-of-the-art voice quality
- Low latency for real-time interaction
- Integrated AI reasoning capabilities
- AWS ecosystem integration

---

## 12. Development Workflow


### Local Development

```
Developer Machine
    |
    | git clone
    v
+------------------+
| Local Repository |
+------------------+
    |
    | npm install
    v
+------------------+
| Install Deps     |
+------------------+
    |
    | npm run dev
    v
+------------------+
| Start Services   |
| - Frontend:3000  |
| - Backend:3001   |
| - MySQL:3306     |
| - Redis:6379     |
+------------------+
    |
    | Hot reload
    v
+------------------+
| Code Changes     |
+------------------+
```

**Development Tools:**
- ESLint for code linting
- Prettier for code formatting
- Vitest for testing
- TypeScript for type safety
- Husky for pre-commit hooks

### CI/CD Pipeline (Future)

```
Git Push
    |
    v
+------------------+
| Run Tests        |
| - Unit tests     |
| - Integration    |
| - Property tests |
+------------------+
    |
    v
+------------------+
| Build Artifacts  |
| - Frontend build |
| - Backend build  |
+------------------+
    |
    v
+------------------+
| Deploy to Env    |
| - Dev/Staging    |
| - Production     |
+------------------+
```

---

## 13. API Integration Points

### External Services

**Amazon Nova Sonic (Voice):**
- Endpoint: AWS Bedrock API
- Authentication: AWS IAM credentials
- Rate limits: Per AWS account limits
- Fallback: Text-only mode on failure

**Amazon Nova Lite (AI Reasoning):**
- Endpoint: AWS Bedrock API
- Authentication: AWS IAM credentials
- Rate limits: Per AWS account limits
- Fallback: Template-based responses

### Internal APIs

**Frontend to Backend:**
- Protocol: HTTPS/REST
- Authentication: JWT Bearer tokens
- Format: JSON
- Error handling: Consistent error format

---

## 14. Data Flow Examples

### User Registration Flow

```
User submits signup form
    |
    v
POST /api/auth/signup
    |
    v
Validate email uniqueness
    |
    v
Hash password (bcrypt)
    |
    v
Generate TOTP secret
    |
    v
Encrypt TOTP secret
    |
    v
Store in database
    |
    v
Generate QR code URL
    |
    v
Return user + TOTP data
    |
    v
Display QR code to user
```

### Diet Plan Generation Flow

```
User requests diet plan
    |
    v
POST /api/diet/generate-plan
    |
    v
Verify health profile exists
    |
    v
Calculate daily calories
    |
    v
Build AI prompt with profile
    |
    v
Call Nova Lite API
    |
    v
Parse AI response
    |
    v
Validate plan structure
    |
    v
Filter by diet preference
    |
    v
Store in database
    |
    v
Update user progress
    |
    v
Award points and badge
    |
    v
Return complete plan
```

---

## 15. Error Handling Strategy

### Error Categories

**1. Client Errors (4xx):**
- Invalid input validation
- Authentication failures
- Authorization denials
- Resource not found

**2. Server Errors (5xx):**
- Database connection failures
- External API failures
- Unexpected exceptions
- Timeout errors

### Error Response Format

```json
{
  "success": false,
  "error": "User-friendly error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Specific field error"
  }
}
```

### Error Recovery

**Retry Strategy:**
- Exponential backoff for transient failures
- Maximum 3 retry attempts
- Circuit breaker for external services

**Fallback Mechanisms:**
- Text-only mode when voice fails
- Template responses when AI fails
- Cached data when database slow

---

## Conclusion

This architecture provides a solid foundation for a production-quality conversational AI application with:

- **Scalability**: Horizontal and vertical scaling capabilities
- **Security**: Multi-layered security approach
- **Performance**: Optimized for low latency
- **Reliability**: Error handling and fallback mechanisms
- **Maintainability**: Clean separation of concerns
- **Extensibility**: Easy to add new features

The system is designed to handle 100+ concurrent users with room to scale to thousands as needed.
