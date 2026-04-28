import { generatePageMeta } from "@/lib/seo";
export const metadata = generatePageMeta({
  title: "Contact Us",
  description:
    "Get in touch with Finlogic Capital. Whether you are an entrepreneur seeking growth capital or an investor looking for private equity opportunities in Nepal, we would love to hear from you.",
  path: "/contact",
  keywords: ["contact Finlogic Capital", "Nepal PE inquiry", "Kathmandu investment contact"],
});
export default function ContactLayout({ children }) { return children; }
