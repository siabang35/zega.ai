#!/usr/bin/env bash
# 🦀 ZeroClaw Gateway Daemon Live Demo Launcher
# Runs the ZeroClaw Gateway Daemon Harness on port 4242 and pairs with ZEGA Fastify API.

set -e

echo "🦀 Starting ZeroClaw Gateway Daemon Live Demo..."
echo "📡 Gateway Address: http://127.0.0.1:4242"
echo "⚙️ Config File: docs/zeroclaw/config.toml"
echo "📜 SOP Engine Directory: docs/zeroclaw/sops"
echo ""

pnpm zeroclaw:daemon
