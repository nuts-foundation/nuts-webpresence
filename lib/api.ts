import { readdir, readFile } from "fs/promises";
import matter from "gray-matter";

import { render } from "./markdown";

const CONTENT_DIR = "./content";
const POSTS_DIR = `${CONTENT_DIR}/posts`;

export interface Content {
  meta: { [key: string]: any };
  content: string;
}

export async function getContent(base_path: string): Promise<Content> {
  const source = await readFile(`${CONTENT_DIR}/${base_path}.md`, "utf8");
  const { data, content } = matter(source);
  const output = await render(content);

  return {
    meta: data,
    content: output,
  };
}

export class Post {
  constructor(
    public name: string,
    public meta: { [key: string]: any },
    public content: string,
  ) {
  }
}

interface Opts {
  dir: string;
}

function getDirname(opts?: Opts): string {
  if (opts?.dir) {
    if (!/^[a-zA-Z0-9-_]+$/.test(opts.dir)) {
      throw new Error("invalid posts subdirectory");
    }

    return `${POSTS_DIR}/${opts.dir}`
  }

  return POSTS_DIR
}

export async function getPost(name: string, opts?: Opts): Promise<Post> {
  if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
    throw new Error(`invalid post name: ${name}`);
  }

  const source = await readFile(`${getDirname(opts)}/${name}.md`, "utf8");
  const { data, content } = matter(source);
  const output = await render(content);

  return new Post(name, data, output);
}

export async function getPosts(opts?: Opts): Promise<Post[]> {
  const results = await readdir(getDirname(opts));

  let promises: Promise<Post>[] = [];

  results.forEach(name => {
    if (!name.endsWith(".md")) {
      return;
    }

    promises.push(getPost(name.substring(0, name.length - 3), opts));
  })

  return await Promise.all(promises);
}
