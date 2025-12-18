# FamCal Architecture

Technical documentation for IT personnel and developers.

> **See also:** [Interactive Mermaid Diagrams](ARCHITECTURE-DIAGRAMS.md) for visual diagrams that render on GitHub.

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Application Architecture](#application-architecture)
4. [Database Schema](#database-schema)
5. [API Reference](#api-reference)
6. [Component Architecture](#component-architecture)
7. [Data Flow](#data-flow)
8. [Security Considerations](#security-considerations)
9. [Performance Optimization](#performance-optimization)

---

## System Overview

FamCal is a self-hosted family dashboard application designed for always-on displays. It runs entirely on a local network with no cloud dependencies (except for weather data).

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Raspberry Pi 5                                │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                        FamCal Application                         │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │  │
│  │  │   Dashboard     │  │   Admin Panel   │  │   API Routes    │   │  │
│  │  │   /             │  │   /manage       │  │   /api/*        │   │  │
│  │  │                 │  │                 │  │                 │   │  │
│  │  │  • Photo Mode   │  │  • Family Mgmt  │  │  • CRUD Ops     │   │  │
│  │  │  • Widgets      │  │  • Chores       │  │  • Weather      │   │  │
│  │  │  • Animations   │  │  • Settings     │  │  • Photos       │   │  │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘   │  │
│  │           │                    │                    │            │  │
│  │           └────────────────────┼────────────────────┘            │  │
│  │                                │                                 │  │
│  │                    ┌───────────┴───────────┐                     │  │
│  │                    │     Prisma ORM        │                     │  │
│  │                    └───────────┬───────────┘                     │  │
│  │                                │                                 │  │
│  │                    ┌───────────┴───────────┐                     │  │
│  │                    │   SQLite Database     │                     │  │
│  │                    │   prisma/dev.db       │                     │  │
│  │                    └───────────────────────┘                     │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │    systemd      │  │    Chromium     │  │   Photo Storage         │  │
│  │    Service      │  │    Kiosk Mode   │  │   /home/pi/famcal-photos│  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP (Port 3000)
                                    ▼
                    ┌───────────────────────────────┐
                    │       Local Network           │
                    │   • Mobile Admin Access       │
                    │   • Desktop Browser Access    │
                    └───────────────────────────────┘
                                    │
                                    │ HTTPS (Weather API)
                                    ▼
                    ┌───────────────────────────────┐
                    │      External Services        │
                    │   • Open-Meteo Weather API    │
                    └───────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 15 (App Router) | React framework with SSR |
| **UI Framework** | Tailwind CSS 4 | Utility-first styling |
| **Animations** | Framer Motion | Complex animation sequences |
| **Backend** | Next.js API Routes | REST API endpoints |
| **ORM** | Prisma 6 | Database access layer |
| **Database** | SQLite | Local file-based database |
| **Weather** | Open-Meteo API | Free weather data (no API key) |
| **Process Manager** | systemd | Service management |
| **Display** | Chromium Kiosk | Fullscreen browser display |

### Why These Choices?

- **SQLite**: No external database server needed, simple backup (copy one file)
- **Open-Meteo**: Free, no API key required, reliable
- **systemd**: Native Linux service management, auto-restart on failure
- **Next.js App Router**: Modern React patterns, built-in API routes

---

## Application Architecture

### Directory Structure

```
famcal/
├── prisma/
│   ├── schema.prisma      # Database schema definition
│   └── dev.db             # SQLite database file
├── scripts/
│   ├── famcal.service     # systemd service definition
│   ├── setup-autostart.sh # Service installation script
│   └── setup-kiosk.sh     # Kiosk mode setup script
├── src/
│   ├── app/
│   │   ├── api/           # API route handlers
│   │   │   ├── family/
│   │   │   ├── chores/
│   │   │   ├── habits/
│   │   │   ├── tasks/
│   │   │   ├── shopping/
│   │   │   ├── schedule/
│   │   │   ├── rewards/
│   │   │   ├── points/
│   │   │   ├── settings/
│   │   │   ├── weather/
│   │   │   └── local-photos/
│   │   ├── manage/        # Admin panel page
│   │   ├── layout.tsx     # Root layout
│   │   ├── page.tsx       # Dashboard page
│   │   └── globals.css    # Global styles
│   ├── components/
│   │   ├── display/       # Dashboard display components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Clock.tsx
│   │   │   ├── WeatherDisplay.tsx
│   │   │   ├── PhotoScreensaver.tsx
│   │   │   ├── WidgetCarousel.tsx
│   │   │   ├── DynamicBackground.tsx
│   │   │   └── [Widget]Display.tsx
│   │   └── manage/        # Admin panel components
│   │       ├── MobileNav.tsx
│   │       ├── SettingsSection.tsx
│   │       └── [Feature]Section.tsx
│   └── lib/
│       ├── prisma.ts      # Prisma client singleton
│       └── theme.ts       # Theme configuration
├── docs/                  # Documentation
└── public/                # Static assets
```

### Request Flow

```
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐
│  Client  │───▶│  Next.js     │───▶│  API Route   │───▶│  Prisma  │
│  Browser │    │  Server      │    │  Handler     │    │  Client  │
└──────────┘    └──────────────┘    └──────────────┘    └────┬─────┘
                                                              │
                                                              ▼
                                                        ┌──────────┐
                                                        │  SQLite  │
                                                        │  dev.db  │
                                                        └──────────┘
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  FamilyMember   │       │     Chore       │       │    Reward       │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ name            │       │ title           │       │ name            │
│ avatar          │       │ description     │       │ description     │
│ color           │       │ points          │       │ pointsCost      │
│ role            │       │ recurrence      │       │ icon            │
│ email           │       │ recurDays       │       │ isActive        │
└────────┬────────┘       │ isActive        │       │ isCashReward    │
         │                └────────┬────────┘       │ cashValue       │
         │                         │                └────────┬────────┘
         │                         │                         │
         │    ┌────────────────────┴────────────────────┐    │
         │    │                                         │    │
         ▼    ▼                                         ▼    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐
│ChoreAssignment  │  │ChoreCompletion  │  │   RewardRedemption      │
├─────────────────┤  ├─────────────────┤  ├─────────────────────────┤
│ choreId (FK)    │  │ choreId (FK)    │  │ rewardId (FK)           │
│ assigneeId (FK) │  │ completedById   │  │ requestedById (FK)      │
│ rotationOrder   │  │ completedAt     │  │ approvedById (FK)       │
└─────────────────┘  │ scheduledFor    │  │ status                  │
                     └─────────────────┘  │ pointsSpent             │
                                          └─────────────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│     Habit       │  │    HabitLog     │  │ PointTransaction│
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ id (PK)         │  │ habitId (FK)    │  │ familyMemberId  │
│ name            │  │ familyMemberId  │  │ amount (+/-)    │
│ icon            │  │ completedDate   │  │ type            │
│ points          │  └─────────────────┘  │ description     │
│ frequency       │                       └─────────────────┘
└─────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│     Task        │  │  ShoppingItem   │  │  ScheduleItem   │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ id (PK)         │  │ id (PK)         │  │ id (PK)         │
│ title           │  │ name            │  │ title           │
│ completed       │  │ quantity        │  │ time            │
│ priority        │  │ store           │  │ icon            │
│ dueDate         │  │ checked         │  │ days            │
└─────────────────┘  └─────────────────┘  └─────────────────┘

┌───────────────────────────────────────────────────────────┐
│                       Settings                            │
├───────────────────────────────────────────────────────────┤
│ id = "singleton"                                          │
│ displayName, timezone, theme                              │
│ carouselInterval, carouselAnimation                       │
│ headerMode, headerAlternateInterval                       │
│ weatherLat, weatherLon, weatherCity                       │
│ screensaverEnabled, screensaverPhotoPath, screensaverInterval │
└───────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Singleton Settings**: Single row with `id = "singleton"` for app-wide settings
2. **Soft Deletes**: Not implemented - hard deletes cascade through relationships
3. **Points Ledger**: All point transactions logged for audit trail
4. **Flexible Recurrence**: JSON-stored day arrays for custom schedules

---

## API Reference

### Base URL
```
http://[PI-IP]:3000/api
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Family** |
| GET | `/family` | List all family members |
| POST | `/family` | Create family member |
| PUT | `/family/[id]` | Update family member |
| DELETE | `/family/[id]` | Delete family member |
| **Chores** |
| GET | `/chores` | List today's chores |
| GET | `/chores?all=true` | List all chores |
| POST | `/chores` | Create chore |
| PUT | `/chores/[id]` | Update chore |
| DELETE | `/chores/[id]` | Delete chore |
| POST | `/chores/[id]/complete` | Mark chore complete |
| DELETE | `/chores/[id]/complete` | Undo completion |
| **Habits** |
| GET | `/habits` | List all habits |
| POST | `/habits` | Create habit |
| POST | `/habits/[id]/log` | Log habit completion |
| **Tasks** |
| GET | `/tasks` | List tasks |
| POST | `/tasks` | Create task |
| PUT | `/tasks/[id]` | Update task |
| DELETE | `/tasks/[id]` | Delete task |
| **Shopping** |
| GET | `/shopping` | List shopping items |
| POST | `/shopping` | Add item |
| PUT | `/shopping/[id]` | Update item |
| DELETE | `/shopping/[id]` | Delete item |
| **Schedule** |
| GET | `/schedule` | List schedule items |
| POST | `/schedule` | Create schedule item |
| **Rewards** |
| GET | `/rewards` | List rewards |
| POST | `/rewards` | Create reward |
| GET | `/rewards/redemptions` | List redemptions |
| POST | `/rewards/redemptions` | Request redemption |
| PUT | `/rewards/redemptions/[id]` | Approve/deny |
| **Points** |
| GET | `/points/balance/[memberId]` | Get point balance |
| POST | `/points/bonus` | Award bonus points |
| **Settings** |
| GET | `/settings` | Get settings |
| PUT | `/settings` | Update settings |
| **Weather** |
| GET | `/weather` | Get current weather |
| **Photos** |
| GET | `/local-photos` | List photos in folder |
| GET | `/local-photos/[filename]` | Serve photo file |

---

## Component Architecture

### Display Components

```
Dashboard
├── DynamicBackground (animated gradient + floating orbs)
├── Header
│   ├── Clock (time display with animations)
│   └── WeatherDisplay (temp colormap, conditions)
├── WidgetCarousel (animated widget rotation)
│   ├── CalendarDisplay
│   ├── ChoreBoard
│   ├── HabitsDisplay
│   ├── TasksDisplay
│   ├── ShoppingDisplay
│   ├── ScheduleDisplay
│   ├── MealPlanDisplay
│   └── PointsDisplay
└── PhotoScreensaver (Ken Burns effect)
    └── Mini Dashboard Overlay
```

### Animation Presets

| Preset | Description |
|--------|-------------|
| `arrivingTogether` | Widgets arrive from opposite sides |
| `racingFriends` | Race in from same side |
| `bouncyBall` | Drop and bounce |
| `peekaBoo` | Pop from center |
| `airplaneLanding` | Swoop from above |
| `sillySpin` | Spin while growing |
| `trampolineJump` | Bounce from below |
| `crashAndRecover` | Collide and recover |
| `jellyWobble` | Wobble effect |
| `rocketLaunch` | Blast from below |
| `swingIn` | Pendulum swing |
| `tumbleIn` | Roll in from sides |
| `balloonFloat` | Float up gently |
| `cycle` | Rotate through all |

---

## Data Flow

### Photo Mode Display Logic

```
┌─────────────────────────────────────────────────────────────┐
│                    Time-Based Display Logic                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Current Time ──▶ Check Hour & Minute                       │
│                          │                                  │
│                          ▼                                  │
│                 ┌────────────────┐                          │
│                 │  Hour >= 6?    │                          │
│                 │  (6 AM - 11 PM)│                          │
│                 └───────┬────────┘                          │
│                         │                                   │
│              ┌──────────┴──────────┐                        │
│              │                     │                        │
│              ▼                     ▼                        │
│         YES (Day)             NO (Night)                    │
│              │                     │                        │
│              ▼                     ▼                        │
│   ┌─────────────────┐     ┌─────────────────┐              │
│   │ Minute :25-:35  │     │  Photo Mode     │              │
│   │ or :55-:05?     │     │  (always)       │              │
│   └────────┬────────┘     └─────────────────┘              │
│            │                                                │
│   ┌────────┴────────┐                                       │
│   │                 │                                       │
│   ▼                 ▼                                       │
│  YES               NO                                       │
│   │                 │                                       │
│   ▼                 ▼                                       │
│ ┌─────────┐   ┌───────────┐                                │
│ │Full     │   │Photo Mode │                                │
│ │Dashboard│   │+ Mini Dash│                                │
│ └─────────┘   └───────────┘                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Considerations

### Current Security Model

⚠️ **FamCal is designed for trusted home networks only.**

| Aspect | Status | Notes |
|--------|--------|-------|
| Authentication | None | No login required |
| Authorization | None | All endpoints public |
| HTTPS | Not configured | HTTP only |
| Input Validation | Basic | Prisma provides SQL injection protection |
| File Access | Restricted | Photos served from configured path only |

### Path Traversal Protection

The `/api/local-photos/[filename]` endpoint validates filenames:
```typescript
// Only alphanumeric, dots, hyphens, underscores allowed
if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
  return error;
}
```

### Recommendations for Production

1. **Network Isolation**: Keep on separate VLAN if possible
2. **Firewall**: Only allow port 3000 from trusted IPs
3. **VPN**: Use VPN for remote access instead of port forwarding
4. **Authentication**: Consider adding NextAuth.js if internet-exposed

---

## Performance Optimization

### Raspberry Pi Specific

1. **Memory Management**
   - Next.js standalone build reduces memory footprint
   - SQLite is memory-efficient vs PostgreSQL/MySQL

2. **Animation Performance**
   - CSS transforms use GPU acceleration
   - Framer Motion optimizes for 60fps

3. **Image Handling**
   - Photos served directly from filesystem
   - No image processing on Pi (use pre-resized images)

### Recommended Photo Sizes

| Use Case | Recommended Size |
|----------|------------------|
| Photo Mode Background | 1920x1080 (1080p) |
| Maximum | 3840x2160 (4K) |
| File Size | Under 2MB per image |

### Caching

| Data | Cache Duration | Location |
|------|----------------|----------|
| Weather | 10 minutes | Next.js fetch cache |
| Settings | 5 minutes | Client-side state |
| Photos List | None | Fresh on each request |

---

## Monitoring & Logs

### View Application Logs
```bash
sudo journalctl -u famcal -f
```

### View Last 100 Lines
```bash
sudo journalctl -u famcal -n 100
```

### Check Resource Usage
```bash
htop
# or
top -p $(pgrep -f "next-server")
```

### Database Location
```bash
ls -la ~/famcal/prisma/dev.db
```

### Backup Database
```bash
cp ~/famcal/prisma/dev.db ~/famcal-backup-$(date +%Y%m%d).db
```

---

## Development

### Local Development
```bash
npm run dev     # Start dev server with hot reload
```

### Production Build
```bash
npm run build   # Create optimized build
npm run start   # Start production server
```

### Database Management
```bash
npx prisma studio          # Open database GUI
npx prisma db push         # Sync schema to database
npx prisma generate        # Regenerate Prisma client
```
