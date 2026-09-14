import { GetStaticPaths, GetStaticPropsContext } from "next";
import Layout from "../../components/Layout";

function toYoutubeEmbedId(value: string): string | null {
  // Already just an ID (no slashes or dots)
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") return url.pathname.slice(1);
    return url.searchParams.get("v");
  } catch {
    return null;
  }
}
import { getNewsArticles, getNewsArticleFull, NewsArticleFull, NewsCategory } from "../../lib/api";

const CATEGORY_LABELS: Record<NewsCategory, string> = {
  algemeen: "Algemeen",
  toepassing: "Toepassing",
  persbericht: "Persbericht",
  overig: "Overig",
};


function ShareButtons({ url }: { url: string }) {
  const encoded = encodeURIComponent(url);
  return (
    <div className="flex items-center gap-3 mt-8 pt-8 border-t border-stroke">
      <span className="font-inter text-sm text-text font-medium">Delen:</span>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-stroke text-sm font-inter font-medium text-text hover:border-[#0077B5] hover:text-[#0077B5] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
        LinkedIn
      </a>
    </div>
  );
}

interface Props {
  article: NewsArticleFull;
  siteUrl: string;
}

const MONTHS = ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"];

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

export default function NieuwsArtikel({ article, siteUrl }: Props) {
  const articleUrl = `${siteUrl}/nieuws/${article.slug}`;
  const formattedDate = formatDate(article.date);

  return (
    <Layout>
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8">
          <a
            href="/nieuws"
            className="font-inter text-sm text-text hover:text-brand transition-colors"
          >
            &larr; Terug naar nieuws
          </a>
        </div>

        {/* Categorie + datum */}
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 rounded-full text-xs font-inter font-medium text-text bg-light">
            {CATEGORY_LABELS[article.category]}
          </span>
          <span className="font-inter text-sm text-text/60">{formattedDate}</span>
        </div>

        {/* Titel */}
        <h1 className="font-redhat text-3xl md:text-4xl font-bold text-dark-gray mb-6 leading-snug">
          {article.title}
        </h1>

        {/* Intro / excerpt als lead-tekst */}
        {article.excerpt && (
          <p className="font-inter text-lg text-text leading-relaxed border-l-4 border-brand pl-5 mb-8 text-dark-gray/80">
            {article.excerpt}
          </p>
        )}

        {/* Video embed — frontmatter: video: "https://youtu.be/abc123" of video: "abc123" */}
        {article.video && (() => {
          const embedId = toYoutubeEmbedId(article.video!);
          return embedId ? (
            <div className="mb-8 rounded-xl overflow-hidden aspect-video">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${embedId}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={article.title}
                className="w-full h-full"
              />
            </div>
          ) : null;
        })()}

        {/* Artikel content */}
        <article
          className="prose prose-lg max-w-none font-inter"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        <ShareButtons url={articleUrl} />
      </div>
    </Layout>
  );
}

export const getStaticProps = async ({ params }: GetStaticPropsContext) => {
  const slug = params!.slug as string;
  const article = await getNewsArticleFull(slug);
  return {
    props: {
      article,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://nuts.nl",
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const articles = await getNewsArticles();
  return {
    fallback: false,
    paths: articles.map(a => `/nieuws/${a.slug}`),
  };
};
