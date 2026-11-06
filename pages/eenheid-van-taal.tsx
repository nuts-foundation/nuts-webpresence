import React, { useEffect, useState } from "react";
import Head from "next/head";
import { getContent } from "../lib/api";
import Markdown from "../components/Markdown";
import Layout from "../components/Layout";
import KennisbankIcon from "../components/KennisbankIcon";
import PaginaKop, { PaginaInhoud } from "../components/PaginaKop";

// Per term (in volgorde van het document): anker en korte naam.
const TERMEN = [
  { id: "missie", kort: "Missie", icon: "missie" },
  { id: "community", kort: "Nuts-community", icon: "community" },
  { id: "manifest", kort: "Nuts-manifest", icon: "manifest" },
  { id: "specificatie", kort: "Nuts-specificatie", icon: "specificatie" },
  { id: "node", kort: "Nuts-node", icon: "node" },
  { id: "netwerk", kort: "Nuts-netwerk", icon: "techniek" },
  { id: "toepassingen", kort: "Toepassingen", icon: "toepassingen" },
  { id: "merk", kort: "Nuts-merk", icon: "merk" },
  { id: "stichting", kort: "Stichting Nuts", icon: "organisatie" },
  { id: "ecosysteem", kort: "Ecosysteem", icon: "ecosysteem" },
];

// Schema: hoe de termen samenhangen, in drie lagen.
const LAGEN = [
  { label: "Waarom", termen: ["missie", "manifest", "merk"], keten: false },
  { label: "Wie", termen: ["community", "stichting", "ecosysteem"], keten: false },
  { label: "Wat", termen: ["specificatie", "node", "netwerk", "toepassingen"], keten: true },
];

interface Term {
  id: string;
  nummer: string;
  titel: string;
  kort: string;
  icon: string;
  eersteZin: string;
  html: string;
}

const stripTags = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");

function parse(html: string): { introHtml: string; termen: Term[] } {
  const [introRaw, ...parts] = html.split(/(?=<h2>)/);
  // De genummerde opsomming in de intro is overbodig: het schema en de lijst tonen hetzelfde.
  const introHtml = introRaw.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, "").replace(/<p>[^<]*volgende termen:<\/p>\s*<ol>[\s\S]*?<\/ol>/i, "");
  const termen = parts.map((part, i) => {
    const kop = stripTags(part.match(/<h2>([\s\S]*?)<\/h2>/)?.[1] ?? "").trim();
    const [, nummer = String(i + 1), titel = kop] = kop.match(/^(\d+)\.\s*(.*)$/) ?? [];
    const body = part.replace(/<h2>[\s\S]*?<\/h2>/, "");
    const eersteAlinea = stripTags(body.match(/<p>([\s\S]*?)<\/p>/)?.[1] ?? "");
    const eersteZin = eersteAlinea.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? eersteAlinea;
    const meta = TERMEN[i] ?? { id: `term-${i + 1}`, kort: titel, icon: "techniek" };
    return { ...meta, nummer: nummer.padStart(2, "0"), titel, eersteZin, html: body };
  });
  return { introHtml, termen };
}

