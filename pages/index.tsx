import React from "react"
import { readdir } from "fs/promises"
import { InferGetStaticPropsType } from "next"

import { config } from "../lib/config"
import { getContent, getPosts } from "../lib/api"

import VideoImage from "/public/video.png"

// import KikV from "/public/use-cases/kik-v.png"
// import ZorgInzage from "/public/use-cases/zorginzage.png"
// import eOverdracht from "/public/use-cases/eOverdracht.png"
// import BabyConnect from "/public/use-cases/baby-connect.png"
// import KikVSm from "/public/use-cases/sm/kik-v.png"
// import ZorgInzageSm from "/public/use-cases/sm/zorginzage.png"
// import eOverdrachtSm from "/public/use-cases/sm/eOverdracht.png"
// import BabyConnectSm from "/public/use-cases/sm/baby-connect.png"

import Video from "../components/Video"
import Layout from "../components/Layout"
import Header from "../components/Header"
import UseCase from "../components/UseCase"
import Markdown from "../components/Markdown"
import Carousel from "../components/Carousel"
import YoutubeEmbed from "../components/YoutubeEmbed"
import { InputButton } from "../components/Button"

interface HomeProps extends InferGetStaticPropsType<typeof getStaticProps> {
}

function Heading({ children }: { children: React.ReactNode }) {
  return (<h2 className="font-redhat font-bold text-2xl md:text-3xl mb-6">{children}</h2>)
}

function Section({ children }: { children: React.ReactNode }) {
  return (<div className="container mx-auto py-8 md:py-24">{children}</div>)
}

export default function Home({ sections: { entrance, whatIsNuts, howDoesItWork, community, usecases, callToAction } }: HomeProps) {
  function submitNewsletter() {
  }

  return (
    <Layout>
      <Header>
        <div className="container mx-auto">
          <div className="md:grid grid-cols-2 mb-12 gap-24 mb-6 md:mb-24">
            <h1 className="font-redhat font-bold text-white text-3xl md:text-4xl mb-6">{entrance.meta["title"]}</h1>
            <div>
              <Markdown className="text-white font-inter mb-12 leading-relaxed" html={entrance.content} />
            </div>
          </div>

          <div className="-mb-[120px] md:px-12 md:-mb-[300px]">
            <YoutubeEmbed placeholder={VideoImage} embedId="iD7iYTeE2kI" />
          </div>
        </div>
      </Header>

      <div className="mt-[120px] md:mt-[300px]">
        <Section>
          <div className="md:grid grid-cols-2 gap-24">
            <div className="mb-8">
              <Heading>{whatIsNuts.meta["title"]}</Heading>
              <Markdown className="prose font-inter space-y-6 leading-loose" html={whatIsNuts.content} />
            </div>

            <div>
              <img src="/collaboration.png" className="rounded-3xl shadow-md" loading="lazy" />
            </div>
          </div>
        </Section>
      </div>

      <div className="bg-light mt-[40px]">
        <Section>
          <div className="md:grid grid-cols-2 gap-24 items-center">
            <div className="text-right">
              <img src="/globe.gif" loading="lazy" />
            </div>
            <div>
              <Heading>{howDoesItWork.meta["title"]}</Heading>
              <Markdown className="prose font-inter space-y-6 leading-loose" html={howDoesItWork.content} />
            </div>
          </div>
        </Section>
      </div>

      <Section>
        <Heading>{community.meta["title"]}</Heading>
        <Markdown className="font-inter" html={community.content} />
      </Section>

      <div className="my-20 mx-5 h-[65px]">
        <Carousel items={config.participants.map(participant => (<a
          href={participant.url}
          key={participant.title}
          target="_blank"
          rel="noreferrer">
          <img
            src={participant.logoUrl}
            loading="lazy"
            style={{ objectFit: "contain", height: "100%", display: "inline-block" }}
          />
        </a>))} />
      </div>

      <Section>
        <div className="mx-auto text-center max-w-lg">
          <div>
            <Heading>{callToAction.meta["title"]}</Heading>
            <Markdown className="font-inter leading-loose mb-8" html={callToAction.content} />

            <form action="https://nuts.us19.list-manage.com/subscribe/post?u=3e7256ff066373fd17657bba0&id=f44bdb4b26" method="POST">
              <InputButton inputName="EMAIL" placeholderText="Vul hier je e-mailadres in" buttonText="Houd me op de hoogte!" buttonType="submit" />
            </form>
          </div>
        </div>
      </Section>

    </Layout>
  )
}

export const getStaticProps = async () => {
  const files = await readdir("public/logos")

  return {
    props: {
      sections: {
        entrance: await getContent("home/1-entrance"),
        whatIsNuts: await getContent("home/2-what-is-nuts"),
        howDoesItWork: await getContent("home/3-how-does-it-work"),
        community: await getContent("home/4-community"),
        usecases: await getContent("home/5-usecases"),
        callToAction: await getContent("home/6-bottom-call-to-action"),
      },
    }
  }
}
