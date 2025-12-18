# FamCal Deployment Guide

Complete step-by-step instructions for deploying FamCal on a Raspberry Pi 5.

## Table of Contents

1. [What You'll Need](#what-youll-need)
2. [Preparing Your Raspberry Pi](#preparing-your-raspberry-pi)
3. [Installing FamCal](#installing-famcal)
4. [Setting Up Auto-Start](#setting-up-auto-start)
5. [Setting Up Kiosk Mode](#setting-up-kiosk-mode)
6. [Configuring Your Dashboard](#configuring-your-dashboard)
7. [Adding Family Photos](#adding-family-photos)
8. [Troubleshooting](#troubleshooting)

---

## What You'll Need

### Hardware
| Item | Recommendation | Notes |
|------|---------------|-------|
| Raspberry Pi 5 | 4GB or 8GB model | 8GB recommended for smooth animations |
| MicroSD Card | 32GB+ Class 10 | Faster cards improve performance |
| Power Supply | Official Pi 5 27W USB-C | Must be 5V/5A for Pi 5 |
| HDMI Cable | Micro-HDMI to HDMI | Pi 5 uses micro-HDMI |
| Display | Any TV or monitor | 1080p or higher recommended |
| Keyboard/Mouse | Any USB or Bluetooth | Only needed for initial setup |

### Software (we'll install these)
- Raspberry Pi OS (64-bit)
- Node.js 18+
- Git

---

## Preparing Your Raspberry Pi

### Step 1: Install Raspberry Pi OS

1. Download [Raspberry Pi Imager](https://www.raspberrypi.com/software/) on your computer
2. Insert your microSD card into your computer
3. Open Raspberry Pi Imager and:
   - Choose **Raspberry Pi 5** as the device
   - Choose **Raspberry Pi OS (64-bit)** as the operating system
   - Choose your microSD card as storage
4. Click the **gear icon** (⚙️) for advanced options:
   - Set hostname: `famcal`
   - Enable SSH (for remote access)
   - Set username: `pi`
   - Set a password you'll remember
   - Configure WiFi (enter your network name and password)
   - Set timezone
5. Click **Write** and wait for completion

### Step 2: First Boot

1. Insert the microSD card into your Raspberry Pi
2. Connect HDMI, keyboard, and mouse
3. Connect power - the Pi will boot automatically
4. Wait for the desktop to appear (first boot takes a few minutes)

### Step 3: Install Node.js

Open a terminal (click the terminal icon in the top bar) and run:

```bash
# Update your system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

---

## Installing FamCal

### Step 4: Download FamCal

```bash
# Go to your home directory
cd ~

# Clone the repository
git clone https://github.com/Valencia94303/famcal.git

# Enter the project folder
cd famcal
```

### Step 5: Install Dependencies

```bash
# Install all required packages (this takes a few minutes)
npm install
```

### Step 6: Build the Application

```bash
# Create the production build
npm run build
```

### Step 7: Initialize the Database

```bash
# Set up the database
npx prisma db push
```

### Step 8: Test the Application

```bash
# Start FamCal
npm run start
```

Open Chromium browser and go to `http://localhost:3000`

You should see the FamCal dashboard! Press `Ctrl+C` in the terminal to stop for now.

---

## Setting Up Auto-Start

This makes FamCal start automatically when your Pi boots.

### Step 9: Run the Auto-Start Setup

```bash
# Make sure you're in the famcal directory
cd ~/famcal

# Run the setup script
sudo ./scripts/setup-autostart.sh
```

You'll see confirmation that the service is installed and running.

### Verify It's Working

```bash
# Check the service status
sudo systemctl status famcal
```

You should see "active (running)" in green.

### Useful Commands

| Command | What It Does |
|---------|--------------|
| `sudo systemctl status famcal` | Check if FamCal is running |
| `sudo systemctl restart famcal` | Restart FamCal |
| `sudo systemctl stop famcal` | Stop FamCal |
| `sudo systemctl start famcal` | Start FamCal |
| `sudo journalctl -u famcal -f` | View live logs |

---

## Setting Up Kiosk Mode

Kiosk mode makes your Pi display FamCal fullscreen automatically, with no desktop or browser controls visible.

### Step 10: Run the Kiosk Setup

```bash
# Run the kiosk setup script
sudo ./scripts/setup-kiosk.sh
```

### Step 11: Reboot

```bash
sudo reboot
```

After rebooting:
- FamCal will start automatically
- Chromium will open in fullscreen
- The screen will never go to sleep

---

## Configuring Your Dashboard

### Accessing the Admin Panel

From any device on your network, open a browser and go to:

```
http://famcal.local:3000/manage
```

Or use your Pi's IP address:
```
http://[PI-IP-ADDRESS]:3000/manage
```

To find your Pi's IP address:
```bash
hostname -I
```

### Initial Setup Checklist

1. **Add Family Members**
   - Go to the "Family" tab
   - Add each family member with their name and color

2. **Set Up Weather**
   - Go to "Settings" tab
   - Set Header Display to "Weather Only" or "Alternate"
   - Enter your location coordinates (get from Google Maps)
   - Enter your location name

3. **Enable Photo Mode** (optional)
   - Go to "Settings" tab
   - Toggle "Enable Photo Mode" on
   - Set photo folder path (default: `/home/pi/famcal-photos`)

4. **Add Chores**
   - Go to "Chores" tab
   - Add daily/weekly chores
   - Assign point values
   - Assign to family members

5. **Set Up Rewards**
   - Go to "Rewards" tab
   - Add rewards kids can redeem points for

---

## Adding Family Photos

Photos display in Photo Mode with a beautiful Ken Burns effect.

### Step 12: Create Photo Folder

```bash
mkdir -p ~/famcal-photos
```

### Step 13: Add Photos

**Option A: Copy from USB drive**
```bash
# Insert USB drive, then:
cp /media/pi/YOUR_USB_NAME/*.jpg ~/famcal-photos/
```

**Option B: Transfer from your computer (via SFTP)**

Using an SFTP client like FileZilla or Cyberduck:
- Host: `famcal.local` or your Pi's IP
- Username: `pi`
- Password: your password
- Upload to: `/home/pi/famcal-photos/`

**Option C: Transfer via command line (from your Mac/PC)**
```bash
scp ~/Pictures/family/*.jpg pi@famcal.local:~/famcal-photos/
```

### Supported Formats
- JPG / JPEG
- PNG
- WebP

---

## Troubleshooting

### Dashboard won't load

```bash
# Check if the service is running
sudo systemctl status famcal

# View error logs
sudo journalctl -u famcal -n 50

# Restart the service
sudo systemctl restart famcal
```

### Black screen after boot

```bash
# Connect via SSH from another computer
ssh pi@famcal.local

# Check service status
sudo systemctl status famcal

# Restart display manager
sudo systemctl restart lightdm
```

### Weather not showing

1. Go to `/manage` → Settings
2. Make sure Header Display is set to "Weather Only" or "Alternate"
3. Verify coordinates are entered correctly
4. Check internet connection: `ping google.com`

### Photos not displaying

1. Verify photos exist: `ls ~/famcal-photos/`
2. Check file permissions: `chmod 644 ~/famcal-photos/*`
3. Verify Photo Mode is enabled in Settings
4. Check the photo path in Settings matches your folder

### Screen going to sleep

```bash
# Re-run kiosk setup
sudo ./scripts/setup-kiosk.sh
sudo reboot
```

### How to update FamCal

```bash
cd ~/famcal
git pull origin main
npm install
npm run build
sudo systemctl restart famcal
```

---

## Network Access

Once running, you can access FamCal from any device on your network:

| Access Point | URL |
|--------------|-----|
| Dashboard | `http://famcal.local:3000` |
| Admin Panel | `http://famcal.local:3000/manage` |

If `famcal.local` doesn't work, use your Pi's IP address instead.

---

## Getting Help

- Check the [Troubleshooting](#troubleshooting) section above
- [Open an Issue](https://github.com/Valencia94303/famcal/issues) on GitHub
- Include error logs when reporting issues

---

**Congratulations!** Your FamCal dashboard is now running. Enjoy your new family command center!
