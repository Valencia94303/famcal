#!/bin/bash

# FamCal Kiosk Mode Setup for Raspberry Pi
# This sets up Chromium to auto-start in fullscreen kiosk mode

set -e

echo "=== FamCal Kiosk Mode Setup ==="

# Get the actual user
ACTUAL_USER=${SUDO_USER:-$USER}
AUTOSTART_DIR="/home/$ACTUAL_USER/.config/autostart"

# Create autostart directory if it doesn't exist
mkdir -p "$AUTOSTART_DIR"

# Create autostart entry for Chromium kiosk
cat > "$AUTOSTART_DIR/famcal-kiosk.desktop" << 'EOF'
[Desktop Entry]
Type=Application
Name=FamCal Kiosk
Exec=/usr/bin/chromium-browser --kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble --disable-restore-session-state http://localhost:3000
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF

# Disable screen blanking/screensaver
if [ -f /etc/xdg/lxsession/LXDE-pi/autostart ]; then
    # Remove existing screen saver settings
    sed -i '/screensaver/d' /etc/xdg/lxsession/LXDE-pi/autostart
    sed -i '/xset/d' /etc/xdg/lxsession/LXDE-pi/autostart

    # Add settings to disable screen blanking
    echo "@xset s off" >> /etc/xdg/lxsession/LXDE-pi/autostart
    echo "@xset -dpms" >> /etc/xdg/lxsession/LXDE-pi/autostart
    echo "@xset s noblank" >> /etc/xdg/lxsession/LXDE-pi/autostart
fi

# Also set via lightdm config if available
if [ -d /etc/lightdm ]; then
    cat > /etc/lightdm/lightdm.conf.d/50-disable-blanking.conf << 'EOF'
[SeatDefaults]
xserver-command=X -s 0 -dpms
EOF
fi

echo ""
echo "=== Kiosk Setup Complete ==="
echo ""
echo "On next reboot:"
echo "  1. FamCal service will start automatically"
echo "  2. Chromium will open in fullscreen kiosk mode"
echo "  3. Screen will not blank or go to sleep"
echo ""
echo "To test now, run:"
echo "  chromium-browser --kiosk http://localhost:3000"
echo ""
echo "Reboot to apply all changes: sudo reboot"
