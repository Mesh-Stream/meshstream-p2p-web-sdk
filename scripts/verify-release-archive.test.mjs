import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { verifyArchive } from "./verify-release-archive.mjs";

async function fixture(t, packageVersion = "1.2.3") {
  const dir = await mkdtemp(path.join(os.tmpdir(), "web-release-test-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(path.join(dir, "package"));
  await writeFile(path.join(dir, "package/package.json"), JSON.stringify({ name: "@meshstream/p2p-web", version: packageVersion }));
  const filename = "meshstream-p2p-web-1.2.3.tgz";
  execFileSync("tar", ["-czf", path.join(dir, filename), "-C", dir, "package"]);
  const bytes = await readFile(path.join(dir, filename));
  const manifest = { package: "@meshstream/p2p-web", version: "1.2.3", artifact: {
    file: filename, bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    integrity: `sha512-${createHash("sha512").update(bytes).digest("base64")}`,
  } };
  await writeFile(path.join(dir, "1.2.3.json"), JSON.stringify(manifest));
  return { dir, filename, bytes, manifest };
}

test("accepts the recorded release archive", async (t) => {
  const { dir } = await fixture(t);
  await verifyArchive("1.2.3", dir, dir);
});
test("rejects tampered bytes even if the size is unchanged", async (t) => {
  const { dir, filename, bytes } = await fixture(t);
  bytes[10] ^= 1;
  await writeFile(path.join(dir, filename), bytes);
  await assert.rejects(verifyArchive("1.2.3", dir, dir), /SHA-256 mismatch/);
});
test("rejects a different package version even with valid hashes", async (t) => {
  const { dir } = await fixture(t, "9.9.9");
  await assert.rejects(verifyArchive("1.2.3", dir, dir), /Package version mismatch/);
});
test("rejects an inconsistent npm integrity record", async (t) => {
  const { dir, manifest } = await fixture(t);
  manifest.artifact.integrity = "sha512-invalid";
  await writeFile(path.join(dir, "1.2.3.json"), JSON.stringify(manifest));
  await assert.rejects(verifyArchive("1.2.3", dir, dir), /npm integrity mismatch/);
});
test("rejects a version containing path traversal", async () => {
  await assert.rejects(verifyArchive("../../1.2.3", "."), /Invalid SDK version/);
});
