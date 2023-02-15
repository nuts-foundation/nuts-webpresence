import { remark } from "remark";
import html from "remark-html";

export async function render(source: string): Promise<string> {
  const output = await remark()
    .use(html, { sanitize: false })
    .process(source);
  return output.toString();
}
