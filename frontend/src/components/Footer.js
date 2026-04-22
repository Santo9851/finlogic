import Link from 'next/link';
import FinlogicLogo from '@/components/FinlogicLogo';

export default function Footer() {
  return (
    <footer className="w-full bg-ls-supporting py-12 text-ls-white lg:py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Brand & Tagline */}
          <div className="space-y-5">
            <FinlogicLogo size={36} variant="full" darkBg={true} />
            <p className="text-lg italic text-ls-white/80">
              "Where Vision Meets Wisdom"
            </p>
          </div>


          {/* Quick Links & Contact */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-ls-compliment">
                Quick Links
              </h3>
              <ul className="space-y-2">
                <li><Link href="/" className="text-sm hover:text-ls-compliment transition-colors">Home</Link></li>
                <li><Link href="/about" className="text-sm hover:text-ls-compliment transition-colors">About Us</Link></li>
                <li><Link href="/investors" className="text-sm hover:text-ls-compliment transition-colors">For Investors</Link></li>
                <li><Link href="/insights" className="text-sm hover:text-ls-compliment transition-colors">Insights</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-ls-compliment">
                Contact Info
              </h3>
              <ul className="space-y-2 text-sm text-ls-white/80">
                <li>contact@finlogiccapital.com</li>
                <li>Kathmandu, Nepal</li>
                <li>+977-9851437351</li>
              </ul>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-ls-compliment">
                Newsletter
              </h3>
              <p className="text-sm text-ls-white/80">
                Subscribe for the latest investment insights and updates.
              </p>
            </div>
            <form className="flex w-full max-w-sm space-x-2">
              <input
                type="email"
                placeholder="Your email address"
                className="w-full rounded-md border border-ls-white/20 bg-ls-primary/30 px-4 py-2 text-sm focus:border-ls-compliment focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-md bg-ls-compliment px-4 py-2 text-sm font-bold text-ls-primary transition-all hover:bg-ls-compliment/90"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mt-16 border-t border-ls-white/10 pt-8 text-center text-xs text-ls-white/40">
          <p>© {new Date().getFullYear()} Finlogic Capital Limited. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
