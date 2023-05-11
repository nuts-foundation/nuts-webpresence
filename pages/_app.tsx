import "../styles/globals.css"
import { DefaultSeo } from "next-seo"
import type { AppProps } from "next/app"
import { GoogleAnalytics } from "nextjs-google-analytics"

import { config, ConfigContext } from "../lib/config"

export default function App({ Component, pageProps }: AppProps) {
  return <>
    <ConfigContext.Provider value={config}>
      <DefaultSeo
        title="Nuts — Een decentraal communicatienetwerk voor de zorg"
        description="Een decentraal communicatienetwerk voor de zorg"
        openGraph={{ title: "Nuts — Een decentraal communicatienetwerk voor de zorg" }}
      />
      <GoogleAnalytics />
      <Component {...pageProps} />
    </ConfigContext.Provider>
  </>
}
