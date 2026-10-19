import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "node_modules", "@meshstream", "p2p-web", "dist", "meshstream-sw.js");
const destination = path.join(root, "public", "meshstream-sw.js");

await mkdir(path.dirname(destination), { recursive: true });
await copyFile(source, destination);
