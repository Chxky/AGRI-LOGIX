#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./backup-firestore.sh agri-logix gs://agri-logix-backups
#   ./backup-firestore.sh agri-logix gs://agri-logix-backups "seedBags,farmers"
#
# Prerequisites:
#   gcloud CLI installed and authenticated
#   Service account has roles/datastore.importExportAdmin on the project
#   GCS bucket exists in the same region as Firestore

PROJECT_ID="${1:?Usage: $0 <project-id> <bucket-url> [collection-ids-csv]}"
BUCKET_URL="${2:?Usage: $0 <project-id> <bucket-url> [collection-ids-csv]}"
COLLECTION_IDS="${3:-}"

TIMESTAMP=$(date -u +%Y%m%d-%H%M%S)
EXPORT_URI="${BUCKET_URL}/backups/${TIMESTAMP}"

CMD=(gcloud firestore export "$EXPORT_URI" --project="$PROJECT_ID" --async)

if [ -n "$COLLECTION_IDS" ]; then
  IFS=',' read -ra IDS <<< "$COLLECTION_IDS"
  CMD+=(--collection-ids="${IDS[@]}")
fi

echo "Starting Firestore export to ${EXPORT_URI} ..."
echo "Command: ${CMD[*]}"
echo ""

"${CMD[@]}"

echo ""
echo "Export initiated successfully."
echo "Check status via: gcloud firestore operations list --project=${PROJECT_ID}"
echo "Output location: ${EXPORT_URI}"
