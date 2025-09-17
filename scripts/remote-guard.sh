#!/usr/bin/env bash
set -euo pipefail


EXPECTED_ORG="yuna-akazawa" # e.g., yuna-akazawa or your GH org
EXPECTED_REPO="storytime" # e.g., storytime


REMOTE_URL="$(git config --get remote.origin.url || true)"


if [[ -z "${REMOTE_URL}" ]]; then
echo "❌ No git remote 'origin' configured. Aborting."
exit 1
fi


if [[ "${REMOTE_URL}" != *"${EXPECTED_ORG}"* || "${REMOTE_URL}" != *"${EXPECTED_REPO}"* ]]; then
echo "❌ Wrong remote detected: ${REMOTE_URL}"
echo " This project must push to: ${EXPECTED_ORG}/${EXPECTED_REPO}"
exit 1
fi


echo "✅ Remote check passed (${REMOTE_URL})"
