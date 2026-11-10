import { build } from "esbuild";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
await mkdir("tmp/quote-sources", { recursive: true });
await build({
  entryPoints: ["src/data/quotes.ts"],
  outfile: "tmp/quotes.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
});
const { quotes } = await import("../tmp/quotes.mjs?" + Date.now());
const sourceList = [...new Set(quotes.map((q) => q.source))];
const errors = [];
const sources = {};
await Promise.all(
  sourceList.map(async (url) => {
    const file = `tmp/quote-sources/${createHash("sha256").update(url).digest("hex").slice(0, 12)}.html`;
    try {
      try {
        sources[url] = await readFile(file, "utf8");
      } catch {
        const r = await fetch(url, { signal: AbortSignal.timeout(40000) });
        if (!r.ok) throw Error(String(r.status));
        sources[url] = await r.text();
        await writeFile(file, sources[url]);
      }
    } catch (e) {
      errors.push({ url, error: String(e) });
    }
  }),
);
function norm(s) {
  return s
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&#\d+;|&#x[0-9a-f]+;|&[a-z]+;/gi, " ")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}
const results = quotes.map((q) => ({
  id: q.id,
  source: q.source,
  matched: !!sources[q.source] && norm(sources[q.source]).includes(norm(q.en)),
}));
await writeFile(
  "tmp/quote-source-report.json",
  JSON.stringify(
    { date: new Date().toISOString(), total: quotes.length, errors, results },
    null,
    2,
  ),
);
console.log(
  JSON.stringify(
    {
      total: quotes.length,
      matched: results.filter((r) => r.matched).length,
      unmatched: results.filter((r) => !r.matched).map((r) => r.id),
      errors,
    },
    null,
    2,
  ),
);
