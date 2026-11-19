// Stijlcontrole voor nuts.nl: bewaakt de huisstijlregels uit de README (sectie "Style").
//
// Controleert de .tsx-bestanden en de nieuwe regels in styles/globals.css die deze branch
// toevoegt of wijzigt ten opzichte van master. Oude, ongewijzigde bestanden worden niet
// gecontroleerd; zodra je er een aanpast, moet het wel aan de regels voldoen.
//
//   npm run check:style          bestanden die op deze branch zijn gewijzigd
//   npm run check:style -- --all alle bestanden (overzicht van oude afwijkingen)
//
// In CI (pull request) wordt vergeleken met de doelbranch (GITHUB_BASE_REF).

import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

const ALLES = process.argv.includes("--all");
const UITGEZONDERD = new Set(["components/Button.tsx"]); // hier staat de knopstijl zelf

const sh = (cmd) => {
  try { return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch { return ""; }
};

function basis() {
  const doel = process.env.GITHUB_BASE_REF || "master";
  for (const ref of [`origin/${doel}`, doel]) {
    const mb = sh(`git merge-base HEAD ${ref}`);
    if (mb) return mb;
  }
  return "";
}

const BASIS = ALLES ? "" : basis();
if (!ALLES && !BASIS) {
  console.log("Stijlcontrole: geen vergelijking met master mogelijk (geen git-geschiedenis); controleer met --all.");
  process.exit(0);
}

function bestanden() {
  if (ALLES) return sh("git ls-files 'pages/**' 'components/**'").split("\n").filter((f) => /\.(tsx|jsx|js)$/.test(f));
  const gewijzigd = [
    sh(`git diff --name-only --diff-filter=AMR ${BASIS}`),
    sh("git ls-files --others --exclude-standard"),
  ].join("\n").split("\n").filter(Boolean);
  return [...new Set(gewijzigd)].filter((f) => /^(pages|components)\/.*\.(tsx|jsx|js)$/.test(f) && existsSync(f));
}

// Haalt alle className-waarden uit een bestand: "…", '…', {`…`} of {uitdrukking} (met haakjes geteld).
function classNames(src) {
  const uit = [];
  const re = /className=/g;
  let m;
  while ((m = re.exec(src))) {
    let i = m.index + m[0].length;
    const start = i;
    if (src[i] === '"' || src[i] === "'") {
      const eind = src.indexOf(src[i], i + 1);
      uit.push({ waarde: src.slice(i + 1, eind), pos: start });
      continue;
    }
    if (src[i] === "{") {
      let diepte = 0;
      for (; i < src.length; i++) {
        if (src[i] === "{") diepte++;
        else if (src[i] === "}" && --diepte === 0) break;
      }
      uit.push({ waarde: src.slice(start + 1, i), pos: start });
    }
  }
  return uit;
}

const regel = (src, pos) => src.slice(0, pos).split("\n").length;
const zonderCommentaar = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " ")).replace(/(^|[^:])\/\/.*$/gm, (c, p) => p + " ".repeat(c.length - p.length));

