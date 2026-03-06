# Testing Guide for NutriVoice AI Diet Planner

This document provides comprehensive testing instructions for the NutriVoice AI Diet Planner backend.

## Test Setup

### Prerequisites
- Bun runtime installed
- MySQL database running
- Test database configured
- Environment variables set in `.env.test`

### Install Dependencies
```bash
cd backend
bun install
```

### Configure Test Environment
Create `.env.test` file:
```env
NODE_ENV=test
DB_HOST=localhost
DB_PORT=3306
DB_USER=test_user
DB_PASSWORD=test_password
DB_NAME=nutrivoice_test
JWT_SECRET=test_secret_key_for_testing_only
```

### Setup Test Database
```bash
# Create test database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS nutrivoice_test;"

# Run migrations
bun run migrate:test
```

## Running Tests

### Run All Tests
```bash
bun test
```

### Run Specific Test Suites
```bash
# Unit tests only
bun test src/test/*.test.ts

# Integration tests only
bun test src/test/integration/*.test.ts

# Performance tests only
bun test src/test/performance/*.test.ts
```

### Run Tests with Coverage
```bash
bun test --coverage
```

### Run Tests in Watch Mode
```bash
bun test --watch
```

## Task 18: Unit Tests

### 18.1 AuthService Tests
**File**: `backend/src/test/AuthService.test.ts`

**Test Cases**:
- ✅ Valid signup with TOTP generation
- ✅ Duplicate email rejection
- ✅ Password hashing verification
- ✅ TOTP validation within time window
- ✅ TOTP rejection outside time window
- ✅ Session creation and expiration
- ✅ Login with invalid credentials

**Run**:
```bash
bun test src/test/AuthService.test.ts
```

### 18.2 VoiceService Tests
**File**: `backend/src/test/VoiceService.test.ts`

**Test Cases**:
- ✅ STT success with valid audio
- ✅ STT failure handling
- ✅ TTS success with valid text
- ✅ TTS failure fallback to text-only
- ✅ Voice settings application
- ✅ Default voice settings

**Run**:
```bash
bun test src/test/VoiceService.test.ts
```

### 18.3 HealthService Tests
**File**: `backend/src/test/HealthService.test.ts`

**Test Cases**:
- ✅ Valid profile creation
- ✅ Required field validation
- ✅ Numeric range validation (age, height, weight)
- ✅ Diet preference enum validation
- ✅ Profile retrieval
- ✅ BMI calculation correctness
- ✅ BMI category classification at boundaries
- ✅ BMI record persistence

**Run**:
```bash
bun test src/test/HealthService.test.ts
```

### 18.4 DietService Tests
**File**: `backend/src/test/DietService.test.ts` (to be created)

**Test Cases**:
- Test calorie calculation based on profile
- Test activity level multipliers
- Test diet plan generation with complete structure
- Test macronutrient distribution
- Test diet preference filtering (vegetarian, eggetarian, non-vegetarian)
- Test plan persistence and retrieval
- Test AI generation failure handling

**Run**:
```bash
bun test src/test/DietService.test.ts
```

### 18.5 GamificationService Tests
**File**: `backend/src/test/GamificationService.test.ts` (to be created)

**Test Cases**:
- Test progress initialization
- Test stage completion updates
- Test points and badge awards for each stage
- Test completion percentage calculation
- Test progress retrieval

**Run**:
```bash
bun test src/test/GamificationService.test.ts
```

### 18.6 ConversationManager Tests
**File**: `backend/src/test/ConversationManager.test.ts`

**Test Cases**:
- ✅ Session initialization
- ✅ Conversation state updates
- ✅ Adaptive questioning logic
- ✅ Age-based question adaptation
- ✅ Activity-level-based question adaptation
- ✅ Conversation history tracking
- ✅ Session expiration

**Run**:
```bash
bun test src/test/ConversationManager.test.ts
```

### 18.7 Error Handling Tests
**File**: `backend/src/test/error-handling.test.ts` (to be created)

**Test Cases**:
- Test database connection failures
- Test external API failures (Nova Sonic, Nova Lite)
- Test invalid input handling
- Test session expiration handling
- Test error response format

**Run**:
```bash
bun test src/test/error-handling.test.ts
```

## Task 19: Integration Tests

### 19.1 End-to-End User Journey Test
**File**: `backend/src/test/integration/user-journey.test.ts` (to be created)

**Test Flow**:
1. Signup → Login → Start conversation
2. Collect profile → Calculate BMI
3. Generate diet plan
4. Verify progress updates at each stage
5. Verify gamification points and badges awarded
6. Verify all data persisted correctly

**Run**:
```bash
bun test src/test/integration/user-journey.test.ts
```

### 19.2 Voice Conversation Flow Test
**File**: `backend/src/test/integration/voice-conversation.test.ts` (to be created)

