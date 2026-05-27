#!/bin/bash
# deploy_capacitor_testflight.sh
# Build and deploy Capacitor iOS app to TestFlight
# Uses xcodebuild + xcrun altool (no fastlane/bundler)

set -e

# ── SECURITY NOTICE ──────────────────────────────────────────
# The API key previously embedded in this script and ios/App/api_key.json
# has been compromised and MUST be treated as revoked.
# Generate a new App Store Connect API key before using this script:
#   https://developer.apple.com/documentation/appstoreconnectapi/creating_api_keys_for_app_store_connect_api
# Then set the environment variables listed below.

# ── Required environment variables (with fallback defaults) ──
API_KEY_ID="${APPLE_API_KEY_ID:-2G67S7XV8N}"
API_ISSUER_ID="${APPLE_API_ISSUER_ID:-a9ee901f-b505-4465-90ec-d405cbf25d85}"
TEAM_ID="${APPLE_TEAM_ID:-DGQ5P34GS9}"

# Configuration
PROJECT_DIR="/Volumes/Jacob-SSD/Projects/tip_tracker"
IOS_DIR="$PROJECT_DIR/ios/App"
XCODEPROJ="$IOS_DIR/App.xcodeproj"
SCHEME="App"
BUNDLE_ID="com.soup.tipTally"

API_KEY_PATH="$HOME/.private_keys/AuthKey_${API_KEY_ID}.p8"

# Output paths
ARCHIVE_PATH="$HOME/Library/Developer/Xcode/Archives/$(date +%Y-%m-%d)/${SCHEME} $(date +%Y-%m-%d\ %H.%M.%S).xcarchive"
EXPORT_DIR="$IOS_DIR/build"
EXPORT_PLIST="$IOS_DIR/ExportOptions.plist"
IPA_PATH="$EXPORT_DIR/App.ipa"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err() { echo -e "${RED}[✗]${NC} $1"; }

# Step 0: Preflight
echo "=== Step 0: Preflight Checks ==="
[ -f "$API_KEY_PATH" ] || { err "API key not found at $API_KEY_PATH"; exit 1; }
command -v xcodebuild >/dev/null || { err "xcodebuild not found"; exit 1; }
command -v xcrun >/dev/null || { err "xcrun not found"; exit 1; }
cd "$PROJECT_DIR" || exit 1
log "API key found: $API_KEY_PATH"
log "Project: $XCODEPROJ"

# Step 1: Build Next.js and sync Capacitor
echo ""
echo "=== Step 1: Build Next.js & Sync Capacitor ==="
npm run build
npx cap sync ios
log "Next.js built and Capacitor synced"

# Step 2: Create ExportOptions.plist
echo ""
echo "=== Step 2: Create ExportOptions.plist ==="
cat > "$EXPORT_PLIST" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>${TEAM_ID}</string>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>compileBitcode</key>
    <false/>
    <key>manageAppVersionAndBuildNumber</key>
    <true/>
</dict>
</plist>
PLIST
log "ExportOptions.plist created"

# Step 3: Archive
echo ""
echo "=== Step 3: Archive ==="
xcodebuild archive \
  -project "$XCODEPROJ" \
  -scheme "$SCHEME" \
  -destination "generic/platform=iOS" \
  -archivePath "$ARCHIVE_PATH" \
  -allowProvisioningUpdates \
  -authenticationKeyID "$API_KEY_ID" \
  -authenticationKeyIssuerID "$API_ISSUER_ID" \
  -authenticationKeyPath "$API_KEY_PATH" \
  CODE_SIGN_STYLE=Automatic \
  DEVELOPMENT_TEAM="$TEAM_ID"
log "Archive created: $ARCHIVE_PATH"

# Step 4: Export IPA
echo ""
echo "=== Step 4: Export IPA ==="
mkdir -p "$EXPORT_DIR"
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_DIR" \
  -exportOptionsPlist "$EXPORT_PLIST" \
  -allowProvisioningUpdates \
  -authenticationKeyID "$API_KEY_ID" \
  -authenticationKeyIssuerID "$API_ISSUER_ID" \
  -authenticationKeyPath "$API_KEY_PATH"
log "IPA exported: $IPA_PATH"

# Step 5: Validate
echo ""
echo "=== Step 5: Validate IPA ==="
xcrun altool --validate-app \
  -f "$IPA_PATH" \
  --type ios \
  --apiKey "$API_KEY_ID" \
  --apiIssuer "$API_ISSUER_ID" \
  --apiKeyPath "$API_KEY_PATH"
log "IPA validated"

# Step 6: Upload to TestFlight
echo ""
echo "=== Step 6: Upload to TestFlight ==="
xcrun altool --upload-app \
  -f "$IPA_PATH" \
  --type ios \
  --apiKey "$API_KEY_ID" \
  --apiIssuer "$API_ISSUER_ID" \
  --apiKeyPath "$API_KEY_PATH" \
  --apiKeyPath "$API_KEY_PATH" \
  --apiKeyPath "$API_KEY_PATH" \
  --apiKeyPath "$API_KEY_PATH" \
  --apiKeyPath "$API_KEY_PATH" \
  --apiKeyPath "$API_KEY_PATH" \
  --apiKeyPath "$API_KEY_PATH"
log "Uploaded to TestFlight!"

echo ""
echo "=== Deploy Complete ==="
log "Build uploaded to TestFlight for $BUNDLE_ID"
