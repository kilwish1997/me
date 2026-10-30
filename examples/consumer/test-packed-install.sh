#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${DIR}/../.." && pwd)"

echo "=== Verifying consumer installation using packed .tgz tarballs ==="
TMP_CONSUMER="/tmp/plotwise-isolated-consumer-test"
rm -rf "${TMP_CONSUMER}"
mkdir -p "${TMP_CONSUMER}"

cd "${TMP_CONSUMER}"
npm init -y > /dev/null

echo "Installing local tarballs into clean directory..."
npm install "${ROOT_DIR}/tarballs/kilwish1997-plotwise-core-0.1.0.tgz" "${ROOT_DIR}/tarballs/kilwish1997-plotwise-react-0.1.0.tgz" --silent

echo "Testing pure Node import from installed package..."
node -e "
  const core = require('@kilwish1997/plotwise-core');
  console.log('Successfully loaded @kilwish1997/plotwise-core from isolated npm install!');
  console.log('Available exports:', Object.keys(core));
"

echo "=== Isolated packed consumer test PASSED! ==="
rm -rf "${TMP_CONSUMER}"
