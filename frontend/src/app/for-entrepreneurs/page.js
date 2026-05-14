"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  Send, 
  Search, 
  Handshake, 
  ClipboardCheck,
  Lightbulb,
  Zap,
  TrendingUp,
  Globe,
  Eye,
  UserCheck,
  Target,
  ShieldCheck,
  BookOpen,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";

const benefits = [
  {
    title: "Capital with Wisdom",
    description: "We provide not just funding, but strategic guidance and access to our global network.",
    icon: <Lightbulb className="w-6 h-6" />,
  },
  {
    title: "Patient Partnership",
    description: "We invest for the long term and align our interests with yours.",
    icon: <TrendingUp className="w-6 h-6" />,
  },
  {
    title: "Differentiated Insight",
    description: "Our deep due diligence uncovers hidden potential and helps you avoid pitfalls.",
    icon: <Zap className="w-6 h-6" />,
  },
  {
    title: "Harmonious Collaboration",
    description: "We work alongside you as a trusted partner, not a distant investor.",
    icon: <Handshake className="w-6 h-6" />,
  },
];

const criteria = [
  {
    title: "Unconventional Vision",
    description: "Is your market underserved? Is your approach unique?",
    icon: <Eye className="w-6 h-6" />,
  },
  {
    title: "Wisdom-Backed Growth",
    description: "Is your business model sustainable and scalable?",
    icon: <TrendingUp className="w-6 h-6" />,
  },
  {
    title: "Leadership Activation",
    description: "Do you and your team have the passion and capability to execute?",
    icon: <UserCheck className="w-6 h-6" />,
  },
  {
    title: "Deep Insight",
    description: "Do you understand your metrics and your customers deeply?",
    icon: <Target className="w-6 h-6" />,
  },
  {
    title: "Harmonious Partnerships",
    description: "Are you open to collaboration and aligned values?",
    icon: <ShieldCheck className="w-6 h-6" />,
  },
];

const steps = [
  {
    id: "01",
    title: "Submit Proposal",
    description: "Complete our institutional validator form. You'll receive a preliminary scoring based on our proprietary framework.",
    icon: <Send className="w-6 h-6" />,
  },
  {
    id: "02",
    title: "Strategic Screening",
    description: "Our evaluation engine analyzes your submission across financial, commercial, and operational dimensions.",
    icon: <ClipboardCheck className="w-6 h-6" />,
  },
  {
    id: "03",
    title: "Investment Committee",
    description: "Shortlisted ventures undergo deep-dive valuation and formal investment memo preparation by our IC.",
    icon: <Search className="w-6 h-6" />,
  },
  {
    id: "04",
    title: "Structuring & LOI",
    description: "We present a formal Letter of Intent (LOI) and negotiate deal structures that ensure long-term alignment.",
    icon: <Handshake className="w-6 h-6" />,
  },
  {
    id: "05",
    title: "Activation",
    description: "Capital is deployed, and we begin the journey of scaling your vision through our strategic ecosystem.",
    icon: <Zap className="w-6 h-6" />,
  },
];

