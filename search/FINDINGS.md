# Bevindingen: proof of concept documentatiezoeker

Eén zoekfunctie over alle formele Nuts-documentatie, met Meilisearch Community Edition v1.55.0.
Wat "formele documentatie" is, staat in `search/sources.yaml`.

## Resultaat in cijfers

Volledige indexrun op 26 oktober 2026: 2 min 18 s, 2.018 records (1.473 Engels, 545 Nederlands).

| Bron | Pagina's | Records | Fouten | Overgeslagen |
|---|---:|---:|---:|---:|
| nuts.nl | 33 | 168 | 0 | 17 (zelfde pagina met en zonder `/`) |
| Nuts node-documentatie v6.2 | 36 | 280 | 1 | 0 |
| Nuts node-documentatie v5.4 | 42 | 325 | 0 | 0 |
| Nuts node API v6.2 (OpenAPI) | 10 specs | 85 | 0 | 0 |
| Nuts node API v5.4 (OpenAPI) | 7 specs | 56 | 0 | 0 |
| Nuts-specificaties v2 | 18 | 350 | 0 | 1 |
| Toepassing ANW | 5 | 50 | 0 | 0 |
| Toepassing Generieke functies | 24 | 84 | 0 | 2 |
| Toepassing Zorginzage | 5 | 29 | 0 | 1 |
| Toepassing Cliëntbeeld 360 | 5 | 25 | 0 | 1 |
| Toepassing eOverdracht routering | 5 | 17 | 0 | 1 |
| Toepassing PZP | 5 | 29 | 0 | 1 |
| Nuts wiki | 100 | 520 | 2 | 1 |

De fouten zijn dode links in de bronnen zelf (HTTP 404), geen fouten van de indexer:

- Nuts node v6.2: `/pages/deployment/nuts-node-api`
- Wiki: `/books/designing-a-nuts-use-case/chapter/endpoint-discovery` en `/books/generic-technical-agreements`

Elke run schrijft de details naar `search/indexer/out/report.json`.

## Per bron

### nuts.nl
- Goed: de hoofdtekst zit netjes in één element.
- Slecht:
  - Niet alle pagina's worden gevonden. nuts.nl heeft geen `sitemap.xml`, dus de indexer volgt links vanaf de homepage. Vijf pagina's zijn nergens gelinkt en ontbreken daardoor: `/actiz/`, `/toepassingen/welldata/`, `/use-case/zorginzage/` en twee nieuwsberichten. Zie de opties hieronder.
  - `/certs/` ontbreekt ook. De uitsluitregel in `sources.yaml` was bedoeld voor de `.pem`-bestanden eronder, maar raakt ook de pagina zelf. Oplossing: de regel beperken tot `/certs/.+`.
  - Koppen hebben geen `id`, dus deeplinks gebruiken een tekstfragment (`#:~:text=…`). Dat werkt in Chrome, Edge, Safari 16.1+ en Firefox 131+. In oudere browsers opent de pagina bovenaan.
  - Filterknoppen en formulierteksten moesten expliciet worden weggefilterd.
  - Interne links gebruiken URL's met én zonder slash aan het eind. Die worden nu als één pagina geteld.

#### Ontbrekende pagina's vinden: overwogen opties

