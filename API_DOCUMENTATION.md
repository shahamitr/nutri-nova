# NutriVoice API Documentation

## Base URL
```
Development: http://localhost:3001
Production: https://api.nutrivoice.com
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format

All API responses follow this consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## HTTP Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## Authentication Endpoints

### POST /api/auth/signup

Register a new user account with TOTP authentication.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "created_at": "2024-01-15T10:30:00Z"
    },
    "totp_secret": "JBSWY3DPEHPK3PXP",
    "qr_code_url": "otpauth://totp/NutriVoice:john@example.com?secret=JBSWY3DPEHPK3PXP&issuer=NutriVoice"
  }
}
```

**Validation Rules:**
- Email must be valid format and unique
- Password minimum 8 characters
}
```

**Error Responses:**
- `401` - Invalid email or password
- `401` - Invalid TOTP code
- `429` - Too many login attempts

**Rate Limit:** 5 requests per 15 minutes per IP

---

### POST /api/auth/verify-totp

Verify a TOTP code (used for additional verification).

**Request Body:**
```json
{
  "user_id": 1,
  "totp_code": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "valid": true
  }
}
```

**Rate Limit:** 10 requests per 5 minutes per user

---

### POST /api/auth/logout

Invalidate current session token.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## Voice Interaction Endpoints

### POST /api/voice/start-session

Initialize a new voice conversation session.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "greeting": "Hello! I'm your AI nutritionist. Let's start by learning about your health profile. How old are you?",
    "expires_at": "2024-01-15T11:00:00Z"
  }
}
```

**Session Duration:** 30 minutes

---

### POST /api/voice/process-speech

Process voice input (Speech-to-Text and conversation management).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
audio: <audio_blob>
session_id: "550e8400-e29b-41d4-a716-446655440000"
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transcript": "I am 30 years old",
    "ai_response": "Great! Now, what is your gender?",
    "conversation_state": {
      "collected_data": {
        "age": 30
      },
      "next_question": "gender"
    }
  }
}
```

**Target Latency:** < 2 seconds

---

### POST /api/voice/generate-response

Generate Text-to-Speech audio for AI response.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "text": "Great! Now, what is your gender?",
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "audio_url": "https://cdn.nutrivoice.com/audio/abc123.mp3",
    "audio_base64": "data:audio/mp3;base64,//uQx...",
    "duration_seconds": 3.5
  }
}
```

**Target Latency:** < 2 seconds

---

### GET /api/voice/settings

Retrieve user's voice preferences.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accent": "US_ENGLISH",
    "voice_gender": "MALE",
    "speech_speed": 1.0
  }
}
```

---

### POST /api/voice/save-settings

Save user's voice preferences.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "accent": "UK_ENGLISH",
  "voice_gender": "FEMALE",
  "speech_speed": 1.2
}
```

**Validation:**
- `accent`: US_ENGLISH, UK_ENGLISH, AUSTRALIAN_ENGLISH, INDIAN_ENGLISH
- `voice_gender`: MALE, FEMALE
- `speech_speed`: 0.5 to 2.0

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Voice settings saved successfully"
  }
}
```

---

## Health Profile Endpoints

### POST /api/health/save-profile

Save or update user's health profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "age": 30,
  "gender": "MALE",
  "height_cm": 175,
  "weight_kg": 70,
  "diet_preference": "VEGETARIAN",
  "activity_level": "MODERATE",
  "sleep_hours": 7,
  "stress_level": "MEDIUM",
  "medical_conditions": "None"
}
```

**Validation:**
- `age`: 1-120
- `gender`: MALE, FEMALE, OTHER
- `height_cm`: 50-250
- `weight_kg`: 20-300
- `diet_preference`: VEGETARIAN, EGGETARIAN, NON_VEGETARIAN
- `activity_level`: SEDENTARY, LIGHT, MODERATE, ACTIVE, VERY_ACTIVE
- `sleep_hours`: 0-24
- `stress_level`: LOW, MEDIUM, HIGH

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Health profile saved successfully",
    "progress_updated": true,
    "points_awarded": 20,
    "badge_earned": "Health Profile Created"
  }
}
```

---

### POST /api/health/calculate-bmi

Calculate and store BMI based on health profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "bmi": 22.86,
    "category": "Normal",
    "interpretation": "Your BMI is in the normal range. Maintain your current weight through balanced diet and regular exercise.",
    "progress_updated": true,
    "points_awarded": 30,
    "badge_earned": "Health Baseline Ready"
  }
}
```

**BMI Categories:**
- Underweight: < 18.5
- Normal: 18.5 - 24.9
- Overweight: 25.0 - 29.9
- Obese: >= 30.0

---

### GET /api/health/profile

