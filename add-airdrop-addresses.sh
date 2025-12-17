#!/bin/bash
# Helper script to add airdrop addresses to token-balances.csv
# Usage: ./add-airdrop-addresses.sh

cd "$(dirname "$0")"

echo "Adding airdrop addresses..."
echo ""
echo "NOTE: You need to provide the full addresses from your image."
echo "The image shows truncated addresses (e.g., 0xc73961f instead of full 0x... format)."
echo ""
echo "You can:"
echo "1. Edit data/airdrop-addresses.txt with format: address,balance"
echo "2. Run: node web3/scripts/import-airdrop-data.js"
echo ""
echo "Or edit web3/scripts/quick-add-addresses.js and run it directly."
echo ""

# Check if addresses file exists and has data
if [ -f "data/airdrop-addresses.txt" ]; then
    # Count non-comment, non-empty lines
    DATA_LINES=$(grep -v '^#' data/airdrop-addresses.txt | grep -v '^$' | grep -c ',' || echo "0")
    if [ "$DATA_LINES" -gt 0 ]; then
        echo "Found $DATA_LINES address entries in data/airdrop-addresses.txt"
        echo "Running import script..."
        node web3/scripts/import-airdrop-data.js
    else
        echo "No address data found in data/airdrop-addresses.txt"
        echo "Please add addresses in format: address,balance (one per line)"
    fi
else
    echo "data/airdrop-addresses.txt not found. Creating template..."
    echo "Please add your addresses to the file and run this script again."
fi



