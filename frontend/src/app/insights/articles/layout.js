import { generatePageMeta } from "@/lib/seo";
export const metadata = generatePageMeta({
  title: "Articles & Research",
  description:
    "Explore Finlogic Capital's market research, white papers, and investment essays — covering private equity in Nepal, South Asia's emerging markets, and sustainable scaling strategies.",
  path: "/insights/articles",
  keywords: [
    "private equity articles Nepal", "South Asia market research", "PE white papers",
    "Nepal investment analysis", "emerging market essays",
  ],
  type: "website",
});
export default function ArticlesLayout({ children }) { return children; }
