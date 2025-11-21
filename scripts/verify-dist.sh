#!/bin/bash
# ============================================
# Verify dist/ Directory
# ============================================
# Purpose: Verify that dist/ directory contains required files
# Usage: ./scripts/verify-dist.sh
# Exit codes:
#   0 = dist/ is valid
#   1 = dist/ is missing or invalid

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

error() {
    echo -e "${RED}✗ $1${NC}" >&2
}

success() {
    echo -e "${GREEN}✓ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if dist/ exists
if [ ! -d "dist" ]; then
    error "dist/ directory does not exist"
    echo "Run: npm run build"
    exit 1
fi

# Check if dist/index.html exists
if [ ! -f "dist/index.html" ]; then
    error "dist/index.html is missing"
    echo "Run: npm run build"
    exit 1
fi

# Check if dist/assets/ exists and has files
if [ ! -d "dist/assets" ] || [ -z "$(ls -A dist/assets 2>/dev/null)" ]; then
    error "dist/assets/ is missing or empty"
    echo "Run: npm run build"
    exit 1
fi

# Count files
html_count=$(find dist -name "*.html" | wc -l)
js_count=$(find dist/assets -name "*.js" 2>/dev/null | wc -l)

if [ "$html_count" -eq 0 ] || [ "$js_count" -eq 0 ]; then
    error "dist/ appears incomplete (html: $html_count, js: $js_count)"
    echo "Run: npm run build"
    exit 1
fi

# Success
success "dist/ directory is valid"
echo "  HTML files: $html_count"
echo "  JS bundles: $js_count"
echo "  Ready for deployment"
exit 0
