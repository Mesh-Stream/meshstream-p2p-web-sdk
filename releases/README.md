# Web SDK archives and publishing

Install the SDK from public npm. The Demo uses an exact published version in
`package.json` and `package-lock.json`.

SDK tarballs are GitHub Release attachments, not Git-tracked files. For version
`<version>`, the archive URL is:

```text
https://github.com/Mesh-Stream/meshstream-p2p-web-sdk/releases/download/<version>/meshstream-p2p-web-<version>.tgz
```

The matching `releases/<version>.json` records the filename, SHA-256, byte size
and npm integrity. Historical archives were migrated unchanged on 2026-11-09;
the old Git commits and existing tags were preserved. Removing tarballs from
`main` does not remove their bytes from Git history or reduce a full clone's
historical object storage. Use a shallow clone if that history is not needed.

Historical exception: for **1.0.11**, the recorded SHA-256 and size describe the
GitHub archive, while `integrity` matches the npm-distributed tarball. Those two
files differ. Both distributions and the original manifest are preserved. Use
SHA-256 to verify that historical GitHub attachment; it must not be republished
as a replacement npm package. New releases must have matching hashes for the
same bytes across the archive, manifest and npm.

## New SDK release

1. Select a new explicit SDK version and build, test and pack it in P2PCDN.
   Keep the internal implementation and build tools in P2PCDN.
2. Stage the resulting `.tgz` locally (ignored by Git). Record its exact version,
   SHA-256, SHA-512 npm integrity and size in a new `releases/<version>.json`.
   Update the documentation, changelog and licenses as needed; commit and push
   the release metadata to `main`.
3. Create the new version tag and a GitHub Release with the verified tarball as
   an attachment. For example, after setting the new `VERSION` and `ARCHIVE`:

   ```bash
   gh release create "$VERSION" "$ARCHIVE" \
     --repo Mesh-Stream/meshstream-p2p-web-sdk \
     --target main --title "Web SDK $VERSION" --notes-file release-notes.md
   ```

   Preserve existing tags and assets. Do not use `--clobber` to replace archives.
4. Download the attachment and verify it before publishing:

   ```bash
   mkdir -p /tmp/meshstream-web-release
   gh release download "$VERSION" --repo Mesh-Stream/meshstream-p2p-web-sdk \
     --pattern "meshstream-p2p-web-${VERSION}.tgz" --dir /tmp/meshstream-web-release
   node scripts/verify-release-archive.mjs "$VERSION" /tmp/meshstream-web-release
   gh workflow run publish-npm.yml --repo Mesh-Stream/meshstream-p2p-web-sdk \
     --ref main -f version="$VERSION"
   ```

   The workflow repeats validation and publishes that same file through npm
   Trusted Publishing. No npm token is stored in this repository. Do not rerun
   publication for an existing npm version.
   To test archive retrieval for an already published version, add
   `-f verify_only=true`; this runs the same download and validation and skips
   npm publication.
5. Verify the npm version and downloaded tarball, update the Demo's exact
   dependency and lockfile using public npm, and run `npm ci`, `npm test` and
   `npm run build`. Record browser playback, P2P and CDN fallback verification
   separately from build results, then commit and push the final Demo updates.

Never replace historical archives, manifests or tags. If a candidate needs new
bytes after its Release is published, use a new version. Report GitHub archive
publication, npm publication, installation, Demo build and runtime checks
separately.

## 中文说明

SDK 在 P2PCDN 统一编译、测试和打包；本仓库保存 Demo、文档、版本标签及
`releases/<version>.json`。`.tgz` 原样上传对应版本的 GitHub Release，临时本地包
由 `.gitignore` 排除。发布工作流下载附件，校验大小、SHA-256、npm integrity、包名及
版本后，通过现有 Trusted Publishing 绑定发布 npm。发布后再通过公网 npm 更新并验证
Demo。历史标签、清单、附件和 npm 版本均不覆盖；main 移除文件不等于重写 Git 历史。

1.0.11 的历史记录中，SHA-256/大小对应 GitHub 归档包，integrity 对应 npm 包，两者
字节不同；此次保持原样并注明差异。此后新版本要求两处使用同一份包和一致的校验记录。
