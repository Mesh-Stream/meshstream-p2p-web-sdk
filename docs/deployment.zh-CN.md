# Demo 部署

[English](deployment.md) · [返回 README](../README.zh-CN.md)

Demo 是 Vite 静态站点，部署内容为 `dist/`。运行环境不需要 Node.js，
`npm run preview` 只用于本地预览。

## 生产配置

在 `.env.production.local` 中设置自己的 Key，或者在托管平台的构建环境中设置：

```dotenv
VITE_MESHSTREAM_SDK_KEY=your_web_sdk_key
```

仓库自带的 `.env.production` 用于官方演示站。Vite 的同名变量优先级从高到低是：
构建进程的环境变量、`.env.production.local`、`.env.production`、`.env.local`、`.env`。
修改配置后重新构建，再上传产物。

`VITE_P2PCDN_SDK_KEY` 是旧版 Key 变量名，仅在 `VITE_MESHSTREAM_SDK_KEY` 为空时生效。
`VITE_P2PCDN_PUBLIC_HOST` 通常留空；设置后会把 localhost / 127.0.0.1 跳转到指定主机名，
保留协议、端口和路径。它不负责配置 DNS 或 HTTPS。
SDK 使用默认 bootstrap 发现服务，Demo 不读取 `VITE_P2PCDN_BOOTSTRAP_URL`。

部署前，在控制台授权正式站点的 Origin，例如 `https://demo.example.com`。
SDK Key 会出现在浏览器资源中，应该通过应用权限、来源限制和配额管理其使用。
后端密钥不能放在前端环境变量中。

## Service Worker

`npm run dev` 和 `npm run build` 会将 npm 包的 `dist/meshstream-sw.js` 复制到
`public/`，构建时再放入 `dist/`。部署到域名根目录后，以下地址应返回 JavaScript：

```text
https://demo.example.com/meshstream-sw.js
```

Worker 必须与页面同源，并通过 HTTPS 提供；localhost / 回环地址允许 HTTP。
手机访问电脑的普通局域网 HTTP 地址不满足这一条件。
Worker 文件要使用 JavaScript MIME 类型，不要被 SPA 回退规则改写成 `index.html`。

在自己的业务项目中使用时，也要从同一版本的 npm 包复制 Worker 到公开目录。
默认地址为 `/meshstream-sw.js`，自定义路径和作用域通过 `attach` 的 `serviceWorker`
选项设置，可参考本仓库 `src/main.ts`。

## Nginx

以下示例部署到域名根目录。先配置 DNS 和 TLS 证书，再将 `dist/` 的全部内容上传到
`/var/www/meshstream-demo`，替换示例域名及证书路径：

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

使用 CDN 时，让 HTML 和 `meshstream-sw.js` 重新验证缓存。`assets/` 下带哈希的文件
可以长期缓存，更新时暂时保留旧资源，避免已打开的页面加载后续资源时出现 404。
部署后检查页面版本，并按[测试说明](testing.zh-CN.md)确认播放和 P2P。

## 子目录部署

部署到 `https://demo.example.com/demo/` 时，指定 Vite base：

```bash
npm run build -- --base /demo/
npm run preview -- --base /demo/ --host 127.0.0.1 --strictPort
```

本地预览地址为 `http://127.0.0.1:4173/demo/`。将 `dist/` 的全部内容放在服务器
`/demo/` 路径下，Worker 地址应为 `/demo/meshstream-sw.js`。
测试 SW 时使用 `?transport=service-worker`，MP4 会自动选择此模式；这时 Demo
按 base 配置 Worker 地址与作用域。自动传输模式仍可能使用 SDK 默认的根目录 Worker 地址。

## 媒体源站

跨域媒体需要在媒体服务器上配置 CORS，允许播放站点的 Origin，以及需要的
`GET`、`HEAD`、`OPTIONS` 方法和 `Range` 请求头。不要只给 Demo 站点加 CORS。
MP4 源还需要支持字节范围请求，返回 `206` 和有效的 `Content-Range`，并暴露
`Content-Length`、`Content-Type`、`Accept-Ranges`、`Content-Range` 响应头。
Nginx 静态托管的同源 MP4 通常已支持 Range。
