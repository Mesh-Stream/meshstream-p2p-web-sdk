# Changelog

## 1.1.7 — 2026-11-13

- Share one per-session scheduler for periodic and peer/error reports, with at least 20 seconds between ordinary writes.
- Merge queued events into the latest cumulative statistics snapshot and prevent overlapping report timers.
- Send pagehide snapshots immediately through keepalive, even while another report is pending, using an unexpired cached session token.
- Keep disposal reports, playback callbacks, CDN fallback and unique-media traffic accounting intact.

## 1.1.6 — 2026-11-12

- Fix authenticated Service Worker P2P recovery when bootstrap finishes after CDN playback starts: admit the existing session before Tracker connection and statistics reporting.
- Keep CDN playback and accumulated download statistics when session admission is unavailable.
- Add regression coverage for late HLS/MP4/MP3 authorization and token failure.

## 1.1.5 — 2026-11-12

- Reject oversized cache entries without evicting useful cached media; refresh memory diagnostics after pruning.
- Coalesce peer/error telemetry bursts and release pending report timers on disposal.
- Use a 90-second default periodic report interval with a bounded 30–40-second first sample; platform report settings still apply.
- Apply platform peer and offer limits consistently across the supported playback transports.
- Preserve live retention, CDN playback fallback and unique-media download accounting.

## Repository maintenance — 2026-11-09

- Archive SDK tarballs as GitHub Release attachments instead of keeping them in the main branch.
- Preserve historical manifests and tags; npm package versions and the Demo dependency are unchanged.
- Download and verify release size, checksums, package name and version before Trusted Publishing.

## 1.1.4 — 2026-11-08

- Deduplicate overlapping MP4/MP3 byte ranges across P2P, CDN fallback and repeated seeks.
- Keep Demo traffic counters source-aware by using the SDK statistics snapshot directly.
- Verify that final Service Worker reports contain the deduplicated download counters.
- Updated the Demo to consume `@meshstream/p2p-web@1.1.4`.

## 1.1.3 — 2026-11-08

- Normalize HLS byte ranges across hls.js and Core for consistent media-byte accounting.
- Share deduplication across Shaka, dash.js, RxPlayer CDN fallback and recovered P2P paths.
- Read Shaka Range headers and ignore zero-byte responses when claiming media segments.
- Add regression coverage for repeated seeks, byte ranges, Shaka fallback and zero-byte retries.
- Updated the Demo to consume `@meshstream/p2p-web@1.1.3`.

## 1.1.2 — 2026-11-08

- Share one per-session media segment ledger between CDN fallback and recovered P2P playback.
- Keep seek and recreated runtime IDs from double-counting the same URL and byte range.
- Add regression coverage for cross-source recovery accounting and byte-range media.
- Updated the Demo to consume `@meshstream/p2p-web@1.1.2`.

## 1.1.1 — 2026-11-08

- Fix CDN media-byte accounting across repeated HLS seeks by de-duplicating completed fragments by URL and byte range.
- Preserve cumulative CDN bytes in P2P recovery and statistics reports.
- Add regression coverage for repeated seeks, byte-range HLS fragments, and late bootstrap recovery.
- Updated the Demo to consume `@meshstream/p2p-web@1.1.1`.

## 1.1.0 — 2026-11-08

- Release the verified Web SDK build with the complete HLS, DASH, MP3, and MP4 fallback and recovery matrix.
- Preserve playback, statistics callbacks, P2P reporting, CDN fallback, and player adapter behavior across bootstrap failures and delayed recovery.
- Updated the Demo to consume `@meshstream/p2p-web@1.1.0`.

## 1.0.11 — 2026-11-07

- Upgrade an already-playing CDN HLS session after delayed Bootstrap without restarting playback.
- Replay the current hls.js manifest state so the late P2P client joins the tracker and begins reporting.
- Preserve CDN traffic counters and event subscriptions across the upgrade.
- Updated the Demo to consume `@meshstream/p2p-web@1.0.11`.

## 1.0.5 — 2026-11-06

- Attach P2P to an already-playing CDN HLS session after bootstrap completes without reloading the media element or resetting playback position.
- Preserve CDN counters and public playback event subscriptions across the late P2P upgrade.
- Updated the Demo to consume @meshstream/p2p-web@1.0.5.

## 1.0.4 — 2026-11-06

- Keep CDN HLS fallback on hls.js for MSE-capable browsers so fragment statistics continue during bootstrap outages.
- Preserve Native HLS fallback for platforms explicitly classified as `native-hls-cdn`.
- Updated the Demo to consume `@meshstream/p2p-web@1.0.4`.

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
