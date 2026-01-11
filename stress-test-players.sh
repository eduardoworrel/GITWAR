#!/bin/bash
# Stress test script - spawn 1000 fake players

API_URL="${1:-http://localhost:5138}"
COUNT="${2:-1000}"

echo "=== GitWorld Stress Test ==="
echo "API: $API_URL"
echo "Spawning $COUNT fake players..."

# Spawn fake players
RESULT=$(curl -s -X POST "$API_URL/debug/spawn-fake-players?count=$COUNT")
echo "$RESULT" | jq '.' 2>/dev/null || echo "$RESULT"

echo ""
echo "Done! Now open http://localhost:5173 to test performance."
echo ""
echo "To clear fake players, run:"
echo "  curl -X POST $API_URL/debug/clear-fake-players"
