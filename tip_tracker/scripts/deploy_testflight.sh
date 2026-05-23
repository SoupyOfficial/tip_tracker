#!/bin/bash

# =============================================================================
# TestFlight Build & Deploy Script — Tip Tracker
# Adapted from ash_trail's deploy_testflight.sh
#
# Usage:
#   ./scripts/deploy_testflight.sh                  # bump patch (default)
#   ./scripts/deploy_testflight.sh --patch           # bump patch: 1.0.1 → 1.0.2
#   ./scripts/deploy_testflight.sh --minor           # bump minor: 1.0.1 → 1.1.0
#   ./scripts/deploy_testflight.sh --major           # bump major: 1.0.1 → 2.0.0
#   ./scripts/deploy_testflight.sh --no-bump         # keep current version
#   ./scripts/deploy_testflight.sh --build 42        # explicit build number
#   SKIP_TESTS=1 ./scripts/deploy_testflight.sh      # skip tests
#   SKIP_CLEAN=1 ./scripts/deploy_testflight.sh      # skip flutter clean
#
# Flags can be combined:
#   ./scripts/deploy_testflight.sh --minor --build 50
# =============================================================================

set -euo pipefail

# Colors (disabled in CI for cleaner logs)
if [ -t 1 ]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  BLUE='\033[0;34m'
  NC='\033[0m'
else
  RED='' GREEN='' YELLOW='' BLUE='' NC=''
fi

# Resolve project root (script lives in scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# ── Configuration ──────────────────────────────────────────────────────────────
BUNDLE_ID="com.soup.tipTally"
TEAM_ID="DGQ5P34GS9"
IPA_PATH="build/ios/ipa/tip_tracker.ipa"

# ── Parse arguments ───────────────────────────────────────────────────────────
BUMP_TYPE="patch"  # default: bump patch version
EXPLICIT_BUILD=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --major)  BUMP_TYPE="major"; shift ;;
    --minor)  BUMP_TYPE="minor"; shift ;;
    --patch)  BUMP_TYPE="patch"; shift ;;
    --no-bump) BUMP_TYPE="none"; shift ;;
    --build)
      if [ -n "${2:-}" ]; then
        EXPLICIT_BUILD="$2"; shift 2
      else
        echo -e "${RED}✗ --build requires a number${NC}"; exit 1
      fi
      ;;
    [0-9]*)
      # Legacy support: bare number = explicit build number
      EXPLICIT_BUILD="$1"; shift ;;
    *)
      echo -e "${RED}✗ Unknown argument: $1${NC}"
      echo "Usage: $0 [--major|--minor|--patch|--no-bump] [--build N]"
      exit 1
      ;;
  esac
done

# ── Version bumping ───────────────────────────────────────────────────────────
# Read current version from pubspec.yaml
CURRENT_VERSION_LINE=$(grep '^version:' pubspec.yaml)
CURRENT_VERSION=$(echo "$CURRENT_VERSION_LINE" | sed 's/version: //' | sed 's/+.*//')
CURRENT_BUILD=$(echo "$CURRENT_VERSION_LINE" | sed 's/.*+//')

# Split version into major.minor.patch
IFS='.' read -r V_MAJOR V_MINOR V_PATCH <<< "$CURRENT_VERSION"

case "$BUMP_TYPE" in
  major)
    V_MAJOR=$((V_MAJOR + 1))
    V_MINOR=0
    V_PATCH=0
    ;;
  minor)
    V_MINOR=$((V_MINOR + 1))
    V_PATCH=0
    ;;
  patch)
    V_PATCH=$((V_PATCH + 1))
    ;;
  none)
    # Keep current version
    ;;
esac

VERSION_NAME="${V_MAJOR}.${V_MINOR}.${V_PATCH}"

# Build number: explicit > env > auto-increment
if [ -n "$EXPLICIT_BUILD" ]; then
  BUILD_NUMBER="$EXPLICIT_BUILD"
elif [ -n "${BUILD_NUMBER:-}" ]; then
  BUILD_NUMBER="$BUILD_NUMBER"
else
  BUILD_NUMBER=$((CURRENT_BUILD + 1))
