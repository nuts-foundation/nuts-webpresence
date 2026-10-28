import { Head, Html, Main, NextScript } from "next/document"

// GitHub Pages can't set response headers, so the policy is sent as a <meta> tag.
// Browsers ignore frame-ancestors, report-uri and sandbox in a <meta> policy.
const contentSecurityPolicy = [
  "default-src 'self'",
  // The hash allows the inline Google Analytics bootstrap script of nextjs-google-analytics.
  // It changes when NEXT_PUBLIC_GA_MEASUREMENT_ID or that library changes.
  "script-src 'self' https://www.googletagmanager.com 'sha256-haybr32kyu60e393E5DNKrhZLuHmDjpZyPY1jFfk5L0='",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
  "frame-src https://www.youtube.com https://open.spotify.com https://app.springcast.fm https://calendar.google.com",
  "form-action 'self' https://nuts.us19.list-manage.com",
  "object-src 'none'",
  "base-uri 'self'",
  "upgrade-insecure-requests",
].join("; ")

export default function Document() {
  return (<Html>
    <Head>
      {/* Not in development: next dev needs eval() for hot reloading */}
      {process.env.NODE_ENV === "production" &&
        <meta httpEquiv="Content-Security-Policy" content={contentSecurityPolicy} />}
      <meta name="referrer" content="strict-origin-when-cross-origin" />
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
