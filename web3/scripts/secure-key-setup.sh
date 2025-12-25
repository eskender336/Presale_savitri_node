#!/bin/bash
# scripts/secure-key-setup.sh
# Secure private key management setup
#
# This script helps move the private key from .env to a secure location
# and sets up proper file permissions.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB3_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SECRETS_DIR="$WEB3_DIR/.secrets"

echo "========================================"
echo "SECURE KEY SETUP"
echo "========================================"
echo ""

# Create .secrets directory with secure permissions
mkdir -p "$SECRETS_DIR"
chmod 700 "$SECRETS_DIR"
echo "✅ Created .secrets directory with restricted permissions"

# Check if .env exists
if [ ! -f "$WEB3_DIR/.env" ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Extract private key from .env
PRIVATE_KEY=$(grep "^PRIVATE_KEY=" "$WEB3_DIR/.env" | cut -d'=' -f2- | tr -d '"' | tr -d "'" | xargs)

if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ PRIVATE_KEY not found in .env"
    exit 1
fi

# Save private key to secure file
PRIVATE_KEY_FILE="$SECRETS_DIR/private-key"
echo "$PRIVATE_KEY" > "$PRIVATE_KEY_FILE"
chmod 600 "$PRIVATE_KEY_FILE"
echo "✅ Private key saved to .secrets/private-key (permissions: 600)"

# Remove private key from .env (keep other variables)
if [ -f "$WEB3_DIR/.env" ]; then
    # Create backup
    cp "$WEB3_DIR/.env" "$WEB3_DIR/.env.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ Created backup: .env.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Remove PRIVATE_KEY line from .env
    sed -i '/^PRIVATE_KEY=/d' "$WEB3_DIR/.env"
    echo "✅ Removed PRIVATE_KEY from .env"
    
    # Add comment pointing to secure location
    if ! grep -q "# Private key moved to .secrets/private-key" "$WEB3_DIR/.env"; then
        echo "" >> "$WEB3_DIR/.env"
        echo "# Private key moved to .secrets/private-key (secure location)" >> "$WEB3_DIR/.env"
    fi
fi

# Create .gitignore for .secrets if it doesn't exist
if [ ! -f "$WEB3_DIR/.gitignore" ]; then
    touch "$WEB3_DIR/.gitignore"
fi

if ! grep -q "^\.secrets/" "$WEB3_DIR/.gitignore"; then
    echo "" >> "$WEB3_DIR/.gitignore"
    echo "# Secure key storage" >> "$WEB3_DIR/.gitignore"
    echo ".secrets/" >> "$WEB3_DIR/.gitignore"
    echo "✅ Added .secrets/ to .gitignore"
fi

# Ensure .env is in .gitignore
if ! grep -q "^\.env$" "$WEB3_DIR/.gitignore"; then
    echo ".env" >> "$WEB3_DIR/.gitignore"
    echo "✅ Added .env to .gitignore"
fi

echo ""
echo "========================================"
echo "SETUP COMPLETE"
echo "========================================"
echo ""
echo "✅ Private key moved to secure location:"
echo "   .secrets/private-key (permissions: 600)"
echo ""
echo "✅ .env file updated (PRIVATE_KEY removed)"
echo ""
echo "⚠️  IMPORTANT:"
echo "   1. Keep .secrets/private-key secure and backed up"
echo "   2. Never commit .secrets/ to git"
echo "   3. Use environment variable or secure key management in production"
echo ""
echo "📋 Next steps:"
echo "   Update hardhat.config.js to read from .secrets/private-key"
echo "   Or use environment variable: export PRIVATE_KEY=\$(cat .secrets/private-key)"
echo "========================================"

