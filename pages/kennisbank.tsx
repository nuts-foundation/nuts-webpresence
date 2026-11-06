import React from "react";
import Head from "next/head";
import { getContent } from "../lib/api";
import Markdown from "../components/Markdown";
import Layout from "../components/Layout";
import KennisbankIcon from "../components/KennisbankIcon";
import config from "../config/kennisbank.json";
import PaginaKop, { PaginaInhoud } from "../components/PaginaKop";

interface Sectie {
  id: string;
  label: string;
  icon?: string;
  kort?: string;
  titel: string;
  html: string;
  links: { href: string; label: string }[];
}

// Een laatste alinea die alleen uit links bestaat, wordt het kaartje "Verder lezen".
function splitLinks(html: string): { html: string; links: Sectie["links"] } {
  const m = html.match(/<p>((?:\s*<a [^>]*>[^<]*<\/a>\s*)+)<\/p>\s*$/);
  if (!m) return { html, links: [] };
  const links = Array.from(m[1].matchAll(/<a [^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g)).map((a) => ({ href: a[1], label: a[2] }));
  return { html: html.slice(0, m.index), links };
}

// Splitst de gerenderde markdown op elke <h2> in een intro en losse secties.
// Label, icoon en anker per sectie komen uit config/kennisbank.json (gekoppeld op de titel).
function splitSecties(html: string): { intro: string; secties: Sectie[] } {
  const [intro, ...parts] = html.split(/(?=<h2>)/);
  const secties = parts.map((part) => {
    const titel = (part.match(/<h2>(.*?)<\/h2>/)?.[1] ?? "").trim();
    const meta = config.secties.find((s) => s.titel === titel);
    const id = meta?.id ?? titel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const { html, links } = splitLinks(part.replace(/<h2>.*?<\/h2>/, ""));
    return { id, titel, label: meta?.label ?? titel, icon: meta?.icon, kort: (meta as any)?.kort, html, links };
  });
  return { intro, secties };
}

export default function KennisbankPage({ kennisbank }: any) {
  const { intro, secties } = splitSecties(kennisbank.content);
  const titel = intro.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "") ?? "Kennisbank";
  const introTekst = intro.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, "");
  return (
    <Layout>
      <Head>
        <title>Nuts - Kennisbank</title>
        {kennisbank.meta.description && <meta name="description" content={kennisbank.meta.description} />}
        <meta property="og:title" content="Nuts - Kennisbank" />
        <link rel="canonical" href="https://nuts.nl/kennisbank/" />
      </Head>

      <div className="kennisbank bg-white font-inter">
        <PaginaKop
          variant="warm"
          terug={{ href: "/", label: "Terug naar home" }}
          eyebrow={{ icon: "wiki", label: "Meedoen" }}
          titel={titel}
          introHtml={introTekst}
          aside={
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#B84A3C]">Kies een ingang</p>
              <div className="flex flex-col gap-3">
                {config.ingangen.map((ingang) => (
                  <a
                    key={ingang.id}
                    href={ingang.href}
                    className="group flex items-start gap-3.5 rounded-2xl border border-[#F0E7E5] bg-white p-5 text-[#1C2A39] shadow-sm transition-shadow hover:shadow-md"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FCE5D3] text-[#B84A3C]">
                      <KennisbankIcon name={ingang.icon} size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-redhat text-lg font-bold leading-snug group-hover:text-[#B84A3C]">{ingang.title}</span>
                      <span className="mt-1 block text-sm leading-snug text-[#4C5968]">{ingang.text}</span>
                    </span>
                    <span aria-hidden="true" className="ml-auto self-center text-[#B84A3C] transition-transform group-hover:translate-x-0.5">&rarr;</span>
                  </a>
                ))}
              </div>
              <p className="mt-5 text-sm text-[#4C5968]">
                Nieuw met Nuts? Begin bij{" "}
                <a href="/starten" className="font-semibold text-[#B84A3C] underline underline-offset-4 hover:text-[#7D352C]">Starten met Nuts &rarr;</a>
              </p>
            </div>
          }
        />

        <nav aria-label="Onderwerpen op deze pagina" className="mt-8 border-b border-[#F0E7E5] bg-white">
          <PaginaInhoud>
            <div className="-mx-3.5 flex gap-2 overflow-x-auto py-2.5">
              {secties.map((sectie) => (
                <a
                  key={sectie.id}
                  href={`#${sectie.id}`}
                  className="shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium text-[#1C2A39] transition-colors hover:bg-[#FBF6F4] hover:text-[#B84A3C]"
                >
                  {sectie.label}
                </a>
              ))}
            </div>
          </PaginaInhoud>
        </nav>

        <PaginaInhoud className="py-12 md:py-16">
          {secties.map((sectie, i) => (
            <section
              key={sectie.id}
              id={sectie.id}
              className={`scroll-mt-20 ${i > 0 ? "mt-10 border-t border-[#F0E7E5] pt-10" : ""}`}
            >
              <h2 className="mb-4 flex items-center gap-3 font-redhat text-2xl font-bold leading-tight text-[#1C2A39]">
                {sectie.icon && (
                  <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FCE5D3] text-[#B84A3C]">
                    <KennisbankIcon name={sectie.icon} size={18} />
                  </span>
                )}
                {sectie.titel}
              </h2>
              <Markdown html={sectie.html} className="kennisbank-sectie max-w-[66ch]" />
              {sectie.links.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2.5">
                  {sectie.links.map((link, j) => {
                    const ext = link.href.startsWith("http");
                    return (
                      <a
                        key={link.href}
                        href={link.href}
                        {...(ext ? { target: "_blank", rel: "noreferrer" } : {})}
                        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                          j === 0 ? "bg-[#B84A3C] text-white hover:bg-[#7D352C]" : "border border-[#D6C9C4] text-[#1C2A39] hover:border-[#B84A3C] hover:text-[#B84A3C]"
                        }`}
                      >
                        {link.label}
                        <span aria-hidden="true">→</span>
                      </a>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </PaginaInhoud>
      </div>
    </Layout>
  );
}

export async function getStaticProps() {
  return {
    props: {
      kennisbank: await getContent("kennisbank"),
    },
  };
}
