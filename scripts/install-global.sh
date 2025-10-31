#!/usr/bin/env bash
# Install markdownlint-trap and markdownlint-cli2 globally for use in all projects

set -euo pipefail

DRY_RUN="${DRY_RUN:-false}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
  echo -e "${BLUE}[install-global]${NC} $1"
}

success() {
  echo -e "${GREEN}[install-global]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[install-global]${NC} $1"
}

error() {
  echo -e "${RED}[install-global]${NC} $1"
}

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Install markdownlint-trap globally for use in all projects (including non-Node.js)."
      echo ""
      echo "Options:"
      echo "  --dry-run              Show what would be installed without making changes"
      echo "  --help                 Show this help message"
      echo ""
      echo "Environment variables:"
      echo "  DRY_RUN                Set to 'true' for dry run mode"
      echo ""
      echo "Examples:"
      echo "  $0                     # Install globally"
      echo "  $0 --dry-run           # Preview what would be installed"
      echo ""
      echo "After installation:"
      echo "  - markdownlint-cli2 will be available as a global command"
      echo "  - markdownlint-trap rules will work in any project"
      echo "  - VS Code extension will pick up rules automatically"
      echo "  - Works in both Node.js and non-Node.js projects"
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

# Get the repository root (parent of scripts directory)
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log "Installing markdownlint-trap globally..."
echo ""

# Check if npm link has already been run
if npm list -g --depth=0 markdownlint-trap &>/dev/null; then
  success "✓ markdownlint-trap is already globally linked"
else
  if [ "$DRY_RUN" = "true" ]; then
    log "[dry-run] Would run: npm link in $REPO_ROOT"
  else
    log "Globally linking markdownlint-trap from: $REPO_ROOT"
    if (cd "$REPO_ROOT" && npm link); then
      success "✓ Globally linked markdownlint-trap"
    else
      error "Failed to globally link markdownlint-trap"
      exit 1
    fi
  fi
fi

echo ""

# Install markdownlint-cli2 globally
if command -v markdownlint-cli2 &>/dev/null; then
  current_version=$(markdownlint-cli2 --version 2>/dev/null || echo "unknown")
  success "✓ markdownlint-cli2 is already installed globally (version: $current_version)"
else
  if [ "$DRY_RUN" = "true" ]; then
    log "[dry-run] Would run: npm install -g markdownlint-cli2"
  else
    log "Installing markdownlint-cli2 globally..."
    if npm install -g markdownlint-cli2; then
      success "✓ Installed markdownlint-cli2 globally"
    else
      error "Failed to install markdownlint-cli2 globally"
      exit 1
    fi
  fi
fi

echo ""
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$DRY_RUN" = "true" ]; then
  log "DRY RUN COMPLETE - no packages were installed"
  log "Run without --dry-run to install globally"
else
  log "GLOBAL INSTALLATION COMPLETE"
  echo ""
  success "✓ markdownlint-trap is globally linked"
  success "✓ markdownlint-cli2 is globally installed"
  echo ""
  log "You can now use markdownlint-cli2 in any project:"
  log "  cd ~/any-project"
  log "  markdownlint-cli2 '**/*.md'"
  echo ""
  log "VS Code extension will automatically use markdownlint-trap rules"
  log "in any project with .markdownlint-cli2.jsonc or .vscode/settings.json"
fi

log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$DRY_RUN" = "true" ]; then
  echo ""
  log "Run without --dry-run to apply changes"
fi
