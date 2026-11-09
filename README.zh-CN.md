# MeshStream Web SDK Demo

[English](README.md) · [在线 Demo](https://demo.meshstream.net/) · [npm SDK](https://www.npmjs.com/package/@meshstream/p2p-web)

本仓库用于运行和部署 MeshStream Web 播放演示，观察 HLS、DASH、MP4 的播放及
P2P/CDN 流量。它是一个 Vite + TypeScript 前端工程，**直接安装 npm 已发布的
`@meshstream/p2p-web@1.1.4`**。SDK 源码维护和编译在 P2PCDN 完成；运行本 Demo
无需在本地部署 Tracker、API 服务、数据库，也无需编译原生 SDK。

- [环境要求与 SDK Key](#环境要求与-sdk-key)
- [本地运行](#本地运行)
- [环境配置](#环境配置)
- [播放器与测试链接](#播放器与测试链接)
- [测试与验收](#测试与验收)
- [构建与上线](#构建与上线)
- [常见问题](#常见问题)
- [在自己的项目中接入或升级 SDK](#在自己的项目中接入或升级-sdk)

## 环境要求与 SDK Key

| 项目 | 准备内容 |
| --- | --- |
| 运行环境 | Node.js 22.12+ 或 24 LTS，推荐 24 LTS；使用随附的 npm。 |
| 浏览器 | 建议先用近期版本的 Chrome 或 Edge 验证；原生 HLS 取决于浏览器能力，Safari 需要单独验收。 |
| MeshStream 账户 | 在[控制台](https://console.meshstream.net/)创建应用，并创建、启用 Web SDK Key。 |
| 域名授权 | 启用来源校验时，允许实际使用的完整 Origin，例如 `http://localhost:5173`、`http://127.0.0.1:4173`、`https://demo.example.com`。 |
| 媒体资源 | 可访问的 HLS `.m3u8`、DASH `.mpd` 或 MP4；跨域清单和媒体资源需要正确的 CORS 响应。 |
| 安全上下文 | Service Worker 要求 HTTPS，浏览器对 `localhost` / 回环地址有例外。不能双击 `index.html` 通过 `file://` 运行。 |

Origin 包含**协议、主机名和端口**。`localhost` 与 `127.0.0.1` 不相同，端口不同
也要分别授权。`http://192.168.1.10:5173` 等局域网地址不享受 localhost 的安全上下文
例外；手机或局域网测试需要 Service Worker 时，应配置 HTTPS。

SDK Key 是用于浏览器接入的应用标识，请在控制台配置域名限制及应用权限、配额。
后端 API 密钥、账户密码和发布令牌不能放入前端。官方在线 Demo 的 Key 用于官方站点，
部署到自己的域名时请使用自己的 Key。

## 本地运行

```bash
git clone https://github.com/Mesh-Stream/meshstream-p2p-web-sdk.git
cd meshstream-p2p-web-sdk
node --version
npm ci
cp .env.example .env.local
```

编辑 `.env.local`，将 `VITE_MESHSTREAM_SDK_KEY` 填为自己的 Web SDK Key，然后启动：

```bash
npm run dev
```

打开终端输出的本地地址，通常是 **http://localhost:5173/**。如果 5173 被占用，
Vite 可能使用其他端口；此时也需要在控制台授权实际 Origin。
脚本默认监听全部网卡，在本机测试时使用 localhost 即可。

1. 首次验证选择 **hls.js**。
2. 确认 **SDK Key** 输入框已填入 Key，也可以直接在页面中手动填写。
3. 使用默认 HLS 测试地址，或粘贴自己的媒体地址，点击 **Play**。
4. 确认视频时间持续前进，观察 **SDK version**、**HTTP down**、**Peers**、
   **P2P down/up** 及播放器下方日志。
5. 点击 **Simulate Peer**，允许弹窗，让两个窗口同时播放。

单个观看端只有 CDN 流量属于正常情况。“可以播放”本身不能证明 P2P 已发生，
具体判断方式见后文验收步骤。

## 环境配置

可复制的配置模板见 [`.env.example`](.env.example)。

| 变量 | 默认行为及用途 |
| --- | --- |
| `VITE_MESHSTREAM_SDK_KEY` | 未配置时为空，用于预填 SDK Key 输入框；URL 中的 `?key=` 优先。 |
| `VITE_P2PCDN_SDK_KEY` | 兼容旧变量名，仅在上一个变量为空时使用；新部署建议使用上一个变量。 |
| `VITE_P2PCDN_PUBLIC_HOST` | 可选，只填主机名，不带协议、端口或路径。访问 localhost / 127.0.0.1 时跳转到此主机名，并保留协议、端口、路径与查询参数。普通本地开发留空；它不会配置 DNS、TLS 或 API 地址。 |

开发环境使用 `.env.local`，该文件已被 Git 忽略：

```dotenv
VITE_MESHSTREAM_SDK_KEY=your_web_sdk_key
VITE_P2PCDN_PUBLIC_HOST=
```

**部署到自己的站点**时，使用生产环境覆盖文件：

```bash
cp .env.example .env.production.local
# 编辑 .env.production.local，填入自己的 Web SDK Key。
npm run build
```

仓库自带的 `.env.production` 用于官方 Demo，生产构建会读取它。
**只配置 `.env.local` 无法覆盖 `.env.production` 中的同名值**，请使用
`.env.production.local`，或在托管平台的构建环境中设置变量。
已有的 shell / CI 环境变量优先级最高，例如：

```bash
VITE_MESHSTREAM_SDK_KEY=your_web_sdk_key npm run build
```

Vite 在**构建时**将 `VITE_*` 值写入浏览器资源，任何访问者都可以看到这些值。
修改开发配置后需要重启开发服务；修改生产配置后需要重新构建和部署。
上传 `dist/` 后再向静态服务器添加环境变量，不会修改已经生成的页面。

SDK 通过标准 bootstrap 流程发现 MeshStream 服务地址。本 Demo 当前没有提供自定义
Bootstrap/API 服务的环境变量入口；配置代码不会读取 `VITE_P2PCDN_BOOTSTRAP_URL`。

## 播放器与测试链接

| 页面选项 | 实际接入方式 |
| --- | --- |
| hls.js | SDK 管理的 HLS 播放器。 |
| dash.js | 创建实际 dash.js 实例，通过 `attachToDashJs` 接入。 |
| RxPlayer | 创建实际 RxPlayer 实例，通过 `attachToRxPlayer` 接入。 |
| Shaka | 创建实际 Shaka 实例，通过 `attachToShaka` 接入。 |
| video.js / plyr.js | 当前是使用 SDK `attach` 的兼容演示选项，Demo 没有创建 Video.js 或 Plyr 实例。 |
| Native HLS | 选择 HLS 路径，由 SDK 和浏览器决定实际播放方式；不会在所有浏览器上强制原生 HLS。 |
| MP4 | 使用 Service Worker 传输的渐进式 MP4，默认使用仓库自带的 Sintel 片段。 |

通过查询参数可以直接打开指定模式：

```text
http://localhost:5173/?player=hls.js&transport=mse
http://localhost:5173/?player=hls.js&transport=service-worker
http://localhost:5173/?player=dash.js
http://localhost:5173/?player=rxplayer
http://localhost:5173/?player=shaka
http://localhost:5173/?player=mp4
```

`player` 还支持 `video.js`、`plyr.js` 和 `native`。`url` 可覆盖媒体地址；
媒体地址自身含查询参数时，需要先做 URL 编码。`key` 可覆盖预填的 SDK Key；
`autoplay=1` 请求静音自动播放，但浏览器仍可能要求用户点击。
**Simulate Peer** 会带上当前媒体地址、Key、播放器和传输模式打开第二个窗口，
用于功能验证，不是压力测试工具。

`transport` 选项适用于 SDK 管理的播放路径，dash.js、RxPlayer、Shaka 使用各自的
适配器路径。MP4 固定请求 Service Worker 传输。第三方测试流可能变化或失效，
可重复验收建议使用自己控制的媒体资源。内置 MP4 的版权说明见
[`public/media/NOTICE.txt`](public/media/NOTICE.txt)。

## 测试与验收

在仓库根目录执行：

```bash
npm ci
npm test
node --test scripts/verify-release-archive.test.mjs
npm run build
npm run preview -- --host 127.0.0.1 --strictPort
```

打开 **http://127.0.0.1:4173/** 验证构建产物，并确保该 Origin 已授权。
预览服务使用已有 `dist/`，包括构建时写入的生产 Key。

| 检查 | 能验证什么 |
| --- | --- |
| `npm test` | 仅做 TypeScript 类型检查，不启动浏览器，也不验证播放或 P2P。 |
| `node --test scripts/verify-release-archive.test.mjs` | 验证发布包校验逻辑及对错误、篡改输入的拒绝，不是播放测试。 |
| `npm run build` | 类型检查、生产打包，以及复制对应版本的 Service Worker。 |
| 浏览器验收 | 真实播放、连接、P2P 流量、CDN 回退和会话释放。 |

建议先在本地完成以下检查，上线到 HTTPS 站点后再重复一次：

1. **CDN 播放：**使用有效 Key 和媒体地址，确认视频持续播放、媒体请求成功，
   页面显示的 SDK 版本为 `1.1.4`。
2. **P2P 传输：**两个窗口使用同一应用下的 Key、相同媒体地址，在相近播放位置
   同时请求媒体。确认 Peers 大于零，且 P2P down 或 P2P up 随请求增长。
   仅发现 Peer 不能证明传输已经发生。缓冲、NAT 和网络策略可能影响 P2P，
   P2P 与 HTTP 流量也可能同时增长。
3. **CDN 回退：**在浏览器 Network 中找到实际 Tracker 请求，使用请求屏蔽工具
   阻断该地址，再新建播放会话，同时保持媒体源可访问。确认仍可通过 CDN 播放。
   不要使用浏览器全局 Offline 开关，否则 CDN 也会断网。
4. **Service Worker / MP4：**在安全上下文中测试强制 SW 的 HLS 链接和 MP4 页签，
   在 DevTools 中检查 Worker 和媒体请求。自定义 MP4 源需要支持 HTTP Range。
   拖动进度后应能继续播放；重复请求相同数据不一定增加 SDK 统计。
5. **清理释放：**切换播放器、关闭模拟窗口、离开页面，检查是否有未捕获错误，
   并确认剩余会话仍可正常播放。

验收记录应包含浏览器及版本、Origin、播放器、去除签名凭据的媒体地址、SDK 版本、
P2P/CDN 结果及错误。SDK 源码测试在 P2PCDN 中于 npm 发布前执行，
本 Demo 仓库没有提供可单独运行的完整 SDK 源码测试集。

## 构建与上线

这是一个**静态站点**，可部署到支持 HTTPS 的静态托管平台、CDN 或 Nginx。
构建后不需要 Node.js 服务端；`npm run preview` 用于本地检查产物。

1. 在 MeshStream 控制台授权最终 HTTPS Origin，使用对该 Origin 有效的 Key。
2. 在托管平台的**构建环境**设置 `VITE_MESHSTREAM_SDK_KEY`，或在本机配置
   `.env.production.local`。
3. 安装命令使用 `npm ci`，构建命令使用 `npm run build`，发布目录填写 **`dist`**。
   部署它的**全部内容**，包括 `meshstream-sw.js` 与 `media/`。
4. 启用 HTTPS，确认资源、媒体、Worker 路径正确。不存在的 JS 文件应返回 404，
   不能被站点规则改写成 HTML 页面。
5. 访问线上站点，检查 SDK 版本，并重新完成浏览器验收。

部署到域名根路径时，以下地址应可访问：

```text
https://demo.example.com/index.html
https://demo.example.com/assets/...
https://demo.example.com/meshstream-sw.js
https://demo.example.com/media/sintel-trailer.mp4
```

部署到 `/demo/` 等子目录时，构建命令指定 base：

```bash
VITE_MESHSTREAM_SDK_KEY=your_web_sdk_key npm run build -- --base /demo/
```

将 `dist/` 内容放到 `/demo/` 下，Worker 应位于 `/demo/meshstream-sw.js`。
测试 Service Worker 时使用 `?transport=service-worker`，MP4 会自动选择此模式；
这时 Demo 会按 Vite base 设置 Worker 地址和作用域。未指定传输模式时，SDK 的
默认 Worker 地址可能仍指向域名根目录。不要只移动 `index.html`，也不要把 Worker
地址改写成 HTML。

本地预览这份子目录构建时，也要指定相同的 base：

```bash
npm run preview -- --base /demo/ --host 127.0.0.1 --strictPort
```

打开 `http://127.0.0.1:4173/demo/`。

### Nginx 示例：部署到根路径

完成 DNS、有效 TLS 证书和 `dist/` 上传后，可参考以下配置。
请替换域名、证书路径和站点目录：

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

CDN 应对 HTML 和固定地址 `meshstream-sw.js` 做缓存重新验证；`assets/` 下带哈希的
文件可以长期缓存。更新期间保留旧哈希资源，避免已打开的页面加载后续资源时失败。

跨域媒体的 CORS 应配置在**媒体源站**。允许站点 Origin、需要的 `GET`、`HEAD`、
`OPTIONS` 和 `Range` 请求，并暴露 `Content-Length`、`Content-Type`、`Accept-Ranges`、
`Content-Range` 响应头。MP4 字节范围请求应返回 `206` 和正确的 `Content-Range`；
Nginx 静态托管的同源 MP4 通常原生支持 Range。

## 常见问题

| 现象 | 排查方法 |
| --- | --- |
| 提示 SDK Key required | 手动填写 Key，或设置开发/构建环境变量，重启或重新构建后刷新页面。 |
| 本地能用，上线后 P2P 失败 | 检查构建实际使用的 Key、完整 HTTPS Origin 授权，并查看 bootstrap/session 与 Tracker 请求错误。 |
| localhost 自动跳到别的域名 | 清空 `VITE_P2PCDN_PUBLIC_HOST`，重启或重新构建。 |
| Peers 或 P2P 流量一直为零 | 两个匹配的观看端需要同时请求相近分片；检查 WebRTC、应用/Key 状态、配额、来源校验及 WebSocket 网络连接。CDN 回退仍可能正常播放。 |
| Service Worker 注册失败 | 使用 HTTPS 或 localhost；确认 Worker 返回 JavaScript 和正确 MIME 类型，不是 HTML。子目录检查 `--base`；新 Worker 可能需要激活或刷新。 |
| MP4 失败或没有 P2P | 检查 Range、206、Content-Range 和 CORS；普通整文件播放成功不等于分段 P2P 验证成功。 |
| 无声音或自动播放被暂停 | 点击 Play 或 Enable sound；浏览器通常限制自动播放。 |
| 模拟窗口未打开 | 允许 Demo 站点弹窗。 |
| 开发/构建时缺少 Worker | 执行 `npm ci`；`predev` / `prebuild` 会从已安装 npm SDK 复制 Worker。 |
| 安装时报 EINTEGRITY | 使用当前 main 提交的锁文件，检查 npm registry 后重试 `npm ci`，不要关闭完整性校验。 |
| 上线后仍显示旧版本 | 检查新 dist 是否上传，重新验证 HTML 与 Worker 缓存，再查看页面版本。 |

## 在自己的项目中接入或升级 SDK

如果只需要在业务项目接入 SDK，不必部署整个 Demo：

```bash
npm install @meshstream/p2p-web@1.1.4
```

在页面中准备 `<video controls playsinline></video>`，然后在 TypeScript 中接入：

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

此示例加载会话和媒体后，由用户点击视频控件开始播放。需要 Service Worker 传输时，
还需将 npm 包中的 `dist/meshstream-sw.js` 部署到自己的同源站点，并配置对应 URL
和作用域；本仓库的 `predev` / `prebuild` 脚本展示了复制方式。

升级本 Demo 时，使用 `npm install --save-exact @meshstream/p2p-web@<version>`
安装**已经发布的精确版本**，同时提交 `package.json` 和锁文件，再重复上述检查。
Worker 也必须从相同版本的包重新复制。
维护者发布流程见 [Release 归档与 npm 发布说明](releases/README.md)。
历史包位于 [GitHub Releases](https://github.com/Mesh-Stream/meshstream-p2p-web-sdk/releases)，
版本与校验和清单保留在 `releases/`。

其他 SDK：[Android](https://github.com/Mesh-Stream/meshstream-p2p-android-sdk) ·
[Apple](https://github.com/Mesh-Stream/meshstream-p2p-ios-sdk) ·
[Windows](https://github.com/Mesh-Stream/meshstream-p2p-Windows-sdk)。
支持邮箱：support@meshstream.net。请提供浏览器、Origin、SDK 版本、播放器选项及
脱敏日志，不要附带令牌、密码或带签名的媒体查询参数。
