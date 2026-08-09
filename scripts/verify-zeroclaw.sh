#!/usr/bin/env bash
# ⚡ ZEGA ZeroClaw Runtime Verifier Script
# Validates that the official ZeroClaw Rust binary is installed and executable.

set -e

echo "🔍 Verifying ZeroClaw Rust Runtime..."

if command -v zeroclaw >/dev/null 2>&1; then
    VERSION=$(zeroclaw --version 2>&1 || echo "unknown")
    echo "✅ Official ZeroClaw Rust binary found: ${VERSION}"
    exit 0
else
    echo "⚠️  ZeroClaw Rust binary ('zeroclaw') is NOT installed in PATH."
    echo "ℹ️  To install official ZeroClaw Rust runtime v0.8.3:"
    echo "    cargo install zeroclaw --version 0.8.3"
    echo "    OR download pre-built binary from https://github.com/zeroclaw-labs/zeroclaw/releases"
    echo ""
    echo "ℹ️  Note: Development harness is available at: pnpm zeroclaw:dev-harness"
    echo "    (Labeled DEVELOPMENT ONLY — NOT THE BOUNTY RUNTIME)"
    exit 1
fi
