import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

export async function verifyArchive(version, archiveDirectory, manifestDirectory = path.join(root, "releases")) {
  assert.match(version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/, "Invalid SDK version");
  const manifest = JSON.parse(await readFile(path.join(manifestDirectory, `${version}.json`), "utf8"));
  const filename = `meshstream-p2p-web-${version}.tgz`;
  assert.equal(manifest.package, "@meshstream/p2p-web", "Manifest package mismatch");
  assert.equal(manifest.version, version, "Manifest version mismatch");
  assert.equal(manifest.artifact.file, filename, "Archive filename mismatch");
  const archive = path.resolve(archiveDirectory, filename);
  const bytes = await readFile(archive);
  assert.equal(bytes.length, manifest.artifact.bytes, "Archive size mismatch");
  assert.equal(createHash("sha256").update(bytes).digest("hex"), manifest.artifact.sha256, "Archive SHA-256 mismatch");
  assert.equal(`sha512-${createHash("sha512").update(bytes).digest("base64")}`, manifest.artifact.integrity, "Archive npm integrity mismatch");
  const pkg = JSON.parse(execFileSync("tar", ["-xOf", archive, "package/package.json"], { encoding: "utf8" }));
  assert.equal(pkg.name, manifest.package, "Package name mismatch");
  assert.equal(pkg.version, version, "Package version mismatch");
  console.log(`Verified ${filename}: version, size, SHA-256 and npm integrity`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await verifyArchive(process.argv[2] ?? "", process.argv[3] ?? ".");
}
