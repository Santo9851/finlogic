import { generatePageMeta } from "@/lib/seo";
export const metadata = generatePageMeta({
  title: "Login",
  description: "Sign in to your Finlogic Capital account to access your investor or entrepreneur dashboard.",
  path: "/auth/login",
  noIndex: true,
});
export default function LoginLayout({ children }) { return children; }
