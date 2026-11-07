import {
  attach,
  attachToRxPlayer,
  getSdkVersion,
  type MeshStreamMediaPlayer,
  type P2pStats,
} from "@meshstream/p2p-web";
import { attachToDashJs, attachToShaka } from "@meshstream/p2p-web-published/adapters";
import * as dashjs from "dashjs";
import "./style.css";

const HLS_MANIFEST_PARSED_EVENT = "hlsManifestParsed";
const HLS_ERROR_EVENT = "hlsError";
type Protocol = "hls" | "dash" | "native" | "mp4";
type PlayerId = "hls.js" | "dash.js" | "rxplayer" | "video.js" | "plyr.js" | "shaka" | "native" | "mp4";
type DemoTransportPreference = "auto" | "mse" | "service-worker";

const playerProtocol: Record<PlayerId, Protocol> = {
  "hls.js": "hls",
  "dash.js": "dash",
  "rxplayer": "dash",
  "video.js": "hls",
  "plyr.js": "hls",
  "shaka": "dash",
  "native": "native",
  "mp4": "mp4",
};

const playerLabels: Record<PlayerId, string> = {
  "hls.js": "hls.js",
  "dash.js": "dash.js",
  "rxplayer": "RxPlayer",
  "video.js": "video.js",
  "plyr.js": "plyr.js",
  "shaka": "Shaka",
  "native": "Native HLS",
  "mp4": "MP4",
};

const defaultStreams: Record<Protocol, string> = {
  hls: "https://test-streams.mux.dev/x36xhzz/url_2/193039199_mp4_h264_aac_ld_7.m3u8",
  dash: "https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd",
  native: "https://test-streams.mux.dev/x36xhzz/url_2/193039199_mp4_h264_aac_ld_7.m3u8",
  mp4: new URL(`${import.meta.env.BASE_URL}media/sintel-trailer.mp4`, window.location.origin).href,
};

const query = new URLSearchParams(window.location.search);
const peerMode = query.get("peer") === "1";
const autoStart = peerMode || query.get("autoplay") === "1";
const requestedPlayer = query.get("player") ?? "hls.js";
const initialPlayer: PlayerId = Object.hasOwn(playerProtocol, requestedPlayer)
  ? requestedPlayer as PlayerId
  : "hls.js";
const transportPreference: DemoTransportPreference = query.get("transport") === "service-worker"
  ? "service-worker"
  : query.get("transport") === "mse"
    ? "mse"
    : "auto";
const defaultSdkKey =
  (import.meta.env.VITE_MESHSTREAM_SDK_KEY as string | undefined)?.trim() ||
  (import.meta.env.VITE_P2PCDN_SDK_KEY as string | undefined)?.trim() ||
  "";
const testInitialP2pWaitParam = query.get("p2pInitialWaitMs");
const testInitialP2pWaitMs = testInitialP2pWaitParam === null
  ? undefined
  : Number(testInitialP2pWaitParam);
const hasTestInitialP2pWait = testInitialP2pWaitMs !== undefined
  && Number.isFinite(testInitialP2pWaitMs)
  && testInitialP2pWaitMs >= 0;
