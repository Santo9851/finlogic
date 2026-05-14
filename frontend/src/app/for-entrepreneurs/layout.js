import { generatePageMeta } from "@/lib/seo";
export const metadata = generatePageMeta({
  title: "For Entrepreneurs — Submit Your Venture",
  description:
    "Building something exceptional in Nepal? Submit your venture to Finlogic Capital for institutional-grade evaluation, mentorship, and patient capital from Nepal's premier private equity firm.",
  path: "/entrepreneurs",
  keywords: ["submit startup Nepal", "entrepreneur funding Nepal", "venture capital application", "Nepal founder", "PE application"],
});
export default function EntrepreneursLayout({ children }) { return children; }
