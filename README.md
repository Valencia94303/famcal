# FamCal - Family Dashboard

A beautiful, animated family dashboard designed for always-on displays like TVs or tablets. Built with Next.js 15 and optimized for Raspberry Pi deployment.

![FamCal Dashboard](docs/images/dashboard-preview.png)

## Features

### Dashboard & Display
- **Dynamic Photo Mode** - Ken Burns effect slideshow with mini dashboard overlay
- **Animated Widget Carousel** - 14 playful animation styles for widget transitions
- **Weather Display** - Real-time weather with temperature-based color coding
- **Theme System** - Auto-adjusting colors based on time of day

### Family & Chore Management
- **Family Management** - Track family members with avatars and colors
- **Habit Tracking** - Daily habits with point rewards for kids
- **Task Management** - Quick tasks with priority and due dates
- **Daily Schedule** - Time-based routine display
- **Points & Rewards** - Gamified chore system with redeemable rewards

### Meal Planning System (NEW)
- **Recipe Database** - 21+ recipes with ingredients, instructions, and nutrition info
- **4-Week Rotating Meal Plan** - Pre-planned dinners with per-person dietary adaptations
- **Recipe Ratings** - 1-5 star family ratings with "would make again" tracking
- **Per-Member Variations** - Dad's low-carb, Mom's no-spinach, kid-friendly versions
- **Auto Shopping Lists** - Generate shopping lists from meal plan ingredients

### Shopping & Stores
- **Smart Shopping Lists** - Combines meal plan ingredients with manual items
- **Store Prioritization** - Items mapped to preferred stores (Costco, Walmart, Target, Rancho San Miguel, Shun Fat)
- **Visual Grouping** - Dashboard widget groups by store with icons

### NFC Card & POS System (NEW)
- **NFC Card Registration** - Assign NFC cards to family members
- **Point of Sale Interface** - Kids tap card to view balance, earn/spend points
- **QR Code Generation** - Scannable QR codes for card URLs
- **Member Portal** - Kid-friendly portal for chores, rewards, and meal ratings

### Security
- **PIN Authentication** - 4-digit PIN protects admin panel
- **Public Dashboard** - Dashboard widgets accessible without auth
- **Session Cookies** - Secure session management

## Quick Start

### For Home Users

See the [Raspberry Pi Deployment Guide](docs/DEPLOYMENT.md) for complete setup instructions.

**Quick Install:**
```bash
# On your Raspberry Pi 5

# 1. Install Node.js 20+ (required)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs chromium

# 2. Clone and build
git clone https://github.com/Valencia94303/famcal.git
cd ~/famcal
echo 'DATABASE_URL="file:./dev.db"' > .env
npm install
npx prisma db push
npm run build

# 3. Setup auto-start
sudo ./scripts/setup-autostart.sh

# 4. Setup kiosk mode (see docs/DEPLOYMENT.md for full steps)
sudo raspi-config   # Enable Desktop Autologin
mkdir -p ~/.config/autostart
cat << 'EOF' > ~/.config/autostart/famcal.desktop
[Desktop Entry]
Type=Application
Name=FamCal Kiosk
Exec=sh -c 'sleep 10 && chromium --kiosk --noerrdialogs --disable-infobars http://localhost:3000'
X-GNOME-Autostart-enabled=true
EOF

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
| [Architecture Diagrams](docs/ARCHITECTURE-DIAGRAMS.md) | Interactive Mermaid JS diagrams |
| [Configuration](docs/CONFIGURATION.md) | Settings and customization options |

## System Requirements

### Recommended Hardware
- **Raspberry Pi 5** (4GB+ RAM recommended)
- MicroSD card (32GB+ recommended)
- HDMI display (TV, monitor, or tablet)
- Stable internet connection (for weather data)

### Software Requirements
- Raspberry Pi OS (64-bit, Bookworm or later)
- Node.js 20+ (required - Node 18 will NOT work)
- npm 10+
- Chromium browser

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