const configuredPublicHost = (import.meta.env.VITE_P2PCDN_PUBLIC_HOST as string | undefined)?.trim();
if (
  configuredPublicHost &&
  ["127.0.0.1", "localhost"].includes(window.location.hostname) &&
  configuredPublicHost !== window.location.hostname
) {
  const publicUrl = new URL(window.location.href);
  publicUrl.hostname = configuredPublicHost;
  window.location.replace(publicUrl.href);
}
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <main>
    <header>
      <div>
        <p class="eyebrow">MeshStream / Live Demo</p>
        <h1>${peerMode ? "Simulated peer node" : "Media peer delivery"}</h1>
      </div>
      <span id="status" class="status">Idle</span>
    </header>
    <div class="capability-strip" aria-label="Capability support">
      <span id="cap-webrtc" class="cap-badge">WebRTC</span>
      <span id="cap-sw" class="cap-badge">ServiceWorker</span>
      <span id="cap-mse" class="cap-badge">MSE</span>
    </div>
    ${peerMode ? `<div class="peer-banner">Simulated Peer — muted playback shares segments with the main window. Keep both windows open.</div>` : ""}
    <nav class="player-tabs" aria-label="Player">
      <button type="button" data-player="hls.js" class="player-tab player-tab-active">hls.js</button>
      <button type="button" data-player="dash.js" class="player-tab">dash.js</button>
      <button type="button" data-player="rxplayer" class="player-tab">RxPlayer</button>
      <button type="button" data-player="video.js" class="player-tab">video.js</button>
      <button type="button" data-player="plyr.js" class="player-tab">plyr.js</button>
      <button type="button" data-player="shaka" class="player-tab">Shaka</button>
      <button type="button" data-player="native" class="player-tab">Native HLS</button>
      <button type="button" data-player="mp4" class="player-tab">MP4</button>
    </nav>
    <section class="controls" aria-label="Playback configuration">
      <label>Media URL<input id="stream-url" type="url" /></label>
      <label>SDK Key<input id="key" placeholder="required sdk key" /></label>
      <button id="play" type="button">Play</button>
      <button id="simulate" type="button">Simulate Peer</button>
    </section>
    <p id="mp4-info" class="media-info" hidden>Use a playable MP4 URL with HTTP Range support. Cross-origin sources also need CORS and exposed Accept-Ranges / Content-Range headers. Sample: <a href="https://durian.blender.org/" target="_blank" rel="noopener noreferrer">Sintel</a> © Blender Foundation, <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener noreferrer">CC BY 3.0</a>.</p>
    <video id="video" controls playsinline></video>
    <div class="playback-notice" id="playback-notice" hidden>
      <span id="playback-hint" role="status"></span>
      <button id="unmute" type="button" hidden>Enable sound</button>
    </div>
    <section class="metrics" aria-label="P2P statistics">
      <div><span>Peers</span><strong id="peers">0</strong></div>
      <div><span>P2P down</span><strong id="p2p-down">0 B</strong></div>
      <div><span>HTTP down</span><strong id="http-down">0 B</strong></div>
      <div><span>P2P up</span><strong id="p2p-up">0 B</strong></div>
      <div><span>Offload</span><strong id="ratio">0%</strong></div>
      <div><span>SDK version</span><strong>${getSdkVersion()}</strong></div>
      <div><span>Config version</span><strong id="config-version">-</strong></div>
    </section>
    <section class="segment-panel" aria-label="Segment delivery source">
      <div class="segment-title"><span>Segment delivery</span><span class="segment-legend"><i class="dot dot-p2p"></i>P2P<i class="dot dot-cdn"></i>CDN</span></div>
      <div id="segment-blocks" class="segment-blocks"></div>
    </section>
    <pre id="log" aria-live="polite"></pre>
  </main>
