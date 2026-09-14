import { remark } from "remark";
import gfm from "remark-gfm";
import html from "remark-html";

function embedYoutubeLinks(htmlStr: string): string {
  // Alleen embedden als de YouTube-link de enige inhoud van een <p> is (niet inline in een zin)
  return htmlStr.replace(
    /<p>\s*<a\s[^>]*href="https?:\/\/(?:youtu\.be\/|(?:www\.)?youtube\.com\/watch\?(?:[^"]*&)?v=)([a-zA-Z0-9_-]{11})[^"]*"[^>]*>(.*?)<\/a>\s*<\/p>/gi,
    (_, videoId, linkText) =>
      `<div class="my-6 rounded-xl overflow-hidden aspect-video">` +
      `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}" ` +
      `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ` +
      `allowfullscreen title="${linkText}" class="w-full h-full"></iframe></div>`
  );
}

export async function render(source: string): Promise<string> {
  const output = await remark()
    .use(gfm)
    .use(html, { sanitize: false })
    .process(source);
  return embedYoutubeLinks(output.toString());
}
