# MeshStream Web Demo

[简体中文](README.zh-CN.md)

This repository contains the source for the MeshStream online Web Demo. It
demonstrates HLS, DASH, and native HLS playback with peer count, P2P/CDN
traffic, and offload metrics.

The Demo consumes the public npm package `@meshstream/p2p-web@1.0.1`. It does
not use a workspace dependency, local SDK archive, or MeshStream service source
code.

## MeshStream SDKs

- [Online Demo](https://demo.meshstream.net/) to view the deployed experience.
- [Web Demo](https://github.com/Mesh-Stream/meshstream-p2p-web-sdk) using the published npm SDK.
- [Android SDK](https://github.com/Mesh-Stream/meshstream-p2p-android-sdk) for Media3 / ExoPlayer apps.
- [Apple SDK](https://github.com/Mesh-Stream/meshstream-p2p-ios-sdk) for iOS and macOS apps.
- [Windows SDK](https://github.com/Mesh-Stream/meshstream-p2p-Windows-sdk) for C/C++ desktop apps.

## Features

- hls.js, dash.js, Shaka Player, RxPlayer, Video.js, Plyr, and native HLS;
- SDK Key based playback sessions and player-ready playback URLs;
- real-time peer, P2P download/upload, CDN download, and offload metrics;
- a simulated viewer window for observing segment sharing;
- MSE or Service Worker transport selection using query parameters.

When acceleration is unavailable, the player keeps loading media through the
origin/CDN path. Acceleration status is intended for observability and must not
be used as a reason to interrupt playback.

## Run locally

Node.js 22 or later is required.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, then provide an SDK Key created in the
MeshStream console and a media URL. To prefill the Key during local work:

```bash
VITE_MESHSTREAM_SDK_KEY=your_sdk_key npm run dev
```

## Production build

```bash
npm run build
```

The prebuild step copies `meshstream-sw.js` from the installed npm package.
Deploy the generated `dist/` directory unchanged so Service Worker mode can
register the script from the site root.

## Update the SDK

Change the `@meshstream/p2p-web` version in `package.json`, run `npm install`,
then build and validate the Demo. Do not replace the dependency with a local
path, npm alias, or manually copied SDK build output.

## Support

For SDK integration and service support, contact support@meshstream.net.
