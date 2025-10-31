#!/usr/bin/env bash
# Link markdownlint-trap to all projects using npm link

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
  echo -e "${BLUE}[link-to-projects]${NC} $1"
}

success() {
  echo -e "${GREEN}[link-to-projects]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[link-to-projects]${NC} $1"
}

error() {
  echo -e "${RED}[link-to-projects]${NC} $1"
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
      echo "Link markdownlint-trap package to all Node.js projects."
      echo "Automatically detects package manager (npm, pnpm, yarn, bun) and uses the appropriate link command."
      echo ""
      echo "Options:"
      echo "  --dry-run              Show what would be linked without making changes"
      echo "  --projects-dir DIR     Projects directory (default: ~/Projects)"
      echo "  --help                 Show this help message"
      echo ""
      echo "Environment variables:"
      echo "  PROJECTS_DIR           Override projects directory"
      echo "  DRY_RUN                Set to 'true' for dry run mode"
      echo ""
      echo "Examples:"
      echo "  $0                                    # Link to all projects"
      echo "  $0 --dry-run                          # Preview what would be linked"
      echo "  $0 --projects-dir ~/Work              # Use different directory"
      echo ""
      echo "Package manager detection:"
      echo "  - pnpm-lock.yaml → uses pnpm"
      echo "  - yarn.lock      → uses yarn"
      echo "  - bun.lockb      → uses bun"
      echo "  - default        → uses npm"
      echo ""
      echo "Prerequisites:"
      echo "  Run 'npm link' in the markdownlint-trap repository first"
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
  log "DRY RUN MODE - no packages will be linked"
  echo ""
fi

if [ ! -d "$PROJECTS_DIR" ]; then
  error "Projects directory not found: $PROJECTS_DIR"
  exit 1
fi

# Get the repository root (parent of scripts directory)
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Check if npm link has been run in this repository
log "Checking if $PACKAGE_NAME is globally linked..."
if npm list -g --depth=0 "$PACKAGE_NAME" &>/dev/null; then
  success "✓ $PACKAGE_NAME is already globally linked"
else
  warn "$PACKAGE_NAME is not globally linked yet"
  log "Running 'npm link' in $REPO_ROOT..."

  if [ "$DRY_RUN" = "true" ]; then
    log "[dry-run] Would run: npm link"
  else
    if ! (cd "$REPO_ROOT" && npm link); then
      error "Failed to run 'npm link' in $REPO_ROOT"
      exit 1
    fi
    success "✓ Globally linked $PACKAGE_NAME"
  fi
fi

echo ""
log "Scanning projects in: $PROJECTS_DIR"
echo ""

linked_count=0
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

  # Skip this repo itself
  if [ "$dir" -ef "$REPO_ROOT/" ]; then
    log "Skipping $project_name (this repository)"
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

  # Check if already linked
  if [ -L "$dir/node_modules/$PACKAGE_NAME" ]; then
    log "Skipping $project_name (already linked)"
    skipped_count=$((skipped_count + 1))
    continue
  fi

  # Check if installed as regular dependency
  if [ -d "$dir/node_modules/$PACKAGE_NAME" ] && [ ! -L "$dir/node_modules/$PACKAGE_NAME" ]; then
    warn "$project_name has $PACKAGE_NAME installed (not linked)"
    log "  Remove it first with: cd $dir && $pkg_manager uninstall $PACKAGE_NAME"
    skipped_count=$((skipped_count + 1))
    continue
  fi

  if [ "$DRY_RUN" = "true" ]; then
    log "Would link in: $project_name (using $pkg_manager)"
    linked_count=$((linked_count + 1))
  else
    log "Linking in: $project_name (using $pkg_manager)"

    # Link based on package manager
    link_success=false
    link_error=""
    if [ "$pkg_manager" = "pnpm" ]; then
      link_error=$(cd "$dir" && pnpm link "$REPO_ROOT" 2>&1) && link_success=true || link_success=false
    elif [ "$pkg_manager" = "yarn" ]; then
      link_error=$(cd "$dir" && yarn link "$PACKAGE_NAME" 2>&1) && link_success=true || link_success=false
    elif [ "$pkg_manager" = "bun" ]; then
      link_error=$(cd "$dir" && bun link "$PACKAGE_NAME" 2>&1) && link_success=true || link_success=false
    else
      # npm
      link_error=$(cd "$dir" && npm link "$PACKAGE_NAME" 2>&1) && link_success=true || link_success=false
    fi

    if [ "$link_success" = true ]; then
      success "✓ Linked in $project_name"
      linked_count=$((linked_count + 1))
    else
      # Check if it actually linked despite warnings/errors
      if [ -L "$dir/node_modules/$PACKAGE_NAME" ]; then
        success "✓ Linked in $project_name (with warnings)"
        linked_count=$((linked_count + 1))
      else
        error "✗ Failed to link in $project_name"
        error "  Error: $(echo "$link_error" | head -n 3 | tr '\n' ' ')"
        failed_count=$((failed_count + 1))
      fi
    fi
  fi
done

echo ""
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$DRY_RUN" = "true" ]; then
  log "DRY RUN SUMMARY:"
  log "  Would link: $linked_count projects"
else
  log "LINK SUMMARY:"
  success "  Linked: $linked_count projects"
fi

log "  Skipped: $skipped_count projects"

if [ $failed_count -gt 0 ]; then
  error "  Failed: $failed_count projects"
fi

log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$DRY_RUN" = "true" ]; then
  echo ""
  log "Run without --dry-run to link packages"
fi

if [ $failed_count -gt 0 ]; then
  exit 1
fi

echo ""
log "To unlink later, run:"
log "  cd <project> && npm unlink $PACKAGE_NAME"
log ""
log "Or use the companion script:"
log "  ./scripts/unlink-from-projects.sh"
