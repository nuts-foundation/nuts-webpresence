import { readFile } from "fs/promises";
import { existsSync } from "fs";

const OUT_DIR = "./out";

// Markdown syntax that should never survive into rendered HTML. If these
// show up, the markdown-to-HTML pipeline silently broke (this is exactly
// what happened when remark-html and remark/remark-gfm ended up on
// incompatible unified major versions).
const LEFTOVER_MARKDOWN_PATTERNS = [
  { name: "unrendered link", regex: /\[[^\]<>]{1,80}\]\(https?:\/\/[^)<>]+\)/ },
  { name: "unrendered bold", regex: /\*\*[^<>*]{1,80}\*\*/ },
  { name: "unrendered heading", regex: /(^|>)#{1,6} [^<\n]{1,80}(<|\n)/m },
];

// Pages that render markdown content, with the HTML structure they must
// contain once actually rendered.
const PAGE_CHECKS = [
  {
    path: "index.html",
    label: "homepage",
    mustContain: [/<h1/i],
  },
  {
    path: "q-and-a/index.html",
    label: "/q-and-a/",
    mustContain: [/<h1/i, /<h2/i, /<a\s+href=/i],
  },
  {
    path: "documentatie/index.html",
    label: "/documentatie/",
    mustContain: [/<h1/i, /<h2/i, /<blockquote/i, /<a\s+href=/i],
  },
  {
    path: "kalender/index.html",
    label: "/kalender/",
    // Raw HTML embedded in markdown (sanitize: false) must still pass through.
    mustContain: [/<iframe/i],
  },
  {
    path: "toepassingen/index.html",
    label: "/toepassingen/",
    mustContain: [/<h1/i],
  },
  {
    path: "nieuws/poc-mitz-nuts/index.html",
    label: "/nieuws/poc-mitz-nuts/",
    // Content contains a standalone YouTube link, which embedYoutubeLinks()
    // in lib/markdown.ts should turn into an iframe via a regex match
    // against remark-html's exact output shape. That match is easy to
    // silently break without this page being covered.
    mustContain: [/<h1/i, /<iframe[^>]+youtube\.com\/embed\//i],
  },
];

async function readOut(relPath) {
  return readFile(`${OUT_DIR}/${relPath}`, "utf8");
}

function stripScriptsAndStyles(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
}

async function main() {
  const failures = [];

  if (!existsSync(OUT_DIR)) {
    console.error(`Smoke test failed: ${OUT_DIR} does not exist. Run "npm run export" first.`);
    process.exit(1);
  }

  for (const page of PAGE_CHECKS) {
    let html;
    try {
      html = await readOut(page.path);
    } catch {
      failures.push(`${page.label}: expected output file "${OUT_DIR}/${page.path}" does not exist`);
      continue;
    }

    for (const pattern of page.mustContain) {
      if (!pattern.test(html)) {
        failures.push(`${page.label}: expected to find ${pattern} in rendered output, but it's missing`);
      }
    }

    const visibleHtml = stripScriptsAndStyles(html);
    for (const { name, regex } of LEFTOVER_MARKDOWN_PATTERNS) {
      const match = visibleHtml.match(regex);
      if (match) {
        failures.push(`${page.label}: found ${name} in rendered output: "${match[0].slice(0, 80)}"`);
      }
    }
  }

  if (failures.length > 0) {
    console.error("Smoke test failed:\n");
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    process.exit(1);
  }

  console.log(`Smoke test passed (${PAGE_CHECKS.length} pages checked).`);
}

main();
