"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  Send, 
  Search, 
  Video, 
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
  BookOpen
} from "lucide-react";
import Link from "next/link";

const benefits = [
  {
    title: "Capital with Wisdom",
    description: "We provide not just funding, but strategic guidance and access to our global network.",
    icon: <Lightbulb className="w-6 h-6 text-ls-compliment" />,
  },
  {
    title: "Patient Partnership",
    description: "We invest for the long term and align our interests with yours.",
    icon: <TrendingUp className="w-6 h-6 text-ls-compliment" />,
  },
  {
    title: "Differentiated Insight",
    description: "Our deep due diligence uncovers hidden potential and helps you avoid pitfalls.",
    icon: <Zap className="w-6 h-6 text-ls-compliment" />,
  },
  {
    title: "Harmonious Collaboration",
    description: "We work alongside you as a trusted partner, not a distant investor.",
    icon: <Handshake className="w-6 h-6 text-ls-compliment" />,
  },
];

const criteria = [
  {
    title: "Unconventional Vision",
    description: "Is your market underserved? Is your approach unique?",
    icon: <Eye className="w-6 h-6 text-ls-compliment" />,
  },
  {
    title: "Wisdom-Backed Growth",
    description: "Is your business model sustainable and scalable?",
    icon: <TrendingUp className="w-6 h-6 text-ls-compliment" />,
  },
  {
    title: "Leadership Activation",
    description: "Do you and your team have the passion and capability to execute?",
    icon: <UserCheck className="w-6 h-6 text-ls-compliment" />,
  },
  {
    title: "Deep Insight",
    description: "Do you understand your metrics and your customers deeply?",
    icon: <Target className="w-6 h-6 text-ls-compliment" />,
  },
  {
    title: "Harmonious Partnerships",
    description: "Are you open to collaboration and aligned values?",
    icon: <ShieldCheck className="w-6 h-6 text-ls-compliment" />,
  },
];

const steps = [
  {
    id: "01",
    title: "Submit",
    description: "Complete our online form (20 minutes). You'll receive an instant preliminary score.",
    icon: <Send className="w-6 h-6" />,
  },
  {
    id: "02",
    title: "Review",
    description: "Our team evaluates your submission against the five pillars.",
    icon: <ClipboardCheck className="w-6 h-6" />,
  },
  {
    id: "03",
    title: "Video Pitch",
    description: "If shortlisted, you'll be invited to present your vision live.",
    icon: <Video className="w-6 h-6" />,
  },
  {
    id: "04",
    title: "Due Diligence",
    description: "We conduct a deep dive into your business, team, and market.",
    icon: <Search className="w-6 h-6" />,
  },
  {
    id: "05",
    title: "Partnership",
    description: "We structure a deal that works for both sides and begin our journey together.",
    icon: <Handshake className="w-6 h-6" />,
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
    <div className="border-b border-ls-supporting/20 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className="text-lg font-semibold group-hover:text-ls-compliment transition-colors">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="text-ls-white/40"
        >
          <ChevronDown className="w-5 h-5" />
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
            <p className="pb-6 text-ls-white/60 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function EntrepreneursPage() {
  return (
    <div className="bg-ls-primary text-ls-white min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-abstract-gradient opacity-20 pointer-events-none" />
        <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1 rounded-full bg-ls-compliment/10 text-ls-compliment text-sm font-bold uppercase tracking-widest mb-6"
          >
            For Entrepreneurs
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-8"
          >
            We back visionary founders. <br className="hidden md:block" />
            <span className="text-ls-compliment">Apply today.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-ls-white/70 max-w-2xl mx-auto mb-12"
          >
            If you're building a business that others overlook, we want to hear from you.
          </motion.p>
          <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: 0.3 }}
          >
            <button className="rounded-full bg-ls-up px-10 py-5 text-lg font-bold text-ls-primary transition-all hover:scale-105 hover:bg-ls-up/90 active:scale-95 shadow-lg shadow-ls-up/20">
              Submit Your Project
            </button>
          </motion.div>
        </div>
      </section>

      {/* Why Apply Section */}
      <section className="py-24 border-y border-ls-supporting/10">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-3xl font-bold mb-16 text-center">Why Apply to Finlogic?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="glass-card p-8 rounded-2xl"
              >
                <div className="mb-6 p-4 bg-ls-compliment/5 rounded-xl inline-block">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{benefit.title}</h3>
                <p className="text-ls-white/60 leading-relaxed text-sm">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Screening Criteria Section */}
      <section className="py-24 bg-ls-supporting/5">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Our Screening Criteria</h2>
          <p className="text-ls-white/50 mb-16">We evaluate every opportunity through the lens of our five pillars.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {criteria.map((c, i) => (
              <motion.div
                key={i}
                className="glass-card p-8 rounded-2xl flex flex-col items-center group"
              >
                <div className="mb-6 transform transition-transform group-hover:scale-110">
                  {c.icon}
                </div>
                <h3 className="text-lg font-bold mb-4 leading-tight">{c.title}</h3>
                <p className="text-xs text-ls-white/50 leading-relaxed">{c.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 overflow-hidden">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-3xl font-bold mb-20 text-center">How It Works</h2>
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 lg:left-1/2 top-0 bottom-0 w-px bg-ls-compliment/20 hidden sm:block" />

            <div className="space-y-16">
              {steps.map((step, index) => (
                <motion.div 
                  key={step.id} 
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className={`relative flex items-center ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
                >
                  <div className="w-full lg:w-1/2 flex items-center lg:px-12">
                     <div className={`p-8 lg:p-10 rounded-3xl glass-card transition-all hover:border-ls-compliment/40 w-full`}>
                        <div className="flex items-center mb-6">
                           <span className="text-4xl font-black text-ls-compliment/20 mr-4">{step.id}</span>
                           <div className="p-3 bg-ls-compliment/10 rounded-lg text-ls-compliment">
                              {step.icon}
                           </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                        <p className="text-ls-white/60 leading-relaxed">{step.description}</p>
                     </div>
                  </div>
                  <div className="absolute left-8 lg:left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-ls-compliment border-4 border-ls-primary hidden sm:block shadow-[0_0_15px_rgba(245,159,1,0.5)]" />
                  <div className="hidden lg:block w-1/2" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Educational Resources Section */}
      <section className="py-24 border-t border-ls-supporting/10 bg-abstract-gradient opacity-90">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="glass-card p-12 md:p-20 rounded-[3rem] text-center max-w-5xl mx-auto flex flex-col items-center">
            <BookOpen className="w-16 h-16 text-ls-compliment mb-8" />
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Educational Resources Teaser</h2>
            <p className="text-lg text-ls-white/70 mb-10 leading-relaxed">
              Prepare a compelling submission with our free courses in the Wisdom Hub. Learn how to articulate your vision, build a sustainable business model, and more.
            </p>
            <Link href="/insights" className="flex items-center text-ls-compliment font-bold text-lg hover:translate-x-2 transition-transform">
              Explore the Wisdom Hub <Globe className="ml-3 w-6 h-6" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
          <h2 className="text-3xl font-bold mb-16 text-center">FAQ for Entrepreneurs</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <FAQItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-ls-supporting/5 text-center">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">Ready to Scale Honestly?</h2>
          <p className="text-ls-white/60 mb-12 max-w-xl mx-auto">We review submissions on a rolling basis. Take the first step today.</p>
          <button className="rounded-full bg-ls-up px-12 py-5 text-xl font-bold text-ls-primary hover:scale-105 transition-all shadow-xl shadow-ls-up/20">
            Submit Your Project Now
          </button>
        </div>
      </section>
    </div>
  );
}
