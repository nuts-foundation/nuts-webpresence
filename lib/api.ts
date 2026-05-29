import { readdir, readFile } from "fs/promises";
import matter from "gray-matter";
import { render } from "./markdown";

const CONTENT_DIR = "./content";
const HOME_DIR = `${CONTENT_DIR}/home`;
const POSTS_DIR = `${CONTENT_DIR}/posts`;

export interface Content {
  meta: { [key: string]: any };
  content: string;
}

async function tryRead(path: string) {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

export async function getContent(name: string): Promise<Content> {
  name = name.toLowerCase();

  const postFile = `${POSTS_DIR}/${name}.md`;
  const postSource = await tryRead(postFile);

  if (postSource) {
    const { data, content } = matter(postSource);
    return {
      meta: data,
      content: await render(content),
    };
  }

  const homeFile = `${HOME_DIR}/${name}.md`;
  const homeSource = await tryRead(homeFile);

  if (homeSource) {
    const { data, content } = matter(homeSource);
    return {
      meta: data,
      content: await render(content),
    };
  }

  throw new Error(`Content not found for: ${name}`);
}

export class Post {
  constructor(
    public name: string,
    public meta: { [key: string]: any },
    public content: string,
  ) {}
}

interface Opts {
  dir?: string;
}

function getDirname(opts?: Opts): string {
  if (opts?.dir) {
    if (!/^[a-zA-Z0-9-_]+$/.test(opts.dir)) {
      throw new Error("invalid posts subdirectory");
    }
    return `${POSTS_DIR}/${opts.dir}`;
  }

  return POSTS_DIR;
}

export async function getPost(name: string, opts?: Opts): Promise<Post> {
  name = name.toLowerCase();

  if (!/^[a-z0-9-_]+$/.test(name)) {
    throw new Error(`invalid post name: ${name}`);
  }

  const source = await readFile(`${getDirname(opts)}/${name}.md`, "utf8");
  const { data, content } = matter(source);
  const output = await render(content);

  return new Post(name, data, output);
}

export async function getPosts(opts?: Opts): Promise<Post[]> {
  const results = await readdir(getDirname(opts));

  const promises = results
    .filter(name => name.endsWith(".md"))
    .map(name => getPost(name.replace(".md", ""), opts));

  return await Promise.all(promises);
}

export type NewsCategory = "algemeen" | "toepassing" | "persbericht" | "overig";

export interface NewsArticle {
  slug: string;
  title: string;
  date: string;
  category: NewsCategory;
  excerpt: string;
  image: string | null;
}

export interface NewsArticleFull extends NewsArticle {
  content: string;
  video: string | null;
}

export async function getNewsArticles(): Promise<NewsArticle[]> {
  const dir = `${POSTS_DIR}/nieuws`;
  const files = await readdir(dir);

  const articles = await Promise.all(
    files
      .filter(f => f.endsWith(".md"))
      .map(async f => {
        const slug = f.replace(".md", "");
        const source = await readFile(`${dir}/${f}`, "utf8");
        const { data } = matter(source);
        return {
          slug,
          title: data.title as string,
          date: data.date as string,
          category: (data.category ?? "overig") as NewsCategory,
          excerpt: data.excerpt as string,
          image: (data.image as string) ?? null,
        };
      })
  );

  return articles.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getNewsArticleFull(slug: string): Promise<NewsArticleFull> {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`invalid news slug: ${slug}`);
  const source = await readFile(`${POSTS_DIR}/nieuws/${slug}.md`, "utf8");
  const { data, content } = matter(source);
  const rendered = await render(content);
  return {
    slug,
    title: data.title as string,
    date: data.date as string,
    category: (data.category ?? "overig") as NewsCategory,
    excerpt: data.excerpt as string,
    image: (data.image as string) ?? null,
    video: (data.video as string) ?? null,
    content: rendered,
  };
}
