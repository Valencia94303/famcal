# FamCal Android Companion App

A native Android companion app for the FamCal Family Dashboard, built with Kotlin and Jetpack Compose.

## Overview

FamCal Android connects to your existing FamCal server via local network or VPN, providing full access to all dashboard features from your Android device.

## Features

### For Everyone
- **Dashboard** - Quick overview with weather, calendar events, today's chores
- **Chores** - View assigned chores, mark as complete, earn points
- **Habits** - Track daily habits with one-tap logging
- **Rewards** - Browse reward catalog, request redemptions
- **Points** - View balance and transaction history
- **Tasks** - Manage quick to-do items
- **Shopping** - Shared shopping list organized by store
- **Schedule** - Daily routine and activity times
- **Calendar** - View Google Calendar events

### Parent Features (Admin)
- **Family Management** - Add/edit family members, assign roles
- **Chore Management** - Create chores, set points, assign to members
- **Habit Management** - Create habits with point values
- **Reward Management** - Create rewards, set point costs
- **Redemption Approval** - Approve or deny reward requests
- **Points Control** - Award bonus points to children
- **Settings** - Configure display, weather, screensaver
- **Backups** - Create and restore data backups
- **Audit Log** - View security and activity logs

## Requirements

- Android 8.0 (API 26) or higher
- FamCal server running on local network or accessible via VPN
- Network access to the FamCal server

## Quick Start

1. **Install the app** on your Android device
2. **Connect to your network** (same network as FamCal server or via VPN)
3. **Enter server address** (e.g., `192.168.1.100:3000`)
4. **Authenticate with PIN** (same PIN as web dashboard)
5. **Select your profile** (choose your family member)
6. **Start using FamCal!**

## Connection Options

### Local Network
Connect your Android device to the same WiFi network as your FamCal server (e.g., Raspberry Pi).

```
Server Address: 192.168.1.100:3000
```

### VPN Access
Enable your home VPN to access FamCal from anywhere.

```
Server Address: 192.168.1.100:3000
(while connected to home VPN)
```

## Roles & Permissions

### PARENT Role
- Full access to all features
- Can create, edit, delete all items
- Can approve/deny reward redemptions
- Can award bonus points
- Can view audit logs
- Can manage backups and settings

### CHILD Role
- View assigned chores and complete them
- Log daily habits
- View own points balance
- Request reward redemptions
- Check off shopping items
- Complete tasks

## Tech Stack

| Component | Technology |
|-----------|------------|
| Language | Kotlin 1.9+ |
| UI Framework | Jetpack Compose |
| Design System | Material 3 |
| Architecture | MVVM + Clean Architecture |
| Dependency Injection | Hilt |
| Networking | Retrofit + OkHttp |
| JSON Parsing | Moshi |
| Async Operations | Kotlin Coroutines + Flow |
| Navigation | Navigation Compose |
| Image Loading | Coil |

## Project Structure

```
famcal-android/
├── app/src/main/java/com/famcal/android/
│   ├── core/           # DI, network, utilities, theme
│   ├── domain/         # Models, repositories, use cases
│   ├── data/           # API DTOs, repository implementations
│   └── feature/        # UI screens organized by feature
├── docs/               # Documentation
└── build.gradle.kts    # Build configuration
```

## Documentation

- [Architecture Guide](ARCHITECTURE.md) - MVVM + Clean Architecture details
- [API Integration](API-INTEGRATION.md) - Complete API reference
- [Development Setup](SETUP.md) - Environment setup and building

## Version History

### v1.0 (Planned)
- Full dashboard feature parity with web
- Online-only operation (no offline sync)
- PIN-based authentication
- Role-based access control

### Future Considerations
- Offline mode with sync
- Push notifications
- Widgets for home screen
- Wear OS companion

## License

This project is part of the FamCal family dashboard system.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.
