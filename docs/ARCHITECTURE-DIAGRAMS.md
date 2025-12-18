# FamCal Architecture Diagrams

Interactive diagrams using Mermaid JS. View these on GitHub or any Mermaid-compatible viewer.

## Table of Contents

1. [System Overview](#system-overview)
2. [Application Layers](#application-layers)
3. [Database Schema](#database-schema)
4. [Component Hierarchy](#component-hierarchy)
5. [Data Flow](#data-flow)
6. [Photo Mode State Machine](#photo-mode-state-machine)
7. [API Request Flow](#api-request-flow)
8. [Deployment Architecture](#deployment-architecture)

---

## System Overview

High-level view of the FamCal system architecture.

```mermaid
flowchart TB
    subgraph RPI["Raspberry Pi 5"]
        subgraph APP["FamCal Application"]
            NEXT["Next.js Server<br/>Port 3000"]
            PRISMA["Prisma ORM"]
            SQLITE[("SQLite<br/>dev.db")]
        end

        subgraph SERVICES["System Services"]
            SYSTEMD["systemd<br/>famcal.service"]
            CHROMIUM["Chromium<br/>Kiosk Mode"]
        end

        PHOTOS[("Photo Storage<br/>/home/pi/famcal-photos")]
    end

    subgraph EXTERNAL["External Services"]
        WEATHER["Open-Meteo<br/>Weather API"]
    end

    subgraph CLIENTS["Client Devices"]
        TV["TV Display<br/>Dashboard View"]
        MOBILE["Mobile/Tablet<br/>Admin Panel"]
    end

    SYSTEMD -->|manages| NEXT
    CHROMIUM -->|displays| NEXT
    NEXT --> PRISMA
    PRISMA --> SQLITE
    NEXT -->|reads| PHOTOS
    NEXT -->|fetches| WEATHER
    TV -->|HTTP:3000| NEXT
    MOBILE -->|HTTP:3000/manage| NEXT
```

---

## Application Layers

Detailed view of the Next.js application structure.

```mermaid
flowchart TB
    subgraph PRESENTATION["Presentation Layer"]
        direction LR
        DASHBOARD["Dashboard<br/>(/)"]
        ADMIN["Admin Panel<br/>(/manage)"]
    end

    subgraph COMPONENTS["Component Layer"]
        direction LR
        subgraph DISPLAY["Display Components"]
            CLOCK["Clock"]
            WEATHER["WeatherDisplay"]
            CAROUSEL["WidgetCarousel"]
            PHOTO["PhotoScreensaver"]
            BG["DynamicBackground"]
        end

        subgraph WIDGETS["Widget Components"]
            CAL["CalendarDisplay"]
            CHORES["ChoreBoard"]
            HABITS["HabitsDisplay"]
            TASKS["TasksDisplay"]
            SHOP["ShoppingDisplay"]
            SCHED["ScheduleDisplay"]
            POINTS["PointsDisplay"]
        end

        subgraph MANAGE["Admin Components"]
            NAV["MobileNav"]
            SETTINGS["SettingsSection"]
            SECTIONS["Feature Sections"]
        end
    end

    subgraph API["API Layer (/api/*)"]
        direction LR
        FAMILY_API["family"]
        CHORES_API["chores"]
        HABITS_API["habits"]
        TASKS_API["tasks"]
        SHOPPING_API["shopping"]
        REWARDS_API["rewards"]
        POINTS_API["points"]
        SETTINGS_API["settings"]
        WEATHER_API["weather"]
        PHOTOS_API["local-photos"]
    end

    subgraph DATA["Data Layer"]
        PRISMA_CLIENT["Prisma Client"]
        DB[("SQLite Database")]
    end

    PRESENTATION --> COMPONENTS
    COMPONENTS --> API
    API --> DATA
    PRISMA_CLIENT --> DB
```

---

## Database Schema

Entity relationship diagram for all database models.

```mermaid
erDiagram
    FamilyMember ||--o{ ChoreAssignment : "assigned to"
    FamilyMember ||--o{ ChoreCompletion : "completes"
    FamilyMember ||--o{ PointTransaction : "earns/spends"
    FamilyMember ||--o{ RewardRedemption : "requests"
    FamilyMember ||--o{ RewardRedemption : "approves"
    FamilyMember ||--o{ HabitLog : "logs"

    Chore ||--o{ ChoreAssignment : "has"
    Chore ||--o{ ChoreCompletion : "tracked by"

    Reward ||--o{ RewardRedemption : "redeemed as"

    Habit ||--o{ HabitLog : "logged in"

    FamilyMember {
        string id PK
        string name
        string avatar
        string color
        string role
        string email
    }

    Chore {
        string id PK
        string title
        string description
        int points
        string recurrence
        string recurDays
        boolean isActive
    }

    ChoreAssignment {
        string id PK
        string choreId FK
        string assigneeId FK
        int rotationOrder
    }

    ChoreCompletion {
        string id PK
        string choreId FK
        string completedById FK
        datetime completedAt
        datetime scheduledFor
    }

    Habit {
        string id PK
        string name
        string icon
        int points
        string frequency
        boolean isActive
    }

    HabitLog {
        string id PK
        string habitId FK
        string familyMemberId FK
        datetime completedAt
        string completedDate
    }

    Reward {
        string id PK
        string name
        string description
        int pointsCost
        string icon
        boolean isActive
        boolean isCashReward
        float cashValue
    }

    RewardRedemption {
        string id PK
        string rewardId FK
        string requestedById FK
        string approvedById FK
        int pointsSpent
        string status
        datetime approvedAt
    }

    PointTransaction {
        string id PK
        string familyMemberId FK
        int amount
        string type
        string description
        datetime createdAt
    }

    Task {
        string id PK
        string title
        boolean completed
        string priority
        datetime dueDate
    }

    ShoppingItem {
        string id PK
        string name
        int quantity
        string store
        boolean checked
    }

    ScheduleItem {
        string id PK
        string title
        string time
        string icon
        string days
    }

    Settings {
        string id PK
        string displayName
        int carouselInterval
        string carouselAnimation
        string headerMode
        string weatherCity
        float weatherLat
        float weatherLon
        boolean screensaverEnabled
        string screensaverPhotoPath
        int screensaverInterval
    }
```

---

## Component Hierarchy

React component tree for the dashboard.

```mermaid
flowchart TB
    subgraph ROOT["App Root"]
        LAYOUT["layout.tsx"]
    end

    subgraph PAGES["Pages"]
        PAGE_DASH["page.tsx (/)"]
        PAGE_MANAGE["manage/page.tsx"]
    end

    subgraph DASHBOARD["Dashboard Component Tree"]
        DASH["Dashboard"]

        subgraph PHOTO_MODE["Photo Mode (when enabled)"]
            PHOTOSS["PhotoScreensaver"]
            MINI["Mini Dashboard Overlay"]
        end

        subgraph NORMAL_MODE["Normal Dashboard"]
            DYNBG["DynamicBackground"]

            subgraph HEADER["Header Section"]
                CLOCK_C["Clock"]
                WEATHER_C["WeatherDisplay"]
            end

            subgraph CONTENT["Content Section"]
                WIDGET_CAROUSEL["WidgetCarousel"]

                subgraph WIDGETS_LIST["Widgets"]
                    W1["CalendarDisplay"]
                    W2["ScheduleDisplay"]
                    W3["ChoreBoard"]
                    W4["HabitsDisplay"]
                    W5["TasksDisplay"]
                    W6["ShoppingDisplay"]
                    W7["MealPlanDisplay"]
                    W8["PointsDisplay"]
                end
            end
        end
    end

    LAYOUT --> PAGES
    PAGE_DASH --> DASH
    DASH -->|"photo mode off"| NORMAL_MODE
    DASH -->|"photo mode on"| PHOTO_MODE
    PHOTOSS --> MINI
    MINI --> NORMAL_MODE
    DYNBG --> HEADER
    DYNBG --> CONTENT
    WIDGET_CAROUSEL --> WIDGETS_LIST
```

---

## Data Flow

How data flows through the application.

```mermaid
sequenceDiagram
    participant Browser
    participant NextJS as Next.js Server
    participant API as API Routes
    participant Prisma
    participant SQLite
    participant OpenMeteo as Open-Meteo API

    Note over Browser,SQLite: Dashboard Load
    Browser->>NextJS: GET /
    NextJS->>Browser: HTML + JS Bundle

    Note over Browser,SQLite: Fetch Settings
    Browser->>API: GET /api/settings
    API->>Prisma: findUnique(settings)
    Prisma->>SQLite: SELECT * FROM Settings
    SQLite-->>Prisma: Settings row
    Prisma-->>API: Settings object
    API-->>Browser: JSON response

    Note over Browser,OpenMeteo: Fetch Weather
    Browser->>API: GET /api/weather
    API->>Prisma: Get coordinates from settings
    Prisma-->>API: lat, lon, city
    API->>OpenMeteo: GET forecast?lat=...&lon=...
    OpenMeteo-->>API: Weather data
    API-->>Browser: Formatted weather JSON

    Note over Browser,SQLite: Complete Chore
    Browser->>API: POST /api/chores/{id}/complete
    API->>Prisma: Create ChoreCompletion
    API->>Prisma: Create PointTransaction
    Prisma->>SQLite: INSERT INTO ChoreCompletion
    Prisma->>SQLite: INSERT INTO PointTransaction
    SQLite-->>Prisma: Success
    Prisma-->>API: Updated records
    API-->>Browser: Success response
```

---

## Photo Mode State Machine

State transitions for photo mode display logic.

```mermaid
stateDiagram-v2
    [*] --> CheckPhotoMode

    CheckPhotoMode --> PhotosDisabled: Photo Mode OFF
    CheckPhotoMode --> CheckTime: Photo Mode ON

    PhotosDisabled --> FullDashboard

    CheckTime --> NightMode: Hour < 6
    CheckTime --> DayMode: Hour >= 6

    NightMode --> PhotosOnly: Always photos at night

    DayMode --> CheckMinute

    CheckMinute --> FullDashboard: Minutes 25-35
    CheckMinute --> FullDashboard: Minutes 55-59
    CheckMinute --> FullDashboard: Minutes 0-5
    CheckMinute --> PhotoWithMini: Other minutes

    state FullDashboard {
        [*] --> ShowBackground
        ShowBackground --> ShowClock
        ShowClock --> ShowWidgets
        ShowWidgets --> RotateWidgets
        RotateWidgets --> RotateWidgets: Every N seconds
    }

    state PhotoWithMini {
        [*] --> LoadPhoto
        LoadPhoto --> KenBurnsEffect
        KenBurnsEffect --> ShowMiniDashboard
        ShowMiniDashboard --> NextPhoto: After interval
        NextPhoto --> LoadPhoto
    }

    state PhotosOnly {
        [*] --> LoadPhotoNight
        LoadPhotoNight --> KenBurnsNight
        KenBurnsNight --> NextPhotoNight: After interval
        NextPhotoNight --> LoadPhotoNight
    }
```

---

## API Request Flow

Detailed flow for API requests with authentication context.

```mermaid
flowchart TB
    subgraph CLIENT["Client Request"]
        REQ["HTTP Request"]
    end

    subgraph NEXTJS["Next.js Server"]
        ROUTER["App Router"]

        subgraph ROUTE_HANDLER["Route Handler"]
            PARSE["Parse Request"]
            VALIDATE["Validate Input"]
            PROCESS["Process Logic"]
            RESPOND["Build Response"]
        end
    end

    subgraph PRISMA_LAYER["Prisma Layer"]
        QUERY["Query Builder"]
        EXECUTE["Execute Query"]
    end

    subgraph DATABASE["Database"]
        SQLITE_DB[("SQLite")]
    end

    REQ -->|"GET/POST/PUT/DELETE"| ROUTER
    ROUTER -->|"Match route"| PARSE
    PARSE -->|"Extract body/params"| VALIDATE
    VALIDATE -->|"Check required fields"| PROCESS
    PROCESS -->|"Business logic"| QUERY
    QUERY -->|"Build SQL"| EXECUTE
    EXECUTE -->|"Run query"| SQLITE_DB
    SQLITE_DB -->|"Return rows"| EXECUTE
    EXECUTE -->|"Map to objects"| PROCESS
    PROCESS -->|"Format data"| RESPOND
    RESPOND -->|"JSON"| CLIENT

    VALIDATE -->|"Invalid"| ERROR["400 Bad Request"]
    PROCESS -->|"Not found"| NOTFOUND["404 Not Found"]
    EXECUTE -->|"DB Error"| SERVERERR["500 Server Error"]
```

---

## Deployment Architecture

Infrastructure diagram for Raspberry Pi deployment.

```mermaid
flowchart TB
    subgraph HARDWARE["Hardware Layer"]
        RPI5["Raspberry Pi 5<br/>4GB/8GB RAM"]
        SDCARD["MicroSD Card<br/>32GB+"]
        HDMI["HDMI Display"]
        NETWORK["Network<br/>WiFi/Ethernet"]
    end

    subgraph OS["Operating System"]
        RPIOS["Raspberry Pi OS<br/>64-bit"]

        subgraph SERVICES["System Services"]
            SYSTEMD_SVC["systemd"]
            LIGHTDM["LightDM<br/>Display Manager"]
            NETWORKD["Network Manager"]
        end
    end

    subgraph RUNTIME["Runtime Environment"]
        NODE["Node.js 18+"]
        NPM["npm 9+"]
    end

    subgraph APPLICATION["FamCal Application"]
        NEXTJS_APP["Next.js<br/>Production Build"]
        PRISMA_RT["Prisma Runtime"]
        SQLITE_FILE[("dev.db")]
    end

    subgraph DISPLAY["Display Layer"]
        CHROMIUM_KIOSK["Chromium Kiosk"]
        XSERVER["X Server"]
    end

    RPI5 --> SDCARD
    SDCARD --> RPIOS
    RPIOS --> SERVICES
    RPIOS --> RUNTIME
    RUNTIME --> APPLICATION
    SYSTEMD_SVC -->|"manages"| NEXTJS_APP
    LIGHTDM --> XSERVER
    XSERVER --> CHROMIUM_KIOSK
    CHROMIUM_KIOSK -->|"localhost:3000"| NEXTJS_APP
    RPI5 --> HDMI
    HDMI --> DISPLAY
    RPI5 --> NETWORK
```

---

## Animation System

Widget carousel animation flow.

```mermaid
flowchart LR
    subgraph TRIGGER["Trigger"]
        TIMER["Rotation Timer"]
        CLICK["User Click"]
    end

    subgraph ANIMATION["Animation Engine"]
        SELECT["Select Preset"]

        subgraph PRESETS["Animation Presets"]
            P1["arrivingTogether"]
            P2["bouncyBall"]
            P3["peekaBoo"]
            P4["rocketLaunch"]
            P5["...12 more"]
        end

        FRAMER["Framer Motion"]
    end

    subgraph OUTPUT["Output"]
        EXIT_ANIM["Exit Animation<br/>(outgoing widget)"]
        ENTER_ANIM["Enter Animation<br/>(incoming widget)"]
    end

    TIMER -->|"interval elapsed"| SELECT
    CLICK -->|"dot clicked"| SELECT
    SELECT --> PRESETS
    PRESETS -->|"get variants"| FRAMER
    FRAMER --> EXIT_ANIM
    FRAMER --> ENTER_ANIM
```

---

## Weather Data Flow

Weather fetching and display pipeline.

```mermaid
flowchart TB
    subgraph SETTINGS["Settings"]
        LAT["Latitude"]
        LON["Longitude"]
        CITY["City Name"]
    end

    subgraph API_CALL["API Call"]
        BUILD_URL["Build Open-Meteo URL"]
        FETCH["Fetch Weather Data"]
        CACHE["Cache 10 minutes"]
    end

    subgraph TRANSFORM["Transform"]
        PARSE_WEATHER["Parse Response"]
        MAP_CODE["Map Weather Code<br/>to Icon"]
        CALC_COLOR["Calculate Temp Color"]
    end

    subgraph DISPLAY["Display"]
        ICON["Weather Icon"]
        TEMP["Temperature"]
        CITY_NAME["City Name"]
        HILO["High / Low"]
    end

    SETTINGS --> BUILD_URL
    BUILD_URL --> FETCH
    FETCH --> CACHE
    CACHE --> PARSE_WEATHER
    PARSE_WEATHER --> MAP_CODE
    PARSE_WEATHER --> CALC_COLOR
    MAP_CODE --> ICON
    CALC_COLOR --> TEMP
    CITY --> CITY_NAME
    PARSE_WEATHER --> HILO
```

---

## Points & Rewards Flow

Complete points lifecycle.

```mermaid
flowchart TB
    subgraph EARN["Earning Points"]
        CHORE_COMPLETE["Complete Chore"]
        HABIT_COMPLETE["Complete Habit"]
        BONUS["Bonus Award"]
    end

    subgraph LEDGER["Points Ledger"]
        TRANSACTION["PointTransaction"]
        BALANCE["Calculate Balance<br/>SUM(amount)"]
    end

    subgraph REDEEM["Redemption"]
        REQUEST["Request Reward"]
        PENDING["Pending Approval"]

        subgraph APPROVAL["Parent Decision"]
            APPROVE["Approve"]
            DENY["Deny"]
        end
    end

    subgraph RESULT["Result"]
        DEDUCT["Deduct Points"]
        FULFILL["Fulfill Reward"]
        REJECT["Keep Points"]
    end

    CHORE_COMPLETE -->|"+points"| TRANSACTION
    HABIT_COMPLETE -->|"+points"| TRANSACTION
    BONUS -->|"+points"| TRANSACTION
    TRANSACTION --> BALANCE
    BALANCE -->|"sufficient"| REQUEST
    REQUEST --> PENDING
    PENDING --> APPROVAL
    APPROVE --> DEDUCT
    DEDUCT -->|"-points"| TRANSACTION
    DEDUCT --> FULFILL
    DENY --> REJECT
```

---

## Viewing These Diagrams

### On GitHub
GitHub automatically renders Mermaid diagrams in markdown files.

### Local Viewing
1. **VS Code**: Install "Markdown Preview Mermaid Support" extension
2. **Browser**: Use [Mermaid Live Editor](https://mermaid.live)
3. **CLI**: Use `mmdc` (Mermaid CLI) to export as PNG/SVG

### Export to Images
```bash
npm install -g @mermaid-js/mermaid-cli
mmdc -i ARCHITECTURE-DIAGRAMS.md -o diagrams/
```
