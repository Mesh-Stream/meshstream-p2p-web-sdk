# MeshStream Web SDK

[English](README.md) · [在线演示](https://demo.meshstream.net/) · [npm](https://www.npmjs.com/package/@meshstream/p2p-web)

MeshStream 为浏览器中的 HLS、DASH 和 MP4 播放提供 P2P 分发，无法建立 P2P 连接时回退到 CDN。
本仓库提供接入示例和演示站，当前使用 `@meshstream/p2p-web@1.1.4`。

## 安装

在自己的前端项目中安装：

```bash
npm install @meshstream/p2p-web@1.1.4
```

先在 [MeshStream 控制台](https://console.meshstream.net/)创建应用，取得已启用的 Web SDK Key。
开启来源校验后，将网站地址加入允许列表，例如 `https://video.example.com`。
本地开发地址也需要加入，协议和端口要与实际访问地址一致。

页面放一个 video 元素：

```html
<video controls playsinline></video>
```

在页面加载后初始化 SDK：

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

点击视频控件开始播放。组件卸载或更换媒体时，调用 `player.dispose()` 释放会话。
使用 Service Worker 传输还需要部署 Worker 文件，见[部署说明](docs/deployment.zh-CN.md#service-worker)。

## 运行 Demo

使用 Node.js 22.12+ 或 24 LTS，建议先用 Chrome 或 Edge 测试。

```bash
git clone https://github.com/Mesh-Stream/meshstream-p2p-web-sdk.git
cd meshstream-p2p-web-sdk
npm ci
cp .env.example .env.local
```

把 `.env.local` 中的 Key 换成自己的：

```dotenv
VITE_MESHSTREAM_SDK_KEY=your_web_sdk_key
```

然后启动：

```bash
npm run dev
```

打开终端显示的地址，默认是 `http://localhost:5173`。开启来源校验时，记得授权这个地址；
如果 Vite 换了端口，允许列表也要一起修改。`localhost` 和 `127.0.0.1` 需要分别授权。

选择 hls.js，保留默认媒体地址或填入自己的地址，点击 **Play**。
页面会显示 SDK 版本、Peer 数和 P2P/CDN 流量。Key 也可以直接在页面填写。

Demo 通过 npm 安装 SDK，运行时连接 MeshStream 服务，不需要本地搭建后端。
页面中的 dash.js、RxPlayer 和 Shaka 使用各自的播放器实例；video.js / plyr.js
页签目前走 SDK 通用播放路径，没有加载这两个播放器。[播放器和参数说明](docs/testing.zh-CN.md#播放器与参数)

## 测试

```bash
npm test
npm run build
npm run preview -- --host 127.0.0.1 --strictPort
```

`npm test` 做 TypeScript 类型检查。构建完成后，打开 `http://127.0.0.1:4173`
检查实际页面；预览使用生产配置，请先按下一节填好生产 Key，并授权预览地址。

验证 P2P 时，点击 **Simulate Peer** 打开第二个窗口，让两个窗口播放同一媒体的相近位置。
Peers 大于零说明发现了其他观看端；P2P down 或 P2P up 持续增长，才说明有数据传输。
只有一个窗口时，主要走 CDN 是正常的。

播放、拖动进度、CDN 回退和不同播放器的测试方法见[测试说明](docs/testing.zh-CN.md)。

## 上线

Demo 构建后是静态站点，可以放在 Nginx 或静态托管平台上。

```bash
cp .env.example .env.production.local
```

编辑 `.env.production.local`，填入自己的 Key，再构建：

```bash
npm run build
```

将 `dist/` 的全部内容上传到站点目录，使用 HTTPS 访问，并在控制台授权正式域名。
使用托管平台时，安装命令填 `npm ci`，构建命令填 `npm run build`，输出目录填 `dist`；
Key 可以设置在平台的构建环境变量 `VITE_MESHSTREAM_SDK_KEY` 中。

仓库里的 `.env.production` 是官方演示站配置。自己的部署要用 `.env.production.local`
或平台构建变量覆盖它，单独修改 `.env.local` 不会覆盖生产配置。
这些值在构建时写入页面，修改后需要重新构建；`VITE_*` 变量不能存放后端密钥。

`dist/meshstream-sw.js` 和 `dist/media/` 也要一起上传。Worker 需要 HTTPS
或 localhost，普通局域网 HTTP 地址无法注册。
Nginx 配置、子目录部署、媒体跨域和缓存设置见[部署说明](docs/deployment.zh-CN.md)。

## 其他平台

- [iOS / macOS](https://github.com/Mesh-Stream/meshstream-p2p-ios-sdk)：原生 Apple 应用使用 `MeshStreamKit`，通过 Swift Package Manager 或 CocoaPods 安装。
- [Android](https://github.com/Mesh-Stream/meshstream-p2p-android-sdk)：Kotlin / Java 应用使用 Maven SDK，可接入 Media3 / ExoPlayer 等播放器。
- [Windows](https://github.com/Mesh-Stream/meshstream-p2p-Windows-sdk)：面向 Windows 10 / 11 x64 桌面应用，提供 C / C++ 接口。
- [uni-app](https://github.com/Mesh-Stream/meshstream-p2p-uniapp-sdk)：面向 uni-app Vue 3 App 的 UTS 插件，接入 iOS 和 Android 原生 SDK。
- [Flutter](https://github.com/Mesh-Stream/meshstream-p2p-flutter-sdk)：使用 Dart 插件 `meshstream_p2p` 接入 iOS / Android，可配合 `video_player` 使用。
- [React Native](https://github.com/Mesh-Stream/meshstream-p2p-react-native-sdk)：使用 npm 包 `react-native-meshstream` 接入 iOS / Android，可配合 `react-native-video` 使用。

## 升级与支持

升级 Demo 依赖时，安装已发布的精确版本，并提交 `package.json` 和 `package-lock.json`：

```bash
npm install --save-exact @meshstream/p2p-web@<version>
```

`npm run dev` 和 `npm run build` 会从已安装的 SDK 复制匹配的 Worker。
历史安装包放在 [GitHub Releases](https://github.com/Mesh-Stream/meshstream-p2p-web-sdk/releases)，
版本和校验和记录在 `releases/`；维护者参见[发布流程](releases/README.md)。

遇到问题可以联系 support@meshstream.net，附上 SDK 版本、浏览器版本、播放器选项和错误日志。
媒体地址带有签名参数时，请先去掉签名。
