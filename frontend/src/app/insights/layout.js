import { generatePageMeta } from "@/lib/seo";
export const metadata = generatePageMeta({
  title: "The Wisdom Hub — Insights, Courses & Webinars",
  description:
    "Finlogic Capital's Knowledge Center — proprietary market research, investment frameworks, structured learning courses, and exclusive webinars on private equity in Nepal and South Asia.",
  path: "/insights",
  keywords: [
    "Nepal PE insights", "private equity research Nepal", "investment analysis South Asia",
    "VC courses Nepal", "fintech webinars", "emerging market analysis",
  ],
});
export default function InsightsLayout({ children }) { return children; }
