# MeshStream Web SDK Demo

[简体中文](README.zh-CN.md) · [Online Demo](https://demo.meshstream.net/) · [npm SDK](https://www.npmjs.com/package/@meshstream/p2p-web)

Run a browser Demo of MeshStream HLS, DASH and MP4 delivery, inspect P2P/CDN traffic,
and deploy the same Demo to your own HTTPS domain. This repository contains a
Vite + TypeScript frontend that installs **`@meshstream/p2p-web@1.1.4` from npm**.
SDK development and compilation take place in P2PCDN; running this Demo requires
no local Tracker, API server, database or native SDK build.

- [Requirements and SDK Key](#requirements-and-sdk-key)
- [Run locally](#run-locally)
- [Environment configuration](#environment-configuration)
- [Players and test links](#players-and-test-links)
- [Testing and acceptance](#testing-and-acceptance)
- [Build and deploy](#build-and-deploy)
- [Troubleshooting](#troubleshooting)
- [Use or upgrade the SDK](#use-or-upgrade-the-sdk)

## Requirements and SDK Key

| Requirement | What to prepare |
| --- | --- |
| Runtime | Node.js 22.12+ or 24 LTS, with npm. Node.js 24 LTS is recommended. |
| Browser | A current Chrome or Edge is a useful starting point. Native HLS depends on browser support; test Safari separately. |
| MeshStream account | Create an application and an enabled Web SDK Key in the [console](https://console.meshstream.net/). |
| Website identity | When origin validation is enabled, allow the exact origins used for development, preview and deployment. Examples: `http://localhost:5173`, `http://127.0.0.1:4173`, `https://demo.example.com`. |
| Media | A reachable HLS `.m3u8`, DASH `.mpd`, or MP4 URL. Cross-origin manifests and media need appropriate CORS responses. |
| Secure context | Service Workers need HTTPS, with a browser exception for `localhost` / loopback. Opening `index.html` through `file://` does not work. |

`localhost` and `127.0.0.1` are different origins; ports also matter. Register the
origins you actually use. A LAN address such as `http://192.168.1.10:5173` does not
receive localhost's secure-context exception. Use HTTPS for phone or LAN tests
that need the Service Worker transport.

The SDK Key is a browser-facing application identifier. Configure domain
restrictions and your application's entitlement/quota in the console. Backend
API secrets, account passwords and publishing tokens do not belong in this site.
The hosted Demo's key is scoped for the hosted Demo; use your own key on your domain.

## Run locally

```bash
git clone https://github.com/Mesh-Stream/meshstream-p2p-web-sdk.git
cd meshstream-p2p-web-sdk
node --version
npm ci
cp .env.example .env.local
```

Edit `.env.local` and set `VITE_MESHSTREAM_SDK_KEY` to your Web SDK Key, then run:

```bash
npm run dev
```

Open the local URL printed by Vite, normally **http://localhost:5173/**. Vite can
choose another port if 5173 is busy; update the allowed origin if necessary.
The scripts listen on all network interfaces; use localhost on the same machine.

1. Select **hls.js** for the first check.
2. Confirm the **SDK Key** field is filled, or enter the key there manually.
3. Use the sample HLS URL or paste your own playable URL and click **Play**.
4. Confirm video time advances and inspect the **SDK version**, **HTTP down**,
   **Peers**, **P2P down/up**, and the log below the player.
5. Click **Simulate Peer**, allow the popup, and keep both windows playing.

Only CDN traffic with one viewer is normal. A successful play does not by itself
prove P2P traffic; see the acceptance steps below.

## Environment configuration

Copyable defaults are in [`.env.example`](.env.example).

| Variable | Default / purpose |
| --- | --- |
| `VITE_MESHSTREAM_SDK_KEY` | Empty unless configured. Prefills the SDK Key field. A `?key=` query value takes precedence. |
| `VITE_P2PCDN_SDK_KEY` | Legacy alias used only when `VITE_MESHSTREAM_SDK_KEY` is empty. Prefer the variable above. |
| `VITE_P2PCDN_PUBLIC_HOST` | Optional hostname, without scheme, port or path. Redirects `localhost` / `127.0.0.1` to that hostname, retaining the current scheme, port, path and query. Leave empty for normal local work; it does not configure DNS, TLS or an API endpoint. |

Development configuration (`.env.local`, ignored by Git):

```dotenv
VITE_MESHSTREAM_SDK_KEY=your_web_sdk_key
VITE_P2PCDN_PUBLIC_HOST=
```

Production configuration for **your own deployment**:

```bash
cp .env.example .env.production.local
# Edit .env.production.local and set your own Web SDK Key.
npm run build
```

The repository includes `.env.production` for the official Demo. Vite loads it
when building with production mode. **`.env.local` alone does not override values
in `.env.production`**: use `.env.production.local` or your hosting provider's
build environment to override the official Demo key. Existing shell / CI
variables have the highest priority. For example:

```bash
VITE_MESHSTREAM_SDK_KEY=your_web_sdk_key npm run build
```

Vite replaces `VITE_*` variables **at build time**, and those values are visible in
browser assets. Restart the dev server after changing local configuration;
rebuild and redeploy after changing production configuration. Adding variables
on a static server after upload does not change an already built site.

The SDK discovers its MeshStream service endpoints through its standard bootstrap
flow. This Demo exposes no environment setting for a custom Bootstrap/API server;
`VITE_P2PCDN_BOOTSTRAP_URL` is not read by the Demo's configuration code.

## Players and test links

| Demo selection | Actual integration |
| --- | --- |
| hls.js | SDK-managed HLS player. |
| dash.js | An actual dash.js instance attached through `attachToDashJs`. |
| RxPlayer | An actual RxPlayer instance attached through `attachToRxPlayer`. |
| Shaka | An actual Shaka instance attached through `attachToShaka`. |
| video.js / plyr.js | Compatibility selections using SDK-managed `attach`; this Demo does not instantiate Video.js or Plyr. |
| Native HLS | HLS selection; the SDK/browser decides the available playback path. The tab does not force native HLS on every browser. |
| MP4 | Progressive MP4 with Service Worker transport, using the bundled Sintel sample by default. |

You can open a preselected mode using a query string:

```text
http://localhost:5173/?player=hls.js&transport=mse
http://localhost:5173/?player=hls.js&transport=service-worker
http://localhost:5173/?player=dash.js
http://localhost:5173/?player=rxplayer
http://localhost:5173/?player=shaka
http://localhost:5173/?player=mp4
```

`player` also accepts `video.js`, `plyr.js` and `native`. `url` overrides the media
URL; URL-encode it when it contains query parameters. `key` overrides the prefilled
SDK Key, and `autoplay=1` requests muted autoplay. Browsers may still require a
click. **Simulate Peer** opens a second window with the current URL, key, player
and transport; it is a functional check, not a load test.

The `transport` switch applies to the SDK-managed paths; the dash.js, RxPlayer
and Shaka integrations use their own adapter paths. MP4 always requests the
Service Worker transport. Third-party sample streams may change or be unavailable;
use a stream you control for repeatable acceptance. The bundled MP4's attribution
is in [`public/media/NOTICE.txt`](public/media/NOTICE.txt).

## Testing and acceptance

Run these from the repository root:

```bash
npm ci
npm test
node --test scripts/verify-release-archive.test.mjs
npm run build
npm run preview -- --host 127.0.0.1 --strictPort
```

Open **http://127.0.0.1:4173/** for the built-site check and allow that origin. Preview serves the
existing `dist/` build, including the production key baked into that build.

| Check | What it proves |
| --- | --- |
| `npm test` | TypeScript type checking only. It does not start a browser or test playback/P2P. |
| `node --test scripts/verify-release-archive.test.mjs` | Release-archive validation and rejection of invalid/tampered inputs; not playback tests. |
| `npm run build` | TypeScript + production bundling and Service Worker staging. |
| Browser acceptance | Real playback, connectivity, P2P traffic, fallback and release of sessions. |

Use this browser checklist on localhost and again on the deployed HTTPS site:

1. **CDN playback:** use a valid key and media URL. Confirm the video advances,
   HTTP/media requests succeed, and the displayed SDK version is `1.1.4`.
2. **P2P transfer:** start two windows with keys under the same application,
   the same media URL and overlapping playback positions. Confirm Peers becomes
   nonzero and P2P down or P2P up grows while media is being requested. Peer
   discovery alone does not prove a transfer. Buffering, NAT and network rules
   can limit P2P; HTTP down can continue alongside P2P.
3. **CDN fallback:** use the browser's request-blocking tool to block the Tracker
   request (identify its actual address in Network), then start a new session.
   Keep the media origin reachable. Confirm playback continues via CDN. Do not
   use the browser's global Offline switch: it also disables CDN.
4. **Service Worker / MP4:** test the forced SW HLS URL and the MP4 tab on a secure
   origin. Inspect the Worker in DevTools and media requests in Network. A custom
   MP4 source must support HTTP Range responses. Seek and confirm playback
   continues; repeatedly requesting the same data need not increase SDK counters.
5. **Cleanup:** switch players, close the simulated window, and leave the page.
   Check for uncaught errors and verify the remaining session continues playing.

Record browser/version, origin, player, media URL without signed credentials,
SDK version, P2P/CDN results and errors. SDK source tests are run in P2PCDN before
npm publication; they are not included as a runnable suite in this Demo repository.

## Build and deploy

This is a **static site**. Use an HTTPS static host/CDN or Nginx; no Node.js server
is needed after building. `npm run preview` is a local verification server.

1. Configure the final HTTPS origin in the MeshStream console and use a key valid
   for that origin.
2. Set `VITE_MESHSTREAM_SDK_KEY` in the host's **build** environment, or configure
   `.env.production.local` locally.
3. Set install to `npm ci`, build to `npm run build`, and publish directory to
   **`dist`**. Upload its **contents**, including `meshstream-sw.js` and `media/`.
4. Enable HTTPS and ensure assets, media and the Worker are served from the
   expected paths. A missing JS file must return 404, not an HTML fallback page.
5. Open the deployed site, check the SDK version and repeat browser acceptance.

For a root deployment, these files must be available:

```text
https://demo.example.com/index.html
https://demo.example.com/assets/...
https://demo.example.com/meshstream-sw.js
https://demo.example.com/media/sintel-trailer.mp4
```

For a subdirectory such as `/demo/`, build with that base:

```bash
VITE_MESHSTREAM_SDK_KEY=your_web_sdk_key npm run build -- --base /demo/
```

Serve the contents of `dist/` under `/demo/`. The Worker must be at
`/demo/meshstream-sw.js`. Test SW with `?transport=service-worker` (MP4 selects
this automatically); in this mode the Demo derives the Worker URL and scope from
Vite's base. Without an explicit transport, the SDK default Worker URL may still
point to the domain root. Do not move only `index.html` or rewrite the Worker path
to HTML.

To preview that subdirectory build locally, use the same base:

```bash
npm run preview -- --base /demo/ --host 127.0.0.1 --strictPort
```

Open `http://127.0.0.1:4173/demo/`.

### Nginx example (root deployment)

After DNS, a valid TLS certificate and the `dist/` upload are ready, adapt this
server block. Replace the hostname, certificate paths and web root:

```nginx
server {
    listen 443 ssl;
    server_name demo.example.com;
    ssl_certificate /etc/letsencrypt/live/demo.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/demo.example.com/privkey.pem;
    root /var/www/meshstream-demo;
    include /etc/nginx/mime.types;

    location = /index.html {
        add_header Cache-Control "no-cache" always;
    }
    location = /meshstream-sw.js {
        add_header Cache-Control "no-cache" always;
        try_files $uri =404;
    }
    location / {
        try_files $uri $uri/ =404;
    }
}
```

Configure your CDN to revalidate HTML and the stable `meshstream-sw.js` URL.
Hashed files under `assets/` can use long cache lifetimes. Keep old hashed assets
available during rollout so already-open pages can finish loading their chunks.
For cross-origin media, configure CORS at the **media origin**, not just the Demo
host. Allow the website's origin and required `GET`, `HEAD`, `OPTIONS` and `Range`
requests; expose `Content-Length`, `Content-Type`, `Accept-Ranges` and
`Content-Range`. Byte-range MP4 requests should return `206` with a valid
`Content-Range`. Same-origin MP4 hosted by Nginx normally supports ranges directly.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| SDK Key required | Enter a key or set the build/dev variable, restart/rebuild, and reload. |
| Works locally, P2P fails after deployment | Confirm the production build's key and exact HTTPS allowed origin; inspect bootstrap/session and Tracker failures in Network. |
| Page redirects away from localhost | Clear `VITE_P2PCDN_PUBLIC_HOST` and restart/rebuild. |
| Peers or P2P bytes stay at zero | Keep two matching viewers requesting overlapping segments; check WebRTC capability, application/key status, quota, origin policy and WebSocket/network access. CDN fallback can still play. |
| Service Worker registration fails | Use HTTPS or localhost; confirm the Worker URL returns JavaScript with a JS MIME type, not HTML. For subpaths, check `--base`. A new Worker may need activation/reload. |
| MP4 fails or does not use P2P | Check `Range`/`206`/`Content-Range` and CORS; ordinary full-file playback alone does not verify range-based P2P. |
| No sound / autoplay paused | Click Play or Enable sound; browsers commonly restrict autoplay. |
| Simulated window does not open | Allow popups for the Demo site. |
| Missing Worker file during dev/build | Run `npm ci`; `predev`/`prebuild` copies it from the installed npm SDK. |
| `EINTEGRITY` while installing | Use the committed lockfile from current `main`, confirm the npm registry, then retry `npm ci`. Do not disable integrity checks. |
| Old version after deployment | Confirm the new `dist/` was uploaded, revalidate HTML and Worker caches, then inspect the version displayed on the page. |

## Use or upgrade the SDK

To add the SDK to your own application:

```bash
npm install @meshstream/p2p-web@1.1.4
```

Add `<video controls playsinline></video>` to the page, then in TypeScript:

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

This loads the session and media; the user starts playback using the video
controls. For Service Worker transport in your own app, also deploy the package's
`dist/meshstream-sw.js` on your origin and configure its URL and scope. This
repository's `predev` / `prebuild` script demonstrates copying the file.

For this Demo's next upgrade, install a **published exact version** with
`npm install --save-exact @meshstream/p2p-web@<version>`, commit both package files,
and repeat the checks above. Ensure the Worker is restaged from the same package.
Maintainers: [archive and npm publishing procedure](releases/README.md).
Archives live in [GitHub Releases](https://github.com/Mesh-Stream/meshstream-p2p-web-sdk/releases);
version/checksum manifests remain in `releases/`.

Related SDKs: [Android](https://github.com/Mesh-Stream/meshstream-p2p-android-sdk) ·
[Apple](https://github.com/Mesh-Stream/meshstream-p2p-ios-sdk) ·
[Windows](https://github.com/Mesh-Stream/meshstream-p2p-Windows-sdk).
Support: support@meshstream.net. Include the browser, origin, SDK version, selected
player and redacted logs; omit tokens, passwords and signed media query values.
