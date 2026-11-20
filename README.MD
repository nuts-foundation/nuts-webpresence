# www.nuts.nl

The "webpresence" site for Nuts, where we tell the world who we are. Nothing
very complicated or special, it's a regular statically generated Next.js site.

Hosting is done through [Github pages](https://pages.github.com/). So be advised
that pushing to master is equal to deploying.

## Podcast

One thing to notice is that it's also where we host our Going Nuts podcast. So
when refactoring this project in the future, please do keep that in mind ;)

The podcast lives at `https://nuts.nl/going-nuts.xml`.

## Local development

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Style

The colours come from the Nuts brand guide (the same colours as in the illustrations). They are defined once, as named
colours in `tailwind.config.js`. Use those names, never a loose colour code:

- in components: Tailwind classes such as `bg-brand`, `text-inkt`, `border-zand`;
- in `styles/globals.css`: `theme(colors.brand)`, `theme(colors.inkt)` and so on;
- in an SVG: `fill="currentColor"` or `stroke="currentColor"`, with the colour as a class (e.g. `text-brand`);
- not the default Tailwind colours (`gray-500`, `blue-600` …), no `rgb()`/`hsl()` and no colours in `style={{…}}`.
  For transparency use the named colour with an opacity, e.g. `bg-inkt/70` or `border-white/50`.

| Name | Colour | Used for |
|---|---|---|
| `brand` | `#D15949` | Nuts red: menu, footer, buttons, icons, labels, links and arrows |
| `dark` | `#B24A3B` | hover state of everything in `brand` |
| `darker` | `#7D352C` | only for an extra dark accent; not for buttons |
| `button` / `button-hover` | `#FEC248` / `#CB9B3A` | yellow button on red or dark blue (e.g. "Starten met Nuts", newsletter) |
| `inkt` | `#1C2A39` | headings and body text in the new layout |
| `leisteen`, `grijs` | `#4C5968`, `#5B6470` | secondary text |
| `creme`, `zand`, `perzik` | `#FBF6F4`, `#F0E7E5`, `#FCE5D3` | card background, card border, icon circle; the note box ("Wat dit níét is") is `creme` with a `brand` line on the left |
| `zand-donker` | `#D6C9C4` | border of the secondary button and of input fields |
| `pijl` | `#B8ADA9` | arrow in a list row before hover |
| `onderstreep` | `#F0C9C2` | underline of a text link |
| `light` / `light-rand` | `#F1F9FB` / `#DCEBEF` | light blue: sections that explain how it works ("Hoe werkt Nuts?", "Hoe het werkt") |
| `nuts-blauw` | `#004B6B` | dark blue from the illustrations: the "Interesse in …?" and "Hulp nodig bij een stap?" blocks |
| `nuts-blauw-fel` | `#0084DF` | bright blue of the Nuts circle in the illustrations: the icon in those blocks |
| `nuts-blauw-donker` | `#0B122C` | darkest blue, for hover on dark blue |
| `nuts-groen` | `#87A14C` | light green of the Nuts circle in the illustrations: numbers and link underlines in the "Interesse in …?" block |
| `fase-idee`, `brand`, `button`, `fase-productie` | `#8B97A8`, `#D15949`, `#FEC248`, `#2E8A4F` | status dot per phase: Idee, PoC, In ontwikkeling, In productie (always with its label) |

Rules:

- **Buttons**: always use `<Button>` from `components/Button.tsx` (or `knopStijl()` for a `<button>` with `onClick`).
  It is a pill in Nuts red with a darker hover, one size everywhere. Variants: `primair` (default), `secundair`
  (outlined, on a light background), `geel` and `op-donker` (on red or dark blue). Filter and choice chips use `keuzeStijl()`.
  Do not write your own button classes; `className` on `<Button>` is only for placement (margin, alignment, width).
- **Icons** sit in a round circle (`rounded-full`), in `brand` on `perzik`. They belong in cards, lists and blocks;
  section headings (`<h2>`) and the label above a page title have no icon.
- **Fonts**: `font-inter` for text, `font-redhat` for headings; no other font families.
- **Cards** have a thin border (`border-zand`) and no shadow, also not in CSS (`box-shadow`). Clickable cards only get a
  shadow on hover (`hover:shadow-md`).
- **Arrows**: use `<Pijl href={…} />` from `components/Button.tsx` instead of typing an arrow. It shows → for a page on
  nuts.nl and ↗ for an external site (which opens in a new tab, also announced to screen readers). Do not put arrows
  in labels in the config files. Only the text of a link is underlined, never the arrow.
- **Hand cursor** on everything clickable. Links get it automatically; a `<button>` needs `cursor-pointer`
  (`knopStijl()` and `keuzeStijl()` include it), because Tailwind 4 no longer sets it.
- **CSS in `styles/globals.css`** is only for styling text that comes from Markdown files (which cannot carry Tailwind
  classes). Everything else is done with Tailwind classes in the component.
- New colour? Add it to `tailwind.config.js` and to this table first.

### Style check

`npm run check:style` checks the rules above in the files your branch adds or changes (compared with master):

- colours: no loose colour codes, no default Tailwind colours, no `rgb()`/`hsl()` and no colours in `style={{…}}`;
- buttons: no own button styles (filled or outlined), and a hand cursor on every `<button>`;
- no fixed shadows, round icon circles, and only `font-inter` / `font-redhat`;
- new lines in `styles/globals.css`: no loose colours and no `box-shadow`.

It runs on every pull request, next to the build and the smoke test. `npm run check:style -- --all`
lists the older files that do not follow the rules yet; fix those when you touch them.

### A new page

1. Put the page in `pages/` and wrap it in `<Layout>`.
2. Start with `<PaginaKop>` (label, title, intro, buttons and an image or a side block) and put the content in
   `<PaginaInhoud>`, so everything lines up with the header.
3. Use `<Button>` for buttons, `KennisbankIcon` in a round circle for icons, and the named colours for everything else.
4. Text that editors maintain goes into a Markdown file in `content/`; its styling (if needed) goes into `globals.css`.
5. Run `npm run check:style`, `npm run export` and `npm run smoke-test` before you open a pull request.

## Search

One search over all formal Nuts documentation: nuts.nl, the Nuts node docs (ReadTheDocs, per version), the Nuts node API (OpenAPI), the specifications and the toepassingen (FHIR implementation guides) and the wiki. This repository has the search page and the search field. The index is Typesense at https://search.nuts.nl, filled every night by the indexer in nuts-foundation/infra-admin, which also lists the sources.

| Part | Where |
|---|---|
| Search page | `pages/zoeken.tsx`; search field in `components/Menu.tsx` and `components/SearchField.tsx` |
| Typesense client | `lib/search.ts`: https://search.nuts.nl with its public search-only key, unless `.env.local` sets another (see `.env.example`) |
| Ranking (re-orders results by source type) | `search/ranking.yaml`, `lib/ranking.ts`; tests: `npm run test:search` |

To work on the search locally, run `npm run dev` and open http://localhost:3000/zoeken/: it searches the production index. To use another Typesense, such as a local one filled by the indexer, set its address and search-only key in `.env.local` (see `.env.example`).

### Ranking

Typesense returns the best text matches; the search page re-orders them by source type, without leaving any out. The
default puts technical sources first ("Technisch"); visitors can switch to "Functioneel", and under "Geavanceerd" change
the weight per source type and how much it counts. The formula and the defaults are in `search/ranking.yaml`; changing
them only needs a new build of the site.

API operations link to the operation in the Scalar API reference, in every version of the Nuts node docs.
