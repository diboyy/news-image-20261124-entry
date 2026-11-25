// news-image-20261124-entry — writes the pre-rendered front-page poster to /output/entry.png
// No network, no randomness: the output is a byte-for-byte copy of entry.png.
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, "entry.png");
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
const dest = join(outDir, "entry.png");

if (!existsSync(source)) fail(`source image missing: ${source}`);
const srcBytes = readFileSync(source);
if (!srcBytes.subarray(0, 8).equals(PNG_MAGIC)) {
  fail("source entry.png does not start with PNG magic bytes");
}
// Competition limits: at most 1 MiB and exactly 1024x1024 px (IHDR width/height).
if (srcBytes.length > 1048576) {
  fail(`source entry.png is ${srcBytes.length} bytes, over the 1 MiB limit`);
}
const width = srcBytes.readUInt32BE(16);
const height = srcBytes.readUInt32BE(20);
if (width !== 1024 || height !== 1024) {
  fail(`source entry.png is ${width}x${height}, expected 1024x1024`);
}

mkdirSync(outDir, { recursive: true });
copyFileSync(source, dest);

const dstBytes = readFileSync(dest);
if (!dstBytes.subarray(0, 8).equals(PNG_MAGIC)) {
  fail("destination entry.png does not start with PNG magic bytes");
}
if (dstBytes.length !== srcBytes.length || !dstBytes.equals(srcBytes)) {
  fail(`incomplete copy: source ${srcBytes.length} bytes, destination ${dstBytes.length} bytes`);
}

console.log(`Wrote ${dest} (${dstBytes.length} bytes, PNG 1024x1024)`);
