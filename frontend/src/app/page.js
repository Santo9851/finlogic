'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Zap, Target, Users, BookOpen, ShieldCheck } from 'lucide-react';
import { fetchArticles, normaliseList, PILLAR_LABELS } from '@/services/insights';

const HERO_SLIDES = [
  {
    title: "Investing Beyond the Obvious",
    subtitle: "Combining visionary foresight with timeless wisdom to unlock extraordinary value in unconventional spaces.",
    primaryCTA: "Discover Our Philosophy",
    secondaryCTA: "Meet the Team",
    primaryHref: "/philosophy",
    secondaryHref: "/about",
    image: "/images/redesign/vision.png",
    accent: "text-ls-compliment"
  },
  {
    title: "Strategic Leadership Activation",
    subtitle: "We go beyond capital, empowering leaders to orchestrate excellence and drive sustained growth.",
    primaryCTA: "Our Approach",
    secondaryCTA: "Our Story",
    primaryHref: "/philosophy",
    secondaryHref: "/about",
    image: "/images/redesign/leadership.png",
    accent: "text-ls-secondary"
  },
  {
    title: "Harmonious Partnerships",
    subtitle: "Built on a foundation of trust, shared values, and long-term alignment to create enduring success.",
    primaryCTA: "Partner With Us",
    secondaryCTA: "Contact Us",
    primaryHref: "/for-investors",
    secondaryHref: "/contact",
    image: "/images/redesign/harmony.png",
    accent: "text-ls-compliment"
  }
];

