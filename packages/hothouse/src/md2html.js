import remark from "remark";
import github from "remark-github";
import markdown from "remark-parse";
import html from "remark-html";

const pipeline = remark()
  .use(github)
  .use(markdown)
  .use(html);

export default (markdown: string): string =>
  pipeline.processSync(markdown).contents;
