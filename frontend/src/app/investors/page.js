"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  ShieldCheck, 
  Users, 
  Handshake, 
  RefreshCw,
  Globe,
  PieChart,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  FileText
} from "lucide-react";
import Link from "next/link";

const investorBenefits = [
  {
    title: "Differentiated Deal Flow",
    description: "Our unconventional vision uncovers opportunities others miss in overlooked markets.",
    icon: <Globe className="w-6 h-6 text-ls-compliment" />,
  },
  {
    title: "Rigorous Due Diligence",
    description: "Our deep insight framework minimizes risk and uncovers hidden value.",
    icon: <ShieldCheck className="w-6 h-6 text-ls-compliment" />,
  },
  {
    title: "Experienced Team",
    description: "Decades of combined experience across private equity, finance, and emerging markets.",
    icon: <Users className="w-6 h-6 text-ls-compliment" />,
  },
  {
    title: "Alignment of Interests",
    description: "We co-invest alongside our LPs and prioritise long-term value creation.",
    icon: <Handshake className="w-6 h-6 text-ls-compliment" />,
  },
  {
    title: "Transparent Partnership",
    description: "Regular communication, detailed reporting, and a commitment to harmony.",
    icon: <RefreshCw className="w-6 h-6 text-ls-compliment" />,
  },
];

const trackRecord = [
  { label: "Investments", value: "15+", description: "Core portfolio companies" },
  { label: "Capital Deployed", value: "$50M+", description: "Committed since inception" },
  { label: "Exits", value: "5", description: "Successful liquidations" },
  { label: "Average Gross IRR", value: "22%", description: "Benchmark performance" },
];

const investmentSteps = [
  {
    title: "Partnership Discussion",
    description: "We get to know you and your investment goals through personalized consultation.",
    icon: <MessageSquare className="w-6 h-6" />,
  },
  {
    title: "Commitment",
    description: "You commit capital to our core fund or a specialized co-investment vehicle.",
    icon: <ShieldCheck className="w-6 h-6" />,
  },
  {
    title: "Deal Flow",
    description: "You receive priority access to curated, standard-compliant investment opportunities.",
    icon: <PieChart className="w-6 h-6" />,
  },
  {
    title: "Reporting",
    description: "We provide quarterly updates, annual meetings, and transparent performance data.",
    icon: <BarChart3 className="w-6 h-6" />,
  },
];

