#!/bin/bash
# Security Setup Script for Presale Savitri Node
# Run this script to set up basic firewall rules

set -e

echo "=========================================="
echo "Security Setup Script"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Install UFW if not installed
if ! command -v ufw &> /dev/null; then
    echo "Installing UFW firewall..."
    apt update
    apt install -y ufw
fi

# Set default policies
echo "Setting default firewall policies..."
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (IMPORTANT - do this first!)
echo "Allowing SSH (port 22)..."
ufw allow 22/tcp

# Allow HTTP and HTTPS
echo "Allowing HTTP (port 80)..."
ufw allow 80/tcp
echo "Allowing HTTPS (port 443)..."
ufw allow 443/tcp

# Show what will be configured
echo ""
echo "=========================================="
echo "Firewall Rules to be Applied:"
echo "=========================================="
ufw show added
echo ""

# Ask for confirmation
read -p "Do you want to enable the firewall now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Enabling firewall..."
    ufw --force enable
    echo ""
    echo "=========================================="
    echo "Firewall Status:"
    echo "=========================================="
    ufw status verbose
    echo ""
    echo "✅ Firewall enabled successfully!"
    echo ""
    echo "⚠️  IMPORTANT: Make sure you can still SSH to this server!"
    echo "   If you get locked out, you may need to access via console."
else
    echo "Firewall configuration prepared but not enabled."
    echo "To enable later, run: sudo ufw enable"
fi

echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo "1. Restart MongoDB container to apply port binding changes:"
echo "   cd /home/ubuntu/Presale_savitri_node/Presale_savitri_node"
echo "   docker-compose down"
echo "   docker-compose up -d"
echo ""
echo "2. Verify MongoDB is only accessible from localhost:"
echo "   sudo netstat -tulpn | grep 27017"
echo "   (Should show 127.0.0.1:27017, not 0.0.0.0:27017)"
echo ""
echo "3. Review SECURITY.md for additional security recommendations"
echo ""

