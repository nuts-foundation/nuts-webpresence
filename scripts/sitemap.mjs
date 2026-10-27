import { readdir, readFile, writeFile } from "fs/promises";
import path from "path";

const OUT_DIR = "./out";
const SITE_URL = "https://nuts.nl";

// Folders in the export that hold no pages.
const SKIP_DIRS = ["_next", "assets", "certs"];

// The 404 page is exported as a normal page and doesn't carry a noindex tag.
const SKIP_PAGES = ["404/"];

const NOINDEX = /<meta(?=[^>]*\bname=["']robots["'])(?=[^>]*\bcontent=["'][^"']*noindex)[^>]*>/i;

async function findPages(dir) {
  const pages = [];
  for (const entry of await readdir(path.join(OUT_DIR, dir), { withFileTypes: true })) {
    const rel = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.includes(rel)) {
        pages.push(...(await findPages(rel)));
      }
    } else if (entry.name === "index.html") {
      pages.push(rel);
    }
  }
  return pages;
}

async function main() {
  const urls = [];
  for (const page of await findPages("")) {
    // trailingSlash: true exports /actiz/ as actiz/index.html.
    const urlPath = page.slice(0, -"index.html".length);
    if (SKIP_PAGES.includes(urlPath)) {
      continue;
    }
    if (NOINDEX.test(await readFile(path.join(OUT_DIR, page), "utf8"))) {
      continue;
    }
    urls.push(`${SITE_URL}/${urlPath}`);
  }
  urls.sort();

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls.map((url) => `  <url><loc>${url}</loc></url>`),
    `</urlset>`,
    "",
  ].join("\n");

  await writeFile(path.join(OUT_DIR, "sitemap.xml"), xml);
  console.log(`Wrote ${OUT_DIR}/sitemap.xml (${urls.length} pages).`);
}

main();
