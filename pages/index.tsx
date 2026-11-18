import React from "react"

import { config } from "../lib/config"
import { getContent } from "../lib/api"
import home from "../config/home.json"
import footer from "../config/footer.json"

import VideoImage from "../public/video.png"

import Layout from "../components/Layout"
import Markdown from "../components/Markdown"
import YoutubeEmbed from "../components/YoutubeEmbed"
import KennisbankIcon from "../components/KennisbankIcon"
import Carousel from "../components/Carousel"

// Homepage volgens het huisstijlontwerp (nuts.nl – homepage en toepassingen, nov 2026).
// Teksten van de vaste blokken staan in content/home/*.md, de nieuwe blokken in config/home.json.

function Wrap({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`home-wrap ${className}`}>{children}</div>
}

function H2({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`font-redhat text-[26px] font-bold leading-[1.2] text-[#101828] lg:text-[34px] ${className}`}>{children}</h2>
}

export default function Home({ sections: { entrance, whatIsNuts, howDoesItWork, community, callToAction } }: any) {
  const logos = config.participants

  return (
    <Layout>
      <div className="home font-inter text-[#272727]">
        {/* Hero */}
        <section id="inhoud" className="home-hero bg-brand">
          <Wrap className="grid items-start gap-8 lg:grid-cols-2 lg:gap-24">
            <h1 className="text-balance font-redhat text-[30px] font-bold leading-[1.15] text-white lg:text-[44px]">{entrance.meta["title"]}</h1>
            <div className="flex flex-col gap-10">
              <Markdown className="home-hero-tekst" html={entrance.content} />
              <div className="flex flex-wrap gap-3">
                <a href="/starten" className="inline-block rounded-full bg-button px-6 py-3.5 text-[15px] font-semibold text-[#272727] transition-colors hover:bg-button-hover">
                  Starten met Nuts
                </a>
                <a href="/toepassingen" className="inline-block rounded-full border border-white px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:border-[#FFE4CB] hover:text-[#FFE4CB]">
                  Bekijk de toepassingen
                </a>
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
            <div className="rounded-3xl border border-[#F0E7E5] bg-[#FBF6F4] px-6 pb-3 pt-6 lg:px-8 lg:pt-7">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#B84A3C]">{home.watDoet.kop}</p>
              <div className="mt-2 flex flex-col divide-y divide-[#EADCD7]">
                {home.watDoet.pijlers.map((p) => (
                  <a key={p.href} href={p.href} className="group flex items-center gap-4 py-4">
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="font-redhat text-[17px] font-bold leading-tight text-[#1C2A39] group-hover:text-[#B84A3C]">{p.titel}</span>
                      <span className="text-sm leading-[1.55] text-[#4C5968]">{p.tekst}</span>
                    </span>
                    <span aria-hidden="true" className="text-lg text-[#B84A3C] transition-transform group-hover:translate-x-1">
                      &rarr;
                    </span>
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
                <p className="text-[17px] leading-[1.7] text-[#4C5968]">{home.voorWie.intro}</p>
              </div>
              {home.voorWie.doelgroepen.map((d) => (
                <div key={d.titel} className="flex items-start gap-4 rounded-2xl border border-[#F0E7E5] bg-white p-5">
                  <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FCE5D3] text-[#B84A3C]">
                    <KennisbankIcon name={d.icon} size={20} />
                  </span>
                  <div>
                    <h3 className="font-redhat text-[17px] font-bold leading-[1.3] text-[#1C2A39]">{d.titel}</h3>
                    <p className="mt-1 text-sm leading-[1.55] text-[#4C5968]">{d.kern}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              <a href={home.voorWie.knop.href} className="inline-block rounded-full bg-[#B84A3C] px-[22px] py-[13px] text-[15px] font-semibold text-white transition-colors hover:bg-[#7D352C]">
                {home.voorWie.knop.label}
              </a>
              {home.voorWie.knopToelichting && <span className="text-sm text-[#4C5968]">{home.voorWie.knopToelichting}</span>}
            </div>
          </Wrap>
        </section>

        {/* Hoe werkt Nuts? */}
        <section>
          <Wrap>
            <div className="relative overflow-hidden rounded-[2rem] border border-[#F0E7E5] bg-[#FBF6F4]">
              <svg viewBox="0 0 152.31 119.71" aria-hidden="true" focusable="false" className="pointer-events-none absolute -bottom-[14%] right-0 h-[112%] lg:-right-[4vw]">
                <path fill="#D15949" fillOpacity="0.07" d="M128.49,30.76V72.81q0,25.62-20.23,25.62-19.61,0-20.18-24.13V46.37q0-14.19-3-21.39a36.52,36.52,0,0,0-10.48-14.5Q62.57,0,44,0T13.34,10.48A35.94,35.94,0,0,0,3.07,25,66.37,66.37,0,0,0,0,46.37v73.31c.64-.7,1.26-1.4,2-2.06A40.69,40.69,0,0,1,23.82,107V46.9q0-25.62,20.22-25.62,19.62,0,20.18,24.13V73.34q0,14.19,3,21.39a36.42,36.42,0,0,0,10.48,14.5q12.06,10.49,30.59,10.48T139,109.23a35.94,35.94,0,0,0,10.27-14.5,66.65,66.65,0,0,0,3.07-21.39V30.76Z" />
              </svg>
              <div className="relative px-6 py-9 sm:px-12 lg:px-[72px] lg:py-[72px]">
                <div className="max-w-[680px]">
                  <H2 className="mb-6">{howDoesItWork.meta["title"]}</H2>
                  <Markdown className="home-tekst" html={howDoesItWork.content} />
                  <a href={home.hoeWerktNutsLink.href} className="mt-5 inline-block text-[15px] font-semibold text-[#B84A3C] hover:text-[#7D352C] hover:underline">
                    {home.hoeWerktNutsLink.label}
                  </a>
                </div>
              </div>
            </div>
          </Wrap>
        </section>

        {/* Aan de slag: Toepassingen + Kennisbank */}
        <section className="py-12 lg:py-24">
          <Wrap>
            <H2 className="mb-8">{home.aanDeSlag.titel}</H2>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="flex flex-col rounded-3xl border border-[#F0E7E5] bg-[#FBF6F4] p-6 lg:p-10">
                <h3 className="mb-3 font-redhat text-2xl font-bold leading-tight text-[#1C2A39]">{home.aanDeSlag.toepassingen.titel}</h3>
                <p className="mb-6 text-[15px] leading-[1.7] text-[#4C5968]">{home.aanDeSlag.toepassingen.tekst}</p>
                <div className="mb-7 flex flex-col gap-1">
                  {home.aanDeSlag.toepassingen.rijen.map((r) => (
                    <a key={r.abbr} href="/toepassingen#categorieen" className="group flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-[#1C2A39] transition-colors hover:bg-white">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FCE5D3] text-[#B84A3C]" title={r.titel}>
                        <KennisbankIcon name={r.icon} size={18} />
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="text-[15px] font-semibold group-hover:text-[#B84A3C]">{r.titel}</span>
                        <span className="text-[13px] leading-normal text-[#4C5968]">{r.tekst}</span>
                      </span>
                    </a>
                  ))}
                </div>
                <a href="/toepassingen" className="mt-auto self-start rounded-full bg-[#B84A3C] px-[22px] py-[13px] text-[15px] font-semibold text-white transition-colors hover:bg-[#7D352C]">
                  Bekijk alle toepassingen &rarr;
                </a>
              </div>

              {/* Kennisbank: blauwe familie uit de illustraties, geen rood */}
              <div className="flex flex-col rounded-3xl border border-[#DCEBEF] bg-light p-6 lg:p-10">
                <h3 className="mb-3 font-redhat text-2xl font-bold leading-tight text-[#1C2A39]">{home.aanDeSlag.kennisbank.titel}</h3>
                <p className="mb-6 text-[15px] leading-[1.7] text-[#4C5968]">{home.aanDeSlag.kennisbank.tekst}</p>
                {/* Zonder iconen: de titels zeggen genoeg. Een lijn ertussen en een pijl houden het overzichtelijk. */}
                <div className="mb-7 flex flex-col divide-y divide-[#DCEBEF]">
                  {home.aanDeSlag.kennisbank.rijen.map((r) => (
                    <a key={r.href} href={r.href} className="group flex items-center gap-3.5 py-3 text-[#1C2A39] first:pt-0">
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-[15px] font-semibold group-hover:text-[#245371]">{r.titel}</span>
                        <span className="text-[13px] leading-normal text-[#4C5968]">{r.tekst}</span>
                      </span>
                      <span aria-hidden="true" className="text-[#9FB9C6] transition-transform group-hover:translate-x-0.5 group-hover:text-[#245371]">
                        &rarr;
                      </span>
                    </a>
                  ))}
                </div>
                <a href={home.aanDeSlag.kennisbank.knop.href} className="mt-auto self-start rounded-full bg-[#245371] px-[22px] py-[13px] text-[15px] font-semibold text-white transition-colors hover:bg-[#0B122C]">
                  {home.aanDeSlag.kennisbank.knop.label}
                </a>
              </div>
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
            <div className="grid overflow-hidden rounded-[2rem] border border-[#F0E7E5] bg-[#FBF6F4] lg:grid-cols-2">
              <div className="flex flex-col justify-center gap-7 px-6 py-9 sm:px-12 lg:px-[72px] lg:py-[72px]">
                <div>
                  <h2 className="mb-4 font-redhat text-[28px] font-bold leading-[1.15] text-[#1C2A39] lg:text-[40px]">{callToAction.meta["title"]}</h2>
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
                    className="h-[52px] w-full min-w-0 rounded-full border border-[#D6C9C4] bg-white px-[22px] text-[15px] text-[#272727] sm:flex-1 sm:rounded-l-full sm:rounded-r-none sm:border-r-0"
                  />
                  <button type="submit" className="h-[52px] w-full rounded-full bg-button px-[26px] text-[15px] font-semibold text-[#272727] transition-colors hover:bg-button-hover sm:w-auto sm:flex-none sm:rounded-l-none sm:rounded-r-full">
                    Houd me op de hoogte!
                  </button>
                </form>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                  {home.callToAction.links.map((l) => (
                    <a key={l.href} href={l.href} className="text-[15px] font-semibold text-[#B84A3C] hover:text-[#7D352C] hover:underline">{l.label}</a>
                  ))}
                  <span className="flex gap-2.5">
                    {footer.socials.map((s) => (
                      <a key={s.href} href={s.href} aria-label={`Nuts: ${s.name}`} target={s.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
                        <img src={s.icon} alt="" className="block h-11 w-11" />
                      </a>
                    ))}
                  </span>
                </div>
              </div>
              {/* Illustratie in haar eigen verhouding (1200×943): niet bijsnijden, dan valt er niets weg. */}
              <div className="flex items-center px-6 pb-6 sm:px-12 sm:pb-12 lg:py-[72px] lg:pl-0 lg:pr-[72px]">
                <img
                  src={home.callToAction.foto.src}
                  alt={home.callToAction.foto.alt}
                  width={1200}
                  height={943}
                  className="mx-auto block h-auto w-full max-w-[520px] rounded-3xl shadow-md"
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
