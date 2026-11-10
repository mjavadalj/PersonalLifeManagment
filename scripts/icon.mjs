import { chromium } from "@playwright/test";
import { readFile, writeFile, mkdir } from "node:fs/promises";
await mkdir("build", { recursive: true });
const svg = await readFile("public/icon.svg", "utf8");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
const sizes = [16, 32, 48, 64, 256];
const images = [];
for (const size of sizes) {
  const data = await page.evaluate(
    async ({ svg, size }) => {
      const image = new Image();
      image.src = "data:image/svg+xml;base64," + btoa(svg);
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      canvas.getContext("2d").drawImage(image, 0, 0, size, size);
      return canvas.toDataURL("image/png").split(",")[1];
    },
    { svg, size },
  );
  images.push(Buffer.from(data, "base64"));
}
await browser.close();
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
images.forEach((data, i) => {
  const p = 6 + i * 16;
  header[p] = header[p + 1] = sizes[i] === 256 ? 0 : sizes[i];
  header.writeUInt16LE(1, p + 4);
  header.writeUInt16LE(32, p + 6);
  header.writeUInt32LE(data.length, p + 8);
  header.writeUInt32LE(offset, p + 12);
  offset += data.length;
});
await writeFile("build/icon.ico", Buffer.concat([header, ...images]));
await writeFile("public/icon.png", images.at(-1));
console.log("Authored icon rendered at five Windows sizes.");
