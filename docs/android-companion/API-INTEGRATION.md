# FamCal API Integration Guide

Complete API reference for integrating the FamCal Android app with the FamCal server.

## Base Configuration

```
Base URL: http://<server-ip>:<port>/api
Example: http://192.168.1.100:3000/api
```

## Authentication

### Overview

FamCal uses PIN-based authentication with session cookies:

1. User enters 4-6 digit PIN
2. Server validates and returns session cookie
3. Cookie included in all subsequent requests
4. Session expires after 24 hours

### Security Features

- **Brute Force Protection**: 5 failed attempts = 15-minute lockout
- **Session Expiry**: 24 hours from creation
- **bcrypt Hashing**: PINs stored as bcrypt hashes

---

## Authentication Endpoints

### GET /auth/pin/status

Check PIN configuration status.

**Response:**
```json
{
  "pinEnabled": true,
  "isConfigured": true,
  "pinLockedUntil": null
}
```

**Locked Response:**
```json
{
  "pinEnabled": true,
  "isConfigured": true,
  "pinLockedUntil": "2024-01-15T10:30:00.000Z"
}
```

---

### POST /auth/pin/verify

Authenticate with PIN.

**Request:**
```json
{
  "pin": "1234"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "PIN verified successfully"
}
```

**Response Headers:**
```
Set-Cookie: famcal-pin-session=abc123...; Path=/; HttpOnly; Max-Age=86400
```

**Error Response (Invalid PIN):**
```json
{
  "error": "Invalid PIN",
  "remainingAttempts": 4
}
```

**Error Response (Locked):**
```json
{
  "error": "Too many failed attempts. Try again in 14 minutes."
}
```

---

### GET /auth/pin/verify

Check if current session is valid.

**Headers:**
```
Cookie: famcal-pin-session=abc123...
```

**Response:**
```json
{
  "authenticated": true
}
```

---

### DELETE /auth/pin/verify

Logout and clear session.

**Response:**
```json
{
  "success": true
}
```

---

### POST /auth/pin/setup

Set up initial PIN (first-time setup only).

**Request:**
```json
{
  "pin": "1234",
  "confirmPin": "1234"
}
```

**Response:**
```json
{
  "success": true,
  "message": "PIN configured successfully"
}
```

---

### PUT /auth/pin/change

Change existing PIN (requires session).

**Request:**
```json
{
  "currentPin": "1234",
  "newPin": "5678",
  "confirmNewPin": "5678"
}
```

**Response:**
```json
{
  "success": true,
  "message": "PIN changed successfully"
}
```

---

## Request Headers

All authenticated requests must include:

```
Cookie: famcal-pin-session=<session-token>
x-member-id: <family-member-id>  (optional, for role-based access)
Content-Type: application/json
```

---

## Family Members

### GET /family

Get all family members.

**Response:**
```json
{
  "members": [
    {
      "id": "cm123abc",
      "name": "Dad",
      "displayName": "Dad",
      "avatar": "👨",
      "avatarType": "emoji",
      "color": "#3B82F6",
      "role": "PARENT",
      "email": "dad@example.com",
      "birthday": "1985-06-15",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "_count": {
        "assignedChores": 5,
        "completions": 12
      }
    },
    {
      "id": "cm456def",
      "name": "Timmy",
      "avatar": "👦",
      "avatarType": "emoji",
      "color": "#10B981",
      "role": "CHILD",
      "email": null,
      "birthday": "2015-03-20",
      "_count": {
        "assignedChores": 8,
        "completions": 45
      }
    }
  ]
}
```

---

### POST /family

Create a family member (PARENT only).

**Request:**
```json
{
  "name": "Emma",
  "avatar": "👧",
  "avatarType": "emoji",
  "color": "#EC4899",
  "role": "CHILD",
  "email": null,
  "birthday": "2018-09-10"
}
```

