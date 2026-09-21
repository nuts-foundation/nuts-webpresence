import "../styles/globals.css"
import "swiper/css"

import { generateDefaultSeo } from "next-seo/pages"
import type { AppProps } from "next/app"
import Head from "next/head"
import { GoogleAnalytics } from "nextjs-google-analytics"

import { config, ConfigContext } from "../lib/config"

export default function App({ Component, pageProps }: AppProps) {
  return <>
    <ConfigContext.Provider value={config}>
      <Head>
        {generateDefaultSeo({
          title: "Nuts — Een decentraal communicatienetwerk voor de zorg",
          description: "Een decentraal communicatienetwerk voor de zorg",
          openGraph: { title: "Nuts — Een decentraal communicatienetwerk voor de zorg" },
        })}
      </Head>
      <GoogleAnalytics />
      <Component {...pageProps} />
    </ConfigContext.Provider>
  </>
}