fi

# Update pubspec.yaml with new version
NEW_VERSION_LINE="version: ${VERSION_NAME}+${BUILD_NUMBER}"
sed -i '' "s/^version:.*/$NEW_VERSION_LINE/" pubspec.yaml
echo -e "${GREEN}✓${NC} Updated pubspec.yaml: ${CURRENT_VERSION}+${CURRENT_BUILD} → ${VERSION_NAME}+${BUILD_NUMBER}"

echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       TestFlight Build & Deploy               ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo -e "${BLUE}  Version:      ${NC}${VERSION_NAME}+${BUILD_NUMBER}"
echo -e "${BLUE}  Bump:         ${NC}${BUMP_TYPE}"
echo -e "${BLUE}  Bundle ID:    ${NC}${BUNDLE_ID}"
echo ""

# ── Step 1: Preflight checks ──────────────────────────────────────────────────
echo -e "${YELLOW}[1/6] Preflight checks...${NC}"

if ! command -v flutter &> /dev/null; then
  echo -e "${RED}✗ Flutter not found in PATH${NC}"
  exit 1
fi

if ! command -v xcrun &> /dev/null; then
  echo -e "${RED}✗ xcrun not found — Xcode CLI tools required${NC}"
  exit 1
fi

# Check upload credentials
if [ -n "${APP_STORE_CONNECT_API_KEY:-}" ] && [ -n "${APP_STORE_CONNECT_ISSUER_ID:-}" ]; then
  # Check for .p8 key file
  KEY_FILE="${HOME}/.private_keys/AuthKey_${APP_STORE_CONNECT_API_KEY}.p8"
  if [ ! -f "$KEY_FILE" ]; then
    # CI may decode it from base64
    if [ -n "${APP_STORE_CONNECT_API_KEY_BASE64:-}" ]; then
      echo -e "  Decoding API key from base64..."
      mkdir -p "${HOME}/.private_keys"
      echo -n "$APP_STORE_CONNECT_API_KEY_BASE64" | base64 --decode > "$KEY_FILE"
      chmod 600 "$KEY_FILE"
    else
      echo -e "${RED}✗ API key file not found: ${KEY_FILE}${NC}"
      echo "  Run: mv ~/Downloads/AuthKey_${APP_STORE_CONNECT_API_KEY}.p8 ~/.private_keys/"
      exit 1
    fi
  fi
  UPLOAD_METHOD="altool"
  echo -e "  ${GREEN}✓${NC} API key found (${APP_STORE_CONNECT_API_KEY})"
else
  echo -e "${YELLOW}  ⚠ No API credentials found — will build only, skip upload${NC}"
  echo "  Set APP_STORE_CONNECT_API_KEY and APP_STORE_CONNECT_ISSUER_ID to enable upload"
  UPLOAD_METHOD="none"
fi