| Optie | Oordeel |
|---|---|
| Sitemap genereren uit de export (`out/`) na `next build`, plus `robots.txt` die ernaar verwijst | Gekozen: [issue #439](https://github.com/nuts-foundation/nuts-webpresence/issues/439). Elke geëxporteerde pagina komt er vanzelf in, en zoekmachines hebben er ook baat bij. Daarna gebruikt de bron `nuts-nl` `discovery: sitemap`. |
| Sitemap genereren uit de markdown in `content/` | Afgewezen: mist pagina's die niet uit markdown komen, zoals `pages/starten.tsx`. |
| Ontbrekende pagina's als extra `startUrls` in `sources.yaml` zetten | Afgewezen: een lijst die met de hand moet worden bijgehouden. Een nieuwe ongelinkte pagina valt weer weg. |
| De indexer leest `content/` uit de repo, zoals bij de GitHub-bronnen | Afgewezen: de URL's en de opmaak komen uit de Next.js-pagina's. Die logica zou de indexer dan moeten nabouwen. |
| Links naar de vijf pagina's toevoegen op overzichtspagina's | Los van de sitemap. Vraag in #439: zijn ze bewust ongelinkt? |

### Nuts node-documentatie (ReadTheDocs)
- Goed: Sphinx levert vaste ankers per kop. De versies staan apart in de URL en krijgen elk een versielabel.
- Slecht:
  - Dezelfde pagina in v6.2 en v5.4 stond vaak op plek 1 en 2 (bijvoorbeeld "deployment"). Opgelost: een sectie die in beide versies voorkomt, is nu één resultaat met een link per versie. Bij gelijke score wint de nieuwste versie.
  - Koppelen gaat op URL zonder versie plus kopstructuur. Van de ±300 secties per versie zijn er 134 gekoppeld. De rest verschilt tussen de versies: een andere kop, of een pagina die alleen in één versie bestaat.
  - De versies staan nu met de hand in `sources.yaml` (v6.2, v5.4). Bij een nieuwe minor of major moet iemand ze bijwerken.

### Nuts node API (OpenAPI)
- Goed: één record per operatie, zodat zoeken op een endpoint (`/internal/auth/v2/...`) werkt. Verouderde specs krijgen status `archief`.
- Slecht: de API-pagina (Swagger UI) heeft geen ankers per operatie. Een resultaat opent de API-pagina, niet de operatie zelf.
  - Oplossing in de nuts-node-docs: `deepLinking: true` in de Swagger UI-configuratie.

### Nuts-specificaties en toepassingen (GitHub)
- Goed:
  - De markdown in de repo bevat geen navigatie of andere ruis en somt alle pagina's op.
  - Ankers komen van de gepubliceerde pagina (GitBook, GitHub Pages), dus deeplinks kloppen met wat de site toont.
- Slecht:
  - Twee bestanden staan in de repo maar zijn niet gepubliceerd, en worden overgeslagen:
    - `rfc/rfc009-verifiable-presentations.md` (specificaties v2)
    - `input/pagecontent/workflow.md` (Generieke functies)

    **Vraag voor de beheerder van de specificaties en IG's:** is het de bedoeling dat deze niet gepubliceerd zijn?
  - `<html lang>` van de IG's klopt niet altijd. De taal wordt daarom uit de tekst bepaald.
  - De repo's worden met `git clone --depth 1` opgehaald, niet via de GitHub API. Die API staat zonder token maar 60 aanroepen per uur toe, per IP-adres.

### Nuts wiki (BookStack)
- Goed:
  - Elk resultaat toont boek › hoofdstuk › pagina, waarbij de namen uit de zijbalk komen (het kruimelpad van BookStack kort ze af).
  - BookStack geeft elke alinea een anker.
  - Resultaten hebben het label "Community Resource". Bij muis-hover of toetsenbordfocus verschijnt de uitleg dat hierop beperkte kwaliteitscontrole heeft plaatsgevonden.
- Slecht:
  - De wiki is de grootste bron, en concepten en hackathon-notities scoren vaak hoger dan de officiële documentatie. Bij "access token" komen de eerste 3 resultaten allemaal uit de wiki.
  - Op de wiki staat niet welke boeken concept of archief zijn. Dat wordt per boek met de hand bijgehouden, zie "Handmatige labels".
  - Twee dode links (zie hierboven) en sommige pagina's laden traag. Elke fetch wordt bij een time-out één keer opnieuw geprobeerd.

### Nog toe te voegen: Knooppunt-documentatie

Niet in de POC opgenomen. `docs/` in `nuts-foundation/nuts-knooppunt` heeft 10 markdown-bestanden:

- `ARCHITECTURE.md`, `CONFIGURATION.md`, `DEPLOYMENT.md`, `INTEGRATION.md`, `LSP-INTEGRATION.md`, `NUTS-NODE-CUSTOM-BUILD.md`;
- 3 ADR's in `docs/adr/`;
- `prs-contract.md`.

Daarnaast staat er een OpenAPI-pagina (Redoc) in `docs/api/`.

- **Waar publiceren:** GitHub Pages van deze repo wordt gebouwd vanaf de feature-branch `feat/466-openapi-spec`, niet vanaf `main`. Resultaten kunnen daarom beter naar github.com linken: `https://github.com/nuts-foundation/nuts-knooppunt/blob/main/docs/<bestand>.md`.
- **Ankers:** op github.com staan de ankers alleen in ingebedde JSON, zodat de indexer ze niet van de pagina kan lezen. Ze zijn wel voorspelbaar: koptekst in kleine letters, zonder leestekens, spaties als `-`, en `-1`, `-2` voor herhaalde koppen. Nodig is een kleine uitbreiding van de GitHub-bron (`anchors: github`, ongeveer 30 regels) die de ankers uit de markdown berekent in plaats van de gepubliceerde pagina op te halen.
- **Voorstel voor labels:** `category: documentation`, taal `en`.
  - `ARCHITECTURE` en de ADR's: `type: concept`, doelgroep architect.
  - `CONFIGURATION`, `DEPLOYMENT` en `NUTS-NODE-CUSTOM-BUILD`: `type: guide`, doelgroep devops.
  - `INTEGRATION` en `LSP-INTEGRATION`: `type: guide`, doelgroep developer.
- **Vraag voor de eigenaar:** hoort `prs-contract.md` (een werkdocument over de pseudonimiseringsdienst) bij de formele documentatie?

## Testqueries (top 3)

| Query | 1 | 2 | 3 | Talen in resultaten |
|---|---|---|---|---|
| access token | wiki | wiki | wiki (Basics) | en 211, nl 15 |
| X509 credential | node v6.2 did:x509 | RFC023 | Generieke functies | en 95, nl 15 |
| toepassing | nuts.nl Alle toepassingen | Zorginzage (Use cases) | Generieke functies (Use Cases) | nl 160, en 131 |
| use case | wiki | Generieke functies | Generieke functies | en 380, nl 95 |
| Azure Key Vault | node v6.2 storage | node v6.2 | node v6.2 | en 19 |
| CRL | RFC008 3.3 CRL | RFC008 | RFC023 | en 17 |
| discovery service | wiki | RFC022 | wiki | en 116, nl 22 |
| hoe werkt Nuts | nuts.nl | nuts.nl | nuts.nl | nl 70 |
| configuratie | ANW | wiki | wiki | en 119, nl 4 |
| deployment | node (v6.2 + v5.4) | RFC006 | RFC006 | en 42, nl 9 |

- Zoeken over de taalgrens werkt via de synoniemen: "toepassing" vindt Engelse "use cases" en "use case" vindt Nederlandse pagina's.
- "configuratie" vindt Engelse "configuration" alleen via typotolerantie, en de top 3 is zwak. Voeg `configuratie ↔ configuration` toe aan `synonyms.yaml`, en waarschijnlijk meer paren zoals `installatie ↔ installation` en `beveiliging ↔ security`.
- "hoe werkt Nuts" vindt alleen Nederlandse resultaten. Dat klopt, want er is geen Engelse uitleg op dat niveau.

## Deeplinks

Steekproef: 4 records per bron, 48 in totaal, geopend in Chrome.

- Elk anker bestaat op de pagina.
- 37 van de 48 kwamen in de automatische controle direct bovenaan het scherm uit.
- De andere 11 zijn geen fout in de link. Een deel staat onderaan een korte pagina, zodat de browser niet verder kan scrollen. Een deel verschuift na het laden doordat afbeeldingen de pagina langer maken.
- 4 van die 11 heb ik met de hand nagelopen: 2 kwamen bij herhaling precies bovenaan uit en 2 staan onderaan de pagina. De andere 7 heb ik niet nagelopen.
- Wiki-ankers kunnen `%3A` bevatten; de browser vindt ze goed.

## Handmatige labels

Alles in `sources.yaml`:

- `owner`: overal nog `TODO`. Er moet per bron iemand worden aangewezen.
- `type` en `audience`: per bron een standaardwaarde, met regels per URL-patroon (bijvoorbeeld nuts.nl `/toepassingen/` → `use-case`, wiki-boek Basics → `concept`). Nieuwe wiki-boeken of nuts.nl-secties vallen terug op de standaardwaarde.
- `status` van wiki-boeken: concept- en archiefboeken staan bij naam in `sources.yaml` (hackathons-drafts, wg-omnichat, pocs-generieke-functies-netwerkzorg en alles op `-old`). Status per toepassing (Zorginzage en 360 actueel, de rest draft) staat er ook met de hand in.
- `version` van de node-documentatie en de API: met de hand. Deze kan worden afgeleid uit de versielijst van ReadTheDocs.

Automatisch: `language` (uit `<html lang>` of de tekst), `source`, `category` en de kruimelpaden.

## Bekende verbeterpunten

- **Rangschikking:**
  - Records met status `actueel` en officiële bronnen hoger zetten dan wiki-concepten. Kan met een extra veld voor de sortering en een aangepaste `rankingRules`.
- **Instellingen:** de indexer stuurt bij elke run alle Meilisearch-instellingen opnieuw. Dat is onschuldig, maar start bij een wijziging een herindexering van alles.
- **Toegankelijkheid van de bestaande site** (buiten de scope van deze POC, niet aangepast):
  - de uitklapmenu's in de navigatie zijn niet met het toetsenbord te bereiken;
  - de logolink heeft geen toegankelijke naam.

## Zoekgedrag meten (vraag van Steven)

Meilisearch Community Edition houdt zelf geen zoekopdrachten of klikken bij; dat zit alleen in Meilisearch Cloud. In deze POC is het niet gebouwd. Twee opties:

| | Google Analytics 4-events | Eigen klein endpoint |
|---|---|---|
| Hoe | De zoekpagina stuurt een event `search` (zoekterm, aantal resultaten, filters) en een event bij een klik (URL, positie). | De zoekpagina stuurt dezelfde gegevens naar een eigen dienst in het cluster, die ze opslaat. |
| Vaak gezocht | Rapport op zoekterm | Eigen query |
| Niks gevonden | Filter op aantal resultaten = 0 | Eigen query |
| Vaak geklikt | Rapport op geklikte URL en positie | Eigen query |
| Werk | Klein: de site laadt Google Analytics al | Groter: dienst, opslag, rapportage |
| Privacy | Gegevens bij Google, en de bestaande vraag over cookie-toestemming | Volledig in eigen beheer |

- **Bestaande analytics:** de site laadt `UA-129880281-1` (Universal Analytics, sinds juli 2023 gestopt). De tag stuurt via een gekoppelde site-tag ook data naar GA4-property `G-CJGQ5BTP89`. Of daar data binnenkomt, is alleen in het GA4-account te zien.
- **Advies:** begin met GA4-events. De meting is er al en "niks gevonden" is één extra event.
- **Bij beide opties:**
  - Geen IP-adressen opslaan.
  - Zoektermen afkappen (bijvoorbeeld op 100 tekens). Mensen typen soms een naam of patiëntgegeven in een zoekveld.
  - Een bewaartermijn afspreken.
- **Zoeken via Google:** Google Search Console laat zien met welke Google-zoekopdrachten mensen op nuts.nl terechtkomen. Dat vraagt eenmalig een verificatie van het domein (DNS TXT-record) en iemand die het account beheert. Niet nodig voor de sitemap uit [#439](https://github.com/nuts-foundation/nuts-webpresence/issues/439).

## Keuze voor Meilisearch: overwogen alternatieven

De alternatieven zijn in de POC niet getest.

**Kaders:** EU en open source, een los onderdeel, en weinig serverbeheer. Dat laatste weegt minder zwaar sinds er een Kubernetes-cluster bij OVHcloud beschikbaar is.

**Belangrijkste onderscheid:** pagina's crawlen werkt voor elke bron. Een index bouwen tijdens de build van elke bron werkt alleen waar je die build zelf beheert, en bij ReadTheDocs en GitBook is dat niet zo.

| | Licentie | Herkomst | Beheerlast | Docs-scraper | Labels en filters | Semantisch zoeken | Zoekanalytics |
|---|---|---|---|---|---|---|---|
| **Meilisearch CE** | MIT | Frankrijk | Laag | Ja | Ja | Ja | Zelf loggen |
| Typesense | GPL-3.0 | VS (zelf gehost in EU) | Laag | Ja, actief onderhouden (fork van de DocSearch-scraper) | Ja, ook via meta-tags | Ja | Zelf loggen |
| OpenSearch | Apache 2.0 (Linux Foundation) | Community | Hoog: JVM, veel geheugen | Nee | Ja | Ja | Ja, via dashboards |
| Manticore Search | GPL-3.0 | | Laag (1 core, 1 GB RAM) | Nee | Ja | Ja | Zelf loggen |
| Pagefind | MIT | | Minimaal: statische bestanden, geen zoekdienst | Niet nodig | Ja | Nee | Nee |
| Orama | Apache 2.0 | | Laag tot middel | Nee | Ja | Ja | Zelf loggen |
| Algolia DocSearch | Dienst | VS | Geen | Algolia beheert de crawler | Beperkt | | Ja |
| Google Programmable Search | Dienst | VS | Geen | Google-index | Nee | | Beperkt |

Afgevallen:

- **Google Programmable Search:**
  - geen eigen labels of filters;
  - de gratis versie is niet zonder advertenties;
  - de zoekresultaten hangen af van hoe goed Google de pagina's indexeert;
  - Google heeft eerdere producten voor zoeken op websites opgeheven;
  - niet open source en niet uit de EU.
- **Algolia DocSearch:**
  - data bij een Amerikaans bedrijf, met kopieën wereldwijd;
  - er geldt een logo-eis;
  - aanvragen worden vaak afgewezen als een site niet-technische content heeft, zoals nuts.nl.
- **OpenSearch en Elasticsearch:** zwaar (JVM) en gemaakt voor veel grotere datasets. Elasticsearch heeft daarbij een ingewikkelde licentiegeschiedenis.
- **Manticore en Orama:** licht, maar met een kleinere community en geen scraper.

Shortlist:

- **Meilisearch:** als Europese herkomst zwaar weegt. Gekozen, omdat het cluster beschikbaar is en Meilisearch extra mogelijkheden geeft: tolerantie voor typfouten, ranking, opnieuw indexeren zonder de website te bouwen, en een groeipad naar semantisch zoeken en een AI-vraagfunctie op dezelfde index.
- **Typesense:** als het snel werkend resultaat moet geven, dankzij de onderhouden scraper. Het functionele verschil met Meilisearch is klein.
- **Pagefind:** als het beheer zo klein mogelijk moet blijven. Een nachtelijke job crawlt alle bronnen, bouwt één statische index en publiceert die. Er draait dan geen zoekdienst die kan uitvallen of worden aangevallen, maar er is geen analytics en geen groeipad naar AI, en de index loopt tot een dag achter.

Wat de POC eraan toevoegt:

- **Scraper:** de POC gebruikt niet de docs-scraper van Meilisearch, maar een eigen crawler in TypeScript. Die was nodig voor:
  - labels per URL-patroon;
  - de GitHub-bronnen, met ankers van de gepubliceerde pagina;
  - de kruimelpaden van de wiki;
  - de OpenAPI-operaties;
  - het koppelen van versies.

  Of de DocSearch-scraper dat ook kan, is niet onderzocht. Wisselen tussen Meilisearch en Typesense blijft goed te doen: de bronnenlijst (`sources.yaml`) en de crawler staan los van de zoekmachine, alleen `meili.ts` en `lib/search.ts` zijn specifiek voor Meilisearch.
- **Beheerlast:** gemeten is een geheugengebruik van 68 MiB na het indexeren, en een volledige herindexering duurt ruim 2 minuten. Een backup is niet nodig, omdat de index altijd opnieuw op te bouwen is.
- **Zoekanalytics:** Meilisearch CE logt niets. Zie "Zoekgedrag meten".

## Productie (Kubernetes op OVHcloud)

Alleen een notitie; de deployment hoort niet bij deze POC.

**Meilisearch**
- Eén replica, want de Community Edition kan niet clusteren. Bij dataverlies bouwt de indexer de index binnen een paar minuten opnieuw op.
- Geheugen, gemeten met deze 2.018 records in een container met een limiet van 256 MiB:
  - het proces gebruikte na het indexeren 68 MiB;
  - zoeken duurde 2–3 ms;
  - er waren geen OOM-kills.
- Advies:
  ```yaml
  resources:
    requests: { memory: 256Mi, cpu: 100m }
    limits:   { memory: 512Mi }
  env:
    - name: MEILI_MAX_INDEXING_MEMORY   # zelf zetten: Meilisearch past het niet aan de pod-limiet aan
      value: "256Mb"
    - name: MEILI_ENV
      value: production
    - name: MEILI_NO_ANALYTICS
      value: "true"
  ```
- Opslag:
  - een PVC van 1 Gi op block storage (`csi-cinder-classic`); de data is nu 69 MB;
  - geen NFS of andere netwerkopslag, want de database van Meilisearch (LMDB) werkt daar slecht op.
- Master key in een Kubernetes Secret, alleen gekoppeld aan Meilisearch en de indexer. De zoekpagina krijgt alleen de search-only key; die mag openbaar zijn.

**Indexer als CronJob**
- Nachtelijke volledige run voor de HTML-bronnen: nuts.nl, ReadTheDocs, de API en de wiki.
- Elk uur `npm run index -- --if-changed` voor de GitHub-bronnen (gebouwd):
  - De indexer vraagt per repo de laatste commit op met `git ls-remote`. Dat valt niet onder de API-limiet en vraagt geen token.
  - Alleen een bron met een andere commit dan bij de vorige run wordt opnieuw geïndexeerd. Zonder wijzigingen duurt de run 1,5 s.
  - De laatst geïndexeerde commit staat in Meilisearch, in de index `nuts-docs-state`. De zoeksleutel kan daar niet bij.
  - Een run met fouten slaat de commit niet op, zodat de volgende run het opnieuw probeert.
  - De container van de indexer heeft `git` nodig.
- Waarom niet een GitHub Action per repo:
  - het kost 7 repo's met elk een secret;
  - Meilisearch moet dan de master key van buitenaf accepteren;
  - de Action draait vóórdat GitBook of GitHub Pages opnieuw gepubliceerd heeft, terwijl de ankers van de gepubliceerde pagina komen.
- `concurrencyPolicy: Forbid`, zodat runs elkaar niet overlappen.
- Het rapport (`report.json`) naar de logs schrijven, zodat dode links en fouten zichtbaar worden.

**Ingress**
- Alleen `POST /multi-search` (en eventueel `/indexes/nuts-docs/search`) openzetten. `/keys`, `/tasks`, `/health` en dergelijke blijven binnen het cluster.
- Rate limiting per client op de ingress, bijvoorbeeld met ingress-nginx:
  ```yaml
  nginx.ingress.kubernetes.io/limit-rps: "10"
  nginx.ingress.kubernetes.io/limit-burst-multiplier: "3"
  ```
  Zoeken tijdens het typen stuurt na 250 ms stilte één verzoek. 10 per seconde is ruim voor één gebruiker.
- CORS beperken tot `https://nuts.nl`.

**Eigenaar**
- Er moet iemand verantwoordelijk zijn voor `sources.yaml` en `synonyms.yaml`: welke bronnen formeel zijn, welke versies, en welke labels.
- Per bron is een eigenaar nodig die reageert op dode links en ontbrekende pagina's uit het rapport.

## Niet gedaan

- Zoekopdrachten loggen (optioneel in de opdracht): zie "Zoekgedrag meten".
- Google Docs, AI/chat, Kubernetes-deployment: buiten de scope.
