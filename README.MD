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
- in `styles/globals.css`: `theme(colors.brand)`, `theme(colors.inkt)` and so on.

| Name | Colour | Used for |
|---|---|---|
| `brand` | `#D15949` | Nuts red: menu, footer, buttons, icons, labels, links and arrows |
| `dark` | `#B24A3B` | hover state of everything in `brand` |
| `darker` | `#7D352C` | only for an extra dark accent; not for buttons |
| `button` / `button-hover` | `#FEC248` / `#CB9B3A` | yellow secondary button on red (e.g. "Starten met Nuts", newsletter) |
| `inkt` | `#1C2A39` | headings and body text in the new layout |
| `leisteen`, `grijs` | `#4C5968`, `#5B6470` | secondary text |
| `creme`, `zand`, `perzik` | `#FBF6F4`, `#F0E7E5`, `#FCE5D3` | card background, card border, icon circle |
| `light` / `light-rand` | `#F1F9FB` / `#DCEBEF` | light blue: sections that explain how it works ("Hoe werkt Nuts?", "Hoe het werkt") |
| `nuts-blauw` | `#004B6B` | dark blue from the illustrations: the "Interesse in …?" block at the bottom of each toepassing |
| `nuts-blauw-fel` | `#0084DF` | bright blue of the Nuts circle in the illustrations: the icon in that block |
| `geel-licht` / `geel-rand` | `#FFF7E6` / `#FCE2A8` | note box ("Wat dit níét is") |

Rules:

- **Buttons** are pills (`rounded-full`): `bg-brand hover:bg-dark` with white text; the secondary button is outlined,
  or yellow (`bg-button`) on a red background.
- **Icons** sit in a round circle (`rounded-full`), in `brand` on `perzik`.
- **Cards** have a thin border and no shadow. Clickable cards only get a shadow on hover (`hover:shadow-md`).
- **Links with an arrow**: only the text is underlined, not the arrow.
- **Hand cursor** on everything clickable. Links get it automatically; a `<button>` needs `cursor-pointer`,
  because Tailwind 4 no longer sets it.
- New colour? Add it to `tailwind.config.js` and to this table first.

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