**Response:** (201 Created)
```json
{
  "member": {
    "id": "cm789ghi",
    "name": "Emma",
    "avatar": "👧",
    "avatarType": "emoji",
    "color": "#EC4899",
    "role": "CHILD",
    "email": null,
    "birthday": "2018-09-10T00:00:00.000Z",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

### GET /family/{id}

Get single family member with details.

**Response:**
```json
{
  "member": {
    "id": "cm456def",
    "name": "Timmy",
    "avatar": "👦",
    "role": "CHILD",
    "assignedChores": [
      { "id": "chore1", "title": "Make Bed" }
    ],
    "recentCompletions": [
      {
        "choreId": "chore1",
        "completedAt": "2024-01-15T07:30:00.000Z"
      }
    ]
  }
}
```

---

### PUT /family/{id}

Update family member (PARENT only).

**Request:**
```json
{
  "name": "Timothy",
  "avatar": "🧒",
  "color": "#22C55E"
}
```

**Response:**
```json
{
  "member": { /* updated member object */ }
}
```

---

### DELETE /family/{id}

Delete family member (PARENT only).

**Response:**
```json
{
  "success": true
}
```

---

## Chores

### GET /chores

Get chores (today's by default).

**Query Parameters:**
- `all=true` - Get all chores (for management)
- `showAll=true` - Include inactive chores

**Response:**
```json
{
  "chores": [
    {
      "id": "chore1",
      "title": "Make Bed",
      "description": "Make your bed neatly",
      "icon": "🛏️",
      "points": 5,
      "priority": "NORMAL",
      "recurrence": "DAILY",
      "recurDays": null,
      "recurTime": "07:00",
      "dueDate": null,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-10T00:00:00.000Z",
      "assignments": [
        {
          "id": "assign1",
          "assigneeId": "cm456def",
          "assignee": {
            "id": "cm456def",
            "name": "Timmy",
            "avatar": "👦"
          }
        }
      ],
      "completions": [
        {
          "id": "comp1",
          "completedById": "cm456def",
          "completedAt": "2024-01-15T07:30:00.000Z",
          "completedBy": {
            "name": "Timmy",
            "avatar": "👦"
          }
        }
      ],
      "isCompletedToday": true
    }
  ]
}
```

---

### POST /chores

Create a chore (PARENT only).

**Request:**
```json
{
  "title": "Clean Room",
  "description": "Pick up toys and make bed",
  "icon": "🧹",
  "points": 10,
  "priority": "NORMAL",
  "recurrence": "WEEKLY",
  "recurDays": ["SATURDAY"],
  "recurTime": "10:00",
  "dueDate": null,
  "assigneeIds": ["cm456def", "cm789ghi"]
}
```

**Priority Values:** `LOW`, `NORMAL`, `HIGH`, `URGENT`

**Recurrence Values:** `DAILY`, `WEEKLY`, `BIWEEKLY`, `MONTHLY`, `CUSTOM`

**Response:** (201 Created)
```json
{
  "chore": { /* created chore object */ }
}
```

---

### PUT /chores/{id}

Update a chore (PARENT only).

**Request:**
```json
{
  "title": "Clean Bedroom",
  "points": 15,
  "assigneeIds": ["cm456def"]
}
```

---

### DELETE /chores/{id}

Delete a chore (PARENT only).

---

### POST /chores/{id}/complete

Mark chore as complete.

**Request:**
```json
{
  "completedById": "cm456def"
}
```

**Response:** (201 Created)
```json
{
  "completion": {
    "id": "comp123",
    "choreId": "chore1",
    "completedById": "cm456def",
    "completedAt": "2024-01-15T15:30:00.000Z"
  },
  "pointsAwarded": 10
}
```

---

### DELETE /chores/{id}/complete

Undo chore completion (removes points).

---

## Habits

### GET /habits

Get all habits with completion status.

**Query Parameters:**
- `date=YYYY-MM-DD` - Specific date (default: today)

**Response:**
```json
{
  "habits": [
    {
      "id": "habit1",
      "name": "Brush Teeth",
      "icon": "🦷",
      "points": 2,
      "frequency": "DAILY",
      "isActive": true,
      "logs": [
        {
          "id": "log1",
          "familyMemberId": "cm456def",
          "completedAt": "2024-01-15T07:00:00.000Z",
          "completedDate": "2024-01-15"
        }
      ]
    }
  ],
  "date": "2024-01-15"
}
```

---

### POST /habits

Create a habit (PARENT only).

**Request:**
```json
{
  "name": "Read for 20 minutes",
  "icon": "📚",
  "points": 5,
  "frequency": "DAILY"
}
```

---

### POST /habits/log

Log habit completion.

**Request:**
```json
{
  "habitId": "habit1",
  "familyMemberId": "cm456def",
  "date": "2024-01-15"
}
```

**Response:** (201 Created)
```json
{
  "log": {
    "id": "log123",
    "habitId": "habit1",
    "familyMemberId": "cm456def",
    "completedAt": "2024-01-15T15:30:00.000Z",
    "completedDate": "2024-01-15"
  },
  "pointsAwarded": 5
}
```

---

### DELETE /habits/log

Undo habit completion.

**Query Parameters:**
- `habitId` - Required
- `familyMemberId` - Required
- `date` - YYYY-MM-DD format

---

## Rewards & Points

### GET /rewards

Get all rewards.

**Response:**
```json
{
  "rewards": [
    {
      "id": "reward1",
      "name": "Extra Screen Time",
      "description": "30 minutes of extra screen time",
      "pointsCost": 50,
      "icon": "📱",
      "isActive": true,
      "isCashReward": false,
      "cashValue": null
    },
    {
      "id": "reward2",
      "name": "Cash Out",
      "description": "Convert points to money",
      "pointsCost": 100,
      "icon": "💵",
      "isActive": true,
      "isCashReward": true,
      "cashValue": 1.00
    }
  ],
  "settings": {
    "cashConversionRate": 0.01,
    "minCashoutPoints": 100
  }
}
```

---

### POST /rewards

Create a reward (PARENT only).

**Request:**
```json
{
  "name": "Movie Night",
  "description": "Choose the family movie",
  "pointsCost": 100,
  "icon": "🎬",
  "isCashReward": false
}
```

---

### POST /rewards/redeem

Request reward redemption (CHILD).

**Request:**
```json
{
  "rewardId": "reward1",
  "requestedById": "cm456def",
  "customPointsAmount": null
}
```

For cash rewards:
```json
{
  "rewardId": "reward2",
  "requestedById": "cm456def",
  "customPointsAmount": 200
}
```

**Response:** (201 Created)
```json
{
  "redemption": {
    "id": "redeem1",
    "rewardId": "reward1",
    "requestedById": "cm456def",
    "status": "PENDING",
    "pointsSpent": 50,
    "createdAt": "2024-01-15T15:30:00.000Z"
  }
}
```

---

### GET /rewards/redemptions

Get redemption requests.

**Query Parameters:**
- `status` - `PENDING`, `APPROVED`, `DENIED`
- `memberId` - Filter by requester

**Response:**
```json
{
  "redemptions": [
    {
      "id": "redeem1",
      "reward": {
        "id": "reward1",
        "name": "Extra Screen Time",
        "icon": "📱"
      },
      "requestedBy": {
        "id": "cm456def",
        "name": "Timmy",
        "avatar": "👦"
      },
      "status": "PENDING",
      "pointsSpent": 50,
      "createdAt": "2024-01-15T15:30:00.000Z"
    }
  ],
  "pendingCount": 1
}
```

---

### PUT /rewards/redemptions/{id}

Approve or deny redemption (PARENT only).

**Request:**
```json
{
  "status": "APPROVED",
  "approvedById": "cm123abc"
}
```

Or deny:
```json
{
  "status": "DENIED",
  "approvedById": "cm123abc",
  "denialReason": "Not enough chores completed this week"
}
```

---

### GET /points/balance/{memberId}

Get member's points balance.

**Response:**
```json
{
  "memberId": "cm456def",
  "memberName": "Timmy",
  "balance": 150,
  "lifetimeEarned": 500,
  "lifetimeSpent": 350
}
```

---

### GET /points/ledger/{memberId}

Get points transaction history.

**Query Parameters:**
- `limit` - Default 20
- `offset` - Default 0
- `type` - Filter by type

**Response:**
```json
{
  "transactions": [
    {
      "id": "tx1",
      "amount": 10,
      "type": "CHORE_COMPLETION",
      "description": "Completed: Make Bed",
      "createdAt": "2024-01-15T07:30:00.000Z"
    },
    {
      "id": "tx2",
      "amount": -50,
      "type": "REDEMPTION",
      "description": "Redeemed: Extra Screen Time",
      "createdAt": "2024-01-15T15:30:00.000Z"
    }
  ],
  "total": 25,
  "hasMore": true
}
```

**Transaction Types:**
- `CHORE_COMPLETION`
- `HABIT_COMPLETION`
- `BONUS`
- `REDEMPTION`
- `DEDUCTION`
- `HABIT_UNDO`

---

### POST /points/award

Award bonus points (PARENT only).

**Request:**
```json
{
  "familyMemberId": "cm456def",
  "amount": 25,
  "description": "Great report card!",
  "awardedById": "cm123abc"
}
```

**Response:** (201 Created)
```json
{
  "transaction": {
    "id": "tx123",
    "amount": 25,
    "type": "BONUS",
    "description": "Great report card!"
  },
  "newBalance": 175
}
```

---

## Tasks

### GET /tasks

Get all tasks.

**Query Parameters:**
- `showCompleted=true` - Include completed tasks

**Response:**
```json
{
  "tasks": [
    {
      "id": "task1",
      "title": "Buy birthday present for grandma",
      "completed": false,
      "priority": "HIGH",
      "dueDate": "2024-01-20",
      "startDate": null,
      "scheduledDate": "2024-01-18",
      "recurrence": null,
      "notes": "She likes gardening",
      "createdAt": "2024-01-10T00:00:00.000Z"
    }
  ]
}
```

---

### POST /tasks

Create a task.

**Request:**
```json
{
  "title": "Schedule dentist appointment",
  "priority": "MEDIUM",
  "dueDate": "2024-01-25",
  "notes": "Call Dr. Smith"
}
```

**Priority Values:** `HIGH`, `MEDIUM`, `LOW`

---

### PUT /tasks/{id}

Update a task.

**Request:**
```json
{
  "completed": true
}
```

---

## Shopping

### GET /shopping

Get shopping items.

**Query Parameters:**
- `showChecked=true` - Include checked items
- `store=COSTCO` - Filter by store

**Response:**
```json
{
  "items": [
    {
      "id": "item1",
      "name": "Milk",
      "quantity": 2,
      "unit": "gallon",
      "store": "COSTCO",
      "checked": false,
      "notes": "Organic preferred"
    }
  ],
  "grouped": {
    "COSTCO": [ /* items */ ],
    "WALMART": [ /* items */ ],
    "TARGET": [ /* items */ ],
    "OTHER": [ /* items */ ]
  }
}
```

---

### POST /shopping

Create shopping item.

**Request:**
```json
{
  "name": "Bananas",
  "quantity": 1,
  "unit": "bunch",
  "store": "WALMART",
  "notes": null
}
```

**Store Values:** `COSTCO`, `WALMART`, `TARGET`, `OTHER`

---

### PUT /shopping/{id}

Update shopping item (including check/uncheck).

**Request:**
```json
{
  "checked": true
}
```

---

### DELETE /shopping?clearChecked=true

Clear all checked items.

**Query Parameters:**
- `clearChecked=true` - Required
- `store=COSTCO` - Optional, clear only for specific store

---

## Schedule

### GET /schedule

Get daily schedule items.

**Response:**
```json
{
  "items": [
    {
      "id": "sched1",
      "title": "Wake Up",
      "time": "07:00",
      "icon": "☀️",
      "days": null,
      "isActive": true
    },
    {
      "id": "sched2",
      "title": "Soccer Practice",
      "time": "16:00",
      "icon": "⚽",
      "days": ["TUESDAY", "THURSDAY"],
      "isActive": true
    }
  ]
}
```

---

### POST /schedule

Create schedule item (PARENT only).

**Request:**
```json
{
  "title": "Piano Lesson",
  "time": "17:00",
  "icon": "🎹",
  "days": ["WEDNESDAY"]
}
```

---

## Calendar

### GET /calendar/events

Get today's calendar events (Google Calendar).

**Response:**
```json
{
  "connected": true,
  "events": [
    {
      "id": "event1",
      "title": "Team Meeting",
      "description": "Weekly sync",
      "startTime": "2024-01-15T10:00:00.000Z",
      "endTime": "2024-01-15T11:00:00.000Z",
      "allDay": false,
      "location": "Office",
      "color": "#4285F4"
    }
  ]
}
```

---

### GET /calendar/status

Check Google Calendar connection status.

**Response:**
```json
{
  "connected": true,
  "calendarIds": ["primary", "family@group.calendar.google.com"]
}
```

---

## Weather

### GET /weather

Get current weather (uses configured location).

**Response:**
```json
{
  "temp": 72,
  "condition": "Sunny",
  "icon": "☀️",
  "isDay": true,
  "high": 78,
  "low": 55,
  "city": "Los Angeles"
}
```

---

## Settings

### GET /settings

Get application settings (PARENT only).

**Response:**
```json
{
  "settings": {
    "displayName": "Smith Family",
    "theme": "light",
    "carouselInterval": 10000,
    "carouselAnimation": "fade",
    "headerMode": "static",
    "headerAlternateInterval": 5000,
    "showWeather": true,
    "weatherLat": 34.0522,
    "weatherLon": -118.2437,
    "weatherCity": "Los Angeles",
    "screensaverEnabled": true,
    "screensaverStartHour": 22,
    "screensaverEndHour": 6,
    "screensaverPhotoPath": "/photos",
    "screensaverInterval": 30000
  }
}
```

---

### PUT /settings

Update settings (PARENT only).

**Request:**
```json
{
  "displayName": "Smith Family Dashboard",
  "theme": "dark"
}
```

---

## Backup

### GET /backup

List all backups (PARENT only).

**Response:**
```json
{
  "backups": [
    {
      "id": "backup1",
      "name": "Weekly Backup",
      "description": "Automatic weekly backup",
      "version": "1.0",
      "createdAt": "2024-01-14T00:00:00.000Z"
    }
  ]
}
```

---

### POST /backup

Create backup (PARENT only).

**Request:**
```json
{
  "name": "Pre-update Backup",
  "description": "Backup before major changes"
}
```

---

### POST /backup/restore

Restore from backup (PARENT only).

**Request:**
```json
{
  "backupId": "backup1"
}
```

---

## Audit Logs

### GET /audit

Get audit logs (PARENT only).

**Query Parameters:**
- `limit` - 1-500 (default 100)
- `entityType` - `POINTS`, `CHORE`, `REWARD`, etc.
- `action` - Action type
- `performedBy` - Member ID
- `since` - ISO date

**Response:**
```json
{
  "logs": [
    {
      "id": "audit1",
      "action": "AWARD_POINTS",
      "entityType": "POINTS",
      "entityId": "tx123",
      "description": "Awarded 25 bonus points to Timmy",
      "performedBy": "cm123abc",
      "performedByName": "Dad",
      "ipAddress": "192.168.1.50",
      "createdAt": "2024-01-15T15:30:00.000Z"
    }
  ],
  "count": 1
}
```

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "error": "Error message here",
  "status": 400
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (no/expired session) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Server Error |

---

## Kotlin Data Models

### Example Domain Models

```kotlin
data class FamilyMember(
    val id: String,
    val name: String,
    val displayName: String?,
    val avatar: String,
    val avatarType: String,
    val color: String,
    val role: Role,
    val email: String?,
    val birthday: LocalDate?,
    val createdAt: Instant,
    val updatedAt: Instant
)