export default function EenheidVanTaalPage({ pagina }: any) {
  const { introHtml, termen } = parse(pagina.content);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const alleOpen = open.size === termen.length;

  const zetOpen = (id: string, waarde: boolean) =>
    setOpen((prev) => {
      const next = new Set(prev);
      waarde ? next.add(id) : next.delete(id);
      return next;
    });

  // Term in het schema aangeklikt: open de term en scroll erheen.
  const ga = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    zetOpen(id, true);
    history.replaceState(null, "", `#${id}`);
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
  };

  // Directe link naar een term (#node): open die term.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (termen.some((t) => t.id === id)) {
      zetOpen(id, true);
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
    }
  }, []);

  const term = (id: string) => termen.find((t) => t.id === id);

  return (
    <Layout>
      <Head>
        <title>Nuts - Eenheid van Nuts-taal</title>
        {pagina.meta.description && <meta name="description" content={pagina.meta.description} />}
        <meta property="og:title" content="Nuts - Eenheid van Nuts-taal" />
        <link rel="canonical" href="https://nuts.nl/eenheid-van-taal/" />
      </Head>

      <div className="eenheid-van-taal bg-white font-inter text-[#1C2A39]">
        <PaginaKop
          terug={{ href: "/kennisbank", label: "Terug naar de kennisbank" }}
          eyebrow={{ icon: "taal", label: "Kennisbank" }}
          titel="Eenheid van Nuts-taal"
          introHtml={introHtml}
          aside={
            <div className="rounded-2xl border border-[#F0E7E5] bg-white p-6 shadow-sm">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.08em] text-[#B84A3C]">Hoe de termen samenhangen</p>
              <dl className="space-y-4">
                {LAGEN.map((laag) => (
                  <div key={laag.label}>
                    <dt className="mb-2 text-sm font-semibold text-[#1C2A39]">{laag.label}</dt>
                    <dd className="flex flex-wrap items-center gap-1.5">
                      {laag.termen.map((id, j) => {
                        const t = term(id);
                        if (!t) return null;
                        return (
                          <React.Fragment key={id}>
                            {j > 0 && laag.keten && <span aria-hidden="true" className="text-sm text-[#C9B9B4]">→</span>}
                            <a
                              href={`#${id}`}
                              onClick={ga(id)}
                              className="rounded-full border border-[#F0E7E5] bg-[#FBF6F4] px-3 py-1.5 text-sm font-medium text-[#1C2A39] transition-colors hover:border-[#B84A3C] hover:text-[#B84A3C]"
                            >
                              {t.kort}
                            </a>
                          </React.Fragment>
                        );
                      })}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          }
        />

        <PaginaInhoud className="py-12 md:py-16">
          <div className="max-w-[820px]">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-redhat text-[26px] font-bold leading-tight">De termen</h2>
            <button
              type="button"
              onClick={() => setOpen(alleOpen ? new Set() : new Set(termen.map((t) => t.id)))}
              className="shrink-0 text-sm font-semibold text-[#1C2A39] underline decoration-[#D6C9C4] underline-offset-4 transition-colors hover:text-[#B84A3C] hover:decoration-[#B84A3C]"
            >
              {alleOpen ? "Alles inklappen" : "Alles uitklappen"}
            </button>
          </div>

          <div className="mt-4 border-t border-[#F0E7E5]">
            {termen.map((t) => (
              <details
                key={t.id}
                id={t.id}
                open={open.has(t.id)}
                onToggle={(e) => {
                  const isOpen = (e.currentTarget as HTMLDetailsElement).open;
                  if (isOpen !== open.has(t.id)) zetOpen(t.id, isOpen);
                }}
                className="group scroll-mt-20 border-b border-[#F0E7E5]"
              >
                <summary className="flex cursor-pointer list-none items-start gap-5 py-7 [&::-webkit-details-marker]:hidden">
                  <span aria-hidden="true" className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FCE5D3] text-[#B84A3C]">
                    <KennisbankIcon name={t.icon} size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-redhat text-lg font-bold leading-snug group-hover:text-[#B84A3C]">
                      <span className="mr-2 text-[#B84A3C]">{t.nummer}</span>
                      {t.titel}
                    </span>
                    <span className="mt-2 block max-w-[62ch] text-[0.9375rem] leading-[1.65] text-[#5b6470] group-open:hidden">{t.eersteZin}</span>
                  </span>
                  <span aria-hidden="true" className="mt-3 shrink-0 text-[#B84A3C] transition-transform group-open:rotate-180 motion-reduce:transition-none">
                    <KennisbankIcon name="omlaag" size={16} />
                  </span>
                </summary>
                <Markdown html={t.html} className="taal-sectie pb-9 sm:pl-[3.75rem]" />
              </details>
            ))}
          </div>
          </div>
        </PaginaInhoud>
      </div>
    </Layout>
  );
}

export async function getStaticProps() {
  return {
    props: {
      pagina: await getContent("eenheid-van-taal"),
    },
  };
}
