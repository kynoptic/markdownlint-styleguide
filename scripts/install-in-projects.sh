#!/usr/bin/env bash
# Install markdownlint-trap in all projects under ~/Projects

set -euo pipefail

PROJECTS_DIR="${PROJECTS_DIR:-$HOME/Projects}"
DRY_RUN="${DRY_RUN:-false}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
  echo -e "${BLUE}[install-in-projects]${NC} $1"
}

success() {
  echo -e "${GREEN}[install-in-projects]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[install-in-projects]${NC} $1"
}

error() {
  echo -e "${RED}[install-in-projects]${NC} $1"
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
      echo "Install markdownlint-trap and markdownlint-cli2 in all Node.js projects."
      echo ""
      echo "Options:"
      echo "  --dry-run              Show what would be installed without making changes"
      echo "  --projects-dir DIR     Projects directory (default: ~/Projects)"
      echo "  --help                 Show this help message"
      echo ""
      echo "Environment variables:"
      echo "  PROJECTS_DIR           Override projects directory"
      echo "  DRY_RUN                Set to 'true' for dry run mode"
      echo ""
      echo "Examples:"
      echo "  $0                                    # Install in all projects"
      echo "  $0 --dry-run                          # Preview what would be installed"
      echo "  $0 --projects-dir ~/Work              # Use different directory"
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
  log "DRY RUN MODE - no packages will be installed"
  echo ""
fi

if [ ! -d "$PROJECTS_DIR" ]; then
  error "Projects directory not found: $PROJECTS_DIR"
  exit 1
fi

log "Scanning projects in: $PROJECTS_DIR"
echo ""

installed_count=0
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
    ((skipped_count++))
    continue
  fi

  # Check if already installed
  if grep -q '"markdownlint-trap"' "$dir/package.json" 2>/dev/null; then
    log "Skipping $project_name (already has markdownlint-trap)"
    ((skipped_count++))
    continue
  fi

  if [ "$DRY_RUN" = "true" ]; then
    log "Would install in: $project_name"
    ((installed_count++))
  else
    log "Installing in: $project_name"

    if (cd "$dir" && npm install --save-dev markdownlint-trap markdownlint-cli2 --silent); then
      success "✓ Installed in $project_name"
      ((installed_count++))
    else
      error "✗ Failed to install in $project_name"
      ((failed_count++))
    fi
  fi
done

echo ""
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$DRY_RUN" = "true" ]; then
  log "DRY RUN SUMMARY:"
  log "  Would install: $installed_count projects"
else
  log "INSTALLATION SUMMARY:"
  success "  Installed: $installed_count projects"
fi

log "  Skipped: $skipped_count projects"

if [ $failed_count -gt 0 ]; then
  error "  Failed: $failed_count projects"
fi

log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$DRY_RUN" = "true" ]; then
  echo ""
  log "Run without --dry-run to install packages"
fi

if [ $failed_count -gt 0 ]; then
  exit 1
fi
