import { getContent, getToepassingArticles } from "../../lib/api";
import Markdown from "../../components/Markdown";
import Layout from "../../components/Layout";
import CategoryNuts from "../../components/CategoryNuts";

export default function ToepassingenPage({ toepassingen, availableSlugs }: any) {
  return (
    <Layout>
      <div className="container mx-auto max-w-5xl px-4 py-16">
        <Markdown html={toepassingen.content} className="prose max-w-none" />
        <CategoryNuts availableSlugs={availableSlugs} />
      </div>
    </Layout>
  );
}

export async function getStaticProps() {
  const articles = await getToepassingArticles();
  const availableSlugs = articles.map(a => a.slug);
  return {
    props: {
      toepassingen: await getContent("toepassingen"),
      availableSlugs,
    },
  };
}
