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

## Search

One search over all formal Nuts documentation: nuts.nl, the Nuts node docs (ReadTheDocs, per version), the
Nuts node API (OpenAPI), the specifications and the toepassingen (FHIR implementation guides) and the wiki. The
specifications and toepassingen are read as markdown from their GitHub repositories; results link to the published pages
(GitBook, GitHub Pages).

Off by default: it's on for everyone once the site is built with `NEXT_PUBLIC_SEARCH_ENABLED=true` (the repository variable `SEARCH_ENABLED` in the deploy workflow). Before that, testers turn it on in their own browser with `?enable-search=1` on any page, and off again with `?enable-search=0`.

| Part | Where |
|---|---|
| Search engine | Typesense, `docker-compose.yml` |
| Sources and labels | `search/sources.yaml` (also the definition of "formal Nuts documentation") |
| Synonyms (NL ↔ EN) | `search/synonyms.yaml` |
| Ranking (re-orders results by source type) | `search/ranking.yaml`, `lib/ranking.ts`; tests: `npm run test:search` |
| Indexer | `search/indexer/` |
| Search page | `pages/zoeken.tsx`, `lib/search.ts`; search field in `components/Menu.tsx` |

### Run locally

```bash
cp .env.example .env                 # set TYPESENSE_API_KEY and TYPESENSE_SEARCH_KEY (e.g. openssl rand -hex 32)
docker compose up -d                 # Typesense on http://localhost:8108

cd search/indexer && npm install
set -a && . ../../.env && set +a
npm run index                        # crawls all sources, takes a few minutes; creates the search-only key
cd ../..

# .env.local for Next.js
cat > .env.local <<EOT
NEXT_PUBLIC_SEARCH_ENABLED=true
NEXT_PUBLIC_TYPESENSE_URL=http://localhost:8108
NEXT_PUBLIC_TYPESENSE_SEARCH_KEY=<value of TYPESENSE_SEARCH_KEY>
EOT
npm run dev                          # http://localhost:3000/zoeken/
```

Indexer options:

- `npm run index -- --source wiki --source nuts-node` indexes only these sources; the records of other sources stay.
- `npm run index -- --dry-run` crawls without Typesense; output in `search/indexer/out/records.json`.
- `--verbose` lists every crawled page.
- `npm run index -- --if-changed` indexes only GitHub sources whose latest commit differs from the last indexed one, and skips all other sources. A run with failed pages, or with pages that aren't published yet, doesn't count as indexed. Meant for an hourly run; needs `git`.
- `--force-prune` also removes the records the indexer otherwise keeps: of pages that disappeared, when that's more than 5 records and more than a quarter of a source at once (without it the indexer leaves that source as it was and fails, as that more likely means an outage), and of pages in a repository that aren't published. Use it once the pages are really gone, for example after a site restructure.

Each run writes `search/indexer/out/report.json`: pages, records, errors and skipped pages with the reason.

### Add a source

1. Add an entry to `search/sources.yaml` (the fields are explained at the top of the file):
   `id`, `name`, `owner`, `startUrls`, `urlPrefix`, `selectors.content` (the element with the main text) and `labels`.
2. Use `discovery: sitemap` when the site has a usable sitemap; otherwise links are followed within `urlPrefix`.
   Use `exclude` for pages that are not documentation, and `overrides` for labels that differ per URL.
3. Run `npm run index -- --source <id> --dry-run --verbose` and check `out/records.json`:
   is the text free of navigation, and do the URLs have working anchors?
4. Run without `--dry-run` to load the records.

The admin key is only used by the indexer. The browser only gets the search-only key.

A changed schema (fields in `search/indexer/src/typesense.ts`) needs a new collection: delete `nuts-docs` in Typesense
and index all sources again.

### Ranking

Typesense returns the best text matches; the search page re-orders them by source type, without leaving any out. The
default puts technical sources first ("Technisch"); visitors can switch to "Functioneel", and under "Geavanceerd" change
the weight per source type and how much it counts. The formula and the defaults are in `search/ranking.yaml`; changing
them only needs a new build of the site.

API operations link to the operation in the Scalar API reference, in every version of the Nuts node docs.
