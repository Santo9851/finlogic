import { generatePageMeta } from "@/lib/seo";
export const metadata = generatePageMeta({
  title: "Our Philosophy",
  description:
    "Explore Finlogic Capital's investment philosophy — five foundational pillars: Unconventional Vision, Wisdom-Backed Growth, Leadership Activation, Deep Insight, and Harmonious Partnerships.",
  path: "/philosophy",
  keywords: ["investment philosophy", "private equity principles Nepal", "patient capital", "vision wisdom leadership"],
});
export default function PhilosophyLayout({ children }) { return children; }
