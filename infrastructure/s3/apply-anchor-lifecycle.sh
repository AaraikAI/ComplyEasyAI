#!/usr/bin/env bash
#
# Apply the anchor-retries lifecycle policy to the configured S3 bucket.
#
# Usage:
#   AWS_S3_BUCKET=<bucket-name> ./apply-anchor-lifecycle.sh
#
# Idempotent: PutBucketLifecycleConfiguration REPLACES the existing config.
# To preserve other lifecycle rules, fetch the current config first:
#   aws s3api get-bucket-lifecycle-configuration --bucket "$AWS_S3_BUCKET"
# and merge them into the JSON before re-applying.

set -euo pipefail

BUCKET="${AWS_S3_BUCKET:-}"
if [ -z "$BUCKET" ]; then
  echo "ERROR: AWS_S3_BUCKET env var is required" >&2
  exit 1
fi

POLICY_FILE="$(cd "$(dirname "$0")" && pwd)/anchor-retries-lifecycle.json"
if [ ! -f "$POLICY_FILE" ]; then
  echo "ERROR: lifecycle JSON not found at $POLICY_FILE" >&2
  exit 1
fi

echo "Applying anchor-retries lifecycle to s3://$BUCKET ..."
aws s3api put-bucket-lifecycle-configuration \
  --bucket "$BUCKET" \
  --lifecycle-configuration "file://$POLICY_FILE"

echo "Verifying ..."
aws s3api get-bucket-lifecycle-configuration --bucket "$BUCKET" \
  --query 'Rules[?ID==`AnchorRetriesExpiration`]'

echo "Done."
