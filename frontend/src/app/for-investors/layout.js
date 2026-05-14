import { generatePageMeta } from "@/lib/seo";
export const metadata = generatePageMeta({
  title: "For Investors — LP & GP Opportunities",
  description:
    "Explore investment opportunities with Finlogic Capital. Institutional-grade private equity in Nepal's fastest-growing sectors — technology, agritech, clean energy, and infrastructure.",
  path: "/investors",
  keywords: ["LP investor Nepal", "GP investor", "private equity fund Nepal", "accredited investor", "South Asia PE"],
});
export default function InvestorsLayout({ children }) { return children; }
