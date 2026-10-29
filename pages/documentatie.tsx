import Head from "next/head";
import { useEffect } from "react";

// /documentatie is verhuisd naar /kennisbank. De site is statisch geëxporteerd,
// dus we sturen door met een meta refresh (en in de browser direct met JavaScript).
const TARGET = "/kennisbank/";

export default function DocumentatieRedirect() {
  useEffect(() => {
    window.location.replace(TARGET + window.location.hash);
  }, []);

  return (
    <>
      <Head>
        <title>Kennisbank - Nuts</title>
        <meta httpEquiv="refresh" content={`0; url=${TARGET}`} />
        <link rel="canonical" href={`https://nuts.nl${TARGET}`} />
        <meta name="robots" content="noindex" />
      </Head>
      <p style={{ padding: "2rem", fontFamily: "Inter, sans-serif" }}>
        Deze pagina is verhuisd naar de <a href={TARGET}>Kennisbank</a>.
      </p>
    </>
  );
}
