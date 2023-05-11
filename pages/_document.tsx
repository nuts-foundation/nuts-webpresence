import { Head, Html, Main, NextScript } from "next/document"

export default function Document() {
  return (<Html>
    <Head>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400&family=Red+Hat+Display:wght@300;700&display=swap"
        rel="stylesheet" />
      <link rel="alternate" type="application/rss+xml" title="Going Nuts Podcast" href="https://nuts.nl/going-nuts.xml" />
    </Head>
    <body>
      <Main />
      <NextScript />
    </body>
  </Html>);
}
