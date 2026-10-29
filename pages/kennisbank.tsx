import React, { useEffect, useState } from "react";
import Head from "next/head";
import { generateNextSeo } from "next-seo/pages";
import { getContent } from "../lib/api";
import Markdown from "../components/Markdown";
import Layout from "../components/Layout";
import KennisbankIcon from "../components/KennisbankIcon";
import config from "../config/kennisbank.json";

interface Sectie {
  id: string;
  label: string;
  icon?: string;
  html: string;
}

// Splitst de gerenderde markdown op elke <h2> in een intro en losse secties.
// Label, icoon en anker per sectie komen uit config/kennisbank.json (gekoppeld op de titel).
function splitSecties(html: string): { intro: string; secties: Sectie[] } {
  const [intro, ...parts] = html.split(/(?=<h2>)/);
  const secties = parts.map((part) => {
    const titel = (part.match(/<h2>(.*?)<\/h2>/)?.[1] ?? "").trim();
    const meta = config.secties.find((s) => s.titel === titel);
    const id = meta?.id ?? titel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return { id, label: meta?.label ?? titel, icon: meta?.icon, html: part };
  });
  return { intro, secties };
}

export default function KennisbankPage({ kennisbank }: any) {
  const { intro, secties } = splitSecties(kennisbank.content);
  const [actief, setActief] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActief(e.target.id)),
      { rootMargin: "-80px 0px -60% 0px" }
    );
    secties.forEach((s) => {
      const el = document.getElementById(s.id);
      el && observer.observe(el);
    });
    return () => observer.disconnect();
  }, [kennisbank.content]);

  return (
    <Layout>
      <Head>
        {generateNextSeo({ title: "Nuts - Kennisbank", description: kennisbank.meta.description, openGraph: { title: "Nuts - Kennisbank" } })}
      </Head>

      <div className="kennisbank bg-brand text-white border-t border-black/10">
        <div className="container mx-auto py-14 space-y-6">
          <Markdown html={intro} className="kennisbank-intro max-w-3xl" />

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/85 mb-3">Kies een ingang</p>
            <div className="grid gap-3 md:grid-cols-3">
              {config.ingangen.map((ingang) => (
                <a
                  key={ingang.id}
                  href={ingang.href}
                  className="flex items-start gap-3 bg-white text-[#1C2A39] rounded-xl border border-[#F0E7E5] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <span className="flex items-center justify-center w-9 h-9 rounded-full bg-menu-hover text-brand shrink-0">
                    <KennisbankIcon name={ingang.icon} size={18} />
                  </span>
                  <span>
                    <span className="block font-redhat font-bold leading-snug">{ingang.title}</span>
                    <span className="block text-sm text-[#5b6470] leading-snug mt-1">{ingang.text}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>

          <p className="font-medium">
            Nieuw met Nuts? Begin bij{" "}
            <a href="/starten" className="font-semibold underline underline-offset-4">Starten met Nuts &rarr;</a>
          </p>
        </div>
      </div>

      <div className="bg-[#FBF6F4] border-b border-[#F0E7E5]">
        <div className="container mx-auto py-12 grid gap-4 md:grid-cols-2">
          {config.onderwerpen.map((onderwerp) => (
            <a
              key={onderwerp.id}
              href={`#${onderwerp.secties[0]}`}
              className="group flex flex-col bg-white rounded-xl border border-[#F0E7E5] p-6 transition-colors hover:border-brand"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-brand text-white mb-4">
                <KennisbankIcon name={onderwerp.icon} />
              </span>
              <span className="font-redhat font-bold text-lg text-[#1C2A39] mb-2">{onderwerp.title}</span>
              <span className="text-sm text-[#1C2A39] leading-relaxed mb-4">{onderwerp.text}</span>
              <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                Lees meer
                <KennisbankIcon name="omlaag" size={14} className="transition-transform group-hover:translate-y-0.5 motion-reduce:transition-none" />
              </span>
            </a>
          ))}
        </div>
      </div>

      <nav aria-label="Onderwerpen op deze pagina" className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-[#F0E7E5]">
        <div className="container mx-auto flex gap-2 overflow-x-auto py-2.5">
          {config.onderwerpen.map((onderwerp) => {
            const isActief = actief !== null && onderwerp.secties.includes(actief);
            return (
              <a
                key={onderwerp.id}
                href={`#${onderwerp.secties[0]}`}
                aria-current={isActief ? "true" : undefined}
                className={`shrink-0 first:-ml-3.5 text-sm px-3.5 py-1.5 rounded-full transition-colors ${
                  isActief ? "bg-menu-hover text-brand font-semibold" : "text-[#1C2A39] font-medium hover:bg-[#FBF6F4]"
                }`}
              >
                {onderwerp.title}
              </a>
            );
          })}
        </div>
      </nav>

      <div className="container mx-auto py-12 md:py-16">
        {secties.map((sectie, i) => (
          <section
            key={sectie.id}
            id={sectie.id}
            className={`scroll-mt-20 grid gap-3 md:grid-cols-[240px_minmax(0,1fr)] md:gap-7 ${i > 0 ? "border-t border-[#F0E7E5] pt-10 mt-10" : ""}`}
          >
            <div className="flex items-center gap-2.5 self-start text-xs font-semibold uppercase tracking-wider text-[#5b6470]">
              {sectie.icon && (
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand text-white shrink-0">
                  <KennisbankIcon name={sectie.icon} size={16} />
                </span>
              )}
              {sectie.label}
            </div>
            <Markdown html={sectie.html} className="kennisbank-sectie min-w-0" />
          </section>
        ))}
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
