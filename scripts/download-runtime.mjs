import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, stat, readFile, writeFile, rename } from "node:fs/promises";
import { createHash } from "node:crypto";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { extract } from "@electron-internal/extract-zip";
import path from "node:path";
const { version } = JSON.parse(
  await readFile("node_modules/electron/package.json", "utf8"),
);
const name = `electron-v${version}-win32-x64.zip`,
  part = `tmp/${name}.part`;
await mkdir("tmp", { recursive: true });
const size = await stat(part)
  .then((s) => s.size)
  .catch(() => 0);
const response = await fetch(
  `https://github.com/electron/electron/releases/download/v${version}/${name}`,
  {
    headers: size ? { Range: `bytes=${size}-` } : {},
    signal: AbortSignal.timeout(900000),
  },
);
if (!response.ok) throw Error(`Download ${response.status}`);
const resume =
  response.status === 206 &&
  response.headers.get("content-range")?.startsWith(`bytes ${size}-`);
let total = resume ? size : 0,
  last = total;
const body = Readable.fromWeb(response.body);
body.on("data", (chunk) => {
  total += chunk.length;
  if (total - last > 5 * 1024 * 1024) {
    console.log(`${Math.round(total / 1024 / 1024)} MiB downloaded`);
    last = total;
  }
});
await pipeline(body, createWriteStream(part, { flags: resume ? "a" : "w" }));
const hash = createHash("sha256");
for await (const chunk of createReadStream(part)) hash.update(chunk);
const actual = hash.digest("hex"),
  checksums = JSON.parse(
    await readFile("node_modules/electron/checksums.json", "utf8"),
  );
if (actual !== checksums[name]) throw Error("Electron checksum mismatch");
const zip = part.replace(/\.part$/, "");
await rename(part, zip);
await extract(zip, { dir: path.resolve("node_modules/electron/dist") });
await writeFile("node_modules/electron/path.txt", "electron.exe");
console.log(`Electron ${version} verified and installed (${total} bytes).`);