enum class Role { PARENT, CHILD }

data class Chore(
    val id: String,
    val title: String,
    val description: String?,
    val icon: String,
    val points: Int,
    val priority: Priority,
    val recurrence: Recurrence,
    val recurDays: List<String>?,
    val recurTime: String?,
    val dueDate: LocalDate?,
    val isActive: Boolean,
    val assignments: List<ChoreAssignment>,
    val completions: List<ChoreCompletion>,
    val isCompletedToday: Boolean
)

enum class Priority { LOW, NORMAL, HIGH, URGENT }
enum class Recurrence { DAILY, WEEKLY, BIWEEKLY, MONTHLY, CUSTOM }

data class PointTransaction(
    val id: String,
    val amount: Int,
    val type: TransactionType,
    val description: String,
    val createdAt: Instant
)

enum class TransactionType {
    CHORE_COMPLETION,
    HABIT_COMPLETION,
    BONUS,
    REDEMPTION,
    DEDUCTION,
    HABIT_UNDO
}
```

---

## Retrofit API Interface

```kotlin
interface FamCalApi {
    // Auth
    @GET("api/auth/pin/status")
    suspend fun getPinStatus(): Response<PinStatusResponse>

    @POST("api/auth/pin/verify")
    suspend fun verifyPin(@Body request: PinVerifyRequest): Response<ApiResponse>

    // Family
    @GET("api/family")
    suspend fun getFamily(): Response<FamilyResponse>

    @POST("api/family")
    suspend fun createMember(@Body request: CreateMemberRequest): Response<MemberResponse>

    // Chores
    @GET("api/chores")
    suspend fun getChores(@Query("all") all: Boolean = false): Response<ChoresResponse>

    @POST("api/chores/{id}/complete")
    suspend fun completeChore(
        @Path("id") id: String,
        @Body request: CompleteChoreRequest
    ): Response<ChoreCompletionResponse>

    // Points
    @GET("api/points/balance/{memberId}")
    suspend fun getPointsBalance(@Path("memberId") id: String): Response<PointsBalanceResponse>

    @POST("api/points/award")
    suspend fun awardPoints(@Body request: AwardPointsRequest): Response<AwardPointsResponse>

    // ... etc
}
```
