import { GetStaticPaths, GetStaticPropsContext } from "next";
import Layout from "../../components/Layout";
import { getToepassingArticles, getToepassingFull, ToepassingArticleFull } from "../../lib/api";

interface Props {
  toepassing: ToepassingArticleFull;
}

export default function ToepassingDetail({ toepassing }: Props) {
  return (
    <Layout>
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8">
          <a
            href="/toepassingen"
            className="font-inter text-sm text-text hover:text-brand transition-colors"
          >
            &larr; Terug naar toepassingen
          </a>
        </div>

        <h1 className="font-redhat text-3xl md:text-4xl font-bold text-dark-gray mb-6 leading-snug">
          {toepassing.title}
        </h1>

        {toepassing.excerpt && (
          <p className="font-inter text-lg text-text leading-relaxed border-l-4 border-brand pl-5 mb-8 text-dark-gray/80">
            {toepassing.excerpt}
          </p>
        )}

        <article
          className="prose prose-lg max-w-none font-inter"
          dangerouslySetInnerHTML={{ __html: toepassing.content }}
        />
      </div>
    </Layout>
  );
}

export const getStaticProps = async ({ params }: GetStaticPropsContext) => {
  const slug = params!.slug as string;
  const toepassing = await getToepassingFull(slug);
  return { props: { toepassing } };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const articles = await getToepassingArticles();
  return {
    fallback: false,
    paths: articles.map(a => `/toepassingen/${a.slug}`),
  };
};