echo -e "  ${GREEN}✓${NC} Flutter $(flutter --version --machine 2>/dev/null | grep -o '"frameworkVersion":"[^"]*"' | cut -d'"' -f4 || echo "installed")"

# ── Step 2: Clean & dependencies ──────────────────────────────────────────────
echo -e "\n${YELLOW}[2/6] Clean & dependencies...${NC}"

if [ -z "${SKIP_CLEAN:-}" ]; then
  echo -e "  Cleaning build artifacts..."
  flutter clean > /dev/null 2>&1
else
  echo -e "  Skipping clean (SKIP_CLEAN=1)"
fi

echo -e "  Installing Flutter packages..."
flutter pub get > /dev/null 2>&1
echo -e "  ${GREEN}✓${NC} Dependencies installed"

# ── Step 3: Tests ─────────────────────────────────────────────────────────────
echo -e "\n${YELLOW}[3/6] Tests...${NC}"

if [ -z "${SKIP_TESTS:-}" ]; then
  if flutter test 2>&1 | tail -1; then
    echo -e "  ${GREEN}✓${NC} Tests passed"
  else
    echo -e "  ${YELLOW}⚠ Tests failed — continuing with build${NC}"
  fi
else
  echo -e "  Skipped (SKIP_TESTS=1)"
fi

# ── Step 4: Build IPA ─────────────────────────────────────────────────────────
echo -e "\n${YELLOW}[4/6] Building IPA...${NC}"
echo -e "  This may take a few minutes..."

flutter build ipa \
  --release \
  --build-number="$BUILD_NUMBER" \
  --export-options-plist=ios/ExportOptions.plist \
  2>&1 | while IFS= read -r line; do
    # Show progress dots for long builds, full output on error
    if echo "$line" | grep -qi "error\|fail\|exception"; then
      echo -e "  ${RED}$line${NC}"
    fi
  done

# Verify IPA exists
if [ ! -f "$IPA_PATH" ]; then
  # Try to find it
  FOUND_IPA=$(find build/ios/ipa -name "*.ipa" -type f 2>/dev/null | head -1)
  if [ -n "$FOUND_IPA" ]; then
    IPA_PATH="$FOUND_IPA"
  else
    echo -e "${RED}✗ IPA not found after build${NC}"
    echo "  Check build output above for errors"
    exit 1
  fi
fi

IPA_SIZE=$(du -h "$IPA_PATH" | cut -f1)
echo -e "  ${GREEN}✓${NC} IPA built: ${IPA_PATH} (${IPA_SIZE})"

# ── Step 5: Validate IPA ──────────────────────────────────────────────────────
echo -e "\n${YELLOW}[5/6] Validating IPA...${NC}"

if [ "$UPLOAD_METHOD" = "altool" ]; then
  VALIDATE_OUTPUT=$(xcrun altool --validate-app --type ios \
    -f "$IPA_PATH" \
    --apiKey "$APP_STORE_CONNECT_API_KEY" \
    --apiIssuer "$APP_STORE_CONNECT_ISSUER_ID" \
    2>&1) || true
  echo "$VALIDATE_OUTPUT" | tail -5

  if echo "$VALIDATE_OUTPUT" | grep -q "ERROR:"; then
    echo -e "  ${RED}✗ Validation failed${NC}"
    echo -e "  ${YELLOW}If the app isn't registered, create it at https://appstoreconnect.apple.com/apps${NC}"
    exit 1
  fi
  echo -e "  ${GREEN}✓${NC} Validation passed"
else
  echo -e "  Skipped (no credentials)"
fi

# ── Step 6: Upload to TestFlight ──────────────────────────────────────────────
echo -e "\n${YELLOW}[6/6] Uploading to TestFlight...${NC}"

if [ "$UPLOAD_METHOD" = "altool" ]; then
  UPLOAD_OUTPUT=$(xcrun altool --upload-app --type ios \
    -f "$IPA_PATH" \
    --apiKey "$APP_STORE_CONNECT_API_KEY" \
    --apiIssuer "$APP_STORE_CONNECT_ISSUER_ID" \
    2>&1) || true
  echo "$UPLOAD_OUTPUT"

  if echo "$UPLOAD_OUTPUT" | grep -q "ERROR:"; then
    echo -e "\n${RED}✗ Upload failed — see error above${NC}"
    echo -e "  ${YELLOW}If the app isn't registered, create it at https://appstoreconnect.apple.com/apps${NC}"
    exit 1
  fi

  echo -e "\n${GREEN}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  ✓ Uploaded to TestFlight successfully!       ║${NC}"
  echo -e "${GREEN}║  Version: ${VERSION_NAME}+${BUILD_NUMBER}$(printf '%*s' $((25 - ${#VERSION_NAME} - ${#BUILD_NUMBER})) '')║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
  echo ""
  echo "  Build will appear in App Store Connect in ~5-15 minutes."
  echo "  https://appstoreconnect.apple.com/apps"
else
  echo -e "  Skipped (no credentials)"
  echo -e "\n${GREEN}✓ Build complete:${NC} ${IPA_PATH}"
  echo "  Upload manually with:"
  echo "  xcrun altool --upload-app --type ios -f $IPA_PATH \\"
  echo "    --apiKey \"\$APP_STORE_CONNECT_API_KEY\" \\"
  echo "    --apiIssuer \"\$APP_STORE_CONNECT_ISSUER_ID\""
fi