const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![\w-])/g;
const VASTE_SCHADUW = /(?<![\w:-])shadow(?:-(?:sm|md|lg|xl|2xl|inner)|-\[[^\]]*\])?(?![\w-])/;
// Standaardkleuren van Tailwind (bg-gray-500, text-blue-600 …): niet de huisstijl.
const TAILWIND_PALET = /(?<![\w-])(?:[a-z-]+:)*(?:bg|text|border|ring|divide|fill|stroke|decoration|outline|from|via|to|shadow|accent|caret|placeholder)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(?![\w-])/;
// Kleur als losse waarde in een klasse: bg-[rgb(…)], text-[hsl(…)], border-[red] …
const LOSSE_KLEURWAARDE = /(?<![\w-])(?:[a-z-]+:)*(?:bg|text|border|ring|divide|fill|stroke|decoration|outline)-\[(?:rgba?|hsla?|oklch|oklab|color)\(/;
// Icoonvlak (vierkant blokje met gecentreerd icoon) dat niet rond is.
const ICOONVLAK = /(?<![\w-])h-(\d+(?:\.5)?)\b[^"`]*(?<![\w-])w-\1\b|(?<![\w-])w-(\d+(?:\.5)?)\b[^"`]*(?<![\w-])h-\2\b/;
const KNOPKLEUR = /(?<![\w:-])bg-(?:brand|dark|darker|button|nuts-blauw)(?![\w-])/;

const fouten = [];
const meld = (bestand, nr, tekst) => fouten.push(`${bestand}:${nr}  ${tekst}`);

for (const bestand of bestanden()) {
  if (UITGEZONDERD.has(bestand)) continue;
  const src = zonderCommentaar(readFileSync(bestand, "utf8"));

  // 1. Geen losse kleurcodes: gebruik de benoemde kleuren uit tailwind.config.js.
  for (const m of src.matchAll(HEX)) {
    const ervoor = src.slice(Math.max(0, m.index - 6), m.index);
    if (/href=["'{`]?$/.test(ervoor)) continue; // anker zoals href="#abc"
    meld(bestand, regel(src, m.index), `losse kleurcode ${m[0]}: gebruik een benoemde kleur (tailwind.config.js), of currentColor in een SVG`);
  }

  for (const { waarde, pos } of classNames(src)) {
    const nr = regel(src, pos);
    // 2. Geen vaste schaduw: kaarten hebben een dunne rand; alleen klikbare kaarten krijgen hover:shadow-md.
    if (VASTE_SCHADUW.test(waarde)) meld(bestand, nr, "vaste schaduw: gebruik een rand (border-zand); alleen hover:shadow-md op klikbare kaarten");
    // 2b. Alleen de benoemde kleuren: geen standaardkleuren van Tailwind en geen rgb()/hsl() in een klasse.
    if (TAILWIND_PALET.test(waarde)) meld(bestand, nr, `standaardkleur van Tailwind (${waarde.match(TAILWIND_PALET)[0]}): gebruik een benoemde kleur uit tailwind.config.js`);
    if (LOSSE_KLEURWAARDE.test(waarde)) meld(bestand, nr, "losse kleurwaarde (rgb/hsl) in een klasse: gebruik een benoemde kleur, eventueel met /opacity (bijv. bg-inkt/70)");
    // 2c. Eén lettertype-familie per soort tekst: font-inter of font-redhat.
    if (/(?<![\w:-])font-(?:\[|sans\b|serif\b|mono\b)/.test(waarde)) meld(bestand, nr, "ander lettertype: gebruik font-inter (tekst) of font-redhat (koppen)");
    // 2d. Iconen staan in een rond vlak.
    if (ICOONVLAK.test(waarde) && /items-center/.test(waarde) && /justify-center/.test(waarde) && /(?<![\w:-])bg-/.test(waarde) && !/rounded-full/.test(waarde))
      meld(bestand, nr, "icoonvlak dat niet rond is: gebruik rounded-full");
    // 3. Geen eigen knoppen: een gekleurd vlak met binnenmarge is een knop.
    // (kaarten en vlakken hebben grote hoeken, rounded-2xl of meer, en tellen niet als knop)
    if (KNOPKLEUR.test(waarde) && /(?<![\w:-])px-/.test(waarde) && /(?<![\w:-])py-/.test(waarde) && !/rounded-(?:2xl|3xl|\[)/.test(waarde) && !/knopStijl|keuzeStijl/.test(waarde))
      meld(bestand, nr, "eigen knopstijl: gebruik <Button> of knopStijl() uit components/Button.tsx");
    // 3b. Ook een zelfgemaakte omlijnde knop (rand, binnenmarge en vette letter) is een knop.
    else if (/(?<![\w:-])border\b/.test(waarde) && /(?<![\w:-])px-/.test(waarde) && /(?<![\w:-])py-/.test(waarde) && /(?<![\w:-])font-(?:semibold|bold)\b/.test(waarde)
      && !/rounded-(?:2xl|3xl|\[)/.test(waarde) && !/knopStijl|keuzeStijl/.test(waarde))
      meld(bestand, nr, "eigen omlijnde knop: gebruik <Button variant=\"secundair\"> of knopStijl(\"secundair\")");
  }

  // 4. Elke <button> heeft een handcursor (Tailwind 4 zet die niet meer).
  // 2e. Geen kleuren in een style-attribuut: gebruik klassen met de benoemde kleuren.
  for (const m of src.matchAll(/style=\{\{([^}]*)\}\}/g)) {
    if (/\b(?:color|background(?:Color)?|borderColor|fill|stroke|boxShadow)\s*:/.test(m[1]))
      meld(bestand, regel(src, m.index), "kleur of schaduw in style={{…}}: gebruik klassen met de benoemde kleuren");
  }

  const klassen = classNames(src);
  for (const m of src.matchAll(/<button\b/g)) {
    // de className van deze knop: de eerste className binnen de tag (vóór de volgende "<")
    const volgende = src.indexOf("<", m.index + 1);
    const cn = klassen.find((k) => k.pos > m.index && (volgende === -1 || k.pos < volgende));
    if (!cn || !/cursor-pointer|knopStijl|keuzeStijl/.test(cn.waarde))
      meld(bestand, regel(src, m.index), "<button> zonder handcursor: voeg cursor-pointer toe, of gebruik knopStijl()");
  }
}

// 5. Nieuwe CSS-regels in globals.css: geen losse kleurcodes, maar theme(colors.…).
if (!ALLES) {
  const diff = sh(`git diff -U0 ${BASIS} -- styles/globals.css`);
  let nr = 0;
  for (const r of diff.split("\n")) {
    const kop = r.match(/^@@ -\d+(?:,\d+)? \+(\d+)/);
    if (kop) { nr = Number(kop[1]); continue; }
    if (r.startsWith("+") && !r.startsWith("+++")) {
      const tekst = r.slice(1);
      const commentaar = /^\s*\/\*/.test(tekst);
      if (!commentaar && !/url\(/.test(tekst) && HEX.test(tekst))
        meld("styles/globals.css", nr, `losse kleurcode in nieuwe CSS: gebruik theme(colors.…)`);
      if (!commentaar && /(?:^|[^-\w])(?:color|background(?:-color)?|border(?:-[a-z]+)?-color|fill|stroke)\s*:[^;]*\b(?:rgba?|hsla?)\(/.test(tekst))
        meld("styles/globals.css", nr, `rgb()/hsl()-kleur in nieuwe CSS: gebruik theme(colors.…)`);
      if (!commentaar && /box-shadow\s*:(?!\s*(?:none\b|inset 0 0 0))/.test(tekst))
        meld("styles/globals.css", nr, `schaduw in nieuwe CSS: gebruik een rand (border) in plaats van een schaduw`);
      HEX.lastIndex = 0;
      nr++;
    }
  }
}

if (fouten.length) {
  console.error(`Stijlcontrole: ${fouten.length} afwijking(en) van de huisstijl (zie README, sectie "Style"):\n`);
  for (const f of fouten) console.error("  " + f);
  process.exit(1);
}
console.log("Stijlcontrole: alles volgens de huisstijl.");
