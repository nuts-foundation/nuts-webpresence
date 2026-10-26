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

## Search (proof of concept)

One search over all formal Nuts documentation: nuts.nl, the Nuts node docs (ReadTheDocs, per version), the
Nuts node API (OpenAPI), the specifications and the toepassingen (FHIR implementation guides) and the wiki. The
specifications and toepassingen are read as markdown from their GitHub repositories; results link to the published pages
(GitBook, GitHub Pages). Off by default.

| Part | Where |
|---|---|
| Search engine | Meilisearch Community Edition, `docker-compose.yml` |
| Sources and labels | `search/sources.yaml` (also the definition of "formal Nuts documentation") |
| Synonyms (NL ↔ EN) | `search/synonyms.yaml` |
| Indexer | `search/indexer/` |
| Search page | `pages/zoeken.tsx`, `lib/search.ts`; search field in `components/Menu.tsx` |
| Findings | `search/FINDINGS.md` |

### Run locally

```bash
cp .env.example .env                 # set MEILI_MASTER_KEY (e.g. openssl rand -base64 32)
docker compose up -d                 # Meilisearch on http://localhost:7700

cd search/indexer && npm install
set -a && . ../../.env && set +a
npm run index                        # crawls all sources, takes a few minutes; prints the search-only key at the end
cd ../..

# .env.local for Next.js
cat > .env.local <<EOT
NEXT_PUBLIC_SEARCH_ENABLED=true
NEXT_PUBLIC_MEILI_HOST=http://localhost:7700
NEXT_PUBLIC_MEILI_SEARCH_KEY=<search-only key printed by the indexer>
EOT
npm run dev                          # http://localhost:3000/zoeken/
```

Indexer options:

- `npm run index -- --source wiki --source nuts-node` indexes only these sources; the records of other sources stay.
- `npm run index -- --dry-run` crawls without Meilisearch; output in `search/indexer/out/records.json`.
- `--verbose` lists every crawled page.
- `npm run index -- --if-changed` indexes only GitHub sources whose latest commit differs from the last indexed one,
  and skips all other sources. Meant for an hourly run; needs `git`.

Each run writes `search/indexer/out/report.json`: pages, records, errors and skipped pages with the reason.

### Add a source

1. Add an entry to `search/sources.yaml` (the fields are explained at the top of the file):
   `id`, `name`, `owner`, `startUrls`, `urlPrefix`, `selectors.content` (the element with the main text) and `labels`.
2. Use `discovery: sitemap` when the site has a usable sitemap; otherwise links are followed within `urlPrefix`.
   Use `exclude` for pages that are not documentation, and `overrides` for labels that differ per URL.
3. Run `npm run index -- --source <id> --dry-run --verbose` and check `out/records.json`:
   is the text free of navigation, and do the URLs have working anchors?
4. Run without `--dry-run` to load the records.

The master key is only used by the indexer. The browser only gets the search-only key.