export default function InvestorsPage() {
  const [formStatus, setFormStatus] = useState("idle");

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormStatus("submitting");
    setTimeout(() => setFormStatus("success"), 1500);
  };

  return (
    <div className="bg-ls-primary text-ls-white min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-abstract-gradient opacity-20 pointer-events-none" />
        <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block px-4 py-1 rounded-full border border-ls-compliment/30 text-ls-compliment text-sm font-bold uppercase tracking-widest mb-6"
          >
            For Institutional & Private Investors
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold mb-8 max-w-5xl mx-auto leading-tight"
          >
            Partner with us to access <br className="hidden md:block"/>
            <span className="text-ls-compliment">exclusive, high‑potential deals.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-ls-white/70 max-w-2xl mx-auto mb-12"
          >
            Finlogic Capital offers a differentiated investment opportunity rooted in a proven, insight‑driven philosophy.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button className="w-full sm:w-auto rounded-full bg-ls-white text-ls-primary px-10 py-4 font-bold transition-all hover:bg-ls-white/90 active:scale-95">
              Investor Login
            </button>
            <a href="#request-access" className="w-full sm:w-auto rounded-full border border-ls-compliment text-ls-compliment px-10 py-4 font-bold transition-all hover:bg-ls-compliment hover:text-ls-primary">
              Request Access
            </a>
          </motion.div>
        </div>
      </section>

      {/* Why Invest Section */}
      <section className="py-24 border-y border-ls-supporting/10">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-3xl font-bold mb-16 text-center">Why Invest With Finlogic?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {investorBenefits.map((benefit, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="glass-card p-8 rounded-2xl h-full flex flex-col"
              >
                <div className="mb-6 text-ls-compliment">{benefit.icon}</div>
                <h3 className="text-lg font-bold mb-3 leading-tight">{benefit.title}</h3>
                <p className="text-sm text-ls-white/50 leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Track Record Section */}
      <section className="py-24 bg-ls-supporting/5 overflow-hidden">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-16">Our Proven Track Record</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {trackRecord.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8"
              >
                <div className="text-4xl md:text-5xl font-black text-ls-compliment mb-2">{stat.value}</div>
                <div className="text-lg font-bold mb-2">{stat.label}</div>
                <div className="text-xs text-ls-white/40 uppercase tracking-widest">{stat.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Process Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-3xl font-bold mb-20 text-center">Investment Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative">
             {/* Connector Line for Desktop */}
             <div className="absolute top-1/4 left-0 right-0 h-px bg-ls-compliment/20 hidden lg:block" />
             
             {investmentSteps.map((step, i) => (
               <div key={i} className="relative z-10 text-center group">
                 <div className="w-16 h-16 rounded-2xl bg-ls-primary border border-ls-supporting/30 flex items-center justify-center mx-auto mb-8 transition-all group-hover:border-ls-compliment group-hover:shadow-[0_0_20px_rgba(245,159,1,0.2)]">
                   <div className="text-ls-compliment">{step.icon}</div>
                 </div>
                 <h3 className="text-xl font-bold mb-4">0{i+1}. {step.title}</h3>
                 <p className="text-sm text-ls-white/60 leading-relaxed">{step.description}</p>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* Educational Resources Section */}
      <section className="py-24 bg-ls-supporting/5">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16 glass-card p-12 lg:p-16 rounded-[2rem]">
            <div className="w-full lg:w-3/5">
              <h2 className="text-3xl font-bold mb-6 italic text-ls-compliment">Educational Resources for Investors</h2>
              <p className="text-lg text-ls-white/70 mb-10">
                Access exclusive white papers, tailored webinars, and quarterly market insights designed for institutional and sophisticated individual investors. Stay ahead with our unique perspective on frontier markets.
              </p>
              <Link href="/insights" className="inline-flex items-center text-ls-compliment font-bold hover:translate-x-2 transition-transform">
                Explore Resources <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
            <div className="w-full lg:w-2/5 grid grid-cols-2 gap-4">
              <div className="p-6 bg-white/5 rounded-xl text-center flex flex-col items-center">
                 <FileText className="w-8 h-8 mb-4 text-ls-secondary" />
                 <span className="text-xs font-bold uppercase tracking-tighter">White Papers</span>
              </div>
              <div className="p-6 bg-white/5 rounded-xl text-center flex flex-col items-center">
                 <TrendingUp className="w-8 h-8 mb-4 text-ls-up" />
                 <span className="text-xs font-bold uppercase tracking-tighter">Market Reports</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="request-access" className="py-24">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Request Information</h2>
            <p className="text-ls-white/50">Interested in learning more? Fill out the form below, and our specialized investor relations team will reach out.</p>
          </div>

          <form onSubmit={handleSubmit} className="glass-card p-8 md:p-12 rounded-3xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-ls-white/40 uppercase tracking-widest pl-2">Name</label>
                <input required type="text" placeholder="John Doe" className="w-full bg-ls-primary border border-ls-supporting/30 rounded-xl px-6 py-4 outline-none focus:border-ls-compliment transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-ls-white/40 uppercase tracking-widest pl-2">Email</label>
                <input required type="email" placeholder="john@company.com" className="w-full bg-ls-primary border border-ls-supporting/30 rounded-xl px-6 py-4 outline-none focus:border-ls-compliment transition-colors" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-ls-white/40 uppercase tracking-widest pl-2">Institution (Optional)</label>
              <input type="text" placeholder="e.g. Acme Family Office" className="w-full bg-ls-primary border border-ls-supporting/30 rounded-xl px-6 py-4 outline-none focus:border-ls-compliment transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-ls-white/40 uppercase tracking-widest pl-2">Message</label>
              <textarea required rows={4} placeholder="I am interested in learning about upcoming co-investment vehicles..." className="w-full bg-ls-primary border border-ls-supporting/30 rounded-xl px-6 py-4 outline-none focus:border-ls-compliment transition-colors resize-none"></textarea>
            </div>
            
            <button 
              disabled={formStatus !== "idle"}
              type="submit" 
              className="w-full rounded-xl bg-ls-compliment text-ls-primary font-bold py-5 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center justify-center"
            >
              {formStatus === "idle" && "Send Message"}
              {formStatus === "submitting" && (
                <div className="w-6 h-6 border-4 border-ls-primary/30 border-t-ls-primary rounded-full animate-spin"></div>
              )}
              {formStatus === "success" && "Message Sent Successfully!"}
            </button>
            {formStatus === "success" && (
              <p className="text-center text-ls-up font-medium text-sm">Thank you. We will be in touch within 24 hours.</p>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}
