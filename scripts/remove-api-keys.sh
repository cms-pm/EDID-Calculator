#!/bin/bash
# ============================================
# API Key Removal Script
# ============================================
# Purpose: Scan git-tracked files and remove exposed API keys/secrets
# Usage:
#   ./scripts/remove-api-keys.sh           # Remove keys with backup
#   ./scripts/remove-api-keys.sh --dry-run # Preview without changes
#   ./scripts/remove-api-keys.sh --quiet   # Minimal output
#
# Exit codes:
#   0 = No keys found (clean)
#   1 = Keys found and removed (action required)
#   2 = Error during scan

set -euo pipefail

# ============================================
# Configuration
# ============================================

BACKUP_DIR=".api-key-backup"
DRY_RUN=false
QUIET=false
VERBOSE=false

# Key patterns (regex for grep -oP)
declare -A KEY_PATTERNS=(
    ["Google Gemini"]='AIza[A-Za-z0-9_-]{35}'
    ["AWS Access Key"]='AKIA[A-Z0-9]{16}'
    ["GitHub PAT"]='ghp_[A-Za-z0-9]{36}'
    ["GitHub PAT (new)"]='github_pat_[A-Za-z0-9_]{82}'
)

# Revocation URLs
declare -A REVOKE_URLS=(
    ["Google Gemini"]='https://console.cloud.google.com/apis/credentials'
    ["AWS Access Key"]='https://console.aws.amazon.com/iam/home#/security_credentials'
    ["GitHub PAT"]='https://github.com/settings/tokens'
    ["GitHub PAT (new)"]='https://github.com/settings/tokens'
)

# Counters
FILES_SCANNED=0
FILES_MODIFIED=0
KEYS_REMOVED=0
declare -A KEYS_BY_TYPE

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# Functions
# ============================================

log_info() {
    if [ "$QUIET" = false ]; then
        echo -e "${BLUE}$1${NC}"
    fi
}

log_success() {
    if [ "$QUIET" = false ]; then
        echo -e "${GREEN}$1${NC}"
    fi
}

log_warning() {
    echo -e "${YELLOW}$1${NC}"
}

log_error() {
    echo -e "${RED}$1${NC}" >&2
}

log_verbose() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${NC}[DEBUG] $1${NC}"
    fi
}

usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Scan git-tracked files for exposed API keys and remove them.

OPTIONS:
    --dry-run       Preview changes without modifying files
    --quiet         Minimal output (summary only)
    --verbose       Detailed debug output
    -h, --help      Show this help message

EXAMPLES:
    $0                    # Remove keys with backup
    $0 --dry-run          # Preview what would be removed
    $0 --quiet            # Silent mode (check exit code)

EXIT CODES:
    0 = No keys found (repository clean)
    1 = Keys found and removed (action required)
    2 = Error during scan
EOF
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --quiet)
                QUIET=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                exit 2
                ;;
        esac
    done
}

create_backup_dir() {
    if [ "$DRY_RUN" = false ] && [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log_verbose "Created backup directory: $BACKUP_DIR"

        # Add to .gitignore if not already there
        if [ -f .gitignore ] && ! grep -q "^${BACKUP_DIR}/$" .gitignore; then
            echo "${BACKUP_DIR}/" >> .gitignore
            log_verbose "Added $BACKUP_DIR/ to .gitignore"
        fi
    fi
}

backup_file() {
    local file="$1"

    if [ "$DRY_RUN" = false ]; then
        local backup_path="${BACKUP_DIR}/${file}"
        local backup_dir=$(dirname "$backup_path")

        mkdir -p "$backup_dir"
        cp "$file" "$backup_path"
        log_verbose "Backed up: $file → $backup_path"
    fi
}

detect_file_type() {
    local file="$1"
    local ext="${file##*.}"

    case "$ext" in
        js|jsx|ts|tsx|mjs|cjs)
            echo "javascript"
            ;;
        json)
            echo "json"
            ;;
        yaml|yml)
            echo "yaml"
            ;;
        html|htm)
            echo "html"
            ;;
        py)
            echo "python"
            ;;
        *)
            echo "text"
            ;;
    esac
}

remove_key_from_line() {
    local file="$1"
    local line_num="$2"
    local key="$3"
    local file_type="$4"

    if [ "$DRY_RUN" = true ]; then
        log_verbose "[DRY-RUN] Would remove key from $file:$line_num"
        return
    fi

    # Create temp file
    local temp_file=$(mktemp)

    # Strategy: Replace key with placeholder
    # This preserves code structure better than deleting lines
    sed "${line_num}s/${key}/REMOVED_API_KEY/g" "$file" > "$temp_file"

    # Replace original file
    mv "$temp_file" "$file"
    log_verbose "Replaced key with placeholder in $file:$line_num"
}

