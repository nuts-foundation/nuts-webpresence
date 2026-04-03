import React from "react";
import { getContent } from "../lib/api";
import Markdown from "../components/Markdown";
import Layout from "../components/Layout";
import VerticalStepper from "../components/VerticalStepper";

export default function StartenPage({ starten }: any) {
  return (
    <Layout>
      <div className="container mx-auto py-16 max-w-[960px]">
        <Markdown html={starten.content} className="prose max-w-none" />
        <VerticalStepper />
      </div>
    </Layout>
  );
}

export async function getStaticProps() {
  return {
    props: {
      starten: await getContent("posts/starten"),
    },
  };
}
