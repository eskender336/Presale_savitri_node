#!/bin/bash
# Alternative script using tar+gzip for compression before download
# This creates a compressed archive that's easier to download

LOG_FILE="$HOME/.pm2/logs/presale-notifier-error.log"
OUTPUT_DIR="/tmp"
ARCHIVE_NAME="presale-notifier-error-$(date +%Y%m%d).tar.gz"

if [ ! -f "$LOG_FILE" ]; then
    echo "Error: Log file not found: $LOG_FILE"
    exit 1
fi

echo "=========================================="
echo "Creating compressed archive..."
echo "=========================================="
echo "Source: $LOG_FILE"
echo "Output: $OUTPUT_DIR/$ARCHIVE_NAME"
echo ""

# Create compressed archive
cd "$HOME/.pm2/logs"
tar -czf "$OUTPUT_DIR/$ARCHIVE_NAME" presale-notifier-error.log

if [ $? -eq 0 ]; then
    ARCHIVE_SIZE=$(du -h "$OUTPUT_DIR/$ARCHIVE_NAME" | cut -f1)
    echo "=========================================="
    echo "Archive created successfully!"
    echo "Size: $ARCHIVE_SIZE"
    echo "Location: $OUTPUT_DIR/$ARCHIVE_NAME"
    echo "=========================================="
    echo ""
    echo "To download using scp:"
    echo "  scp ubuntu@$(hostname -I | awk '{print $1}'):$OUTPUT_DIR/$ARCHIVE_NAME ./"
    echo ""
    echo "Or start HTTP server to download:"
    echo "  cd $OUTPUT_DIR"
    echo "  python3 -m http.server 8080"
    echo "  Then download: http://$(hostname -I | awk '{print $1}'):8080/$ARCHIVE_NAME"
else
    echo "Error: Failed to create archive"
    exit 1
fi




