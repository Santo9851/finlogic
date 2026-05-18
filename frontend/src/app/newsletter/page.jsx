import Link from 'next/link';
import NewsletterForm from '@/components/NewsletterForm';
import { 
  Zap, 
  BookOpen, 
  Target, 
  PieChart, 
  Database, 
  HelpCircle, 
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  Infinity
} from 'lucide-react';

export const metadata = {
  title: 'Capital Lines | Bi-weekly Investment Intelligence',
  description: 'Investing Beyond the Obvious in Nepal\'s Capital. Bi-weekly intelligence for founders, investors, and observers.',
};

export default async function NewsletterArchivePage() {
  let issues = [];
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    const res = await fetch(`${apiUrl}/newsletter/api/archive/`, {
      next: { revalidate: 300 }
    });
    if (res.ok) {
      const data = await res.json();
      issues = data.issues || [];
    }
  } catch (error) {
    console.error('Failed to fetch newsletter archive:', error.message);
  }

  const sections = [
    {
      title: "The Signal",
      label: "Editor's note on what is shifting",
      desc: "A first-person read of current conditions — specific, current, opinionated. Sets the urgency for the entire issue.",
      icon: Zap
    },
    {
      title: "The Thesis",
      label: "600–900 words of long-form analysis",
      desc: "Takes a clear position. Argues it with data. The section that earns the subscription. Connected to the Wisdom Hub.",
      icon: BookOpen
    },
    {
      title: "For Founders",
      label: "One actionable thing investors notice",
      desc: "Practical, specific, Nepal-relevant. No theory. What actually separates fundable from unfundable — in plain language.",
      icon: Target
    },
    {
      title: "LP Education",
      label: "One concept demystified",
      desc: "Explained without condescension. Builds LP literacy across the 18-month publication arc until the knowledge gap closes.",
      icon: PieChart
    },
    {
      title: "The Numbers",
      label: "One sourced data point contextualised",
      desc: "Grounds every issue in the real economy. Never just a number — always a number with its meaning clearly stated.",
      icon: Database
    },
    {
      title: "One Question",
      label: "The issue closes open",
      desc: "Invites your reply. Opens dialogue. Signals Finlogic is still thinking, not broadcasting. Reply to any issue directly.",
      icon: HelpCircle
    }
  ];

  const pillars = [
    "Unconventional Vision",
    "Wisdom-Backed Growth",
    "Leadership Activation",
    "Deep Insight",
    "Harmonious Partnerships"
  ];

  const stats = [
    { label: "Bi-Weekly Cadence", value: "Bi", sub: "Weekly", icon: Calendar },
    { label: "6 Sections Per Issue", value: "6", sub: "Sections", icon: Layers },
    { label: "0% Sponsored Content", value: "0%", sub: "Sponsored", icon: ShieldCheck },
    { label: "∞ Free Forever", value: "∞", sub: "Free", icon: Infinity }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground theme-transition">
      <main>
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-ls-primary pt-24 pb-16 text-white sm:pt-32 sm:pb-20 lg:pt-48 lg:pb-32">
          <div className="absolute inset-0 bg-abstract-gradient opacity-10"></div>
          <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 sm:gap-16 lg:grid-cols-2 lg:items-center">
              <div>
                <span className="mb-4 sm:mb-6 inline-block text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-ls-compliment">
                  A Publication by Finlogic Capital
                </span>
                <h1 className="mb-6 sm:mb-8 font-serif text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold leading-[1.15] lg:leading-[1.1]">
                  Investing Beyond the <span className="italic text-ls-compliment">Obvious</span> — in Nepal's Capital
                </h1>
                <p className="mb-8 sm:mb-10 text-base sm:text-lg md:text-xl leading-relaxed text-white/80 lg:text-2xl">
                  Bi-weekly intelligence on Nepal's private equity and investment landscape. For founders preparing for institutional capital, investors building frameworks, and observers tracking South Asia's most underestimated market.
                </p>
                
                <ul className="mb-10 sm:mb-12 space-y-3 sm:space-y-4">
                  {[
                    "Evidence-based analysis of Nepal's investment environment",
                    "Practical founder intelligence: what investors actually look for",
                    "LP education that closes the knowledge gap, issue by issue",
                    "Zero advertising. Zero sponsored content."
                  ].map((item, i) => (
                    <li key={i} className="flex items-start sm:items-center space-x-3 text-xs sm:text-sm text-white/60">
                      <ShieldCheck className="h-4 w-4 text-ls-compliment shrink-0 mt-0.5 sm:mt-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center space-x-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border-2 border-ls-primary bg-card" />
                    ))}
                  </div>
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/40">
                    Join 1,200+ Network Members
                  </span>
                </div>
              </div>

              <div id="subscribe" className="w-full max-w-xl mx-auto lg:max-w-none">
                <NewsletterForm />
              </div>
            </div>
          </div>
        </section>

        {/* STATS BAR */}
        <section className="border-y border-border-theme bg-card/30 py-8 sm:py-12 theme-transition">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4">
              {stats.map((stat, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="mb-2 sm:mb-4 text-ls-compliment">
                    <stat.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="mb-1 font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHAT'S INSIDE */}
        <section className="py-16 sm:py-24 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12 sm:mb-20 max-w-2xl">
              <span className="mb-2 sm:mb-4 inline-block text-[10px] sm:text-xs font-black uppercase tracking-widest text-ls-compliment">Contents</span>
              <h2 className="mb-4 sm:mb-6 font-serif text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold">What's inside <span className="italic">every</span> issue</h2>
              <p className="text-base sm:text-lg md:text-xl text-text-muted leading-relaxed">Six sections. One coherent argument. Delivered in under 20 minutes of reading.</p>
            </div>

            <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
              {sections.map((section, i) => (
                <div key={i} className="group relative rounded-2xl border border-border-theme bg-card p-6 sm:p-10 transition-all hover:border-ls-compliment/30 theme-transition">
                  <div className="mb-6 sm:mb-8 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-ls-primary text-ls-compliment shadow-lg shadow-ls-primary/20">
                    <section.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <h3 className="mb-2 font-serif text-xl sm:text-2xl font-bold text-foreground group-hover:text-ls-compliment transition-colors">{section.title}</h3>
                  <div className="mb-3 sm:mb-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-ls-compliment/70">{section.label}</div>
                  <p className="text-xs sm:text-sm leading-relaxed text-text-muted">{section.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PHILOSOPHY SECTION */}
        <section className="bg-ls-primary py-16 sm:py-24 text-white lg:py-40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="mb-8 sm:mb-12 font-serif text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold leading-snug">Rooted in Finlogic Capital's <span className="text-ls-compliment">Investment Philosophy</span></h2>
              <p className="mb-10 sm:mb-16 text-base sm:text-lg md:text-xl text-white/60">Capital Lines reflects all five pillars of our institutional framework</p>
              
              <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
                {pillars.map((pillar, i) => (
                  <div key={i} className="rounded-full border border-white/10 bg-white/5 px-5 py-3 sm:px-8 sm:py-4 text-xs sm:text-sm font-black uppercase tracking-widest text-ls-compliment transition-all hover:bg-white/10">
                    {pillar}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ARCHIVE LIST */}
        <section className="py-16 sm:py-24 lg:py-40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10 sm:mb-16 flex flex-col space-y-3 md:flex-row md:items-end md:justify-between md:space-y-0">
              <div className="max-w-xl">
                <span className="mb-2 sm:mb-4 inline-block text-[10px] sm:text-xs font-black uppercase tracking-widest text-ls-compliment">Archive</span>
                <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-foreground">Past Dispatches</h2>
              </div>
              <div className="flex items-center space-x-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-text-muted">
                <span>{issues.length} Editions Published</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>

            {issues.length > 0 ? (
              <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
                {issues.map((issue) => (
                  <Link 
                    key={issue.slug} 
                    href={`/newsletter/${issue.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-border-theme bg-card shadow-sm transition-all hover:-translate-y-2 hover:shadow-2xl theme-transition"
                  >
                    <div className="p-6 sm:p-10">
                      <div className="mb-3 sm:mb-4 flex items-center justify-between">
                        <span className="font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-ls-compliment">ISSUE {issue.issue_number}</span>
                        <Sparkles className="h-4 w-4 text-ls-compliment opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <h3 className="mb-3 sm:mb-4 font-serif text-xl sm:text-2xl font-bold leading-tight text-foreground group-hover:text-ls-compliment transition-colors">
                        {issue.title}
                      </h3>
                      <p className="mb-6 sm:mb-8 line-clamp-3 text-xs sm:text-sm leading-relaxed text-text-muted/80">
                        {issue.deck}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-4 sm:pt-6 border-t border-border-theme/30 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-text-muted/50">
                        <span>{new Date(issue.sent_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
                        <span className="group-hover:text-ls-compliment transition-colors">Read Dispatch →</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-16 sm:py-20 text-center border-2 border-dashed border-border-theme rounded-3xl">
                <p className="text-base sm:text-lg text-text-muted font-medium">No dispatches found in the archive.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      
      {/* FINAL CTA */}
      <section className="bg-ls-compliment py-12 sm:py-16 text-ls-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-3 sm:mb-4 font-serif text-2xl sm:text-3xl font-bold">Stay at the frontier of Nepal's investment landscape</h2>
          <p className="mb-6 sm:mb-8 text-xs sm:text-sm font-black uppercase tracking-widest opacity-70">Delivered every other Tuesday at 8am NPT</p>
          <Link href="#subscribe" className="inline-block rounded-md border-2 border-ls-primary px-8 py-3.5 sm:px-10 sm:py-4 text-xs sm:text-sm font-black uppercase tracking-widest transition-all hover:bg-ls-primary hover:text-white">
            Join the Network
          </Link>
        </div>
      </section>
    </div>
  );
}
