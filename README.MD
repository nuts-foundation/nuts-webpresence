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

One search over all formal Nuts documentation: nuts.nl, the Nuts node docs (ReadTheDocs, per version), the Nuts node API (OpenAPI), the specifications and the toepassingen (FHIR implementation guides) and the wiki. This repository has the search page and the search field. The index is Typesense at https://search.nuts.nl, filled every night by the indexer in nuts-foundation/infra-admin, which also lists the sources.

Off by default: it's on for everyone once the site is built with `NEXT_PUBLIC_SEARCH_ENABLED=true` (the repository variable `SEARCH_ENABLED` in the deploy workflow). Before that, testers turn it on in their own browser with `?enable-search=1` on any page, and off again with `?enable-search=0`.

| Part | Where |
|---|---|
| Search page | `pages/zoeken.tsx`; search field in `components/Menu.tsx` and `components/SearchField.tsx` |
| Typesense client | `lib/search.ts`: https://search.nuts.nl with its public search-only key, unless `.env.local` sets another (see `.env.example`) |
| Ranking (re-orders results by source type) | `search/ranking.yaml`, `lib/ranking.ts`; tests: `npm run test:search` |

To work on the search locally, run `npm run dev` and open http://localhost:3000/zoeken/?enable-search=1: it searches the production index. To use another Typesense, such as a local one filled by the indexer, set its address and search-only key in `.env.local`.

### Ranking

Typesense returns the best text matches; the search page re-orders them by source type, without leaving any out. The
default puts technical sources first ("Technisch"); visitors can switch to "Functioneel", and under "Geavanceerd" change
the weight per source type and how much it counts. The formula and the defaults are in `search/ranking.yaml`; changing
them only needs a new build of the site.

API operations link to the operation in the Scalar API reference, in every version of the Nuts node docs.
