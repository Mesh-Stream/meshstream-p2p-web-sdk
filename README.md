# MeshStream P2P Web SDK

[简体中文](README.zh-CN.md) · [Website](https://meshstream.net/) · [Documentation](https://meshstream.net/docs/sdk/web-setup/) · [npm](https://www.npmjs.com/package/@meshstream/p2p-web) · [Live demo](https://demo.meshstream.net/)

MeshStream is a JavaScript / TypeScript P2P video and audio streaming SDK for the browser. It adds WebRTC peer-assisted delivery to HLS, MPEG-DASH, MP4 and MP3 playback, with HTTP/CDN fallback when P2P is unavailable.

This repository contains integration examples and the live demo, using the published `@meshstream/p2p-web@1.1.7` package.

## Features

- HLS and MPEG-DASH streaming, plus HTTP Range MP4/MP3 media with origin CORS support.
- Integration paths for hls.js, dash.js, Shaka Player and RxPlayer.
- Peer counts, P2P/CDN download counters and upload statistics.
- npm installation, TypeScript examples and an HTTPS demo with multiple peer windows.

Media decoding and format support depend on your chosen player and platform. P2P availability depends on network conditions and peers with matching content.

## Install

In your frontend project:

```bash
npm install @meshstream/p2p-web@1.1.7
```

Create an application in the [MeshStream console](https://console.meshstream.net/)
and obtain an enabled Web SDK Key. If origin validation is enabled, add your
website's origin, such as `https://video.example.com`, to the allowed list. Add
local development origins too, including the scheme and port you actually use.

Add a video element:

```html
<video controls playsinline></video>
```

Initialize the SDK after the element is available:

```ts
import { attach } from "@meshstream/p2p-web";

const player = attach({
  key: "your_web_sdk_key",
  url: "https://cdn.example.com/video/index.m3u8",
  video: document.querySelector<HTMLVideoElement>("video")!,
  autoplay: false,
});

await player.start();
window.addEventListener("pagehide", () => player.dispose(), { once: true });
```

Use the video controls to start playback. Call `player.dispose()` when unmounting
a component or replacing its media. Service Worker transport also needs a Worker
file on your site; see [deployment](docs/deployment.md#service-worker).

## Run the demo

Use Node.js 22.12+ or 24 LTS. Chrome or Edge is a good browser for the first test.

```bash
git clone https://github.com/Mesh-Stream/meshstream-p2p-web-sdk.git
cd meshstream-p2p-web-sdk
npm ci
cp .env.example .env.local
```

Set your key in `.env.local`:

```dotenv
VITE_MESHSTREAM_SDK_KEY=your_web_sdk_key
```

Start the dev server:

```bash
npm run dev
```

Open the address printed by Vite, normally `http://localhost:5173`. If origin
validation is enabled, allow this address. Update the allowed origin if Vite
chooses another port. `localhost` and `127.0.0.1` need separate entries.

Select hls.js, keep the sample media URL or enter your own, and click **Play**.
The page shows the SDK version, peers and P2P/CDN traffic. You can also enter the
key directly on the page.

The demo installs the SDK from npm and connects to MeshStream services; it needs
no local backend. Its dash.js, RxPlayer and Shaka tabs use those player instances.
The video.js / plyr.js tabs currently use the SDK's general playback path without
loading those two players. See [players and parameters](docs/testing.md#players-and-parameters).

## Test

```bash
npm test
npm run build
npm run preview -- --host 127.0.0.1 --strictPort
```

`npm test` checks TypeScript types. Open `http://127.0.0.1:4173` to check the built
page. Preview uses the production configuration, so set your production key as
described below and allow the preview origin first.

To check P2P, click **Simulate Peer** and keep both windows playing the same media
at nearby positions. A nonzero Peers count means another viewer was found;
increasing P2P down or P2P up means data is being transferred. With one viewer,
most traffic will normally come from the CDN.

See [testing](docs/testing.md) for playback, seeking, CDN fallback and player checks.

## Deploy

The demo builds to a static site for Nginx or a static hosting service.

```bash
cp .env.example .env.production.local
```

Set your own key in `.env.production.local`, then build:

```bash
npm run build
```

Upload all contents of `dist/`, serve the site over HTTPS, and allow its production
origin in the console. For hosted builds, use `npm ci` as the install command,
`npm run build` as the build command, and `dist` as the output directory. Set
`VITE_MESHSTREAM_SDK_KEY` in the host's build environment.

The committed `.env.production` configures the official demo. Override it with
`.env.production.local` or a build environment variable for your deployment;
`.env.local` alone will not override it. Values are embedded during the build,
so rebuild after changes. Keep backend secrets out of `VITE_*` variables.

Include `dist/meshstream-sw.js` and `dist/media/` in the upload. Workers require
HTTPS or localhost; an ordinary LAN HTTP address will not work. See
[deployment](docs/deployment.md) for Nginx, subdirectories, media CORS and caching.

## Other platforms

- [iOS / macOS](https://github.com/Mesh-Stream/meshstream-p2p-ios-sdk): `MeshStreamKit` for native Apple apps, installed through Swift Package Manager or CocoaPods.
- [Android](https://github.com/Mesh-Stream/meshstream-p2p-android-sdk): Maven SDK for Kotlin / Java apps, with Media3 / ExoPlayer integration.
- [Windows](https://github.com/Mesh-Stream/meshstream-p2p-Windows-sdk): C / C++ API for Windows 10 / 11 x64 desktop apps.
- [uni-app](https://github.com/Mesh-Stream/meshstream-p2p-uniapp-sdk): UTS plugin for uni-app Vue 3 apps, integrating the native iOS and Android SDKs.
- [Flutter](https://github.com/Mesh-Stream/meshstream-p2p-flutter-sdk): `meshstream_p2p` Dart plugin for iOS / Android, usable with `video_player`.
- [React Native](https://github.com/Mesh-Stream/meshstream-p2p-react-native-sdk): `react-native-meshstream` npm package for iOS / Android, usable with `react-native-video`.

## Upgrades and support

To update the demo, install an exact published version and commit both
`package.json` and `package-lock.json`:

```bash
npm install --save-exact @meshstream/p2p-web@<version>
```

`npm run dev` and `npm run build` copy the matching Worker from the installed SDK.
Historical packages are in [GitHub Releases](https://github.com/Mesh-Stream/meshstream-p2p-web-sdk/releases);
version and checksum records are in `releases/`. Maintainers can follow the
[publishing procedure](releases/README.md).

For help, contact support@meshstream.net with the SDK version, browser version,
selected player and error logs. Remove signed parameters from media URLs before sharing.
