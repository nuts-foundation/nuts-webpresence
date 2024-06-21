import { NextSeo } from "next-seo"
import { GetStaticPaths, GetStaticPathsContext, GetStaticPropsContext, InferGetStaticPropsType } from "next"

import Layout from "../../components/Layout"
import { getPost, getPosts } from "../../lib/api"

interface PostProps extends InferGetStaticPropsType<typeof getStaticProps> {
}

export default function Careers({ post }: PostProps) {
  return (
    <Layout>
      <NextSeo openGraph={{ title: `Nuts - ${post.meta["title"]}` }} />

      <article
        className="prose text-sm md:text-md xl:prose-lg mx-auto my-12 md:my-24"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </Layout>
  )
}

export const getStaticProps = async ({ params }: GetStaticPropsContext) => {
  if (!params) {
    throw new Error("invalid param");
  }

  const post = await getPost(params["slug"] as string, { dir: "careers" });

  return {
    props: {
      post: {
        name: post.name,
        meta: post.meta,
        content: post.content,
      },
    }
  };
}

export const getStaticPaths: GetStaticPaths = async ({ }: GetStaticPathsContext) => {
  const posts = await getPosts({ dir: "careers" });

  return {
    fallback: "blocking",
    paths: posts.map(post => ({
      params: { slug: post.name },
    })),
  };
}