**Test Flow**:
1. Start session
2. Process multiple voice inputs
3. Complete profile
4. End session
5. Verify conversation state persistence
6. Verify adaptive questioning logic
7. Verify conversation history maintained

**Run**:
```bash
bun test src/test/integration/voice-conversation.test.ts
```

### 19.3 Multi-User Concurrent Sessions Test
**File**: `backend/src/test/integration/concurrent-sessions.test.ts` (to be created)

**Test Scenario**:
- Test multiple users with simultaneous voice sessions
- Verify session isolation (no data leakage)
- Verify each user's data stored separately
- Verify concurrent database access

**Run**:
```bash
bun test src/test/integration/concurrent-sessions.test.ts
```

### 19.4 Database Transaction Tests
**File**: `backend/src/test/integration/transactions.test.ts` (to be created)

**Test Cases**:
- Test profile update with BMI calculation (atomic operation)
- Test diet plan generation with progress update (atomic operation)
- Test rollback on failure scenarios
- Verify data consistency

**Run**:
```bash
bun test src/test/integration/transactions.test.ts
```

### 19.5 External Service Integration Tests
**File**: `backend/src/test/integration/external-services.test.ts` (to be created)

**Test Cases**:
- Test Nova Sonic STT/TTS integration with mock responses
- Test Nova Lite AI reasoning integration with mock responses
- Test Redis caching integration (if implemented)
- Test error handling when services unavailable

**Run**:
```bash
bun test src/test/integration/external-services.test.ts
```

### 19.6 API Endpoint Integration Tests
**File**: `backend/src/test/integration/api-endpoints.test.ts` (to be created)

**Test Cases**:
- Test all authentication endpoints with valid/invalid inputs
- Test all voice interaction endpoints
- Test all health profile endpoints
- Test all diet plan endpoints
- Test all progress endpoints
- Verify response format consistency
- Verify HTTP status codes

**Run**:
```bash
bun test src/test/integration/api-endpoints.test.ts
```

## Task 20: Performance Tests

### 20.1 Latency Tests
**File**: `backend/src/test/performance/latency.test.ts` (to be created)

**Test Targets**:
- Authentication endpoints: < 500ms
- Health profile operations: < 200ms
- Voice STT: < 2 seconds
- Voice TTS: < 2 seconds
- AI reasoning: < 3 seconds
- Diet plan generation: < 5 seconds

**Run**:
```bash
bun test src/test/performance/latency.test.ts
```

### 20.2 Load Tests
**File**: `backend/src/test/performance/load.test.ts` (to be created)

**Test Scenario**:
- 100 concurrent users
- 200-300 requests per minute
- Sustain load for 10 minutes
- Verify no degradation in response times
- Verify no errors under load

**Run**:
```bash
bun test src/test/performance/load.test.ts
```

### 20.3 Stress Tests
**File**: `backend/src/test/performance/stress.test.ts` (to be created)

**Test Scenario**:
- Gradually increase load to 200 concurrent users
- Identify breaking point
- Verify graceful degradation
- Verify error handling under stress
- Verify system recovery after stress

**Run**:
```bash
bun test src/test/performance/stress.test.ts
```

## Property-Based Tests

Property-based tests use `fast-check` library to generate random test cases and verify universal properties.

### Install fast-check
```bash
bun add -d fast-check
```

### Example Property Test
```typescript
import fc from 'fast-check';

test('Property: BMI calculation correctness', () => {
  fc.assert(
    fc.property(
      fc.float({ min: 20, max: 300 }), // weight
      fc.float({ min: 0.5, max: 2.5 }), // height
      (weight, height) => {
        const bmi = calculateBMI(weight, height);
        const expected = weight / (height * height);
        expect(Math.abs(bmi - expected)).toBeLessThan(0.01);
      }
    )
  );
});
```

## Test Coverage Goals

- **Unit Tests**: 80%+ code coverage
- **Integration Tests**: All critical user flows covered
- **Performance Tests**: All latency targets met

## Continuous Integration

### GitHub Actions Workflow
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test --coverage
```

## Troubleshooting

### Test Database Issues
```bash
# Reset test database
mysql -u root -p -e "DROP DATABASE IF EXISTS nutrivoice_test;"
mysql -u root -p -e "CREATE DATABASE nutrivoice_test;"
bun run migrate:test
```

### Port Conflicts
```bash
# Change test port in .env.test
TEST_PORT=3002
```

### Timeout Issues
```bash
# Increase test timeout in vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 30000, // 30 seconds
  },
});
```

## Next Steps

After completing all tests:
1. Review test coverage report
2. Fix any failing tests
3. Optimize slow tests
4. Add missing test cases
5. Update documentation
6. Run final verification before deployment
