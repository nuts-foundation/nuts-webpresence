import { NextSeo } from "next-seo"
import { GetStaticPaths, GetStaticPathsContext, GetStaticPropsContext, InferGetStaticPropsType } from "next"

import Layout from "../components/Layout"
import LinkedInStream from "../components/LinkedInStream"
import { getPost, getPosts } from "../lib/api"

interface PostProps extends InferGetStaticPropsType<typeof getStaticProps> {
}

export default function Post({ post }: PostProps) {
  return (
    <Layout>
      <NextSeo openGraph={{ title: `Nuts - ${post.meta["title"]}` }} />
      {post.name === "nieuws" && <LinkedInStream />}

      <div className="px-4">
        <article
          className="prose xl:prose-md xl:max-w-3xl mx-auto my-12 md:my-24"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>
    </Layout>
  )
}

export const getStaticProps = async ({ params }: GetStaticPropsContext) => {
  if (!params) {
    throw new Error("invalid param");
  }

  const post = await getPost(params["name"] as string);

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
  const posts = await getPosts();

  return {
    fallback: "blocking",
    paths: posts.map(post => `/${post.name}`),
  };
}
