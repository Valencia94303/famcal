# FamCal Configuration Guide

Complete reference for all FamCal settings and customization options.

## Table of Contents

1. [Accessing Settings](#accessing-settings)
2. [Dashboard Display](#dashboard-display)
3. [Header Display](#header-display)
4. [Weather Configuration](#weather-configuration)
5. [Photo Mode](#photo-mode)
6. [Family Management](#family-management)
7. [Points & Rewards](#points--rewards)
8. [Environment Variables](#environment-variables)

---

## Accessing Settings

### Admin Panel URL
```
http://[PI-IP]:3000/manage
```

Navigate to the **Settings** tab in the bottom navigation.

### Settings Persistence
All settings are stored in the SQLite database and persist across restarts.

---

## Dashboard Display

### Widget Rotation Interval

Controls how often the widget carousel rotates to the next widget.

| Option | Description |
|--------|-------------|
| 10 seconds | Fast rotation |
| 15 seconds | Quick glance |
| 20 seconds | Moderate |
| **30 seconds** | Default, balanced |
| 45 seconds | Slower rotation |
| 1 minute | Relaxed viewing |
| 2 minutes | Extended viewing |
| 5 minutes | Minimal rotation |

**Recommendation**: 30-60 seconds for most households.

### Animation Style

Controls how widgets animate when transitioning.

| Animation | Description | Best For |
|-----------|-------------|----------|
| Arriving Together | Widgets slide in from opposite sides | Playful, energetic |
| Racing Friends | Both race from same direction | Fun, competitive |
| Bouncy Ball | Drop and bounce effect | Kids love it |
| Peek-a-Boo | Pop from center | Surprising |
| Airplane Landing | Swoop from above | Smooth, elegant |
| Silly Spin | Rotate while entering | Whimsical |
| Trampoline Jump | Bounce up from below | Energetic |
| Crash & Recover | Collide then settle | Dramatic |
| Jelly Wobble | Wobbly entrance | Playful |
| Rocket Launch | Blast from below | Exciting |
| Swing In | Pendulum motion | Classic |
| Tumble In | Roll from sides | Dynamic |
| Balloon Float | Gentle rise | Calm, peaceful |
| **Surprise Me!** | Cycles through all | Variety |

---

## Header Display

Controls what shows in the top-left corner of the dashboard.

### Display Mode

| Mode | Behavior |
|------|----------|
| Clock Only | Always shows time and date |
| Weather Only | Always shows weather |
| **Alternate** | Switches between clock and weather |

### Switch Interval (Alternate Mode)

When using "Alternate" mode, controls how often it switches.

- **Range**: 10-60 seconds
- **Default**: 30 seconds
- **Recommendation**: 20-30 seconds

---

## Weather Configuration

### Getting Your Coordinates

1. Open [Google Maps](https://maps.google.com)
2. Right-click on your location
3. Click the coordinates to copy them
4. Format: `latitude, longitude` (e.g., `38.0417, -121.3641`)

### Settings

| Field | Description | Example |
|-------|-------------|---------|
| Location Name | Displayed name | `Sherwoods Manor` |
| Latitude | North/South position | `38.0417` |
| Longitude | East/West position | `-121.3641` |

### Weather Data Source

FamCal uses [Open-Meteo](https://open-meteo.com), a free weather API:
- No API key required
- Updates every 10 minutes
- Includes: temperature, conditions, high/low

### Temperature Display

Temperature colors automatically adjust based on the temperature:

| Temperature | Color |
|-------------|-------|
| ≤ 20°F | Blue (freezing) |
| 21-32°F | Cyan (very cold) |
| 33-50°F | Light cyan (cold) |
| 51-60°F | Green (cool) |
| 61-70°F | Lime (comfortable) |
| 71-80°F | Yellow (warm) |
| 81-90°F | Orange (hot) |
| > 90°F | Red (very hot) |

---

## Photo Mode

Photo Mode displays your family photos as a beautiful slideshow with the dashboard overlaid.

### How It Works

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│   PHOTO MODE SCHEDULE                                  │
│                                                        │
│   12 AM ─────────────────────────────────── 6 AM      │
│          │ Photos Only (no interruptions) │           │
│                                                        │
│   6 AM ──────────────────────────────────── 12 AM     │
│          │ Photos + Dashboard Interruptions│          │
│          │                                 │          │
│          │  :00-:05  → Full Dashboard     │          │
│          │  :06-:24  → Photos + Mini Dash │          │
│          │  :25-:35  → Full Dashboard     │          │
│          │  :36-:54  → Photos + Mini Dash │          │
│          │  :55-:59  → Full Dashboard     │          │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Enable Photo Mode | Turn feature on/off | Off |
| Photo Folder Path | Where photos are stored | `/home/pi/famcal-photos` |
| Photo Duration | Seconds per photo | 15 seconds |

### Photo Folder Setup

```bash
# Create the photo folder
mkdir -p /home/pi/famcal-photos

# Set permissions
chmod 755 /home/pi/famcal-photos
```

### Supported Image Formats

| Format | Extension |
|--------|-----------|
| JPEG | `.jpg`, `.jpeg` |
| PNG | `.png` |
| WebP | `.webp` |

### Recommended Photo Specs

| Spec | Recommendation |
|------|----------------|
| Resolution | 1920x1080 (1080p) |
| Aspect Ratio | 16:9 (matches most TVs) |
| File Size | Under 2MB |
| Orientation | Landscape preferred |

### Ken Burns Effect

Photos display with automatic Ken Burns effect:
- Slow pan across the image
- Gentle zoom in/out
- Smooth crossfade between photos

### Mini Dashboard

While photos display, a mini dashboard shows in a random corner:
- Scaled to 40% of screen width
- Semi-transparent background
- Shows full dashboard content
- Corner selected randomly on page load

---

## Family Management

### Adding Family Members

1. Go to Admin Panel → Family tab
2. Click "+ Add"
3. Enter name
4. Select color (for visual identification)
5. Choose role: Parent or Child

### Member Colors

15 color options available:
- Used in chore assignments
- Point displays
- Avatar backgrounds

### Roles

| Role | Purpose |
|------|---------|
| Parent | Can approve reward redemptions |
| Child | Can request rewards, earn points |

---

## Points & Rewards

### How Points Work

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Complete  │────▶│    Earn     │────▶│   Redeem    │
│    Chore    │     │   Points    │     │   Rewards   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Complete   │     │   Bonus     │     │   Parent    │
│   Habit     │────▶│   Points    │     │  Approval   │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Point Sources

| Source | Description |
|--------|-------------|
| Chore Completion | Points defined per chore |
| Habit Completion | Points defined per habit |
| Bonus Points | Manual award by parents |

### Creating Rewards

1. Go to Admin Panel → Rewards tab
2. Click "+ Add Reward"
3. Enter name and description
4. Set point cost
5. Optionally: mark as cash reward with dollar value

### Redemption Flow

1. Child requests reward (from Points display)
2. Request appears in admin panel
3. Parent approves or denies
4. Points deducted on approval

---

## Environment Variables

FamCal uses minimal environment configuration.

### Required: Database URL

Create `.env` file in project root:

```env
DATABASE_URL="file:./prisma/dev.db"
```

### Optional: Custom Port

```env
PORT=3000
```

### Production Settings

```env
NODE_ENV=production
```

---

## Database Backup

### Manual Backup

```bash
cp ~/famcal/prisma/dev.db ~/backups/famcal-$(date +%Y%m%d).db
```

### Automated Daily Backup

Add to crontab (`crontab -e`):

```cron
0 3 * * * cp /home/pi/famcal/prisma/dev.db /home/pi/backups/famcal-$(date +\%Y\%m\%d).db
```

### Restore from Backup

```bash
# Stop the service
sudo systemctl stop famcal

# Restore
cp ~/backups/famcal-20240101.db ~/famcal/prisma/dev.db

# Restart
sudo systemctl start famcal
```

---

## Customization Tips

### Best Practices

1. **Start Simple**: Enable features gradually
2. **Test Settings**: Make changes and observe on the display
3. **Photo Quality**: Use well-lit, high-resolution photos
4. **Point Values**: Keep chore points proportional to effort
5. **Reward Costs**: Make rewards achievable but meaningful

### Household Scenarios

**Young Kids (5-10)**
- Shorter carousel interval (15-20s)
- Fun animations (Bouncy Ball, Trampoline)
- Simple chores, small point values
- Low-cost rewards

**Tweens/Teens**
- Longer carousel interval (45-60s)
- Subtle animations (Balloon Float, Swing In)
- More complex chores, higher points
- Meaningful rewards (screen time, privileges)

**Mixed Ages**
- Use "Surprise Me!" animation cycle
- Varied chore difficulty and point values
- Tiered reward system

---

## Troubleshooting Settings

### Settings Not Saving

1. Check browser console for errors
2. Verify database permissions:
   ```bash
   chmod 644 ~/famcal/prisma/dev.db
   ```
3. Restart the service:
   ```bash
   sudo systemctl restart famcal
   ```

### Weather Not Working

1. Verify coordinates are correct
2. Check internet connection
3. View logs:
   ```bash
   sudo journalctl -u famcal | grep weather
   ```

### Photos Not Displaying

1. Verify path in settings matches actual folder
2. Check folder permissions:
   ```bash
   ls -la /home/pi/famcal-photos/
   ```
3. Verify supported file formats
4. Check file permissions:
   ```bash
   chmod 644 /home/pi/famcal-photos/*
   ```
