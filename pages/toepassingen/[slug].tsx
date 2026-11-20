import Head from "next/head";
import { GetStaticPaths, GetStaticPropsContext } from "next";
import Layout from "../../components/Layout";
import KennisbankIcon from "../../components/KennisbankIcon";
import PaginaKop, { NutsMotief, PaginaInhoud } from "../../components/PaginaKop";
import KopieerKnop from "../../components/KopieerKnop";
import Button, { Pijl, isExtern } from "../../components/Button";
import { FASE_KLEUR } from "../../components/CategoryNuts";
import { getToepassingArticles, getToepassingFull } from "../../lib/api";
import categorieConfig from "../../config/category.json";

// Detailpagina van een toepassing. Paginakop met "In één oogopslag"; daaronder twee kolommen: de tekst links en een
// meescrollende zijkolom met het contact en de belangrijkste links (op de telefoon staan die onderaan). De tekst komt uit content/posts/toepassingen/<slug>.md;
// de opmaak per soort sectie (functies, stappen, let-op, vraag aan je leverancier, links) gebeurt hier.

type Soort = "tekst" | "functies" | "lagen" | "leverancier" | "links";
type Sectie = { id: string; titel: string; icon: string; soort: Soort; html: string; vragen?: string[] };
type LinkKaart = { label: string; bron: string; href: string; tekst: string; volgt?: boolean };
type Feit = { label: string; waarde: string; kleur?: string; icon?: string };
type Persoon = { naam: string; rol: string | null; email: string | null };
// Contact is bij elke toepassing gelijk: de Kring Toepassingen (via Slack) en een of meer contactpersonen met hun rol.
type Contact = { organisatie: string; personen: Persoon[] };

interface Props {
  titel: string;
  /** Korte naam, zoals in de lijst op /toepassingen ("Huisartseninzage", "KIK-V"). */
  naam: string;
  excerpt: string | null;
  categorie: { label: string; icon: string } | null;
  feiten: Feit[];
  secties: Sectie[];
  links: LinkKaart[];
  contact: Contact | null;
  /** Nog niet in productie (idee, PoC, in ontwikkeling): de actiekaart vraagt dan om interesse in plaats van gebruik. */
  inOntwikkeling: boolean;
}

// De openbare Slack van Nuts (zoals op de pagina Contact).
const SLACK = "https://nuts-foundation.slack.com/join/shared_invite/zt-27wzp5eic-8kJD0c7HDU7h_08mgdJR_w#/shared-invite/email";

