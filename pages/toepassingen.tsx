import { getContent } from "../lib/api";
import Markdown from "../components/Markdown";
import Layout from "../components/Layout";
import CategoryNuts from "../components/CategoryNuts";

export default function ToepassingenPage({ toepassingen }: any) {
  return (
    <Layout>
      <div className="container mx-auto max-w-5xl px-4 py-16">
        <Markdown html={toepassingen.content} className="prose max-w-none" />
        <CategoryNuts />
      </div>
    </Layout>
  );
}

export async function getStaticProps() {
  return {
    props: {
      toepassingen: await getContent("toepassingen"),
    },
  };
}
