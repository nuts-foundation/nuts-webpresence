import { remark } from "remark";
import gfm from "remark-gfm";
import html from "remark-html";

export async function render(source: string): Promise<string> {
  const output = await remark()
    .use(gfm)
    .use(html, { sanitize: false })
    .process(source);
  return output.toString();
}
