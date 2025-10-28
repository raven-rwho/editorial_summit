#!/bin/bash

# Test script for Audio API
# Usage: ./test-audio-api.sh path/to/audio.mp3 [optional-title]

set -e

# Configuration
API_URL="${API_URL:-http://localhost:3000/api/process-audio}"
API_PASSWORD="${TRANSCRIPT_API_PASSWORD:-your_password_here}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if audio file is provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: Audio file path is required${NC}"
  echo "Usage: $0 <audio-file> [title]"
  echo ""
  echo "Example:"
  echo "  $0 recording.mp3"
  echo "  $0 meeting.wav 'Team Standup Notes'"
  exit 1
fi

AUDIO_FILE="$1"
TITLE="${2:-}"

# Check if file exists
if [ ! -f "$AUDIO_FILE" ]; then
  echo -e "${RED}Error: File not found: $AUDIO_FILE${NC}"
  exit 1
fi

# Get file size
FILE_SIZE=$(wc -c < "$AUDIO_FILE")
FILE_SIZE_MB=$(echo "scale=2; $FILE_SIZE / 1024 / 1024" | bc)

echo -e "${YELLOW}=== Audio API Test ===${NC}"
echo -e "Audio file: ${GREEN}$AUDIO_FILE${NC}"
echo -e "File size: ${GREEN}${FILE_SIZE_MB}MB${NC}"
echo -e "API URL: ${GREEN}$API_URL${NC}"
if [ -n "$TITLE" ]; then
  echo -e "Title: ${GREEN}$TITLE${NC}"
fi
echo ""

# Check file size (max 25MB)
MAX_SIZE=$((25 * 1024 * 1024))
if [ "$FILE_SIZE" -gt "$MAX_SIZE" ]; then
  echo -e "${RED}Error: File too large (${FILE_SIZE_MB}MB). Maximum is 25MB${NC}"
  exit 1
fi

# Build curl command
CURL_CMD="curl -X POST \"$API_URL\" \
  -H \"x-api-password: $API_PASSWORD\" \
  -F \"audio=@$AUDIO_FILE\""

if [ -n "$TITLE" ]; then
  CURL_CMD="$CURL_CMD -F \"title=$TITLE\""
fi

echo -e "${YELLOW}Sending request...${NC}"
echo ""

# Execute request and capture response
RESPONSE=$(eval $CURL_CMD)

# Pretty print JSON response
echo -e "${YELLOW}Response:${NC}"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

# Check if successful
if echo "$RESPONSE" | grep -q '"success": true'; then
  echo ""
  echo -e "${GREEN}✓ Audio processed successfully!${NC}"

  # Extract and display key information
  ARTICLE_TITLE=$(echo "$RESPONSE" | grep -o '"title": "[^"]*"' | cut -d'"' -f4)
  FILE_PATH=$(echo "$RESPONSE" | grep -o '"filePath": "[^"]*"' | cut -d'"' -f4)
  COMMIT_HASH=$(echo "$RESPONSE" | grep -o '"commitHash": "[^"]*"' | cut -d'"' -f4)

  if [ -n "$ARTICLE_TITLE" ]; then
    echo -e "Title: ${GREEN}$ARTICLE_TITLE${NC}"
  fi
  if [ -n "$FILE_PATH" ]; then
    echo -e "File: ${GREEN}$FILE_PATH${NC}"
  fi
  if [ -n "$COMMIT_HASH" ]; then
    echo -e "Commit: ${GREEN}${COMMIT_HASH:0:8}${NC}"
  fi
else
  echo ""
  echo -e "${RED}✗ Request failed${NC}"
  exit 1
fi
