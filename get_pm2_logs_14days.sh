#!/bin/bash
# Script to get PM2 logs from the last 14 days
# Works even with limited disk space by using pipes

# Calculate date 14 days ago (in UTC)
CUTOFF_DATE=$(date -u -d "14 days ago" +"%Y-%m-%dT%H:%M:%S")
CUTOFF_DATE_SHORT=$(date -u -d "14 days ago" +"%Y-%m-%d")

echo "Getting logs from the last 14 days (since $CUTOFF_DATE)"
echo "Current date: $(date -u +"%Y-%m-%dT%H:%M:%S")"
echo "Cutoff date:  $CUTOFF_DATE"
echo "=========================================="
echo ""

# Function to filter logs by date (streaming, no temp files)
filter_logs_by_date() {
    local log_file=$1
    local app_name=$2
    
    if [ ! -f "$log_file" ]; then
        return
    fi
    
    local file_size=$(stat -c%s "$log_file" 2>/dev/null || echo "0")
    if [ "$file_size" -gt 1073741824 ]; then
        echo "=== $app_name (file size: $(numfmt --to=iec-i --suffix=B $file_size 2>/dev/null || echo "${file_size} bytes")) ==="
        echo "Note: Large file, processing may take time..."
    else
        echo "=== $app_name ==="
    fi
    
    # Use awk to filter by date (streaming, no temp files)
    awk -v cutoff="$CUTOFF_DATE" -v cutoff_short="$CUTOFF_DATE_SHORT" '
    {
        # Extract timestamp (format: YYYY-MM-DDTHH:MM:SS)
        if (match($0, /^([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2})/, arr)) {
            if (arr[1] >= cutoff) {
                print $0
            }
        } else if (match($0, /^([0-9]{4}-[0-9]{2}-[0-9]{2})/, arr)) {
            # Fallback: just date comparison
            if (arr[1] >= cutoff_short) {
                print $0
            }
        }
    }' "$log_file" 2>/dev/null
    echo ""
}

# Get list of PM2 processes
PM2_LIST=$(pm2 jlist 2>/dev/null)

if [ -z "$PM2_LIST" ]; then
    echo "Error: Could not get PM2 process list"
    exit 1
fi

# Extract process names from PM2 list
PROCESS_NAMES=$(echo "$PM2_LIST" | grep -o '"name":"[^"]*"' | sed 's/"name":"\([^"]*\)"/\1/' | sort -u)

# Process each app's logs
for app_name in $PROCESS_NAMES; do
    # Skip pm2-logrotate module
    if [ "$app_name" = "pm2-logrotate" ]; then
        continue
    fi
    
    OUT_LOG="$HOME/.pm2/logs/${app_name}-out.log"
    ERR_LOG="$HOME/.pm2/logs/${app_name}-error.log"
    
    filter_logs_by_date "$OUT_LOG" "${app_name} (stdout)"
    filter_logs_by_date "$ERR_LOG" "${app_name} (stderr)"
done

echo "=========================================="
echo "Done! Logs filtered from the last 14 days."
