#!/bin/bash

echo "Starting Batch Scan for all BOM files in the 'files' directory..."
echo ""

# Ensure reports directory exists
mkdir -p reports

# Loop through all JSON files in the 'files' folder
for BOM_FILE in files/*bom.json; do
  if [ -f "$BOM_FILE" ]; then
    # Get the filename without the .json extension (e.g., 'webservice1_bom')
    BASENAME=$(basename "$BOM_FILE" .json)
    
    echo "============================================="
    
    # Check if we should skip sanitization
    if [ "${SKIP_SANITIZE:-false}" = "true" ] || [ "$1" = "--no-sanitize" ]; then
      echo "⚠️ Step 0: Skipping Sanitization for $BOM_FILE..."
    else
      echo "🛡️ Step 0: Sanitizing $BOM_FILE (using sanitize_config.json)..."
      node sanitize_bom.js "$BOM_FILE" --config sanitize_config.json
    fi
      
    # Backup previous scan if it exists to enable Diff tracking
    if [ -f "reports/${BASENAME}-results.json" ]; then
      cp "reports/${BASENAME}-results.json" "reports/${BASENAME}-results.previous.json"
    fi

    echo "🚀 Step 1: Scanning $BOM_FILE using local Trivy (Strictly Offline)..."
    docker run --rm -v $(pwd):/app --network host aquasec/trivy:latest sbom "/app/$BOM_FILE" \
      --server http://host.docker.internal:4954 \
      --list-all-pkgs \
      --offline-scan \
      --skip-db-update \
      --skip-java-db-update \
      --skip-version-check \
      -f json \
      -o "/app/reports/${BASENAME}-results.json"

    echo "🔍 Step 2: Verifying Scan Integrity..."
    node verify_scan.js "$BOM_FILE" "reports/${BASENAME}-results.json"

    echo "📊 Step 3: Generating Custom HTML Report for $BOM_FILE..."
    node generate_custom_report.js "reports/${BASENAME}-results.json" "reports/${BASENAME}-report.html"

    echo "✅ Finished: reports/${BASENAME}-report.html"
    echo ""
  fi
done

echo "🌐 Step 4: Generating Dashboard Index and Combined Confluence Report..."
node generate_index.js

echo "🎉 All scans complete! Check the 'reports' folder for the new outputs."
