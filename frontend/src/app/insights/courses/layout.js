import { generatePageMeta } from "@/lib/seo";
export const metadata = generatePageMeta({
  title: "Finlogic Campus — Investment Courses",
  description:
    "Structured, proprietary courses for founders and investors — learn patient capital strategy, institutional due diligence, unconventional market entry, and leadership dynamics from Finlogic Capital.",
  path: "/insights/courses",
  keywords: [
    "investment course Nepal", "PE education", "due diligence training",
    "founder education Nepal", "private equity learning",
  ],
});
export default function CoursesLayout({ children }) { return children; }
