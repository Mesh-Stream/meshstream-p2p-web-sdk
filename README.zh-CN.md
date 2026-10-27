# MeshStream Web Demo

[English](README.md)

## MeshStream SDKs

- [Online Demo](https://demo.meshstream.net/) for a live Web playback and P2P delivery view.
- [Web Demo](https://github.com/Mesh-Stream/meshstream-p2p-web-sdk) using the published npm SDK.
- [Android SDK](https://github.com/Mesh-Stream/meshstream-p2p-android-sdk) for Media3 / ExoPlayer apps.
- [Apple SDK](https://github.com/Mesh-Stream/meshstream-p2p-ios-sdk) for iOS and macOS apps.
- [Windows SDK](https://github.com/Mesh-Stream/meshstream-p2p-Windows-sdk) for C/C++ desktop apps.

这是 MeshStream Web SDK 的线上演示站源码。它展示 HLS、DASH 和浏览器原生
HLS 的播放接入，以及 Peer 数、P2P/CDN 流量和分发占比等运行时指标。

Demo 直接依赖 npm 已发布的 `@meshstream/p2p-web@1.0.1`，不引用 MeshStream
主工程源码或本地打包文件。线上部署构建出的产物可直接作为静态站点发布。

## 功能

- 支持 hls.js、dash.js、Shaka Player、RxPlayer、Video.js、Plyr 和浏览器原生 HLS；
- 使用 SDK Key 创建播放会话并将返回地址交给播放器；
- 展示 Peer 数、P2P 下载/上传、CDN 下载和分发占比；
- 在同一浏览器中打开模拟观看端，便于观察多端分片共享；
- 通过 `?transport=mse` 或 `?transport=service-worker` 选择演示传输模式。

加速不可用时，播放器仍可通过源站或 CDN 继续请求媒体内容。页面展示的
P2P 状态用于观察和排障，不应作为中断业务播放的依据。

## 本地运行

要求 Node.js 22 或更高版本。

```bash
npm install
npm run dev
```

打开终端输出的本地地址，填写在 MeshStream 控制台创建的 SDK Key 和媒体地址。
可在构建时使用环境变量预填 SDK Key：

```bash
VITE_MESHSTREAM_SDK_KEY=your_sdk_key npm run dev
```

## 生产构建

```bash
npm run build
```

构建前会从 npm 包复制与当前 SDK 版本匹配的 `meshstream-sw.js`。部署 `dist/`
目录时必须保留该文件在站点根路径，Service Worker 模式才能正常注册。

## 依赖更新

升级 Demo 使用的 SDK 时，修改 `package.json` 中
`@meshstream/p2p-web` 的版本，重新执行 `npm install`，再构建和验证。不要通过
本地路径、npm alias 或手工复制 SDK 构建产物替换该依赖。

## 支持

SDK 接入和服务支持请联系 support@meshstream.net。