const faqs = [
  {
    question: "What types of businesses do you invest in?",
    answer: "We focus on emerging markets, disruptive technologies, and sectors overlooked by mainstream capital. We are sector-agnostic but look for strong alignment with our five pillars.",
  },
  {
    question: "What is the typical investment size?",
    answer: "Our investments range from $500,000 to $5 million, with flexibility for co-investment opportunities.",
  },
  {
    question: "Do you take board seats?",
    answer: "We typically take a board observer seat or a non-executive director position, depending on the level of involvement needed.",
  },
  {
    question: "How long does the process take?",
    answer: "From submission to final decision, the process typically takes 4–8 weeks.",
  },
  {
    question: "What do you look for in a founder?",
    answer: "We look for passion, resilience, clarity of vision, and a willingness to partner.",
  },
];

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border-theme last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-10 flex items-center justify-between text-left group"
      >
        <span className="text-xl font-serif font-light group-hover:text-ls-compliment transition-colors">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="text-ls-compliment"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-10 text-lg text-text-muted leading-relaxed font-light">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function EntrepreneursPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="bg-background text-foreground min-h-screen theme-transition font-sans">
      {/* Hero Section */}
      <section className="relative pt-40 pb-32 overflow-hidden bg-ls-primary text-ls-white">
        <div className="absolute inset-0 z-0 opacity-40 grayscale mix-blend-luminosity">
          <img src="/images/redesign/vision.png" className="w-full h-full object-cover" alt="Entrepreneurs Hero" />
          <div className="absolute inset-0 bg-ls-primary/80" />
        </div>
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl space-y-10"
          >
            <span className="text-sm font-bold uppercase tracking-[0.4em] text-ls-compliment">For Visionary Founders</span>
            <h1 className="text-6xl md:text-8xl font-serif font-light leading-tight">Empowering <br /> Entrepreneurial <br /> Excellence</h1>
            <p className="text-xl text-ls-white/70 max-w-2xl leading-relaxed md:text-2xl font-light">
              We provide institutional capital and strategic wisdom to founders building the unconventional leaders of tomorrow.
            </p>
            <div className="pt-8 flex flex-col sm:flex-row gap-6">
              <Link 
                href="/validate"
                className="inline-flex items-center justify-center rounded-none bg-ls-compliment px-12 py-6 text-xs font-bold text-ls-primary uppercase tracking-[0.3em] hover:bg-ls-white transition-all"
              >
                Launch Validator
              </Link>
              <div className="flex items-center text-ls-white/40 text-[10px] uppercase tracking-[0.2em]">
                By Invitation Only Protocol
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Apply Section */}
      <section className="py-32 lg:py-48">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-24 space-y-6">
            <span className="text-sm font-bold uppercase tracking-[0.4em] text-ls-compliment">The Value Proposition</span>
            <h2 className="text-5xl font-serif font-light">Why Finlogic?</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border-theme">
            {benefits.map((benefit, i) => (
              <div key={i} className="bg-background p-12 transition-all hover:bg-ls-primary hover:text-ls-white group">
                <div className="mb-10 text-ls-compliment opacity-60 group-hover:opacity-100 transition-opacity">
                  {benefit.icon}
                </div>
                <h3 className="text-2xl font-serif font-light mb-6">{benefit.title}</h3>
                <p className="text-text-muted group-hover:text-ls-white/60 transition-colors leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Criteria Grid */}
      <section className="py-32 bg-ls-primary text-ls-white">
        <div className="container mx-auto px-4 lg:px-8">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
              <div className="lg:col-span-4 space-y-8">
                <span className="text-sm font-bold uppercase tracking-[0.4em] text-ls-compliment">Screening Protocol</span>
                <h2 className="text-5xl font-serif font-light leading-tight">Our Evaluation <br /> Framework</h2>
                <p className="text-lg text-ls-white/60 leading-relaxed font-light">
                  Every submission is rigorously analyzed through our five core pillars to ensure long-term alignment and visionary potential.
                </p>
              </div>
              <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
                {criteria.map((c, i) => (
                  <div key={i} className="border border-ls-white/10 p-10 hover:border-ls-compliment transition-colors group">
                    <div className="flex items-center space-x-6 mb-6">
                       <div className="text-ls-compliment">{c.icon}</div>
                       <h3 className="text-xl font-serif font-light">{c.title}</h3>
                    </div>
                    <p className="text-ls-white/50 text-sm leading-relaxed">{c.description}</p>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </section>

      {/* How It Works - Editorial Timeline */}
      <section className="py-32 lg:py-48">
        <div className="container mx-auto px-4 lg:px-8">
           <div className="mb-32 text-center space-y-6">
              <span className="text-sm font-bold uppercase tracking-[0.4em] text-ls-compliment">The Journey</span>
              <h2 className="text-5xl md:text-7xl font-serif font-light">Activation Process</h2>
           </div>

           <div className="space-y-32">
              {steps.map((step, index) => (
                <motion.div 
                  key={step.id} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start"
                >
                  <div className="lg:col-span-2 flex items-baseline space-x-4">
                    <span className="text-sm font-bold text-ls-compliment tracking-widest">{step.id}</span>
                    <div className="h-px w-full bg-border-theme" />
                  </div>
                  <div className="lg:col-span-4">
                    <h3 className="text-3xl font-serif font-light">{step.title}</h3>
                  </div>
                  <div className="lg:col-span-6">
                    <p className="text-xl text-text-muted leading-relaxed font-light">{step.description}</p>
                  </div>
                </motion.div>
              ))}
           </div>
        </div>
      </section>

      {/* Wisdom Hub CTA */}
      <section className="py-32 bg-ls-supporting/5">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="bg-ls-primary p-16 md:p-24 relative overflow-hidden text-ls-white">
             <div className="absolute inset-0 z-0 opacity-20 grayscale mix-blend-luminosity">
                <img src="/images/redesign/insight.png" className="w-full h-full object-cover" alt="Wisdom Hub CTA" />
             </div>
             <div className="relative z-10 max-w-3xl space-y-10">
                <span className="text-sm font-bold uppercase tracking-[0.4em] text-ls-compliment">Knowledge Ecosystem</span>
                <h2 className="text-4xl md:text-6xl font-serif font-light leading-tight">Refine Your Vision in <br /> the Wisdom Hub</h2>
                <p className="text-xl text-ls-white/70 font-light leading-relaxed">
                  Prepare a compelling institutional submission with our free resources. Learn how to articulate your growth strategy according to global private equity standards.
                </p>
                <Link href="/insights" className="inline-flex items-center space-x-4 text-ls-compliment font-bold uppercase tracking-widest text-sm group">
                  <span>Explore Insights</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
                </Link>
             </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 lg:py-48">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <div className="mb-20 text-center space-y-6">
            <span className="text-sm font-bold uppercase tracking-[0.4em] text-ls-compliment">Inquiry Clearing</span>
            <h2 className="text-5xl font-serif font-light">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <FAQItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 border-t border-border-theme text-center">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-2xl mx-auto space-y-12">
            <h2 className="text-5xl font-serif font-light leading-tight">Ready to Activate <br /> Your Vision?</h2>
            <p className="text-lg text-text-muted font-light leading-relaxed">
              Begin your journey by submitting your vision through our institutional validation framework.
            </p>
            <Link 
              href="/validate"
              className="inline-block border border-ls-primary px-16 py-8 text-xs font-bold uppercase tracking-[0.4em] hover:bg-ls-primary hover:text-ls-white transition-all"
            >
              Start Validator
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
