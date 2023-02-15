import "../styles/globals.css"
import type { AppProps } from "next/app"
import { GoogleAnalytics } from "nextjs-google-analytics"

import { config, ConfigContext } from "../lib/config"

export default function App({ Component, pageProps }: AppProps) {
  return <>
    <ConfigContext.Provider value={config}>
      <GoogleAnalytics />
      <Component {...pageProps} />
    </ConfigContext.Provider>
  </>
}
