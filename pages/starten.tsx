import React from "react";
import Head from "next/head";
import { getContent } from "../lib/api";
import Markdown from "../components/Markdown";
import Layout from "../components/Layout";
import VerticalStepper, { STAPPEN, stapId } from "../components/VerticalStepper";
import PaginaKop, { PaginaInhoud } from "../components/PaginaKop";
import Button from "../components/Button";
import KennisbankIcon from "../components/KennisbankIcon";

const SLACK = "https://join.slack.com/t/nuts-foundation/shared_invite/zt-235ww08nk-halwcet23WCHclmlFd0lLg";

export default function StartenPage({ starten }: any) {
  const titel = starten.content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "") ?? "Starten met Nuts";
  const intro = starten.content.match(/<p[^>]*>[\s\S]*?<\/p>/i)?.[0];
  const content = starten.content
    .replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, "")
    .replace(/<p[^>]*>[\s\S]*?<\/p>/i, "");

  return (
    <Layout>
      <Head>
        <title>{`Nuts - ${titel}`}</title>
        {starten.meta?.description && <meta name="description" content={starten.meta.description} />}
      </Head>
      <div className="bg-white font-inter">
        <PaginaKop
          terug={{ href: "/", label: "Terug naar home" }}
          eyebrow={{ icon: "community", label: "Meedoen" }}
          titel={titel}
          introHtml={intro}
          primair={{ href: "#eerste-stappen", label: "Bekijk de stappen ↓" }}
          secundair={{ href: "/kennisbank", label: "Naar de kennisbank" }}
          aside={
            // Overzicht van de route: in één oogopslag welke stappen er zijn, en meteen erheen springen.
            <nav aria-label="De stappen" className="rounded-2xl border border-zand bg-white p-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.08em] text-brand">In {STAPPEN.length} stappen op weg</p>
              <ol className="divide-y divide-zand [&>li:first-child>a]:pt-0 [&>li:last-child>a]:pb-0">
                {STAPPEN.map((s) => (
                  <li key={s.number}>
                    <a href={`#${stapId(s)}`} className="group flex items-center gap-3 py-3 text-sm font-semibold text-inkt">
                      <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-perzik font-redhat text-[13px] font-bold text-brand">
                        {s.number}
                      </span>
                      <span className="flex-1 group-hover:text-dark">{s.title}</span>
                      <span aria-hidden="true" className="text-pijl transition-transform group-hover:translate-x-0.5 group-hover:text-dark">
                        &rarr;
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          }
        />

        <PaginaInhoud className="py-12 md:py-16">
          <div id="eerste-stappen" className="mx-auto max-w-[880px] scroll-mt-8">
            {content.trim() && <Markdown html={content} className="prose mb-12 max-w-none" />}
            <VerticalStepper />

            {/* Afsluiter: wie onderweg vastloopt, kan altijd terecht bij de community. */}
            <section className="relative mt-14 overflow-hidden rounded-3xl bg-nuts-blauw px-6 py-8 text-white sm:px-10 sm:py-10">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-nuts-blauw-fel text-white">
                    <KennisbankIcon name="vraag" size={20} />
                  </span>
                  <div>
                    <h2 className="font-redhat text-xl font-bold leading-tight md:text-2xl">Hulp nodig bij een stap?</h2>
                    <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-white/90">
                      In de community helpen leveranciers, zorgorganisaties en de stichting elkaar verder. Stel je vraag op Slack of kom naar de community meeting.
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-3">
                  <Button href={SLACK} variant="geel">Stel je vraag via Slack</Button>
                  <Button href="/community/" variant="op-donker">Community meeting</Button>
                </div>
              </div>
            </section>
          </div>
        </PaginaInhoud>
      </div>
    </Layout>
  );
}

export async function getStaticProps() {
  return {
    props: {
      starten: await getContent("starten"),
    },
  };
}
