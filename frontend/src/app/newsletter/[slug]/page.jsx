import { notFound } from 'next/navigation';
import Link from 'next/link';

export async function generateStaticParams() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/newsletter/api/archive/`);
    const data = await res.json();
    return (data.issues || []).map((issue) => ({
      slug: issue.slug,
    }));
  } catch (error) {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/newsletter/api/${slug}/`);
    const issue = await res.json();
    return {
      title: `${issue.title} | Capital Lines Issue ${issue.issue_number}`,
      description: issue.deck,
    };
  } catch (error) {
    return { title: 'Issue Not Found' };
  }
}

export default async function NewsletterIssuePage({ params }) {
  const { slug } = await params;
  let issue;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/newsletter/api/${slug}/`, {
      next: { revalidate: 3600 } // Individual issues don't change often
    });
    if (!res.ok) notFound();
    issue = await res.json();
  } catch (error) {
    notFound();
  }

  const parchment = "#f6f2ea";
  const bgDark = "#100226";
  const accent = "#F59F01";
  const textLight = "#e2e8f0";
  const sage = "#eef5f2";
  const parchmentDark = "#ede9e0";

  return (
    <div className="min-h-screen bg-background text-foreground theme-transition">
      <main>
        {/* HERO */}
        <section className="bg-ls-primary py-20 text-white lg:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-abstract-gradient opacity-20"></div>
          <div className="container relative z-10 mx-auto px-4 lg:px-8">
            <div className="max-w-4xl">
              <div className="mb-6 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-ls-compliment">
                ISSUE {issue.issue_number} &bull; {new Date(issue.sent_at).toLocaleDateString('en-GB', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <h1 className="mb-8 font-serif text-4xl font-bold lg:text-6xl leading-tight">
                {issue.title}
              </h1>
              <p className="text-xl text-white/80 lg:text-2xl font-medium italic">
                {issue.deck}
              </p>
            </div>
          </div>
        </section>

        {/* CONTENT SECTIONS */}
        <section className="py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="mx-auto max-w-2xl space-y-20">
              
              {/* SECTION: SIGNAL */}
              <div className="space-y-6">
                <div className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-ls-compliment">01 / The Signal</div>
                <div className="font-serif text-xl leading-relaxed text-foreground whitespace-pre-line">
                  {issue.section_signal}
                </div>
              </div>

              {/* SECTION: THESIS */}
              <div className="space-y-6">
                <div className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-ls-compliment">02 / The Thesis</div>
                <div className="font-serif text-xl leading-relaxed text-foreground whitespace-pre-line">
                  {issue.section_thesis}
                </div>
              </div>

              {/* SECTION: FOUNDERS (Dark) */}
              <div className="rounded-2xl bg-ls-primary p-10 lg:p-16 text-white shadow-2xl border border-border-theme/10">
                <div className="mb-8 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-ls-compliment">03 / Founders Circle</div>
                <div className="font-serif text-xl leading-relaxed text-white/90 whitespace-pre-line">
                  {issue.section_founders}
                </div>
              </div>

              {/* SECTION: LP (Sage) */}
              <div className="rounded-2xl bg-[#eef5f2] dark:bg-emerald-900/10 p-10 lg:p-16 text-[#2d3834] dark:text-emerald-100 border border-[#dce8e3] dark:border-emerald-800/30">
                <div className="mb-8 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#4a6358] dark:text-emerald-500">04 / LP Perspective</div>
                <div className="font-serif text-xl leading-relaxed whitespace-pre-line">
                  {issue.section_lp}
                </div>
              </div>

              {/* SECTION: DATA */}
              <div className="space-y-6">
                <div className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-ls-compliment">05 / The Data</div>
                <div className="font-serif text-xl leading-relaxed text-foreground whitespace-pre-line">
                  {issue.section_data}
                </div>
              </div>

              {/* SECTION: QUESTION (Gold Border) */}
              <div className="rounded-2xl bg-[#ede9e0] dark:bg-ls-compliment/5 p-10 lg:p-16 border-t-8 border-ls-compliment">
                <div className="mb-8 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#5c5851] dark:text-ls-compliment/60">06 / One Question</div>
                <div className="font-serif text-2xl font-bold italic leading-relaxed text-foreground whitespace-pre-line">
                  {issue.section_question}
                </div>
              </div>

              {/* HTML OVERRIDE (if any) */}
              {issue.body_html && (
                <div className="mt-20 pt-20 border-t border-border-theme">
                   <div 
                    dangerouslySetInnerHTML={{ __html: issue.body_html }} 
                    className="prose prose-lg dark:prose-invert max-w-none text-foreground"
                  />
                </div>
              )}

              {/* CTA BOX */}
              <div className="mt-32 rounded-3xl bg-ls-primary p-12 text-center text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-abstract-gradient opacity-10"></div>
                <div className="relative z-10">
                  <h3 className="mb-4 font-serif text-3xl font-bold">Stay Ahead of the Curve</h3>
                  <p className="mb-8 text-white/70">Join 5,000+ founders and investors receiving Nepal's most analytical strategic dispatch.</p>
                  <Link 
                    href="/#subscribe" 
                    className="inline-block rounded-md bg-ls-compliment px-10 py-4 font-bold text-ls-primary transition-all hover:scale-105 active:scale-95 shadow-xl shadow-ls-compliment/20"
                  >
                    Subscribe to Capital Lines
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