Retrieve user's health profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "age": 30,
    "gender": "MALE",
    "height_cm": 175,
    "weight_kg": 70,
    "diet_preference": "VEGETARIAN",
    "activity_level": "MODERATE",
    "sleep_hours": 7,
    "stress_level": "MEDIUM",
    "medical_conditions": "None",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### GET /api/health/bmi-history

Retrieve user's BMI calculation history.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "bmi_value": 22.86,
      "category": "Normal",
      "calculated_at": "2024-01-15T10:30:00Z"
    },
    {
      "bmi_value": 23.12,
      "category": "Normal",
      "calculated_at": "2024-01-10T09:15:00Z"
    }
  ]
}
```

---

## Diet Plan Endpoints

### POST /api/diet/generate-plan

Generate personalized diet plan using AI.

**Headers:**
```
Authorization: Bearer <token>
```

**Prerequisites:**
- Health profile must be completed
- BMI must be calculated

**Response (200):**
```json
{
  "success": true,
  "data": {
    "daily_calories": 2200,
    "protein_percentage": 30,
    "carbs_percentage": 50,
    "fats_percentage": 20,
    "diet_preference": "VEGETARIAN",
    "breakfast": [
      {
        "food": "Oatmeal with berries",
        "portion": "1 cup",
        "calories": 300
      },
      {
        "food": "Greek yogurt",
        "portion": "150g",
        "calories": 150
      }
    ],
    "lunch": [
      {
        "food": "Quinoa salad",
        "portion": "2 cups",
        "calories": 400
      },
      {
        "food": "Grilled vegetables",
        "portion": "1 cup",
        "calories": 100
      }
    ],
    "snack": [
      {
        "food": "Mixed nuts",
        "portion": "30g",
        "calories": 180
      },
      {
        "food": "Apple",
        "portion": "1 medium",
        "calories": 95
      }
    ],
    "dinner": [
      {
        "food": "Lentil curry",
        "portion": "1.5 cups",
        "calories": 350
      },
      {
        "food": "Brown rice",
        "portion": "1 cup",
        "calories": 215
      }
    ],
    "created_at": "2024-01-15T10:30:00Z",
    "progress_updated": true,
    "points_awarded": 50,
    "badge_earned": "Personalized Diet Ready"
  }
}
```

**Target Latency:** < 5 seconds

---

### GET /api/diet/plan

Retrieve user's most recent diet plan.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "daily_calories": 2200,
    "protein_percentage": 30,
    "carbs_percentage": 50,
    "fats_percentage": 20,
    "diet_preference": "VEGETARIAN",
    "breakfast": [...],
    "lunch": [...],
    "snack": [...],
    "dinner": [...],
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Response (404) - No plan exists:**
```json
{
  "success": false,
  "error": "No diet plan found. Please generate a plan first."
}
```

---

## Progress Tracking Endpoints

### GET /api/progress/user

Retrieve user's gamification progress.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "profile_completed": true,
    "bmi_calculated": true,
    "routine_completed": false,
    "diet_generated": true,
    "points": 100,
    "badges": [
      "Health Profile Created",
      "Health Baseline Ready",
      "Personalized Diet Ready"
    ],
    "completion_percentage": 75
  }
}
```

**Progress Stages:**
1. Health Profile (20 points)
2. BMI Calculation (30 points)
3. Routine Established (30 points)
4. Diet Generated (50 points)

**Total Points:** 130 points for 100% completion

---

## Rate Limiting

Rate limits are enforced per IP address or authenticated user:

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/auth/signup | 3 requests | 1 hour |
| POST /api/auth/login | 5 requests | 15 minutes |
| POST /api/auth/verify-totp | 10 requests | 5 minutes |
| All other endpoints | 100 requests | 1 minute |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248000
```

**Rate Limit Exceeded Response (429):**
```json
{
  "success": false,
  "error": "Too many requests. Please try again later.",
  "retry_after": 60
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| AUTH_001 | Invalid credentials |
| AUTH_002 | Invalid TOTP code |
| AUTH_003 | Session expired |
| AUTH_004 | Email already exists |
| VALID_001 | Missing required field |
| VALID_002 | Invalid field format |
| VALID_003 | Value out of range |
| HEALTH_001 | Health profile not found |
| HEALTH_002 | BMI calculation failed |
| DIET_001 | Diet plan generation failed |
| DIET_002 | Prerequisites not met |
| VOICE_001 | Audio processing failed |
| VOICE_002 | Session not found |
| VOICE_003 | Session expired |

---

## Webhooks (Future Feature)

Webhook support for real-time notifications will be added in future versions.

---

## SDK and Client Libraries

Official client libraries:
- JavaScript/TypeScript (coming soon)
- Python (coming soon)
- Mobile SDKs (iOS/Android) (coming soon)

---

## Support

For API support and questions:
- Email: api-support@nutrivoice.com
- Documentation: https://docs.nutrivoice.com
- Status Page: https://status.nutrivoice.com