const kaal = (html: string) => html.replace(/<[^>]+>/g, "").replace(/&amp;|&#x0*26;|&#0*38;/gi, "&").trim();
const slugVan = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** Eén icoon per soort onderwerp, zodat hetzelfde icoon nooit twee betekenissen heeft. */
function icoonVoor(titel: string) {
  const t = titel.toLowerCase();
  if (t.includes("probleem")) return "vraag";
  if (t.includes("hoe het werkt")) return "techniek";
  if (t.includes("wat het doet") || t.startsWith("wat doet")) return "toepassingen";
  if (t.includes("nuts") && (t.includes("betekent") || t.includes("rol"))) return "ecosysteem";
  if (t.includes("privacy")) return "slot";
  if (t.includes("leverancier")) return "dienstverlener";
  if (t.includes("link") || t.includes("contact")) return "wiki";
  if (t.includes("bron")) return "specificatie";
  return "toepassingen";
}

export default function ToepassingDetail({ titel, naam, excerpt, categorie, feiten, secties, links, contact, inOntwikkeling }: Props) {
  const linksSectie = secties.find((s) => s.soort === "links");

  return (
    <Layout>
      <Head>
        <title>{`Nuts - ${titel}`}</title>
        {excerpt && <meta name="description" content={excerpt} />}
      </Head>
      <div className="bg-white font-inter">
        <PaginaKop
          terug={{ href: "/toepassingen", label: "Terug naar toepassingen" }}
          eyebrow={{ icon: categorie?.icon ?? "toepassingen", label: categorie?.label ?? "Toepassing op Nuts" }}
          titel={titel}
          introHtml={excerpt ? `<p>${excerpt}</p>` : undefined}
          aside={
            feiten.length > 0 ? (
              <div className="rounded-2xl border border-zand bg-white p-6">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.08em] text-brand">In één oogopslag</p>
                <dl className="divide-y divide-zand">
                  {feiten.map((f) => (
                    <div key={f.label} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                      <dt className="text-sm text-grijs">{f.label}</dt>
                      <dd className="flex items-center gap-2 text-right text-sm font-semibold text-inkt">
                        {f.kleur && <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${f.kleur}`} />}
                        {f.icon && (
                          <span aria-hidden="true" className="text-brand">
                            <KennisbankIcon name={f.icon} size={16} />
                          </span>
                        )}
                        {f.waarde}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : undefined
          }
        >
          {/* Eén knop: voor wie de techniek zoekt. De oproep aan je leverancier staat als kaart verderop in de pagina. */}
          {linksSectie && (
            <div className="mt-7 flex flex-wrap gap-3">
              <span className="lg:hidden">
              <Button href={`#${linksSectie.id}`}>
                Documentatie en links &darr;
              </Button>
              </span>
              <span className="hidden lg:inline">
              <Button href="#documentatie-en-links">
                Documentatie en links &darr;
              </Button>
              </span>
            </div>
          )}
        </PaginaKop>

        {/* Telefoon en tablet: de onderwerpen als balk om door te vegen. */}
        {secties.length > 1 && (
          <nav aria-label="Onderwerpen op deze pagina" className="mt-6 border-b border-zand bg-white lg:hidden">
            <PaginaInhoud>
              <div className="-mx-3.5 flex gap-2 overflow-x-auto py-2.5">
                {secties.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium text-inkt transition-colors hover:bg-creme hover:text-dark"
                  >
                    {s.titel}
                  </a>
                ))}
              </div>
            </PaginaInhoud>
          </nav>
        )}

        <PaginaInhoud className="py-12 md:py-16">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-16">
            <div className="min-w-0">
              {secties.map((s, i) => (
                <section
                  key={s.id}
                  id={s.id}
                  className={`scroll-mt-8 ${i > 0 ? "mt-12 border-t border-zand pt-12" : ""} ${s.soort === "links" ? "lg:hidden" : ""}`}
                >
                  {s.soort === "leverancier" ? (
                    // Actiekaart: links de kop, uitleg en vervolglinks; rechts de vragen op een lichter blauw vlak (geen wit formulierveld).
                    <div className="relative overflow-hidden rounded-3xl bg-nuts-blauw px-6 py-7 text-white sm:px-8 sm:py-8">
                      <NutsMotief className="pointer-events-none absolute -bottom-[40%] -left-[8%] h-[140%] text-white opacity-[0.05]" />
                      <div className="relative grid gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] xl:grid-rows-[auto_1fr] xl:gap-x-8">
                        <div className="xl:col-start-1 xl:row-start-1">
                          <h2 className="flex items-center gap-3 font-redhat text-xl font-bold leading-tight text-white md:text-2xl">
                            <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nuts-blauw-fel text-white">
                              <KennisbankIcon name={s.icon} size={16} />
                            </span>
                            Interesse in {naam}?
                          </h2>
                          <p className="mt-3 text-[15px] leading-relaxed text-white/90">
                            {inOntwikkeling
                              ? "Deze toepassing is nog in ontwikkeling. Laat je softwareleverancier weten dat je er behoefte aan hebt."
                              : `Je softwareleverancier regelt de aansluiting op Nuts. ${s.vragen && s.vragen.length > 1 ? "Stel hen deze vragen." : "Stel hen deze vraag."}`}
                          </p>
                        </div>
                        <ul className="order-last flex flex-col gap-3 self-end text-sm xl:order-none xl:col-start-1 xl:row-start-2">
                          {(inOntwikkeling
                            ? [
                                { vraag: "Wil je meedenken over beproeven?", tekst: "Neem contact op met de Kring", href: SLACK },
                                { vraag: "Iedereen is welkom in de community", tekst: "Kom naar de community meeting", href: "/community/" },
                              ]
                            : [
                                { vraag: "Is je leverancier al aangesloten?", tekst: "Bekijk de deelnemers", href: "/deelnemers-netwerk/" },
                                { vraag: "Iedereen is welkom in de community", tekst: "Kom naar de community meeting", href: "/community/" },
                              ]
                          ).map((v) => (
                            <li key={v.vraag}>
                              <span className="block text-white/75">{v.vraag}</span>
                              <a
                                href={v.href}
                                {...(isExtern(v.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                                className="group mt-0.5 inline-block whitespace-nowrap font-semibold text-white"
                              >
                                {/* Alleen de tekst onderstreept, niet het pijltje */}
                                <span className="underline decoration-nuts-groen decoration-2 underline-offset-4 group-hover:decoration-white">{v.tekst}</span> <Pijl href={v.href} />
                              </a>
                            </li>
                          ))}
                        </ul>
                        {s.vragen && s.vragen.length > 0 && (
                          <figure className="rounded-2xl bg-white/10 p-5 ring-1 ring-inset ring-white/15 sm:p-6 xl:col-start-2 xl:row-span-2 xl:row-start-1">
                            <ol className="flex flex-col gap-4">
                              {s.vragen.map((v, n) => (
                                <li key={n} className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-3">
                                  <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full bg-nuts-groen font-redhat text-[13px] font-bold text-inkt">
                                    {s.vragen!.length > 1 ? n + 1 : "?"}
                                  </span>
                                  <span className="pt-0.5 font-redhat text-[17px] font-semibold leading-snug text-white">{v}</span>
                                </li>
                              ))}
                            </ol>
                            <figcaption className="mt-5 flex justify-end">
                              <KopieerKnop
                                licht
                                tekst={s.vragen.length > 1 ? s.vragen.map((v, n) => `${n + 1}. ${v}`).join("\n") : s.vragen[0]}
                                label={s.vragen.length > 1 ? "Kopieer de vragen" : "Kopieer de vraag"}
                              />
                            </figcaption>
                          </figure>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className={s.soort === "lagen" ? "toepassing-blauw rounded-[2rem] border border-light-rand bg-light px-4 py-7 sm:px-10 sm:py-10" : ""}>
                      <Kop titel={s.titel} />
                      {s.html.trim() && (
                        <div
                          className={`toepassing-sectie ${s.soort === "lagen" ? "toepassing-lagen" : s.soort === "functies" ? "toepassing-functies" : ""}`}
                          dangerouslySetInnerHTML={{ __html: s.html }}
                        />
                      )}
                      {s.soort === "links" && (
                        <div className="mt-6 flex flex-col gap-8">
                          {contact && <ContactKaart contact={contact} />}
                          <LinkGroepen links={links} />
                        </div>
                      )}
                    </div>
                  )}
                </section>
              ))}

            </div>

            {/* Computer: zijkolom die meescrolt. */}
            <aside className="hidden lg:block">
              {/* Meescrollen, maar nooit hoger dan het scherm: dan scrolt de kolom zelf. */}
              <div className="sticky top-8 flex max-h-[calc(100vh-4rem)] flex-col gap-6 overflow-y-auto pb-2">
                {contact && <ContactKaart contact={contact} />}
                {(links.length > 0 || linksSectie?.html.trim()) && (
                  <div id="documentatie-en-links" className="scroll-mt-8 rounded-2xl border border-zand bg-white p-6">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.08em] text-brand">Documentatie en links</p>
                    {linksSectie?.html.trim() && (
                      <div className="toepassing-sectie toepassing-klein mb-5" dangerouslySetInnerHTML={{ __html: linksSectie.html }} />
                    )}
                    <LinkGroepen links={links} compact />
                  </div>
                )}
              </div>
            </aside>
          </div>
        </PaginaInhoud>
      </div>
    </Layout>
  );
}

// Sectiekop zonder icoon: rustiger. Iconen staan alleen in kaarten en blokken (zie README, sectie "Style").
function Kop({ titel, licht }: { titel: string; licht?: boolean }) {
  return (
    <h2 className={`mb-5 font-redhat text-2xl font-bold leading-tight md:text-[28px] ${licht ? "text-white" : "text-inkt"}`}>
      {titel}
    </h2>
  );
}

/** Links in vaste groepen, steeds in dezelfde volgorde, elk met één icoon. */
const GROEPEN = [
  { titel: "Specificatie en code", icon: "ontwikkelaar", vlak: "bg-perzik text-brand", kleur: "text-inkt", test: /github|gitlab|\bcode\b|specificatie/ },
  { titel: "Documentatie", icon: "wiki", vlak: "bg-perzik text-brand", kleur: "text-inkt", test: /wiki|uitwerking|profiel|documentatie|afsprakenset|implement|ontwerp/ },
  { titel: "Privacy en juridisch", icon: "slot", vlak: "bg-perzik text-brand", kleur: "text-inkt", test: /dpia|privacy|risico|juridisch/ },
];
function groepeer(links: LinkKaart[]) {
  const uit = GROEPEN.map((g) => ({ ...g, links: [] as LinkKaart[] }));
  const overig = { titel: "Meer informatie", icon: "specificatie", vlak: "bg-perzik text-brand", kleur: "text-inkt", test: /./, links: [] as LinkKaart[] };
  for (const l of links) {
    // Eerst kijken naar label en bron (wat het is), pas daarna naar het adres.
    // Privacy en juridisch gaat voor: een risicoanalyse op de wiki is juridisch, geen gewone documentatie.
    const tekst = `${l.label} ${l.bron}`.toLowerCase();
    const opVolgorde = [uit[2], uit[0], uit[1]];
    const g = opVolgorde.find((x) => x.test.test(tekst)) ?? opVolgorde.find((x) => x.test.test(l.href.toLowerCase()));
    (g ?? overig).links.push(l);
  }
  return [...uit, overig].filter((g) => g.links.length > 0);
}


/** Waar de link staat, kort: de bron uit de tekst (GitHub, Wiki), anders de linktekst of de website. */
function bronKort(l: LinkKaart) {
  if (l.bron) return l.bron;
  if (l.label && l.tekst && l.tekst.length <= 18) return l.tekst;
  try {
    return new URL(l.href).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** De links in hun groepen: rustige lijst, per groep een kleine kop met het standaardicoon, één regel per link. */
function LinkGroepen({ links, compact }: { links: LinkKaart[]; compact?: boolean }) {
  if (!links.length) return null;
  const lijst = (
    <div className="flex flex-col gap-5">
      {groepeer(links).map((g) => (
        <div key={g.titel}>
          <p className={`mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] ${g.kleur}`}>
            <span aria-hidden="true" className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${g.vlak}`}>
              <KennisbankIcon name={g.icon} size={13} />
            </span>
            {g.titel}
          </p>
          <ul className="divide-y divide-zand">
            {g.links.map((l) => (
              <li key={l.href}>
                {l.volgt ? (
                  <div className="-mx-2 flex items-baseline gap-3 px-2 py-2.5">
                    <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-grijs">{l.label}</span>
                    <span className="shrink-0 text-xs text-grijs">{l.bron}</span>
                    {/* Zelfde fasebolletje als in "In één oogopslag" en op /toepassingen */}
                    <span className="flex shrink-0 items-center gap-1.5 text-xs text-grijs">
                      <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-button" />
                      In ontwikkeling
                    </span>
                  </div>
                ) : (
                <a href={l.href} target="_blank" rel="noreferrer" className="group -mx-2 flex items-baseline gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-creme">
                  {/* Korte bron (GitHub, Wiki) rechts; een lange (een webadres) klein onder de titel, zodat de titel ruimte houdt. */}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold leading-snug text-inkt group-hover:text-dark">{l.label || l.tekst}</span>
                    {bronKort(l).length > 12 && <span className="mt-0.5 block break-words text-xs text-grijs">{bronKort(l)}</span>}
                  </span>
                  {bronKort(l).length <= 12 && <span className="shrink-0 text-xs text-grijs">{bronKort(l)}</span>}
                  <Pijl href={l.href} className="shrink-0 text-xs text-brand/60 transition-colors group-hover:text-dark" />
                </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
  // In de zijkolom zit de lijst al in een kaart; onderaan (telefoon) krijgt hij er zelf een.
  return compact ? lijst : <div className="rounded-2xl border border-zand bg-white p-6">{lijst}</div>;
}

/** Met wie neem je contact op: bij elke toepassing de Kring Toepassingen via Slack, met de contactpersonen en hun rol. */
function ContactKaart({ contact }: { contact: Contact }) {
  return (
    <div className="rounded-2xl border border-zand bg-creme p-6">
      <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-brand">
        <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full bg-perzik">
          <KennisbankIcon name="persoon" size={14} />
        </span>
        Contact
      </p>
      <p className="font-redhat text-lg font-bold leading-snug text-inkt">{contact.organisatie}</p>
      <Button href={SLACK} className="mt-4 flex w-full">
        Stel je vraag via Slack
      </Button>
      {contact.personen.length > 0 && (
        <div className="mt-5 border-t border-zand pt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-grijs">
            {contact.personen.length > 1 ? "Contactpersonen" : "Contactpersoon"}
          </p>
          <ul className="flex flex-col gap-2.5">
            {contact.personen.map((p) => (
              <li key={p.naam} className="text-sm leading-snug">
                <span className="font-semibold text-inkt">{p.naam}</span>
                {p.rol && <span className="text-grijs"> · {p.rol}</span>}
                {p.email && (
                  <a href={`mailto:${p.email}`} className="mt-0.5 block break-all text-xs text-brand hover:text-dark hover:underline">
                    {p.email}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export const getStaticProps = async ({ params }: GetStaticPropsContext) => {
  const slug = params!.slug as string;
  const t = await getToepassingFull(slug);

  // Categorie en fase uit de lijst op /toepassingen (dezelfde bron, dus altijd gelijk).
  const { categories, phases, toepassingen } = categorieConfig as {
    categories: { id: string; label: string; icon?: string }[];
    phases: { id: string; label: string }[];
    toepassingen: { name: string; category: string | string[]; phase: string }[];
  };
  const item = toepassingen.find((x) => slugVan(x.name) === slug) ?? toepassingen.find((x) => slugVan(x.name).startsWith(slug));
  const catIds = item ? (Array.isArray(item.category) ? item.category : [item.category]) : [];
  const cats = catIds.map((id) => categories.find((c) => c.id === id)).filter(Boolean) as { id: string; label: string; icon?: string }[];
  const fase = item ? phases.find((p) => p.id === item.phase) : undefined;

  // Secties: elke <h2> begint een nieuwe. Tekst vóór de eerste kop wordt "In het kort".
  const delen = t.content.split(/(?=<h2[\s>])/);
  const ruw: { titel: string; html: string }[] = [];
  for (const deel of delen) {
    const m = deel.match(/^<h2[^>]*>([\s\S]*?)<\/h2>/);
    const html = (m ? deel.slice(m[0].length) : deel).replace(/(?:<hr\s*\/?>\s*)+$/i, "").trim();
    if (m) ruw.push({ titel: kaal(m[1]), html });
    else if (kaal(html)) ruw.push({ titel: "In het kort", html });
  }

  const feiten: Feit[] = [];
  if (cats.length) feiten.push({ label: cats.length > 1 ? "Categorieën" : "Categorie", waarde: cats.map((c) => c.label).join(", "), icon: cats.length === 1 ? cats[0].icon : undefined });
  if (fase) feiten.push({ label: "Fase", waarde: fase.label, kleur: FASE_KLEUR[fase.id] });
  else if (t.status) feiten.push({ label: "Fase", waarde: t.status });

  const contact: Contact = { organisatie: "Kring Toepassingen", personen: [] };
  // Object in plaats van een losse variabele: TypeScript ziet anders niet dat hij in de map() wordt gevuld.
  const extra: { initiatief: string | null } = { initiatief: null };
  let links: LinkKaart[] = [];
  const gebruikt = new Set<string>();
  const secties: Sectie[] = ruw.map(({ titel, html }) => {
    let id = `sectie-${slugVan(titel) || "tekst"}`;
    while (gebruikt.has(id)) id += "-2";
    gebruikt.add(id);
    const tl = titel.toLowerCase();
    // "Wat dit níet is: …" als opvallende notitie.
    html = html.replace(/<p>\s*(<strong>\s*Wat dit n[ií][eé]t is:?\s*<\/strong>[\s\S]*?)<\/p>/i, '<div class="toepassing-let-op"><p>$1</p></div>');
    if (tl.includes("link") || tl.includes("contact")) {
      // Links worden kaarten; contact en datum gaan naar de contactkaart en "In één oogopslag".
      const over: string[] = [];
      for (const li of html.match(/<li>[\s\S]*?<\/li>/g) ?? []) {
        const label = kaal(li.match(/<strong>([\s\S]*?)<\/strong>/)?.[1] ?? "").replace(/[:?]$/, "");
        const waarde = li.replace(/<strong>[\s\S]*?<\/strong>/, "");
        const mail = waarde.match(/href="mailto:([^"]+)"/)?.[1] ?? null;
        // "Contactpersoon(en): Naam (rol), Naam (rol)" of meerdere regels; een mailadres mag erbij.
        if (/^contactperso(o|n)n?(en)?$/i.test(label)) {
          const tekst = kaal(waarde.replace(/<a [^>]*href="mailto:[^"]*"[^>]*>[\s\S]*?<\/a>/g, "")).replace(/[,;\s]+$/, "");
          // Splitsen op komma's buiten haakjes: "(Zorginstituut Nederland, programma KIK-V)" blijft één rol.
          const delen: string[] = [];
          let diepte = 0, stuk = "";
          for (const t of tekst) {
            if (t === "(") diepte++;
            if (t === ")") diepte--;
            if ((t === "," || t === ";") && diepte === 0) { delen.push(stuk); stuk = ""; } else stuk += t;
          }
          if (stuk.trim()) delen.push(stuk);
          for (const d of delen) {
            const m = d.trim().match(/^(.*?)\s*(?:\(([^)]+)\))?$/);
            if (m && m[1]) contact.personen.push({ naam: m[1].trim(), rol: m[2]?.trim() ?? null, email: delen.length === 1 ? mail : null });
          }
          continue;
        }
        if (/^contact$/i.test(label)) {
          contact.organisatie = kaal(waarde);
          continue;
        }
        if (/^initiatief$/i.test(label)) {
          extra.initiatief = kaal(waarde);
          continue;
        }
        // "Laatst bijgewerkt" is voor intern gebruik: hij blijft in de markdown staan, maar komt niet op de pagina.
        if (/laatst bijgewerkt/i.test(label)) continue;
        const a = li.match(/<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
        // Nog niet beschikbaar ("Functionele uitwerking (Wiki): in ontwikkeling"): wel tonen, zonder link.
        if (!a && /in ontwikkeling|volgt/i.test(kaal(waarde))) {
          const bron = label.match(/\(([^)]+)\)\s*$/)?.[1] ?? "";
          links.push({ label: label.replace(/\s*\([^)]+\)\s*$/, ""), bron, href: `#volgt-${slugVan(label)}`, tekst: "", volgt: true });
          continue;
        }
        if (a && !a[1].startsWith("mailto:")) {
          const bron = label.match(/\(([^)]+)\)\s*$/)?.[1] ?? "";
          links.push({ label: label.replace(/\s*\([^)]+\)\s*$/, ""), bron, href: a[1].replace(/&amp;/g, "&"), tekst: kaal(a[2]) });
        } else over.push(li);
      }
      html = html.replace(/<ul>[\s\S]*?<\/ul>/, over.length ? `<ul>${over.join("")}</ul>` : "");
      return { id, titel, icon: icoonVoor(titel), soort: "links", html };
    }
    const soort: Soort = tl.includes("hoe het werkt") ? "lagen" : tl.includes("leverancier") ? "leverancier" : tl.includes("wat het doet") ? "functies" : "tekst";
    if (soort === "leverancier") {
      // De vraag (het citaat) gaat in een eigen kaart met kopieerknop; aanhalingstekens eromheen vallen weg.
      // Elke vraag is een citaat (> …); meerdere alinea's of een lijst in één citaat worden aparte vragen.
      const vragen: string[] = [];
      for (const citaat of html.match(/<blockquote>[\s\S]*?<\/blockquote>/g) ?? []) {
        const delen = citaat.match(/<(p|li)>[\s\S]*?<\/\1>/g) ?? [citaat];
        for (const d of delen) {
          const v = kaal(d).replace(/^["“”']+|["“”']+$/g, "").trim();
          if (v) vragen.push(v);
        }
        html = html.replace(citaat, "");
      }
      return { id, titel, icon: icoonVoor(titel), soort, html, ...(vragen.length ? { vragen } : {}) };
    }
    // Bij de stappen staat de naam als kop boven de uitleg: het streepje ertussen ("Deelname — de …") is dan overbodig.
    if (soort === "lagen")
      html = html.replace(/(<li>\s*<strong>[\s\S]*?<\/strong>)\s*[—–-]\s*(\S)/g, (_m, kop: string, eerste: string) => `${kop} ${eerste.toUpperCase()}`);
    return { id, titel, icon: icoonVoor(titel), soort, html };
  });
  links = links.filter((l, i, a) => a.findIndex((x) => x.href === l.href) === i);
  if (extra.initiatief) feiten.push({ label: "Initiatief", waarde: extra.initiatief.split(",")[0].trim() });
  if (contact.organisatie) feiten.push({ label: "Contact", waarde: contact.organisatie });

  return {
    props: {
      titel: t.title,
      naam: item?.name ?? t.title,
      excerpt: t.excerpt ?? null,
      categorie: cats[0] ? { label: cats[0].label, icon: cats[0].icon ?? "toepassingen" } : null,
      feiten,
      secties,
      links,
      contact,
      inOntwikkeling: !!fase && fase.id !== "productie",
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const articles = await getToepassingArticles();
  return {
    fallback: false,
    paths: articles.map((a) => `/toepassingen/${a.slug}`),
  };
};
