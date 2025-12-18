# FamCal - Family Dashboard

A beautiful, animated family dashboard designed for always-on displays like TVs or tablets. Built with Next.js 15 and optimized for Raspberry Pi deployment.

![FamCal Dashboard](docs/images/dashboard-preview.png)

## Features

- **Dynamic Photo Mode** - Ken Burns effect slideshow with mini dashboard overlay
- **Animated Widget Carousel** - 14 playful animation styles for widget transitions
- **Weather Display** - Real-time weather with temperature-based color coding
- **Family Management** - Track family members, assign chores, manage points
- **Habit Tracking** - Daily habits with point rewards for kids
- **Task Management** - Quick tasks with priority and due dates
- **Shopping Lists** - Organized by store (Costco, Walmart, Target, etc.)
- **Daily Schedule** - Time-based routine display
- **Points & Rewards** - Gamified chore system with redeemable rewards
- **Theme System** - Auto-adjusting colors based on time of day

## Quick Start

### For Home Users

See the [Raspberry Pi Deployment Guide](docs/DEPLOYMENT.md) for complete setup instructions.

**Quick Install:**
```bash
# On your Raspberry Pi 5
git clone https://github.com/Valencia94303/famcal.git
cd famcal
npm install
npm run build
sudo ./scripts/setup-autostart.sh
sudo ./scripts/setup-kiosk.sh
sudo reboot
```

### For Developers

```bash
git clone https://github.com/Valencia94303/famcal.git
cd famcal
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the dashboard and [http://localhost:3000/manage](http://localhost:3000/manage) for the admin panel.

## Documentation

| Document | Description |
|----------|-------------|
| [Deployment Guide](docs/DEPLOYMENT.md) | Step-by-step Raspberry Pi 5 setup |
| [Architecture](docs/ARCHITECTURE.md) | Technical architecture and system design |
| [Configuration](docs/CONFIGURATION.md) | Settings and customization options |

## System Requirements

### Recommended Hardware
- **Raspberry Pi 5** (4GB+ RAM recommended)
- MicroSD card (32GB+ recommended)
- HDMI display (TV, monitor, or tablet)
- Stable internet connection (for weather data)

### Software Requirements
- Raspberry Pi OS (64-bit recommended)
- Node.js 18+
- npm 9+

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      FamCal Dashboard                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Display   │  │   Admin     │  │     API Layer       │  │
│  │  (Next.js)  │  │   Panel     │  │   (API Routes)      │  │
│  │             │  │  /manage    │  │                     │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│         └────────────────┼─────────────────────┘             │
│                          │                                   │
│                   ┌──────┴──────┐                            │
│                   │   Prisma    │                            │
│                   │    ORM      │                            │
│                   └──────┬──────┘                            │
│                          │                                   │
│                   ┌──────┴──────┐                            │
│                   │   SQLite    │                            │
│                   │  Database   │                            │
│                   └─────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

## Screenshots

### Dashboard View
The main display showing clock/weather, animated widget carousel, and dynamic backgrounds.

### Photo Mode
Full-screen photo slideshow with Ken Burns effect and mini dashboard overlay.

### Admin Panel
Mobile-friendly management interface for family, chores, rewards, and settings.

## License

MIT License - Feel free to use and modify for your family!

## Support

- [Open an Issue](https://github.com/Valencia94303/famcal/issues) for bugs or feature requests
- Pull requests welcome!

---

Built with Next.js, Prisma, Framer Motion, and Tailwind CSS.
