import { generatePageMeta } from "@/lib/seo";
export const metadata = generatePageMeta({
  title: "About Us",
  description:
    "Meet the Finlogic Capital team — experienced finance, investment, and technology professionals united by a shared philosophy of vision-backed private equity in Nepal.",
  path: "/about",
  keywords: ["Santosh Poudel", "Finlogic team", "Nepal private equity leadership", "Kathmandu investment firm"],
});
export default function AboutLayout({ children }) { return children; }
