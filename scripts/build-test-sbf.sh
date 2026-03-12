#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/target/test-sbf"
FIXTURE_DIR="$ROOT_DIR/tests/fixtures"
PINNED_MPL_CORE_SO="$FIXTURE_DIR/mpl_core_program.so"
PINNED_MPL_CORE_SHA="$FIXTURE_DIR/mpl_core_program.so.sha256"

mkdir -p "$OUT_DIR"

if [[ ! -f "$PINNED_MPL_CORE_SO" ]]; then
  echo "Missing pinned Metaplex Core fixture at $PINNED_MPL_CORE_SO" >&2
  exit 1
fi

if [[ -f "$PINNED_MPL_CORE_SHA" ]]; then
  (
    cd "$FIXTURE_DIR"
    shasum -a 256 -c "$(basename "$PINNED_MPL_CORE_SHA")"
  )
fi

cp "$PINNED_MPL_CORE_SO" "$OUT_DIR/mpl_core_program.so"
