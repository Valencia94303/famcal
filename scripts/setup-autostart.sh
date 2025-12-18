#!/bin/bash

# FamCal Auto-Start Setup Script for Raspberry Pi
# Run this script after cloning the repository

set -e

echo "=== FamCal Auto-Start Setup ==="

# Check if running as root for service installation
if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo: sudo ./scripts/setup-autostart.sh"
    exit 1
fi

# Get the actual user (not root)
ACTUAL_USER=${SUDO_USER:-pi}
INSTALL_DIR="/home/$ACTUAL_USER/famcal"

echo "Installing for user: $ACTUAL_USER"
echo "Install directory: $INSTALL_DIR"

# Update service file with correct paths
sed -i "s|User=pi|User=$ACTUAL_USER|g" "$INSTALL_DIR/scripts/famcal.service"
sed -i "s|/home/pi/famcal|$INSTALL_DIR|g" "$INSTALL_DIR/scripts/famcal.service"

# Copy service file to systemd
cp "$INSTALL_DIR/scripts/famcal.service" /etc/systemd/system/

# Reload systemd
systemctl daemon-reload

# Enable service to start on boot
systemctl enable famcal

# Start the service now
systemctl start famcal

echo ""
echo "=== Setup Complete ==="
echo ""
echo "FamCal is now running and will auto-start on boot."
echo ""
echo "Useful commands:"
echo "  sudo systemctl status famcal   - Check status"
echo "  sudo systemctl restart famcal  - Restart service"
echo "  sudo systemctl stop famcal     - Stop service"
echo "  sudo journalctl -u famcal -f   - View logs"
echo ""
echo "Access dashboard at: http://localhost:3000"
echo "Access from other devices at: http://$(hostname -I | awk '{print $1}'):3000"
