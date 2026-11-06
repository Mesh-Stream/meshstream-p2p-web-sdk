# Changelog

## 1.0.3 — 2026-11-06

- Count CDN HLS fragment bytes and attempts while bootstrap is pending or P2P falls back.
- Keep Demo statistics polling active during CDN-only startup so playback metrics do not freeze.
- Updated the Demo to consume `@meshstream/p2p-web@1.0.3`.

## 1.0.2 — 2026-11-06

- Updated the Demo to consume `@meshstream/p2p-web@1.0.2`.
- Added the verified SDK tarball and release metadata for the 1.0.2 delivery.
- The SDK release includes resilient bootstrap retry/fallback behavior while keeping
  playback independent from telemetry and P2P availability.

## 1.0.1 — 2026-10-27

- Updated the Demo to consume `@meshstream/p2p-web@1.0.1`.
- Added the verified SDK tarball and release metadata for the 1.0.1 delivery.
- The SDK release was built and verified from the P2PCDN Web SDK workspace.
