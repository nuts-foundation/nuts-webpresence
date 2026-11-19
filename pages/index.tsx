import React from "react"

import { config } from "../lib/config"
import { getContent } from "../lib/api"
import home from "../config/home.json"

import VideoImage from "../public/video.png"

import Layout from "../components/Layout"
import Markdown from "../components/Markdown"
import YoutubeEmbed from "../components/YoutubeEmbed"
import KennisbankIcon from "../components/KennisbankIcon"
import Carousel from "../components/Carousel"
import Button, { Pijl } from "../components/Button"

// Homepage volgens het huisstijlontwerp (nuts.nl – homepage en toepassingen, nov 2026).
// Teksten van de vaste blokken staan in content/home/*.md, de nieuwe blokken in config/home.json.

function Wrap({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`home-wrap ${className}`}>{children}</div>
}

function H2({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`font-redhat text-[26px] font-bold leading-[1.2] text-dark-gray lg:text-[34px] ${className}`}>{children}</h2>
}

export default function Home({ sections: { entrance, whatIsNuts, howDoesItWork, community, callToAction } }: any) {
  const logos = config.participants
  // "Hoe werkt Nuts?" in alinea's: de eerste is de inleiding (links), de rest staat ernaast.
  const hoeAlineas: string[] = howDoesItWork.content.match(/<p[\s\S]*?<\/p>/g) ?? [howDoesItWork.content]

  return (
    <Layout>
      <div className="home font-inter text-text">
        {/* Hero */}
        <section id="inhoud" className="home-hero bg-brand">
          <Wrap className="grid items-start gap-8 lg:grid-cols-2 lg:gap-24">
            <h1 className="text-balance font-redhat text-[30px] font-bold leading-[1.15] text-white lg:text-[44px]">{entrance.meta["title"]}</h1>
            <div className="flex flex-col gap-10">
              <Markdown className="home-hero-tekst" html={entrance.content} />
              <div className="flex flex-wrap gap-3">
                <Button href="/starten" variant="geel">Starten met Nuts</Button>
                <Button href="/toepassingen" variant="op-donker">Bekijk de toepassingen</Button>
              </div>
            </div>
          </Wrap>
        </section>

        {/* Video, half over het rood */}
        <div className="home-video">
          <YoutubeEmbed placeholder={VideoImage} embedId="iD7iYTeE2kI" />
        </div>

        {/* Wat doet Nuts? */}
        <section className="py-10 lg:py-16">
          <Wrap className="grid items-center gap-8 lg:grid-cols-[3fr_2fr] lg:gap-16">
            <div>
              <H2 className="mb-4">{whatIsNuts.meta["title"]}</H2>
              <Markdown className="home-tekst" html={whatIsNuts.content} />
            </div>
            {/* Hoe Nuts georganiseerd is: rustige rijen met een lijn ertussen, zonder iconen (die staan alleen waar ze iets betekenen). */}
            <div className="rounded-3xl border border-zand bg-creme px-6 pb-3 pt-6 lg:px-8 lg:pt-7">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand">{home.watDoet.kop}</p>
              <div className="mt-2 flex flex-col divide-y divide-zand">
                {home.watDoet.pijlers.map((p) => (
                  <a key={p.href} href={p.href} className="group flex items-center gap-4 py-4">
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="font-redhat text-[17px] font-bold leading-tight text-inkt group-hover:text-dark">{p.titel}</span>
                      <span className="text-sm leading-[1.55] text-leisteen">{p.tekst}</span>
                    </span>
                    <Pijl href={p.href} className="text-pijl transition-transform group-hover:translate-x-0.5 group-hover:text-dark" />
                  </a>
                ))}
              </div>
            </div>
          </Wrap>
        </section>

        {/* Voor wie is Nuts? */}
        <section className="pb-12 lg:pb-20">
          <Wrap>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col justify-center gap-3 pb-2 sm:col-span-2 lg:col-span-1 lg:pb-0 lg:pr-4">
                <H2>{home.voorWie.titel}</H2>
                <p className="text-[17px] leading-[1.7] text-leisteen">{home.voorWie.intro}</p>
              </div>
              {home.voorWie.doelgroepen.map((d) => (
                <div key={d.titel} className="flex items-start gap-4 rounded-2xl border border-zand bg-white p-5">
                  <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-perzik text-brand">
                    <KennisbankIcon name={d.icon} size={20} />
                  </span>
                  <div>
                    <h3 className="font-redhat text-[17px] font-bold leading-[1.3] text-inkt">{d.titel}</h3>
                    <p className="mt-1 text-sm leading-[1.55] text-leisteen">{d.kern}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Button href={home.voorWie.knop.href}>{home.voorWie.knop.label} <Pijl href={home.voorWie.knop.href} /></Button>
              {home.voorWie.knopToelichting && <span className="text-sm text-leisteen">{home.voorWie.knopToelichting}</span>}
            </div>
          </Wrap>
        </section>

        {/* Hoe werkt Nuts? Lichtblauw (`light`), net als deze sectie op de huidige site. */}
        <section>
          <Wrap>
            <div className="relative overflow-hidden rounded-[2rem] border border-light-rand bg-light">
              <svg viewBox="0 0 152.31 119.71" aria-hidden="true" focusable="false" className="pointer-events-none absolute -bottom-[14%] right-0 h-[112%] text-nuts-blauw lg:-right-[4vw]">
                <path fill="currentColor" fillOpacity="0.06" d="M128.49,30.76V72.81q0,25.62-20.23,25.62-19.61,0-20.18-24.13V46.37q0-14.19-3-21.39a36.52,36.52,0,0,0-10.48-14.5Q62.57,0,44,0T13.34,10.48A35.94,35.94,0,0,0,3.07,25,66.37,66.37,0,0,0,0,46.37v73.31c.64-.7,1.26-1.4,2-2.06A40.69,40.69,0,0,1,23.82,107V46.9q0-25.62,20.22-25.62,19.62,0,20.18,24.13V73.34q0,14.19,3,21.39a36.42,36.42,0,0,0,10.48,14.5q12.06,10.49,30.59,10.48T139,109.23a35.94,35.94,0,0,0,10.27-14.5,66.65,66.65,0,0,0,3.07-21.39V30.76Z" />
              </svg>
              {/* Volledige tekst zoals op de huidige site. Breed: links kop en inleiding; rechts de andere alinea's. */}
              <div className="relative grid gap-6 px-6 py-9 sm:px-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16 lg:px-[72px] lg:py-[72px]">
                <div>
                  <H2 className="mb-6">{howDoesItWork.meta["title"]}</H2>
                  <Markdown className="home-tekst home-tekst-inleiding" html={hoeAlineas[0] ?? ""} />
                </div>
                <div className="lg:pt-[68px]">
                  <Markdown className="home-tekst" html={hoeAlineas.slice(1).join("")} />
                </div>
              </div>
            </div>
          </Wrap>
        </section>

        {/* Aan de slag: Toepassingen + Kennisbank */}
        <section className="py-12 lg:py-24">
          <Wrap>
            <H2 className="mb-8">{home.aanDeSlag.titel}</H2>
            {/* Twee gelijke kaarten. Subgrid: titel, tekst, lijst en knop liggen in beide kaarten op dezelfde hoogte. */}
            <div className="grid gap-6 lg:grid-cols-2 lg:grid-rows-[auto_auto_1fr_auto]">
              {[
                {
                  ...home.aanDeSlag.toepassingen,
                  rijen: home.aanDeSlag.toepassingen.rijen.map((r) => ({ ...r, href: "/toepassingen" })),
                  knop: { href: "/toepassingen", label: "Bekijk alle toepassingen" },
                },
                home.aanDeSlag.kennisbank,
              ].map((kaart) => (
                <div key={kaart.titel} className="flex flex-col rounded-3xl border border-zand bg-creme p-6 lg:row-span-4 lg:grid lg:grid-rows-subgrid lg:gap-0 lg:p-10">
                  <h3 className="mb-3 font-redhat text-2xl font-bold leading-tight text-inkt">{kaart.titel}</h3>
                  <p className="mb-6 text-[15px] leading-[1.7] text-leisteen">{kaart.tekst}</p>
                  <div className="mb-7 flex flex-col gap-1 lg:self-start">
                    {kaart.rijen.map((r: { href: string; titel: string; tekst: string; icon?: string }) => (
                      <a key={r.titel} href={r.href} className="group -mx-3 flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-inkt transition-colors hover:bg-white">
                        {r.icon && (
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-perzik text-brand">
                            <KennisbankIcon name={r.icon} size={18} />
                          </span>
                        )}
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="text-[15px] font-semibold group-hover:text-dark">{r.titel}</span>
                          <span className="text-[13px] leading-normal text-leisteen">{r.tekst}</span>
                        </span>
                        <Pijl href={r.href} className="text-pijl transition-transform group-hover:translate-x-0.5 group-hover:text-dark" />
                      </a>
                    ))}
                  </div>
                  <Button href={kaart.knop.href} className="mt-auto self-start justify-self-start">
                    {kaart.knop.label} <Pijl href={kaart.knop.href} />
                  </Button>
                </div>
              ))}
            </div>
          </Wrap>
        </section>

        {/* Community: logocarrousel */}
        <section className="pb-12 lg:pb-20">
          <Wrap>
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <H2>{community.meta["title"]}</H2>
              <Markdown className="home-tekst text-base" html={community.content.replace(/:\s*<\/p>/, ".</p>")} />
            </div>
            <div className="h-[65px]">
              <Carousel items={logos.map((p) => (
                <a href={p.url} key={p.title} target="_blank" rel="noreferrer" title={p.title}>
                  <img src={p.logoUrl} alt={p.title} loading="lazy" style={{ objectFit: "contain", height: "100%", display: "inline-block" }} />
                </a>
              ))} />
            </div>
          </Wrap>
        </section>

        {/* Call to action: licht vlak met foto */}
        <section className="pb-14 lg:pb-24">
          <Wrap>
            <div className="grid overflow-hidden rounded-[2rem] border border-zand bg-creme lg:grid-cols-2">
              <div className="flex flex-col justify-center gap-7 px-6 py-9 sm:px-12 lg:px-[72px] lg:py-[72px]">
                <div>
                  <h2 className="mb-4 font-redhat text-[28px] font-bold leading-[1.15] text-inkt lg:text-[40px]">{callToAction.meta["title"]}</h2>
                  <Markdown className="home-cta-tekst max-w-[46ch]" html={callToAction.content} />
                </div>
                <form action="https://nuts.us19.list-manage.com/subscribe/post?u=3e7256ff066373fd17657bba0&id=f44bdb4b26" method="POST" className="flex w-full max-w-[520px] flex-col gap-2.5 sm:flex-row sm:gap-0">
                  {/* Telefoon: veld en knop onder elkaar, elk over de volle breedte. Vanaf sm: één pil. */}
                  <label htmlFor="nb-email" className="sr-only">E-mailadres</label>
                  <input
                    id="nb-email"
                    type="email"
                    name="EMAIL"
                    required
                    placeholder="Vul hier je e-mailadres in"
                    className="h-[52px] w-full min-w-0 rounded-full border border-zand-donker bg-white px-[22px] text-[15px] text-text sm:flex-1 sm:rounded-l-full sm:rounded-r-none sm:border-r-0"
                  />
                  <button type="submit" className="h-[52px] w-full cursor-pointer rounded-full bg-button px-[26px] text-sm font-semibold text-text transition-colors hover:bg-button-hover sm:w-auto sm:flex-none sm:rounded-l-none sm:rounded-r-full">
                    Houd me op de hoogte!
                  </button>
                </form>
                {/* Alleen de link(s); de social-iconen staan in de footer */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                  {home.callToAction.links.map((l) => (
                    <a key={l.href} href={l.href} className="text-[15px] font-semibold text-brand hover:text-dark hover:underline">{l.label} <Pijl href={l.href} /></a>
                  ))}
                </div>
              </div>
              {/* Illustratie in haar eigen verhouding (1200×943): niet bijsnijden, dan valt er niets weg. */}
              <div className="flex items-center px-6 pb-6 sm:px-12 sm:pb-12 lg:py-[72px] lg:pl-0 lg:pr-[72px]">
                <img
                  src={home.callToAction.foto.src}
                  alt={home.callToAction.foto.alt}
                  width={1200}
                  height={943}
                  className="mx-auto block h-auto w-full max-w-[520px] rounded-3xl"
                  loading="lazy"
                />
              </div>
            </div>
          </Wrap>
        </section>
      </div>
    </Layout>
  )
}

export const getStaticProps = async () => {
  return {
    props: {
      sections: {
        entrance: await getContent("1-entrance"),
        whatIsNuts: await getContent("2-what-is-nuts"),
        howDoesItWork: await getContent("3-how-does-it-work"),
        community: await getContent("4-community"),
        callToAction: await getContent("6-bottom-call-to-action"),
      },
    }
  }
}
