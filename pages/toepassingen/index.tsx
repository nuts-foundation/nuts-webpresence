import Head from "next/head";
import { getContent, getToepassingArticles } from "../../lib/api";
import Layout from "../../components/Layout";
import CategoryNuts from "../../components/CategoryNuts";
import PaginaKop, { PaginaInhoud } from "../../components/PaginaKop";

export default function ToepassingenPage({ toepassingen, availableSlugs }: any) {
  const titel = toepassingen.content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "") ?? "Toepassingen op Nuts";
  const intro = toepassingen.content.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, "");

  return (
    <Layout>
      <Head>
        <title>{`Nuts - ${titel}`}</title>
        {toepassingen.meta.description && <meta name="description" content={toepassingen.meta.description} />}
      </Head>
      <PaginaKop
        terug={{ href: "/", label: "Terug naar home" }}
        eyebrow={{ icon: "toepassingen", label: "Meedoen" }}
        titel={titel}
        introHtml={intro}
        primair={{ href: "#alle-toepassingen", label: "Bekijk alle toepassingen ↓" }}
        secundair={{ href: "/starten", label: "Starten met Nuts" }}
        beeld={{ src: "/collaboration.png", alt: "Illustratie van samenwerking: zorgverleners in blauw en groen, verbonden via Nuts in het midden." }}
      />
      <PaginaInhoud className="pb-14 pt-12 md:pb-24 md:pt-20">
        <CategoryNuts availableSlugs={availableSlugs} />
      </PaginaInhoud>
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
