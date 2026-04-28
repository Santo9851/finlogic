import { generatePageMeta } from "@/lib/seo";
export const metadata = generatePageMeta({
  title: "Webinars & Masterclasses",
  description:
    "Join Finlogic Capital's live and on-demand webinars — expert-led sessions on private equity deal flow, regulatory frameworks, investment strategy, and sustainable business growth in Nepal and South Asia.",
  path: "/insights/webinars",
  keywords: [
    "PE webinars Nepal", "investment masterclass", "private equity live session",
    "Nepal business webinar", "South Asia finance event",
  ],
});
export default function WebinarsLayout({ children }) { return children; }
