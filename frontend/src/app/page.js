'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Zap, Target, Users, BookOpen, ShieldCheck } from 'lucide-react';
import { NeuralNetwork, GeometricEnergy, FluidHarmony } from '@/components/HeroVisuals';

const HERO_SLIDES = [
  {
    title: "Investing Beyond the Obvious",
    subtitle: "Combining visionary foresight with timeless wisdom to unlock extraordinary value in unconventional spaces.",
    primaryCTA: "Discover Our Philosophy",
    secondaryCTA: "Meet the Team",
    primaryHref: "/philosophy",
    secondaryHref: "/about",
    accent: "bg-ls-compliment",
    visual: <NeuralNetwork />
  },
  {
    title: "Strategic Leadership Activation",
    subtitle: "We go beyond capital, empowering leaders to orchestrate excellence and drive sustained growth across our portfolio.",
    primaryCTA: "Our Approach",
    secondaryCTA: "Portfolio Companies",
    primaryHref: "/approach",
    secondaryHref: "/portfolio",
    accent: "bg-ls-secondary",
    visual: <GeometricEnergy />
  },
  {
    title: "Harmonious Partnerships",
    subtitle: "Built on a foundation of trust, shared values, and long-term alignment to create enduring success.",
    primaryCTA: "Partner With Us",
    secondaryCTA: "Contact Us",
    primaryHref: "/partner",
    secondaryHref: "/contact",
    accent: "bg-ls-up",
    visual: <FluidHarmony />
  }
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -400]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 40,
        y: (e.clientY / window.innerHeight - 0.5) * 40
      });
    };
    window.addEventListener('mousemove', handleMouseMove);

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 8000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(timer);
    };
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);

  return (
    <div ref={containerRef} className="flex flex-col bg-ls-primary selection:bg-ls-compliment selection:text-ls-primary">
      {/* Hero Slider Section */}
      <section className="relative h-screen min-h-[700px] w-full overflow-hidden bg-ls-primary text-ls-white">
        {/* Abstract Background Elements (Enhanced with Scroll Parallax) */}
        {mounted && (
          <motion.div style={{ y: y1 }} className="absolute inset-0 z-0 pointer-events-none">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
                x: mousePos.x * 0.5,
                y: mousePos.y * 0.5
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full bg-ls-supporting/20 blur-[120px]"
            />
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2],
                x: -mousePos.x,
                y: -mousePos.y
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute -right-20 bottom-0 h-[600px] w-[600px] rounded-full bg-ls-secondary/10 blur-[150px]"
            />
          </motion.div>
        )}

        {/* Floating Depth Particles (Parallax) */}
        {mounted && (
          <motion.div style={{ y: y2 }} className="absolute inset-0 z-1 pointer-events-none opacity-30">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-1 w-1 rounded-full bg-ls-white/20"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.2, 0.5, 0.2]
                }}
                transition={{
                  duration: 5 + Math.random() * 5,
                  repeat: Infinity,
                  delay: Math.random() * 5
                }}
              />
            ))}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 flex items-center"
          >
            <div className="container mx-auto px-4 lg:px-8">
              <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
                {/* Left Side: Content */}
                <div className="relative z-10 space-y-8">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="inline-flex items-center space-x-2 rounded-full border border-ls-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-ls-compliment transition-colors hover:bg-white/10"
                  >
                    <span className={`h-2 w-2 rounded-full ${HERO_SLIDES[currentSlide].accent}`} />
                    <span>Exclusive Private Equity Insights</span>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-6xl font-black leading-[1.1] tracking-tighter md:text-8xl"
                  >
                    {HERO_SLIDES[currentSlide].title.split(' ').map((word, i) => (
                      <span key={i} className="inline-block mr-4 last:mr-0">
                        {word === 'Obvious' || word === 'Activation' || word === 'Partnerships' ? (
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-ls-compliment to-ls-secondary">
                            {word}
                          </span>
                        ) : word}
                      </span>
                    ))}
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="max-w-xl text-xl leading-relaxed text-ls-white/60 md:text-2xl"
                  >
                    {HERO_SLIDES[currentSlide].subtitle}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="flex flex-wrap gap-4 pt-6"
                  >
                    <Link
                      href={HERO_SLIDES[currentSlide].primaryHref}
                      className="group relative flex items-center overflow-hidden rounded-full bg-ls-compliment px-10 py-5 text-lg font-bold text-ls-primary transition-all hover:scale-105"
                    >
                      <span className="relative z-10">{HERO_SLIDES[currentSlide].primaryCTA}</span>
                      <div className="absolute inset-0 z-0 translate-y-full bg-ls-white transition-transform duration-300 group-hover:translate-y-0" />
                    </Link>
                    <Link
                      href={HERO_SLIDES[currentSlide].secondaryHref}
                      className="flex items-center rounded-full border border-ls-white/20 bg-white/5 px-10 py-5 text-lg font-semibold backdrop-blur-md transition-all hover:border-ls-white/40 hover:bg-white/10"
                    >
                      <span>{HERO_SLIDES[currentSlide].secondaryCTA}</span>
                      <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </motion.div>
                </div>

                {/* Right Side: Integrated SVG Visual */}
                <div className="relative hidden aspect-square h-full w-full lg:flex items-center justify-center">
                  <motion.div
                    animate={{
                      x: mousePos.x,
                      y: mousePos.y
                    }}
                    transition={{ type: "spring", stiffness: 50, damping: 20 }}
                    className="h-[80%] w-[80%]"
                  >
                    {HERO_SLIDES[currentSlide].visual}
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Custom Slider Navigation */}
        <div className="absolute bottom-12 left-4 right-4 z-30 flex items-center justify-between container mx-auto px-4 lg:px-8">
          <div className="flex items-center space-x-6">
            <div className="flex space-x-2">
              {HERO_SLIDES.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1 transition-all duration-500 rounded-full ${index === currentSlide ? 'w-12 bg-ls-compliment' : 'w-4 bg-ls-white/20 hover:bg-ls-white/40'
                    }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
            <span className="text-xs font-mono text-ls-white/40">
              0{currentSlide + 1} / 0{HERO_SLIDES.length}
            </span>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={prevSlide}
              className="group flex h-14 w-14 items-center justify-center rounded-full border border-ls-white/10 bg-white/5 text-ls-white/50 transition-all hover:border-ls-compliment hover:text-ls-compliment"
            >
              <ChevronLeft className="h-6 w-6 transition-transform group-hover:-translate-x-1" />
            </button>
            <button
              onClick={nextSlide}
              className="group flex h-14 w-14 items-center justify-center rounded-full border border-ls-white/10 bg-white/5 text-ls-white/50 transition-all hover:border-ls-compliment hover:text-ls-compliment"
            >
              <ChevronRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* The Finlogic Difference Section */}
      <section className="relative bg-ls-white py-24 lg:py-40 overflow-hidden">
        {/* Parallax Background Text */}
        {mounted && (
          <motion.div
            style={{ x: y1 }}
            className="absolute left-0 top-1/2 -translate-y-1/2 whitespace-nowrap text-[20vw] font-black text-ls-primary/[0.02] pointer-events-none"
          >
            VISIONARY GROWTH ORCHESTRATION
          </motion.div>
        )}

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          {mounted && <motion.div style={{ y: y1 }} className="absolute inset-0 -z-10 pointer-events-none" />}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-20 space-y-4 text-center lg:mb-32"
          >
            <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-ls-compliment">The Finlogic Edge</h2>
            <h3 className="text-4xl font-black text-ls-primary md:text-6xl lg:text-7xl">Orchestrating Excellence</h3>
            <p className="mx-auto max-w-2xl text-xl text-ls-supporting/60">
              In a world of noise, we find the melody. Our approach is defined by precision, foresight, and unyielding principles.
            </p>
          </motion.div>

          <div className="grid gap-10 md:grid-cols-3">
            {[
              {
                title: 'Unconventional Vision',
                desc: "Discovering extraordinary value in the gaps between conventional wisdom and future reality.",
                icon: <Zap className="h-8 w-8 text-ls-compliment" />,
                delay: 0.1
              },
              {
                title: 'Wisdom-Backed Growth',
                desc: "Every move is rooted in proven principles, ensuring growth that is as sustainable as it is visionary.",
                icon: <Target className="h-8 w-8 text-ls-compliment" />,
                delay: 0.2
              },
              {
                title: 'Harmonious Partnerships',
                desc: "Fostering an ecosystem where capital, talent, and vision align in perfect symphony.",
                icon: <Users className="h-8 w-8 text-ls-compliment" />,
                delay: 0.3
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: card.delay }}
                className="group relative overflow-hidden rounded-3xl bg-ls-supporting p-10 transition-all hover:-translate-y-4 hover:shadow-3xl lg:p-14"
              >
                <div className="absolute -right-4 -top-4 text-ls-white/5 opacity-10 transition-transform group-hover:scale-150 group-hover:opacity-20">
                  <span className="text-9xl font-black">0{i + 1}</span>
                </div>
                <div className="mb-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-ls-primary/40 backdrop-blur-xl">
                  {card.icon}
                </div>
                <h4 className="mb-5 text-3xl font-bold text-ls-white">{card.title}</h4>
                <p className="text-xl leading-relaxed text-ls-white/60">{card.desc}</p>
                <Link href="/about" className="mt-10 flex items-center space-x-3 text-ls-compliment">
                  <span className="font-bold uppercase tracking-widest">Learn More</span>
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy at a Glance Section */}
      <section className="relative overflow-hidden bg-ls-primary py-24 text-ls-white lg:py-40">
        {/* Parallax Accent Blob */}
        {mounted && (
          <motion.div
            style={{ y: y2 }}
            className="absolute -right-64 top-0 h-[800px] w-[800px] rounded-full bg-ls-compliment/5 blur-[120px]"
          />
        )}

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          {mounted && <motion.div style={{ y: y1 }} className="absolute inset-0 -z-10 pointer-events-none" />}
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-ls-compliment">Foundational Pillars</h2>
              <h3 className="text-4xl font-black leading-tight md:text-6xl lg:text-7xl">The DNA of Our Success</h3>
              <p className="text-xl text-ls-white/60">
                Our philosophy isn't just a statement—it's an operational framework. We activate leadership and insight to build enduring enterprises.
              </p>
              <Link
                href="/philosophy"
                className="group inline-flex h-16 items-center rounded-full bg-ls-white px-10 font-bold text-ls-primary transition-all hover:bg-ls-compliment"
              >
                <span className="uppercase tracking-widest">Explore Our Philosophy</span>
                <BookOpen className="ml-4 h-6 w-6 transition-transform group-hover:rotate-6" />
              </Link>
            </motion.div>

            <div className="grid gap-4">
              {[
                { title: 'Unconventional Vision', icon: <Zap className="h-6 w-6" /> },
                { title: 'Wisdom-Backed Growth', icon: <Target className="h-6 w-6" /> },
                { title: 'Leadership Activation', icon: <ShieldCheck className="h-6 w-6" /> },
                { title: 'Deep Insight', icon: <BookOpen className="h-6 w-6" /> },
                { title: 'Harmonious Partnerships', icon: <Users className="h-6 w-6" /> },
              ].map((pillar, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex items-center justify-between border-b border-ls-white/10 bg-white/0 p-6 transition-all hover:bg-white/5 hover:border-ls-compliment"
                >
                  <div className="flex items-center space-x-6">
                    <div className="text-ls-compliment opacity-50">{pillar.icon}</div>
                    <span className="text-xl font-bold md:text-2xl">{pillar.title}</span>
                  </div>
                  <div className="h-3 w-3 rounded-full bg-ls-compliment shadow-[0_0_15px_var(--color-ls-compliment)]" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Latest Insights Section */}
      <section className="bg-ls-white py-24 lg:py-40">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mb-20 flex flex-col items-end justify-between border-b border-ls-supporting/5 pb-16 md:flex-row md:items-center"
          >
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-ls-compliment">Thought Leadership</h2>
              <h3 className="text-4xl font-black text-ls-primary md:text-6xl">Latest Insights</h3>
            </div>
            <Link
              href="/insights"
              className="group mt-10 inline-flex h-14 items-center rounded-full border-2 border-ls-primary px-10 font-bold transition-all hover:bg-ls-primary hover:text-ls-white md:mt-0"
            >
              <span>View All Thoughts</span>
              <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          <div className="grid gap-12 md:grid-cols-3">
            {[
              {
                title: 'The Future of Deep Tech in Southeast Asia',
                category: 'Market Trends',
                date: 'March 10, 2026',
              },
              {
                title: 'Sustainable Scaling: Lessons from Global Leaders',
                category: 'Leadership',
                date: 'March 05, 2026',
              },
              {
                title: 'Unconventional Asset Classes in a Volatile Economy',
                category: 'Investment Strategy',
                date: 'February 28, 2026',
              },
            ].map((post, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group cursor-pointer space-y-6"
              >
                <div className="relative h-80 overflow-hidden rounded-[2.5rem] bg-ls-supporting/5 transition-all group-hover:shadow-2xl">
                  {/* Abstract Post Image Placeholder */}
                  <div className="absolute inset-0 bg-gradient-to-br from-ls-supporting/20 to-ls-primary/10 transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute left-8 top-8 rounded-full bg-ls-white/90 backdrop-blur-md px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-ls-primary">
                    {post.category}
                  </div>
                </div>
                <div className="space-y-4 px-2">
                  <span className="font-mono text-xs text-ls-supporting/40 tracking-tighter">{post.date}</span>
                  <h4 className="text-2xl font-bold leading-[1.3] text-ls-primary transition-colors group-hover:text-ls-compliment">
                    {post.title}
                  </h4>
                  <div className="h-1 w-12 bg-ls-supporting/10 transition-all group-hover:w-24 group-hover:bg-ls-compliment" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
