#!/bin/sh
# Load .env.local into actual environment variables
# Uses line-by-line parsing to avoid shell glob/word-splitting issues
if [ -f .env.local ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    # Skip empty lines and comments
    case "$line" in
      ''|\#*) continue ;;
    esac
    # Strip surrounding quotes from value
    key="${line%%=*}"
    val="${line#*=}"
    # Remove leading/trailing double quotes if present
    val="${val#\"}"
    val="${val%\"}"
    export "$key=$val"
  done < .env.local
fi
# Force port 8080 for Elastic Beanstalk nginx proxy
export PORT=8080
export HOSTNAME=0.0.0.0
exec node server.js
