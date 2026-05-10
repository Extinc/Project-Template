#!/bin/bash

# Usage: ./generate_sbom.sh <project_path> <type> [output_prefix]
# Types supported: react, spring, kmm

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: ./generate_sbom.sh <absolute_or_relative_path_to_project> <type> [output_name]"
  echo "Types: react, spring, kmm"
  echo "Example: ./generate_sbom.sh ../my-frontend react frontend"
  exit 1
fi

# Resolve absolute path to the target project
PROJECT_PATH=$(cd "$1" && pwd)
TYPE=$2
PREFIX=${3:-$TYPE}
OUTPUT_BOM="${PREFIX}_bom.json"

if [ ! -d "$PROJECT_PATH" ]; then
  echo "❌ Error: Directory $1 does not exist."
  exit 1
fi

# Ensure our local 'files' directory exists so we can store the output here
mkdir -p files

echo "🔍 Generating CycloneDX BOM for $TYPE project at $PROJECT_PATH..."

if [ "$TYPE" == "react" ]; then
  docker run --rm -v "$PROJECT_PATH:/workspace" anchore/syft:latest \
    scan dir:/workspace -o cyclonedx-json="/workspace/$OUTPUT_BOM"
  
elif [ "$TYPE" == "spring" ]; then
  # Automatically find all Fat JARs across all modules, ignoring 'plain' jars and buildSrc
  JAR_FILES=$(find "$PROJECT_PATH" -path "*/build/libs/*.jar" -not -path "*/buildSrc/*" ! -name "*-plain.jar" -type f)
  if [ -z "$JAR_FILES" ]; then
    echo "❌ Error: Could not find any built JARs in $PROJECT_PATH/**/build/libs."
    echo "Please build your project first (e.g., ./gradlew bootJar)."
    exit 1
  fi
  
  while IFS= read -r JAR_FILE; do
    JAR_BASENAME=$(basename "$JAR_FILE")
    JAR_DIR=$(dirname "$JAR_FILE")
    MODULE_NAME="${JAR_BASENAME%.jar}"
    
    # If a custom prefix was given, prepend it
    if [ "$PREFIX" != "spring" ]; then
      MODULE_BOM="${PREFIX}_${MODULE_NAME}_bom.json"
    else
      MODULE_BOM="${MODULE_NAME}_bom.json"
    fi

    echo "Scanning module JAR: $JAR_BASENAME"
    docker run --rm -v "$JAR_DIR:/workspace" anchore/syft:latest \
      scan "/workspace/$JAR_BASENAME" -o cyclonedx-json="/workspace/$MODULE_BOM"
      
    if [ -f "$JAR_DIR/$MODULE_BOM" ]; then
      mv "$JAR_DIR/$MODULE_BOM" "./files/$MODULE_BOM"
      echo "✅ Saved to pipeline: ./files/$MODULE_BOM"
    else
      echo "❌ Syft failed on $JAR_BASENAME"
    fi
  done <<< "$JAR_FILES"
  
  echo "============================================="
  echo "✅ All Spring modules successfully generated!"
  echo "🚀 You can now run './scan.sh' to audit them."
  exit 0

elif [ "$TYPE" == "kmm" ]; then
  if [ ! -d "$PROJECT_PATH/build" ]; then
    echo "❌ Error: Could not find build directory in $PROJECT_PATH."
    echo "Please build your project first (e.g., ./gradlew build)."
    exit 1
  fi
  docker run --rm -v "$PROJECT_PATH:/workspace" anchore/syft:latest \
    scan dir:/workspace/build -o cyclonedx-json="/workspace/$OUTPUT_BOM"

else
  echo "❌ Unknown type: $TYPE. Use 'react', 'spring', or 'kmm'."
  exit 1
fi

# Move the generated file directly into your scanning pipeline!
if [ -f "$PROJECT_PATH/$OUTPUT_BOM" ]; then
  mv "$PROJECT_PATH/$OUTPUT_BOM" "./files/$OUTPUT_BOM"
  echo "============================================="
  echo "✅ BOM successfully generated!"
  echo "📁 Saved directly to your pipeline: ./files/$OUTPUT_BOM"
  echo "🚀 You can now run './scan.sh' to audit it."
else
  echo "❌ Syft failed to generate the BOM."
  exit 1
fi