const FadeInView = ({ children, delay = 0, y = 20 }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

export default function RedesignPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [latestInsights, setLatestInsights] = useState([]);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);

  useEffect(() => {
    setMounted(true);

    async function loadInsights() {
      try {
        const data = await fetchArticles({ ordering: '-published_at' });
        const list = normaliseList(data);
        setLatestInsights(list.slice(0, 3));
      } catch (err) {
        console.error("Failed to load insights:", err);
      } finally {
        setLoadingInsights(false);
      }
    }
    loadInsights();

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 8000);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);

  return (
    <div ref={containerRef} className="flex flex-col bg-background text-foreground selection:bg-ls-compliment selection:text-ls-primary theme-transition font-sans">
      {/* Editorial Hero Section */}
      <section className="relative h-screen min-h-[700px] w-full overflow-hidden bg-ls-primary text-ls-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
              <img 
                src={HERO_SLIDES[currentSlide].image} 
                alt="Hero" 
                className="h-full w-full object-cover opacity-40 mix-blend-luminosity grayscale"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-ls-primary via-ls-primary/80 to-transparent" />
            </div>

            <div className="container relative z-10 mx-auto flex h-full items-center px-4 lg:px-8">
              <div className="max-w-4xl space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="inline-flex items-center space-x-3 text-sm font-bold uppercase tracking-[0.3em] text-ls-compliment"
                >
                  <span className="h-[1px] w-8 bg-ls-compliment" />
                  <span>Finlogic Capital Redefined</span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-6xl font-light leading-[1.05] tracking-tight md:text-8xl lg:text-9xl font-serif"
                >
                  {HERO_SLIDES[currentSlide].title}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="max-w-2xl text-xl leading-relaxed text-ls-white/70 md:text-2xl"
                >
                  {HERO_SLIDES[currentSlide].subtitle}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  className="flex flex-wrap gap-6 pt-8"
                >
                  <Link
                    href={HERO_SLIDES[currentSlide].primaryHref}
                    className="group relative flex items-center overflow-hidden border border-ls-compliment bg-ls-compliment px-10 py-5 text-lg font-bold text-ls-primary transition-all hover:bg-transparent hover:text-ls-compliment"
                  >
                    <span className="relative z-10">{HERO_SLIDES[currentSlide].primaryCTA}</span>
                  </Link>
                  <Link
                    href={HERO_SLIDES[currentSlide].secondaryHref}
                    className="group flex items-center border border-ls-white/20 px-10 py-5 text-lg font-bold transition-all hover:border-ls-white hover:bg-ls-white hover:text-ls-primary"
                  >
                    <span>{HERO_SLIDES[currentSlide].secondaryCTA}</span>
                    <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Minimalist Slider Nav */}
        <div className="absolute bottom-12 left-0 right-0 z-20">
          <div className="container mx-auto flex items-center justify-between px-4 lg:px-8">
            <div className="flex items-center space-x-12">
              <div className="flex space-x-4">
                {HERO_SLIDES.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className="group relative h-12 w-8"
                    aria-label={`Go to slide ${index + 1}`}
                  >
                    <div className={`absolute bottom-0 h-1 w-full transition-all duration-500 ${index === currentSlide ? 'bg-ls-compliment' : 'bg-ls-white/20 group-hover:bg-ls-white/40'}`} />
                    <span className={`absolute top-0 text-xs font-bold transition-opacity ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>0{index + 1}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button onClick={prevSlide} className="border border-ls-white/20 p-4 transition-all hover:bg-ls-white hover:text-ls-primary">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button onClick={nextSlide} className="border border-ls-white/20 p-4 transition-all hover:bg-ls-white hover:text-ls-primary">
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* The Finlogic Edge - Editorial Style */}
      <section className="bg-background py-24 lg:py-40 theme-transition">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 gap-20 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="sticky top-32 space-y-8">
                <FadeInView>
                  <h2 className="text-sm font-bold uppercase tracking-[0.4em] text-ls-compliment">The Finlogic Edge</h2>
                </FadeInView>
                <FadeInView delay={0.2}>
                  <h3 className="text-5xl font-light leading-tight md:text-7xl font-serif">Orchestrating Excellence in Nepal's Growth</h3>
                </FadeInView>
                <FadeInView delay={0.4}>
                  <p className="text-xl leading-relaxed text-text-muted">
                    We combine deep local insight with global investment standards to unlock value where others see only complexity.
                  </p>
                </FadeInView>
                <FadeInView delay={0.6}>
                  <div className="pt-8">
                    <Link href="/about" className="group inline-flex items-center space-x-4 text-ls-primary font-bold">
                      <span className="border-b-2 border-ls-compliment pb-1 uppercase tracking-widest">Our Story</span>
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
                    </Link>
                  </div>
                </FadeInView>
              </div>
            </div>
            
            <div className="lg:col-span-7 space-y-24">
              {[
                {
                  title: 'Unconventional Vision',
                  desc: "We look beyond the obvious metrics to identify structural shifts and emerging champions in Nepal's high-potential sectors.",
                  num: '01'
                },
                {
                  title: 'Wisdom-Backed Growth',
                  desc: "Our investment decisions are rooted in proven principles, ensuring that growth is sustainable, ethical, and resilient.",
                  num: '02'
                },
                {
                  title: 'Harmonious Partnerships',
                  desc: "We build ecosystems where capital, leadership, and community interests align to create shared prosperity.",
                  num: '03'
                }
              ].map((item, i) => (
                <FadeInView key={i} delay={i * 0.2}>
                  <div className="group border-b border-border-theme pb-16 transition-all duration-700 hover:border-ls-compliment hover:pl-4">
                    <span className="mb-8 block text-sm font-bold text-ls-compliment/40 group-hover:text-ls-compliment transition-colors">{item.num}</span>
                    <h4 className="mb-6 text-3xl font-light md:text-4xl font-serif group-hover:text-ls-compliment transition-colors">{item.title}</h4>
                    <p className="text-xl text-text-muted leading-relaxed max-w-xl group-hover:text-foreground transition-colors">{item.desc}</p>
                  </div>
                </FadeInView>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Foundational Pillars - Modern Grid */}
      <section className="bg-ls-primary py-24 text-ls-white lg:py-40">
        <div className="container mx-auto px-4 lg:px-8">
          <FadeInView>
            <div className="mb-24 text-center">
              <h2 className="mb-6 text-sm font-bold uppercase tracking-[0.4em] text-ls-compliment">Foundational Pillars</h2>
              <h3 className="text-5xl font-light font-serif md:text-7xl">The DNA of Our Strategy</h3>
            </div>
          </FadeInView>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-ls-white/10">
            {[
              { title: 'Visionary Foresight', icon: <Zap /> },
              { title: 'Strategic Activation', icon: <Target /> },
              { title: 'Ethical Governance', icon: <ShieldCheck /> },
              { title: 'Deep Sector Insight', icon: <BookOpen /> },
              { title: 'Global Alignment', icon: <Users /> },
              { title: 'Resilient Returns', icon: <ArrowRight /> },
            ].map((pillar, i) => (
              <FadeInView key={i} delay={i * 0.1}>
                <div className="bg-ls-primary p-12 h-full transition-all duration-700 hover:bg-ls-supporting/20 group relative overflow-hidden">
                  <div className="mb-8 text-ls-compliment opacity-60 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-110 group-hover:-translate-y-1">
                    {pillar.icon}
                  </div>
                  <h4 className="text-2xl font-light font-serif md:text-3xl group-hover:text-ls-compliment transition-colors">{pillar.title}</h4>
                  <p className="mt-4 text-ls-white/40 group-hover:text-ls-white/60 transition-colors">
                    Integrating long-term vision with operational excellence to drive superior outcomes.
                  </p>
                  <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-ls-compliment transition-all duration-700 group-hover:w-full" />
                </div>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Insights - Editorial Feed */}
      <section className="bg-background py-24 lg:py-40 theme-transition">
        <div className="container mx-auto px-4 lg:px-8">
          <FadeInView>
            <div className="mb-20 flex flex-col items-end justify-between md:flex-row md:items-center border-b border-border-theme pb-12">
              <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-[0.4em] text-ls-compliment">Thought Leadership</h2>
                <h3 className="text-5xl font-light font-serif md:text-7xl">Latest Insights</h3>
              </div>
              <Link
                href="/insights"
                className="group mt-10 inline-flex items-center space-x-3 font-bold md:mt-0"
              >
                <span className="uppercase tracking-widest border-b-2 border-ls-compliment pb-1">All Perspectives</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </FadeInView>

          <div className="grid gap-16 md:grid-cols-3">
            {loadingInsights ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse space-y-8">
                  <div className="aspect-[4/5] bg-border-theme" />
                  <div className="space-y-4">
                    <div className="h-4 w-24 bg-border-theme" />
                    <div className="h-8 w-full bg-border-theme" />
                  </div>
                </div>
              ))
            ) : latestInsights.length > 0 ? (
              latestInsights.map((post, i) => (
                <FadeInView key={post.id || i} delay={i * 0.2}>
                  <Link href={`/insights/articles/${post.slug}`} className="group">
                    <div className="space-y-8">
                      <div className="relative aspect-[4/5] overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-1000">
                        {post.featured_image ? (
                          <img 
                            src={post.featured_image} 
                            alt={post.title} 
                            className="h-full w-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" 
                          />
                        ) : (
                          <div className="h-full w-full bg-ls-supporting/10" />
                        )}
                        <div className="absolute top-0 right-0 bg-ls-primary px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-ls-white transform translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-700">
                          {PILLAR_LABELS[post.pillar?.toLowerCase()] || post.pillar || 'Insight'}
                        </div>
                        <div className="absolute inset-0 border-[0px] border-ls-compliment/0 group-hover:border-[1px] group-hover:border-ls-compliment/20 transition-all duration-700" />
                      </div>
                      <div className="space-y-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-text-muted group-hover:text-ls-compliment transition-colors">
                          {post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''}
                        </span>
                        <h4 className="text-2xl font-light font-serif leading-tight group-hover:text-ls-compliment transition-colors">
                          {post.title}
                        </h4>
                      </div>
                    </div>
                  </Link>
                </FadeInView>
              ))
            ) : (
              <p className="text-text-muted col-span-3 text-center py-10">No insights published yet.</p>
            )}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-ls-primary py-24 text-center lg:py-40">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto space-y-12"
          >
            <h2 className="text-5xl font-light font-serif md:text-8xl text-ls-white">Partner with Vision. Grow with Wisdom.</h2>
            <div className="flex flex-wrap justify-center gap-8 pt-8">
              <Link
                href="/for-investors"
                className="group relative bg-ls-compliment px-12 py-6 text-xl font-bold text-ls-primary hover:bg-ls-white transition-all overflow-hidden"
              >
                <span className="relative z-10">For Investors</span>
                <div className="absolute inset-0 bg-ls-white transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              </Link>
              <Link
                href="/for-entrepreneurs"
                className="group relative border border-ls-white/20 px-12 py-6 text-xl font-bold text-ls-white hover:border-ls-white transition-all overflow-hidden"
              >
                <span className="relative z-10">For Entrepreneurs</span>
                <div className="absolute inset-0 bg-ls-white transform -translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <span className="absolute inset-0 flex items-center justify-center text-ls-primary transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 z-20">For Entrepreneurs</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
