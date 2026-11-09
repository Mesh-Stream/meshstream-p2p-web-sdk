# Deploying the demo

[简体中文](deployment.zh-CN.md) · [Back to README](../README.md)

The demo is a Vite static site. Deploy `dist/`; Node.js is not needed on the
serving host. `npm run preview` is for local checks.

## Production configuration

Set your key in `.env.production.local` or the hosting platform's build environment:

```dotenv
VITE_MESHSTREAM_SDK_KEY=your_web_sdk_key
```

The committed `.env.production` is for the official demo. For a production build,
Vite resolves variables in this order, highest priority first: process environment,
`.env.production.local`, `.env.production`, `.env.local`, `.env`. Rebuild and upload
the new output after configuration changes.

`VITE_P2PCDN_SDK_KEY` is a legacy alias, used only when `VITE_MESHSTREAM_SDK_KEY` is
empty. Normally leave `VITE_P2PCDN_PUBLIC_HOST` empty. Setting it redirects localhost /
127.0.0.1 to that hostname while keeping the scheme, port and path; it does not
configure DNS or HTTPS. The SDK discovers services through its default bootstrap;
the demo does not read `VITE_P2PCDN_BOOTSTRAP_URL`.

Allow the production origin, such as `https://demo.example.com`, in the console.
The SDK Key is visible in browser assets. Manage its use through application
permissions, origin restrictions and quota. Keep backend secrets out of frontend
variables.

## Service Worker

`npm run dev` and `npm run build` copy `dist/meshstream-sw.js` from the npm package
to `public/`; the build includes it in `dist/`. After deployment at the domain
root, this URL should return JavaScript:

```text
https://demo.example.com/meshstream-sw.js
```

The Worker must be on the page's origin and served over HTTPS. Localhost / loopback
can use HTTP, but a phone accessing your computer over ordinary LAN HTTP cannot.
Serve the file with a JavaScript MIME type. SPA fallback rules must not rewrite it
to `index.html`.

For your own application, copy the Worker from the same npm package version to
your public directory. Its default URL is `/meshstream-sw.js`. Custom URLs and
scopes can be set with the `serviceWorker` option in `attach`; see `src/main.ts`
for the demo's configuration.

## Nginx

This example serves the demo at the domain root. Configure DNS and TLS first,
then upload all contents of `dist/` to `/var/www/meshstream-demo`. Replace the
domain and certificate paths:

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

If using a CDN, revalidate HTML and `meshstream-sw.js`. Hashed files under `assets/`
can have long cache lifetimes. Keep old assets during rollout so open pages can
still load their remaining chunks. Check the displayed SDK version and repeat
[playback and P2P tests](testing.md) after deployment.

## Subdirectories

For `https://demo.example.com/demo/`, set Vite's base:

```bash
npm run build -- --base /demo/
npm run preview -- --base /demo/ --host 127.0.0.1 --strictPort
```

Preview at `http://127.0.0.1:4173/demo/`. Serve all contents of `dist/` under
`/demo/`; the Worker should be at `/demo/meshstream-sw.js`. Test SW with
`?transport=service-worker` (MP4 selects this automatically). In that mode the
demo uses the base for the Worker URL and scope. Automatic transport selection
may still use the SDK's default Worker URL at the domain root.

## Media origin

For cross-origin media, configure CORS on the media server. Allow the playback
site's origin, the required `GET`, `HEAD`, `OPTIONS` methods and the `Range` request
header. Adding CORS only to the demo host does not fix media requests.

MP4 sources also need byte-range responses: `206` with a valid `Content-Range`.
Expose `Content-Length`, `Content-Type`, `Accept-Ranges` and `Content-Range` response
headers. Same-origin MP4 served as an Nginx static file normally supports ranges.
