# Testing the demo

[简体中文](testing.zh-CN.md) · [Back to README](../README.md)

Configure your SDK Key and allowed origins first. To test the production build,
run `npm run build` and use the preview server. Check that the SDK version shown
on the page matches `package.json`.

## Playback and P2P

Select hls.js and click Play. Video should keep playing and HTTP down should
increase as media downloads. The default streams are third-party resources;
use media you control for release testing.

Click Simulate Peer, allow the popup, and keep both windows playing the same media
at nearby positions. Watch Peers, P2P down and P2P up. A connected peer alone does
not confirm a transfer. Buffered data may satisfy playback without new downloads,
and seeking over the same data need not increase counters. NAT, firewalls and
buffering also affect P2P. CDN and P2P traffic can occur together.

For MP4, select the MP4 tab to use the bundled Sintel clip. Custom sources should
support Range requests; look for `206` and a valid `Content-Range` in Network.
Seek to different positions and check that playback resumes. Cross-origin media
also needs [CORS](deployment.md#media-origin). See the clip's [NOTICE](../public/media/NOTICE.txt).

Switch players a few times and close the simulated window. Check for uncaught
errors and confirm that the remaining window keeps playing. Test Safari and
mobile browsers on their own devices; desktop Chrome results do not cover them.

## CDN fallback

Find the Tracker connection in Network, block its address with the browser's
request-blocking tool, and start a new playback session. Keep the media origin
reachable. Playback should continue over CDN and HTTP down should increase.
The global Offline switch is unsuitable because it also disconnects the media origin.

Repeat playback, P2P and fallback checks on the deployed HTTPS site. Record the
browser, SDK version, player, media URL and results, removing signed URL parameters.

## Players and parameters

The hls.js tab uses SDK-managed HLS. The dash.js, RxPlayer and Shaka tabs create
their respective players and connect them through adapters. The video.js / plyr.js
tabs currently use the general `attach` path without creating those two players.
Native HLS depends on the browser; the tab does not force native HLS on Chrome.

Common test links:

```text
http://localhost:5173/?player=hls.js&transport=mse
http://localhost:5173/?player=hls.js&transport=service-worker
http://localhost:5173/?player=dash.js
http://localhost:5173/?player=rxplayer
http://localhost:5173/?player=shaka
http://localhost:5173/?player=mp4
```

`player` also accepts `video.js`, `plyr.js` and `native`. `url` overrides the media
URL; encode it if it contains query parameters. `key` overrides the prefilled key,
and `autoplay=1` requests muted autoplay. A click may still be required. Simulate
Peer preserves the current media, key, player and transport.

`transport` affects SDK-managed paths. The dash.js, RxPlayer and Shaka integrations
use their own adapters. MP4 always uses Service Worker transport and needs HTTPS
or localhost.

## Troubleshooting

For playback failures, check the key's status and allowed origin, then inspect
media requests and console errors. Fix CORS at the media origin. For failed MP4
seeks, check Range responses.

If P2P stays at zero, confirm that both windows are requesting nearby media
segments, then check WebRTC, Tracker connectivity, application quota and network
rules. For Worker registration failures, open the Worker URL directly: it should
return JavaScript, not a 404 or an HTML fallback. See [subdirectory deployment](deployment.md#subdirectories)
for path configuration.

`npm test` only checks types. Run release-archive validation tests separately:

```bash
node --test scripts/verify-release-archive.test.mjs
```

These test archive checks, not playback. SDK source tests run in the SDK build
repository before publication.
