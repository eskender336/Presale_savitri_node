#!/bin/bash
# Script to download presale-notifier-error.log file
# Usage: ./download_log.sh [port]

LOG_FILE="$HOME/.pm2/logs/presale-notifier-error.log"
PORT=${1:-8080}

if [ ! -f "$LOG_FILE" ]; then
    echo "Error: Log file not found: $LOG_FILE"
    exit 1
fi

FILE_SIZE=$(du -h "$LOG_FILE" | cut -f1)
echo "=========================================="
echo "Log File Download Server"
echo "=========================================="
echo "File: $LOG_FILE"
echo "Size: $FILE_SIZE"
echo "Port: $PORT"
echo ""
echo "To download the file, use one of these methods:"
echo ""
echo "1. Using wget/curl:"
echo "   wget http://$(hostname -I | awk '{print $1}'):$PORT/presale-notifier-error.log"
echo "   curl -O http://$(hostname -I | awk '{print $1}'):$PORT/presale-notifier-error.log"
echo ""
echo "2. Using browser:"
echo "   http://$(hostname -I | awk '{print $1}'):$PORT/presale-notifier-error.log"
echo ""
echo "3. Using scp (if you have SSH access):"
echo "   scp ubuntu@$(hostname -I | awk '{print $1}'):$LOG_FILE ./presale-notifier-error.log"
echo ""
echo "=========================================="
echo "Starting HTTP server..."
echo "Press Ctrl+C to stop the server"
echo "=========================================="
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    cd "$HOME/.pm2/logs"
    python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    cd "$HOME/.pm2/logs"
    python -m SimpleHTTPServer $PORT 2>/dev/null || python -m http.server $PORT
else
    echo "Error: Python is not installed. Please install Python 3."
    echo "Alternatively, use scp method shown above."
    exit 1
fi




