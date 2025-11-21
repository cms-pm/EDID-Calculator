#!/bin/sh
# ============================================
# Frontend Container Entrypoint
# ============================================
# Purpose: Verify dist/ is populated before starting nginx
# If dist/ is empty, provide clear error message

set -e

echo "=== EDID Frontend Container Starting ==="
echo "Checking dist/ directory..."

# Check if /usr/share/nginx/html has files
if [ ! -f "/usr/share/nginx/html/index.html" ]; then
    echo "ERROR: /usr/share/nginx/html/index.html is missing!"
    echo "This means the volume mount ./dist:/usr/share/nginx/html is empty"
    echo ""
    echo "Possible causes:"
    echo "  1. dist/ directory is empty in git repository"
    echo "  2. Dokploy git clone did not fetch dist/ files"
    echo "  3. Volume mount path is incorrect"
    echo ""
    echo "Solution: Trigger manual rebuild in Dokploy UI"
    exit 1
fi

# Count files
html_files=$(find /usr/share/nginx/html -name "*.html" | wc -l)
js_files=$(find /usr/share/nginx/html/assets -name "*.js" 2>/dev/null | wc -l || echo "0")

echo "✓ dist/ validation passed"
echo "  HTML files: $html_files"
echo "  JS bundles: $js_files"
echo ""
echo "Starting nginx..."

# Start nginx
exec nginx -g 'daemon off;'