`;

const video = element<HTMLVideoElement>("video");
const playButton = element<HTMLButtonElement>("play");
const simulateButton = element<HTMLButtonElement>("simulate");
const streamUrlInput = element<HTMLInputElement>("stream-url");
const playerTabs = Array.from(document.querySelectorAll<HTMLButtonElement>(".player-tab"));
const playbackNotice = element("playback-notice");
const playbackHint = element("playback-hint");
const unmuteButton = element<HTMLButtonElement>("unmute");
streamUrlInput.value = query.get("url") ?? defaultStreams[playerProtocol[initialPlayer]];
element<HTMLInputElement>("key").value = query.get("key") ?? defaultSdkKey;
video.defaultMuted = autoStart;
video.muted = autoStart;
video.autoplay = autoStart;
playerTabs.forEach((tab) => tab.classList.toggle("player-tab-active", tab.dataset.player === initialPlayer));
element("mp4-info").hidden = initialPlayer !== "mp4";
let player: MeshStreamMediaPlayer | undefined;
let p2pEnabled = true;
let statsTimer: number | undefined;
let activeConfigKey: string | undefined;
let lastTrafficLogAt = 0;
let lastTrafficStats: P2pStats | undefined;
let protocol: Protocol = playerProtocol[initialPlayer];
let currentPlayer: PlayerId = initialPlayer;
let lastSegmentTotal = 0;
let configVersionShown = "-";
let activePlaybackMode = "";
let rxPlayer: { dispose?: () => void } | undefined;
let shakaPlayer: { destroy?: () => Promise<unknown> | unknown } | undefined;
let shakaDestroyPromise: Promise<void> = Promise.resolve();
let finalDebugStats: Partial<P2pStats> | undefined;
let playbackStartSequence = 0;
let observedCdnHttpDownloaded = 0;
let observedCdnHttpAttempts = 0;
let observedCdnHttpSuccesses = 0;
let observedCdnHttpFailures = 0;
const segmentQueue: ("p2p" | "cdn" | "idle")[] = [];

declare global {
  interface Window {
    __meshStreamDebug?: {
      statistics: () => Partial<P2pStats>;
      diagnostics: () => Record<string, unknown>;
      playbackMode: () => string;
      stopForDiagnostics: () => void;
    };
  }
}

window.__meshStreamDebug = {
  statistics: () => finalDebugStats ?? player?.statistics() ?? {},
  diagnostics: () => (player?.diagnostics?.() ?? {}) as Record<string, unknown>,
  playbackMode: () => activePlaybackMode,
  stopForDiagnostics: () => {
    video.pause();
    finalDebugStats = player ? { ...player.statistics() } : finalDebugStats;
    player?.dispose();
    rxPlayer?.dispose?.();
    disposeShakaPlayer();
  },
};

playButton.addEventListener("click", () => {
  void startPlayback();
});
unmuteButton.addEventListener("click", () => {
  video.defaultMuted = false;
  video.muted = false;
});
video.addEventListener("playing", () => {
  setStatus("Playing");
  updateSoundNotice();
});
video.addEventListener("volumechange", updateSoundNotice);
playerTabs.forEach((tab) =>
  tab.addEventListener("click", () => {
    const nextPlayer = tab.dataset.player as PlayerId;
    const nextProtocol = playerProtocol[nextPlayer];
    if (nextPlayer === currentPlayer && nextProtocol === protocol) return;
    currentPlayer = nextPlayer;
    protocol = nextProtocol;
    playerTabs.forEach((t) => t.classList.toggle("player-tab-active", t === tab));
    streamUrlInput.value = defaultStreams[protocol];
    element("mp4-info").hidden = nextPlayer !== "mp4";
    const compat = ["video.js", "plyr.js", "shaka"].includes(nextPlayer) ? " (compatibility mode)" : "";
    log(`Switched to ${playerLabels[nextPlayer]}${compat}; sample URL updated`);
    if (player) {
      setStatus("Switching player");
      void startPlayback();
    }
  }),
);
simulateButton.addEventListener("click", () => {
  const params = new URLSearchParams({
    peer: "1",
    autoplay: "1",
    player: currentPlayer,
    transport: effectiveTransportPreference(),
    url: streamUrlInput.value,
    key: element<HTMLInputElement>("key").value,
  });
  if (hasTestInitialP2pWait) params.set("p2pInitialWaitMs", String(testInitialP2pWaitMs));
  const peerWindow = window.open(`${window.location.origin}${window.location.pathname}?${params.toString()}`, "_blank");
  if (!peerWindow) {
    log("Peer window was blocked. Allow pop-ups for this site and click Simulate Peer again.");
    return;
  }
  peerWindow.opener = null;
  log("Opened a simulated peer window — keep it playing to share segments");
});
detectCapabilities();
window.addEventListener("pagehide", cleanup);
window.addEventListener("beforeunload", cleanup);
if (autoStart) {
  updateSoundNotice();
  setStatus("Connecting");
  void startPlayback();
}

async function startPlayback(options: { forceRestart?: boolean } = {}): Promise<void> {
  const startSequence = ++playbackStartSequence;
  const streamUrl = streamUrlInput.value.trim();
  const key = element<HTMLInputElement>("key").value.trim();
  const playbackTransport = effectiveTransportPreference();
  if (!streamUrl) return;
  if (!key) {
    setStatus("SDK Key required");
    log("SDK Key is required; AppID is resolved by the bootstrap service.");
    return;
  }
  const configKey = JSON.stringify({
    streamUrl,
    key,
    currentPlayer,
    protocol,
    transportPreference: playbackTransport,
    ...(hasTestInitialP2pWait
      ? { httpDownloadInitialTimeoutMs: testInitialP2pWaitMs }
      : {}),
    ...(query.get("debug") === "1" ? { logLevel: "info" as const } : {}),
  });
  if (!options.forceRestart && player && activeConfigKey === configKey) {
    if (video.ended) video.currentTime = 0;
    await requestPlayback(startSequence);
    log("Reusing the active playback session");
    return;
  }

  if (options.forceRestart && player) {
    setStatus("Restarting");
    log("Restarting playback session");
  }
  cleanup();
  finalDebugStats = undefined;
  await new Promise((resolve) => window.setTimeout(resolve, 50));
  await shakaDestroyPromise;
  if (startSequence !== playbackStartSequence) return;

  const demoOptions = {
    url: streamUrl,
    video,
    key,
    transportPreference: playbackTransport,
    ...(protocol === "mp4" ? { mimeType: "mp4" as const } : {}),
    ...(playbackTransport === "service-worker"
      ? {
          serviceWorker: {
            url: `${import.meta.env.BASE_URL}meshstream-sw.js`,
            scope: import.meta.env.BASE_URL,
            autoRegister: true,
          },
        }
      : {}),
    ...(hasTestInitialP2pWait
      ? { httpDownloadInitialTimeoutMs: testInitialP2pWaitMs }
      : {}),
    onHlsCreated: (hls: DemoHls) => {
      hls.on("hlsFragLoading", () => {
        observedCdnHttpAttempts += 1;
      });
      hls.on("hlsFragLoaded", (_event, data) => {
        const details = data as {
          stats?: { loaded?: unknown; total?: unknown };
          payload?: { byteLength?: unknown };
        } | undefined;
        const loaded = Number(details?.stats?.loaded)
          || Number(details?.payload?.byteLength)
          || Number(details?.stats?.total)
          || 0;
        if (loaded > 0) observedCdnHttpDownloaded += loaded;
        observedCdnHttpSuccesses += 1;
      });
      hls.on("hlsFragLoadError", () => {
        observedCdnHttpFailures += 1;
      });
      hls.on(HLS_MANIFEST_PARSED_EVENT, () => {
        if (video.paused) setStatus("Buffering");
      });
      hls.on(HLS_ERROR_EVENT, (_event, data) => {
        if ((data as { fatal?: boolean; type?: string }).fatal) {
          setStatus(`Error: ${(data as { type?: string }).type}`);
        }
      });
    },
  } as Parameters<typeof attach>[0] & {
    onHlsCreated: (hls: DemoHls) => void;
  };
  let session: MeshStreamMediaPlayer | undefined;
  try {
    session = currentPlayer === "rxplayer"
      ? await startRxPlayerDemo({ streamUrl, key })
      : currentPlayer === "shaka"
        ? await startShakaDemo({ streamUrl, key })
        : currentPlayer === "dash.js"
          ? attachToDashJs({
              key,
              url: streamUrl,
              video,
              player: dashjs.MediaPlayer().create(),
              ...(hasTestInitialP2pWait
                ? { httpDownloadInitialTimeoutMs: testInitialP2pWaitMs }
                : {}),
            })
          : attach(demoOptions);
    const result = (await session.start()) as DemoStartResult;
    if (startSequence !== playbackStartSequence) {
      session.dispose();
      return;
    }
    player = session;
    activePlaybackMode = result.mode;
    activeConfigKey = configKey;
    lastTrafficLogAt = 0;
    lastTrafficStats = undefined;
    log(
      `Player: ${playerLabels[currentPlayer]} | Playback decision: mode=${result.mode}, capability=${result.capability.supported ? "supported" : "unsupported"}` +
        `${result.capability.reason ? `/${result.capability.reason}` : ""}, ` +
        `sdkP2p=${result.sdkConfig?.p2pEnabled ?? "-"}, effective=${result.sdkConfig?.status?.effectiveP2pEnabled ?? "-"}, ` +
        `trackers=${result.sdkConfig?.trackerUrls?.length ?? 0}`,
    );
    const p2pClient = getP2pClient(session);
    const hasP2pTransport = Boolean(p2pClient) || ["sw-hls-p2p", "sw-direct-p2p"].includes(result.mode);
    if (result.mode !== "unsupported") {
      // Keep the panel live during the intentional CDN cold start while the
      // SDK bootstrap request is still pending. The SDK reports CDN bytes for
      // this path; waiting for a P2P client would leave all counters frozen.
      statsTimer = window.setInterval(renderStats, 500);
    }
    if (hasP2pTransport) {
      if (p2pClient) {
        p2pClient.on?.("peer-connect", (details) => log(`Peer connected: ${summarizeEvent(details)}`));
        p2pClient.on?.("peer-close", (details) => log(`Peer closed: ${summarizeEvent(details)}`));
        p2pClient.on?.("segment-error", (details) => log(`Peer/segment error: ${summarizeSegmentError(details)}`));
        p2pClient.on?.("tracker-error", (details) => log(`Tracker error detail: ${summarizeEvent(details)}`));
      }
      playButton.disabled = false;
      p2pEnabled = result.sdkConfig?.p2pEnabled ?? true;
      setStatus("Connecting");
      if (p2pClient) {
        log(`Joining derived ${protocol === "dash" ? "DASH" : "HLS"} swarm ${p2pClient.swarmId}`);
      } else {
        log("Service Worker P2P transport initialized");
      }
    } else {
      playButton.disabled = false;
      p2pEnabled = false;
      if (result.mode === "cdn-dash" || result.mode === "cdn-rxplayer") {
        setStatus("DASH CDN");
        log("DASH playback is using CDN fallback; P2P is disabled or unavailable for this session.");
        if (!result.capability.supported) {
          logCapabilityFallback(result.fallbackReason ?? result.capability.reason ?? "UNSUPPORTED", result.capability.recommendedMode);
        }
      } else if (result.mode === "unsupported") {
        if (statsTimer !== undefined) window.clearInterval(statsTimer);
        statsTimer = undefined;
        resetStatsView();
        setStatus("Unsupported");
        log("This browser cannot run the selected media path; try Safari native HLS or a browser with MSE support");
      } else {
        setStatus(result.mode === "native-hls-cdn" ? "Native HLS CDN" : "CDN fallback");
        logCapabilityFallback(result.fallbackReason ?? result.capability.reason ?? "UNSUPPORTED", result.capability.recommendedMode);
      }
    }
    session.addEventListener({
      onP2pReady: () => {
        p2pEnabled = true;
        setStatus(video.paused ? "Connecting" : "Playing");
        log("P2P ready");
      },
      onP2pUnavailable: (reason) => log(`P2P unavailable (${reason}); CDN playback continues`),
      onTrackerError: (totalErrors) => log(`Tracker errors: ${totalErrors}`),
      onPeerConnectError: (totalErrors) => {
        const diagnostics = player?.diagnostics?.();
        const detail = diagnostics?.lastPeerError ? ` (${diagnostics.lastPeerError})` : "";
        log(`Peer connect errors: ${totalErrors}${detail}`);
      },
      onCdnFallback: () => undefined,
    });
    if (result.sdkConfig) {
      configVersionShown = result.sdkConfig.configVersion ?? "-";
      log(
        `Loaded SDK config: configVersion=${result.sdkConfig.configVersion ?? "-"}, trackers=${result.sdkConfig.trackerUrls.length}, ` +
          `p2p=${result.sdkConfig.p2pEnabled}, ttl=${result.sdkConfig.ttlSeconds ?? 60}s, apply=${result.sdkConfig.applyMode ?? "next-session"}, ` +
          `poolReady=${result.sdkConfig.trackerPool?.readyCount ?? "-"}, poolMatched=${result.sdkConfig.trackerPool?.matchedCount ?? "-"}`,
      );
    }
    if (result.mode !== "unsupported") void requestPlayback(startSequence);
  } catch (error) {
    session?.dispose();
    rxPlayer?.dispose?.();
    rxPlayer = undefined;
    disposeShakaPlayer();
    await shakaDestroyPromise;
    if (startSequence === playbackStartSequence) {
      setStatus("Playback error");
      log(`Playback initialization failed: ${formatPlaybackError(error)}`);
    }
  }
}

function updateSoundNotice(): void {
  playbackNotice.hidden = !video.muted;
  unmuteButton.hidden = !video.muted;
  playbackHint.textContent = video.muted ? "Playback starts muted. Enable sound when you're ready." : "";
}

function effectiveTransportPreference(): DemoTransportPreference {
  return protocol === "mp4" ? "service-worker" : transportPreference;
}

async function requestPlayback(startSequence: number): Promise<void> {
  try {
    await video.play();
    if (startSequence === playbackStartSequence) {
      setStatus("Playing");
      updateSoundNotice();
    }
  } catch (error) {
    if (startSequence !== playbackStartSequence || (error as DOMException)?.name === "AbortError") return;
    if ((error as DOMException)?.name === "NotAllowedError") {
      setStatus("Click Play to start");
      playbackNotice.hidden = false;
      playbackHint.textContent = "Your browser paused autoplay. Click Play or use the video controls to start.";
      log("Autoplay was blocked by the browser; click Play to resume the prepared session.");
    } else {
      setStatus("Playback error");
      log(`Playback failed: ${formatPlaybackError(error)}`);
    }
  }
}

function detectCapabilities(): void {
  const webrtc = typeof RTCPeerConnection !== "undefined";
  const sw = "serviceWorker" in navigator;
  const mse = typeof MediaSource !== "undefined" || "ManagedMediaSource" in window;
  setCapability("cap-webrtc", webrtc);
  setCapability("cap-sw", sw);
  setCapability("cap-mse", mse);
}

function setCapability(id: string, supported: boolean): void {
  const el = element<HTMLSpanElement>(id);
  el.classList.toggle("cap-on", supported);
  el.classList.toggle("cap-off", !supported);
  el.title = supported ? "Supported in this browser" : "Not supported in this browser";
}

function pushSegmentBlock(kind: "p2p" | "cdn" | "idle"): void {
  segmentQueue.push(kind);
  if (segmentQueue.length > 40) segmentQueue.shift();
  renderSegmentBlocks();
}

function renderSegmentBlocks(): void {
  const host = element("segment-blocks");
  host.innerHTML = segmentQueue
    .map((k) => `<i class="seg-block seg-${k}"></i>`)
    .join("");
}

function renderStats(): void {
  if (!isP2pMediaPlayer(player)) return;
  const stats = player.statistics() as P2pStats;
  const httpDownloaded = Math.max(stats.httpDownloaded, observedCdnHttpDownloaded);
  const httpAttempts = Math.max(stats.httpAttempts ?? 0, observedCdnHttpAttempts);
  const httpSuccesses = Math.max(stats.httpSegmentDownloadSuccesses, observedCdnHttpSuccesses);
  const httpFailures = Math.max(stats.httpSegmentDownloadFailures, observedCdnHttpFailures);
  const visibleStats = {
    ...stats,
    httpDownloaded,
    httpAttempts,
    httpSegmentDownloadSuccesses: httpSuccesses,
    httpSegmentDownloadFailures: httpFailures,
  };
  element("peers").textContent = String(visibleStats.connectedPeers);
  element("p2p-down").textContent = formatBytes(visibleStats.p2pDownloaded);
  element("http-down").textContent = formatBytes(visibleStats.httpDownloaded);
  element("p2p-up").textContent = formatBytes(visibleStats.p2pUploaded);
  const total = visibleStats.p2pDownloaded + visibleStats.httpDownloaded;
  element("ratio").textContent = total ? `${Math.round((visibleStats.p2pDownloaded / total) * 100)}%` : "0%";
  if (configVersionShown !== "-") element("config-version").textContent = configVersionShown;
  const segTotal = visibleStats.p2pDownloaded + visibleStats.httpDownloaded;
  if (segTotal > lastSegmentTotal && segTotal - lastSegmentTotal > 64 * 1024) {
    pushSegmentBlock(visibleStats.p2pDownloaded / Math.max(1, segTotal) > 0.5 ? "p2p" : "cdn");
    lastSegmentTotal = segTotal;
  }
  renderTrafficSummary(visibleStats);
}

function cleanup(): void {
  if (statsTimer !== undefined) window.clearInterval(statsTimer);
  statsTimer = undefined;
  const previousPlayer = player;
  player = undefined;
  activePlaybackMode = "";
  activeConfigKey = undefined;
  configVersionShown = "-";
  lastTrafficLogAt = 0;
  lastTrafficStats = undefined;
  observedCdnHttpDownloaded = 0;
  observedCdnHttpAttempts = 0;
  observedCdnHttpSuccesses = 0;
  observedCdnHttpFailures = 0;
  resetStatsView();
  finalDebugStats = previousPlayer ? { ...previousPlayer.statistics() } : finalDebugStats;
  previousPlayer?.dispose();
  rxPlayer?.dispose?.();
  rxPlayer = undefined;
  disposeShakaPlayer();
  video.removeAttribute("src");
  video.load();
}

async function startRxPlayerDemo(input: {
  streamUrl: string;
  key: string;
}): Promise<MeshStreamMediaPlayer> {
  const module = await import("rx-player");
  const instance = new module.default({ videoElement: video });
  rxPlayer = instance;
  instance.addEventListener("playerStateChange", (state) => {
    if (rxPlayer !== instance) return;
    if (state === "PLAYING") setStatus("Playing");
  });
  instance.addEventListener("error", (error) => {
    if (rxPlayer !== instance) return;
    setStatus("Playback error");
    log(`RxPlayer error: ${formatPlaybackError(error)}`);
  });
  return attachToRxPlayer({
    key: input.key,
    url: input.streamUrl,
    player: instance,
  });
}

function disposeShakaPlayer(): void {
  const previous = shakaPlayer;
  shakaPlayer = undefined;
  if (!previous?.destroy) return;
  shakaDestroyPromise = shakaDestroyPromise
    .then(() => Promise.resolve(previous.destroy?.()).then(() => undefined))
    .catch(() => undefined);
}

async function startShakaDemo(input: {
  streamUrl: string;
  key: string;
}): Promise<MeshStreamMediaPlayer> {
  const { default: shaka } = await import("shaka-player");
  shaka.polyfill.installAll();
  const instance = new shaka.Player();
  await instance.attach(video);
  shakaPlayer = instance;
  return attachToShaka({
    key: input.key,
    url: input.streamUrl,
    player: instance as unknown as Parameters<typeof attachToShaka>[0]["player"],
  });
}

function resetStatsView(): void {
  element("peers").textContent = "0";
  element("p2p-down").textContent = "0 B";
  element("http-down").textContent = "0 B";
  element("p2p-up").textContent = "0 B";
  element("ratio").textContent = "0%";
  segmentQueue.length = 0;
  renderSegmentBlocks();
  lastSegmentTotal = 0;
}

function logCapabilityFallback(reason: string, mode: string): void {
  log(`P2P capability fallback: reason=${reason}, mode=${mode}`);
}

function renderTrafficSummary(stats: P2pStats): void {
  const now = Date.now();
  if (lastTrafficStats === undefined) {
    lastTrafficStats = { ...stats };
    lastTrafficLogAt = now;
    return;
  }
  if (now - lastTrafficLogAt < 5_000) return;

  const p2pDownDelta = stats.p2pDownloaded - lastTrafficStats.p2pDownloaded;
  const p2pUpDelta = stats.p2pUploaded - lastTrafficStats.p2pUploaded;
  const httpDownDelta = stats.httpDownloaded - lastTrafficStats.httpDownloaded;
  const totalDelta = p2pDownDelta + httpDownDelta;
  const offload = totalDelta > 0 ? Math.round((p2pDownDelta / totalDelta) * 100) : 0;
  const playback = video.paused
    ? "paused"
    : video.ended
      ? "ended"
      : `t=${Math.floor(video.currentTime)}s`;
  const activity = describeTrafficActivity(stats.connectedPeers, p2pDownDelta, p2pUpDelta, httpDownDelta);

  log(
    `Traffic ${playback}: peers=${stats.connectedPeers}, ` +
      `P2P down +${formatBytes(p2pDownDelta)}, P2P up +${formatBytes(p2pUpDelta)}, ` +
      `HTTP +${formatBytes(httpDownDelta)}, offload=${offload}% (${activity})`,
  );
  lastTrafficStats = { ...stats };
  lastTrafficLogAt = now;
}

function describeTrafficActivity(
  peers: number,
  p2pDownDelta: number,
  p2pUpDelta: number,
  httpDownDelta: number,
): string {
  if (p2pDownDelta > 0 || p2pUpDelta > 0) return "P2P active";
  if (httpDownDelta > 0 && peers > 0) return "CDN fallback; peers may not have the requested segment yet";
  if (httpDownDelta > 0) return "CDN fallback; waiting for peers";
  if (peers > 0) return "no new segment request; player may be buffered";
  return "idle; waiting for peers or playback demand";
}

function protocolLabel(value: Protocol): string {
  return { hls: "HLS (hls.js)", dash: "DASH (dash.js)", native: "Native HLS", mp4: "MP4" }[value];
}

function element<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

interface P2pMediaPlayer {
  p2pClient?: {
    swarmId: string;
    addEventListener(listener: DemoP2pEventListener): void;
    on?(event: "peer-connect" | "peer-close" | "segment-error" | "tracker-error", listener: (payload: unknown) => void): void;
  };
  setP2pEnabled(enabled: boolean): void;
  statistics(): Partial<P2pStats>;
  diagnostics?(): { lastPeerError?: string; lastTrackerError?: string };
}

interface DemoP2pEventListener {
  onP2pReady?(): void;
  onP2pUnavailable?(reason: string): void;
  onTrackerError?(totalErrors: number): void;
  onPeerConnectError?(totalErrors: number): void;
  onCdnFallback?(bytes: number): void;
}

function isP2pMediaPlayer(value: MeshStreamMediaPlayer | undefined): value is MeshStreamMediaPlayer & P2pMediaPlayer {
  return value !== undefined;
}

function getP2pClient(
  value: MeshStreamMediaPlayer | undefined,
): P2pMediaPlayer["p2pClient"] | undefined {
  return (value as P2pMediaPlayer | undefined)?.p2pClient;
}

function setStatus(value: string): void {
  element("status").textContent = value;
}

function log(message: string): void {
  const output = element("log");
  output.textContent = `${new Date().toLocaleTimeString()}  ${message}\n${output.textContent}`.slice(0, 5000);
}

function summarizeEvent(value: unknown): string {
  return sanitizeEventValue(value).slice(0, 260);
}

function summarizeSegmentError(value: unknown): string {
  if (!value || typeof value !== "object") return summarizeEvent(value);
  const details = value as Record<string, unknown>;
  const segment = details.segment as Record<string, unknown> | undefined;
  const error = details.error as Record<string, unknown> | undefined;
  return JSON.stringify({
    source: details.downloadSource,
    peerId: details.peerId,
    segmentId: segment?.externalId,
    segmentStartTime: segment?.startTime,
    errorName: error?.name,
    errorType: error?.type,
    errorMessage: error?.message,
  });
}

function formatPlaybackError(value: unknown): string {
  if (value instanceof Error) return value.message || value.name;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function sanitizeEventValue(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, (_key, nested) => {
      if (nested instanceof Error) {
        return {
          name: nested.name,
          message: nested.message,
          type: (nested as { type?: unknown }).type,
        };
      }
      return nested;
    });
  } catch {
    return String(value);
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
}

interface DemoStartResult {
  mode: string;
  capability: {
    supported: boolean;
    reason?: string;
    recommendedMode: string;
  };
  fallbackReason?: string;
  sdkConfig?: {
    configVersion?: string;
    trackerUrls: string[];
    p2pEnabled: boolean;
    ttlSeconds?: number;
    applyMode?: string;
    status?: {
      effectiveP2pEnabled?: boolean;
    };
    trackerPool?: {
      readyCount?: number;
      matchedCount?: number;
    };
  };
}

interface DemoHls {
  on(event: string, listener: (event: unknown, data: unknown) => void): void;
}
