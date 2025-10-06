#!/bin/bash

# Deploy Mastowall to Cloudron via SFTP
# Usage: ./deploy-to-cloudron.sh

set -e

HOST="my.wolkenbar.de"
PORT="222"
USERNAME="radmin@follow.wolkenbar.de"
REMOTE_PATH="/app/data/public"

echo "🚀 Deploying Mastowall to Cloudron..."
echo "Host: $HOST:$PORT"
echo "User: $USERNAME"
echo ""

# Files to upload
FILES=(
    "index.html"
    "script.js"
    "styles.css"
    "config.json"
    "mastowall-favicon.png"
)

# Create SFTP batch file
BATCH_FILE=$(mktemp)
echo "cd $REMOTE_PATH" > "$BATCH_FILE"

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "put $file" >> "$BATCH_FILE"
        echo "  ✓ Queued: $file"
    else
        echo "  ⚠️  Missing: $file"
    fi
done

echo ""
echo "📤 Uploading files..."
echo "Please enter your Cloudron password when prompted."
echo ""

# Execute SFTP
sftp -P "$PORT" -b "$BATCH_FILE" "$USERNAME@$HOST"

# Cleanup
rm "$BATCH_FILE"

echo ""
echo "✅ Deployment complete!"
echo "🌐 Check: https://follow.wolkenbar.de"
