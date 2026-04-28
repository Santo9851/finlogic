import { generatePageMeta } from "@/lib/seo";
export const metadata = generatePageMeta({
  title: "Create Account",
  description: "Join Finlogic Capital — register as an entrepreneur or investor to access Nepal's premier private equity platform.",
  path: "/auth/register",
  noIndex: true,
});
export default function RegisterLayout({ children }) { return children; }