scan_file() {
    local file="$1"
    local keys_found_in_file=0
    local file_backed_up=false

    FILES_SCANNED=$((FILES_SCANNED + 1))

    # Skip binary files
    if file "$file" | grep -q "binary"; then
        log_verbose "Skipping binary file: $file"
        return
    fi

    local file_type=$(detect_file_type "$file")
    log_verbose "Scanning $file (type: $file_type)"

    # Search for each key pattern
    for key_type in "${!KEY_PATTERNS[@]}"; do
        local pattern="${KEY_PATTERNS[$key_type]}"

        # Find all matches with line numbers
        while IFS=: read -r line_num key; do
            if [ -z "$key" ]; then
                continue
            fi

            # Backup file on first key found
            if [ "$file_backed_up" = false ]; then
                backup_file "$file"
                file_backed_up=true
                FILES_MODIFIED=$((FILES_MODIFIED + 1))
            fi

            # Mask key for output (first 8 chars + ...)
            local masked_key="${key:0:8}...${key: -4}"

            # Log the finding
            if [ "$QUIET" = false ]; then
                echo ""
                log_warning "[REMOVED] $key_type"
                echo "  File: $file"
                echo "  Line: $line_num"
                echo "  Key: $masked_key (masked)"

                # Reference backup for full key
                if [ "$file_backed_up" = true ]; then
                    echo "  Full key in backup: ${BACKUP_DIR}/${file}"
                fi

                if [ "$DRY_RUN" = true ]; then
                    echo "  Action: [DRY-RUN] Would replace with REMOVED_API_KEY"
                else
                    echo "  Action: Replaced with REMOVED_API_KEY"
                fi

                # Show revocation URL
                if [ -n "${REVOKE_URLS[$key_type]:-}" ]; then
                    echo ""
                    log_error "  ⚠️  REVOKE THIS KEY IMMEDIATELY:"
                    echo "      ${REVOKE_URLS[$key_type]}"
                    echo "      Full key saved in: ${BACKUP_DIR}/${file}"
                fi
            fi

            # Remove the key
            remove_key_from_line "$file" "$line_num" "$key" "$file_type"

            # Increment counters
            KEYS_REMOVED=$((KEYS_REMOVED + 1))
            keys_found_in_file=$((keys_found_in_file + 1))
            KEYS_BY_TYPE[$key_type]=$((${KEYS_BY_TYPE[$key_type]:-0} + 1))

        done < <(grep -nP "$pattern" "$file" 2>/dev/null || true)
    done

    if [ $keys_found_in_file -gt 0 ]; then
        log_verbose "Found $keys_found_in_file key(s) in $file"
    fi
}

scan_repository() {
    log_info "Scanning git-tracked files for API keys..."

    # Get list of all git-tracked files
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            scan_file "$file"
        fi
    done < <(git ls-files)

    log_verbose "Scan complete: $FILES_SCANNED files scanned"
}

generate_report() {
    echo ""
    log_info "============================================"
    log_info "API Key Removal Report"
    log_info "============================================"
    echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "Working Directory: $(pwd)"
    if [ "$DRY_RUN" = true ]; then
        log_warning "Mode: DRY-RUN (no changes made)"
    fi
    echo ""

    echo "=== Summary ==="
    echo "Files scanned: $FILES_SCANNED"
    echo "Files modified: $FILES_MODIFIED"
    echo "Keys removed: $KEYS_REMOVED"

    if [ $KEYS_REMOVED -gt 0 ]; then
        echo ""
        echo "Keys by type:"
        for key_type in "${!KEYS_BY_TYPE[@]}"; do
            echo "  - $key_type: ${KEYS_BY_TYPE[$key_type]}"
        done

        echo ""
        log_error "⚠️  CRITICAL NEXT STEPS:"
        echo "1. Review modified files: git diff"
        echo "2. Revoke all exposed keys immediately (see links above)"
        echo "3. Add keys to env.production or Dokploy environment"
        if [ "$DRY_RUN" = false ]; then
            echo "4. Commit removal: git add . && git commit -m 'Remove exposed API keys'"
            echo "5. Restore from backup if needed: cp -r $BACKUP_DIR/* ."
        else
            echo "4. Run without --dry-run to apply changes"
        fi
        echo ""
        log_warning "Backups saved to: $BACKUP_DIR/"
    else
        echo ""
        log_success "✓ No API keys found - repository is clean!"
    fi

    log_info "============================================"
}

# ============================================
# Main
# ============================================

main() {
    parse_args "$@"

    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Error: Not a git repository"
        exit 2
    fi

    # Create backup directory
    create_backup_dir

    # Scan repository
    scan_repository

    # Generate report
    generate_report

    # Exit with appropriate code
    if [ $KEYS_REMOVED -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
}

main "$@"
