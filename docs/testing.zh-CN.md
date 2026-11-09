# Demo 测试

[English](testing.md) · [返回 README](../README.zh-CN.md)

先按 README 配好 SDK Key 和允许的站点地址。测试生产构建时，使用
`npm run build` 后的预览服务，并确认页面显示的 SDK 版本与 `package.json` 一致。

## 播放和 P2P

选择 hls.js，点击 Play。视频应持续播放，HTTP down 随媒体下载增长。
默认测试流来自第三方；正式验收最好使用自己控制的媒体。

点击 Simulate Peer，允许弹窗，让两个窗口在相近位置播放同一媒体。
观察 Peers、P2P down 和 P2P up：Peer 已连接但没有 P2P 字节增长，仍不能算传输成功。
播放器可能已缓存需要的数据，重复拖动同一片段不一定产生新的下载统计。
NAT、防火墙和缓冲情况也会影响 P2P，CDN 流量与 P2P 流量可以同时存在。

测试 MP4 时选择 MP4 页签，默认使用仓库自带的 Sintel 片段。
自定义源应支持 Range 请求，网络面板中应看到 `206` 和正确的 `Content-Range`。
拖动到不同位置，确认播放能恢复。跨域源还需要[媒体 CORS 配置](deployment.zh-CN.md#媒体源站)。
内置片段的授权见 [NOTICE](../public/media/NOTICE.txt)。

最后切换几次播放器、关闭模拟窗口，检查控制台有无未捕获错误，以及剩余窗口能否继续播放。
Safari 和手机浏览器需要在各自设备上测试，桌面 Chrome 的结果不能代替它们。

## CDN 回退

在浏览器 Network 中找到 Tracker 连接，用请求屏蔽工具阻断对应地址，再重新开始播放。
保持媒体源可访问，确认视频仍能通过 CDN 播放，HTTP down 继续增长。
不要用全局 Offline 开关，否则媒体源也会断网。

上线后在 HTTPS 域名上再做一次播放、P2P 和回退测试。
记录浏览器、SDK 版本、播放器、媒体地址和结果，媒体地址中的签名参数应去除。

## 播放器与参数

hls.js 页签使用 SDK 管理的 HLS 播放路径；dash.js、RxPlayer、Shaka 页签分别创建
对应播放器，通过适配器接入。video.js / plyr.js 页签目前使用通用 `attach` 路径，
没有创建这两个播放器。Native HLS 的实际路径取决于浏览器，不会在 Chrome 上强制原生 HLS。

常用测试链接：

```text
http://localhost:5173/?player=hls.js&transport=mse
http://localhost:5173/?player=hls.js&transport=service-worker
http://localhost:5173/?player=dash.js
http://localhost:5173/?player=rxplayer
http://localhost:5173/?player=shaka
http://localhost:5173/?player=mp4
```

`player` 还接受 `video.js`、`plyr.js`、`native`。`url` 覆盖媒体地址，地址带查询参数时
要先做 URL 编码；`key` 覆盖页面预填的 Key；`autoplay=1` 请求静音自动播放。
浏览器可能仍要求点击。Simulate Peer 会保留当前媒体、Key、播放器和传输模式。

`transport` 只影响 SDK 管理的路径，dash.js、RxPlayer、Shaka 使用各自的适配器。
MP4 固定使用 Service Worker，需要 HTTPS 或 localhost。

## 排查问题

播放失败时，先检查 Key 是否启用、站点地址是否授权，再看媒体请求和控制台错误。
跨域报错要在媒体源站配置 CORS；MP4 跳转失败则检查 Range 响应。

P2P 一直为零时，先确认两个窗口确实在请求相近的媒体片段，再检查 WebRTC、Tracker
连接、应用配额和网络策略。Worker 注册失败时，直接打开其 URL，确认返回的是
JavaScript，而不是 404 或被重写的 HTML。子目录路径见[部署说明](deployment.zh-CN.md#子目录部署)。

本仓库的 `npm test` 仅做类型检查。发布归档的校验测试单独运行：

```bash
node --test scripts/verify-release-archive.test.mjs
```

它检查包校验逻辑，不测试播放。SDK 源码测试由 SDK 构建仓库在发布前执行。
