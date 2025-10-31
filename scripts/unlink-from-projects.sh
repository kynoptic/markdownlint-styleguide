#!/usr/bin/env bash
# Unlink markdownlint-trap from all projects

set -euo pipefail

PROJECTS_DIR="${PROJECTS_DIR:-$HOME/Projects}"
DRY_RUN="${DRY_RUN:-false}"
PACKAGE_NAME="markdownlint-trap"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
  echo -e "${BLUE}[unlink-from-projects]${NC} $1"
}

success() {
  echo -e "${GREEN}[unlink-from-projects]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[unlink-from-projects]${NC} $1"
}

error() {
  echo -e "${RED}[unlink-from-projects]${NC} $1"
}

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --projects-dir)
      PROJECTS_DIR="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Unlink markdownlint-trap package from all Node.js projects."
      echo "Automatically detects package manager (npm, pnpm, yarn, bun) and uses the appropriate unlink command."
      echo ""
      echo "Options:"
      echo "  --dry-run              Show what would be unlinked without making changes"
      echo "  --projects-dir DIR     Projects directory (default: ~/Projects)"
      echo "  --help                 Show this help message"
      echo ""
      echo "Environment variables:"
      echo "  PROJECTS_DIR           Override projects directory"
      echo "  DRY_RUN                Set to 'true' for dry run mode"
      echo ""
      echo "Examples:"
      echo "  $0                                    # Unlink from all projects"
      echo "  $0 --dry-run                          # Preview what would be unlinked"
      echo "  $0 --projects-dir ~/Work              # Use different directory"
      echo ""
      echo "Package manager detection:"
      echo "  - pnpm-lock.yaml → uses pnpm (NOTE: uses 'pnpm remove', not 'unlink')"
      echo "  - yarn.lock      → uses yarn unlink"
      echo "  - bun.lockb      → uses bun remove"
      echo "  - default        → uses npm unlink"
      echo ""
      echo "Note: pnpm doesn't have an 'unlink' command, so 'pnpm remove' is used instead."
      echo "This removes the package from package.json. Use 'pnpm link' to restore."
      exit 0
      ;;
    *)
      error "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

if [ "$DRY_RUN" = "true" ]; then
  log "DRY RUN MODE - no packages will be unlinked"
  echo ""
fi

if [ ! -d "$PROJECTS_DIR" ]; then
  error "Projects directory not found: $PROJECTS_DIR"
  exit 1
fi

log "Scanning projects in: $PROJECTS_DIR"
echo ""

unlinked_count=0
skipped_count=0
failed_count=0

for dir in "$PROJECTS_DIR"/*/; do
  project_name=$(basename "$dir")

  # Skip if not a directory
  if [ ! -d "$dir" ]; then
    continue
  fi

  # Skip if no package.json
  if [ ! -f "$dir/package.json" ]; then
    warn "Skipping $project_name (no package.json)"
    skipped_count=$((skipped_count + 1))
    continue
  fi

  # Check if linked
  if [ ! -L "$dir/node_modules/$PACKAGE_NAME" ]; then
    log "Skipping $project_name (not linked)"
    skipped_count=$((skipped_count + 1))
    continue
  fi

  # Detect package manager
  pkg_manager="npm"
  lock_files_found=0
  detected_managers=""

  if [ -f "$dir/pnpm-lock.yaml" ]; then
    pkg_manager="pnpm"
    lock_files_found=$((lock_files_found + 1))
    detected_managers="pnpm"
  fi
  if [ -f "$dir/yarn.lock" ]; then
    if [ $lock_files_found -eq 0 ]; then
      pkg_manager="yarn"
    fi
    lock_files_found=$((lock_files_found + 1))
    detected_managers="${detected_managers:+$detected_managers, }yarn"
  fi
  if [ -f "$dir/bun.lockb" ]; then
    if [ $lock_files_found -eq 0 ]; then
      pkg_manager="bun"
    fi
    lock_files_found=$((lock_files_found + 1))
    detected_managers="${detected_managers:+$detected_managers, }bun"
  fi
  if [ -f "$dir/package-lock.json" ]; then
    lock_files_found=$((lock_files_found + 1))
    detected_managers="${detected_managers:+$detected_managers, }npm"
  fi

  # Warn if multiple lock files detected
  if [ $lock_files_found -gt 1 ]; then
    warn "$project_name has multiple lock files ($detected_managers) - using $pkg_manager"
  fi

  if [ "$DRY_RUN" = "true" ]; then
    log "Would unlink from: $project_name (using $pkg_manager)"
    unlinked_count=$((unlinked_count + 1))
  else
    log "Unlinking from: $project_name (using $pkg_manager)"

    # Unlink based on package manager
    unlink_success=false
    unlink_error=""
    if [ "$pkg_manager" = "pnpm" ]; then
      # pnpm doesn't have unlink, use remove instead
      unlink_error=$(cd "$dir" && pnpm remove "$PACKAGE_NAME" 2>&1) && unlink_success=true || unlink_success=false
    elif [ "$pkg_manager" = "yarn" ]; then
      unlink_error=$(cd "$dir" && yarn unlink "$PACKAGE_NAME" 2>&1) && unlink_success=true || unlink_success=false
    elif [ "$pkg_manager" = "bun" ]; then
      unlink_error=$(cd "$dir" && bun remove "$PACKAGE_NAME" 2>&1) && unlink_success=true || unlink_success=false
    else
      # npm
      unlink_error=$(cd "$dir" && npm unlink "$PACKAGE_NAME" 2>&1) && unlink_success=true || unlink_success=false
    fi

    if [ "$unlink_success" = true ]; then
      success "✓ Unlinked from $project_name"
      unlinked_count=$((unlinked_count + 1))
    else
      error "✗ Failed to unlink from $project_name"
      error "  Error: $(echo "$unlink_error" | head -n 3 | tr '\n' ' ')"
      failed_count=$((failed_count + 1))
    fi
  fi
done

echo ""
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$DRY_RUN" = "true" ]; then
  log "DRY RUN SUMMARY:"
  log "  Would unlink: $unlinked_count projects"
else
  log "UNLINK SUMMARY:"
  success "  Unlinked: $unlinked_count projects"
fi

log "  Skipped: $skipped_count projects"

if [ $failed_count -gt 0 ]; then
  error "  Failed: $failed_count projects"
fi

log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$DRY_RUN" = "true" ]; then
  echo ""
  log "Run without --dry-run to unlink packages"
fi

if [ $failed_count -gt 0 ]; then
  exit 1
fi
