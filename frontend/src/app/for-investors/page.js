"use client";

import { useState, useEffect } from "react";
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
  FileText,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { contactService } from "@/services/contact";
import { toast } from "sonner";

const investorBenefits = [
  {
    title: "Differentiated Deal Flow",
    description: "Our unconventional vision uncovers opportunities others miss in overlooked markets.",
    icon: <Globe className="w-6 h-6" />,
  },
  {
    title: "Rigorous Due Diligence",
    description: "Our deep insight framework minimizes risk and uncovers hidden value.",
    icon: <ShieldCheck className="w-6 h-6" />,
  },
  {
    title: "Experienced Leadership",
    description: "Decades of combined experience across private equity, finance, and emerging markets.",
    icon: <Users className="w-6 h-6" />,
  },
  {
    title: "Alignment of Interests",
    description: "We co-invest alongside our LPs and prioritise long-term value creation.",
    icon: <Handshake className="w-6 h-6" />,
  },
  {
    title: "Transparent Partnership",
    description: "Regular communication, detailed reporting, and a commitment to harmony.",
    icon: <RefreshCw className="w-6 h-6" />,
  },
];

const trackRecord = [
  { label: "Investments", value: "2+", description: "Core portfolio companies" },
  { label: "Capital Deployed", value: "$5M+", description: "Committed since inception" },
  { label: "Exits", value: "0", description: "Successful liquidations" },
  { label: "Average Gross IRR", value: "18%", description: "Benchmark performance" },
];

const investmentSteps = [
  {
    id: "01",
    title: "Partnership Discussion",
    description: "Personalized consultation to align investment goals with our strategic framework.",
    icon: <MessageSquare className="w-6 h-6" />,
  },
  {
    id: "02",
    title: "Commitment",
    description: "Capital commitment to our core fund or specialized co-investment vehicles.",
    icon: <ShieldCheck className="w-6 h-6" />,
  },
  {
    id: "03",
    title: "Access Deal Flow",
    description: "Priority access to curated, institutionally-compliant investment opportunities.",
    icon: <PieChart className="w-6 h-6" />,
  },
  {
    id: "04",
    title: "Reporting",
    description: "Quarterly updates, annual meetings, and transparent performance transparency.",
    icon: <BarChart3 className="w-6 h-6" />,
  },
];

export default function InvestorsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [formStatus, setFormStatus] = useState("idle");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus("submitting");

    const formData = new FormData(e.target);
    const fullName = formData.get("name").trim();
    const nameParts = fullName.split(' ');
    const first_name = nameParts[0];
    const last_name = nameParts.slice(1).join(' ') || ' ';

    const payload = {
      first_name,
      last_name,
      email: formData.get("email"),
      company: formData.get("institution"),
      source: 'investor_portal_request',
      notes: formData.get("message"),
    };

    try {
      await contactService.submitInquiry(payload);
      setFormStatus("success");
      toast.success("Request sent successfully!");
    } catch (error) {
      console.error("Submission error:", error);
      setFormStatus("idle");
      toast.error("Failed to send request. Please try again later.");
    }
  };

  if (!mounted) return null;

  return (
    <div className="bg-background text-foreground min-h-screen theme-transition font-sans">
      {/* Hero Section */}
      <section className="relative pt-40 pb-32 overflow-hidden bg-ls-primary text-ls-white">
        <div className="absolute inset-0 z-0 opacity-40 grayscale mix-blend-luminosity">
          <img src="/images/redesign/leadership.png" className="w-full h-full object-cover" alt="Investors Hero" />
          <div className="absolute inset-0 bg-ls-primary/80" />
        </div>
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl space-y-10"
          >
            <span className="text-sm font-bold uppercase tracking-[0.4em] text-ls-compliment">For Institutional & Private Investors</span>
            <h1 className="text-6xl md:text-8xl font-serif font-light leading-tight">Sophisticated <br /> Capital <br /> Deployment</h1>
            <p className="text-xl text-ls-white/70 max-w-2xl leading-relaxed md:text-2xl font-light">
              Partner with Nepal's premier institutional-grade private equity firm to access exclusive, visionary deal flow.
            </p>
            <div className="pt-8 flex flex-col sm:flex-row gap-6">
              <Link 
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-none bg-ls-compliment px-12 py-6 text-xs font-bold text-ls-primary uppercase tracking-[0.3em] hover:bg-ls-white transition-all"
              >
                Investor Portal Access
              </Link>
              <a href="#request-access" className="flex items-center text-ls-white/40 text-[10px] uppercase tracking-[0.2em] border-b border-ls-white/20 pb-1 hover:text-ls-compliment hover:border-ls-compliment transition-all">
                Request Onboarding
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Invest Section - Grid */}
      <section className="py-32 lg:py-48">
        <div className="container mx-auto px-4 lg:px-8">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-end mb-24">
              <div className="lg:col-span-6 space-y-6">
                <span className="text-sm font-bold uppercase tracking-[0.4em] text-ls-compliment">The Finlogic Edge</span>
                <h2 className="text-5xl md:text-7xl font-serif font-light leading-tight">Institutional <br /> Discipline</h2>
              </div>
              <div className="lg:col-span-6">
                <p className="text-xl text-text-muted leading-relaxed font-light">
                  We bridge the gap between high-potential frontier markets and global institutional standards, ensuring every investment undergoes rigorous institutional scrutiny.
                </p>
              </div>
           </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {investorBenefits.map((benefit, i) => (
              <div key={i} className="border border-border-theme p-12 transition-all hover:bg-ls-primary hover:text-ls-white group">
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

      {/* Track Record - Minimalist Editorial */}
      <section className="py-32 bg-ls-primary text-ls-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
            {trackRecord.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="space-y-4"
              >
                <div className="text-sm font-bold text-ls-compliment uppercase tracking-widest opacity-60">{stat.label}</div>
                <div className="text-6xl md:text-7xl font-serif font-light">{stat.value}</div>
                <div className="text-xs text-ls-white/40 uppercase tracking-[0.2em]">{stat.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Process - Steps */}
      <section className="py-32 lg:py-48">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-24 space-y-6">
             <span className="text-sm font-bold uppercase tracking-[0.4em] text-ls-compliment">Lifecycle</span>
             <h2 className="text-5xl font-serif font-light">Investor Journey</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
            {investmentSteps.map((step, i) => (
              <div key={i} className="space-y-8 group">
                <div className="flex items-center space-x-6">
                   <span className="text-xs font-bold text-ls-compliment tracking-widest">{step.id}</span>
                   <div className="h-px w-full bg-border-theme group-hover:bg-ls-compliment transition-all" />
                </div>
                <div className="space-y-4">
                   <h3 className="text-2xl font-serif font-light group-hover:text-ls-compliment transition-colors">{step.title}</h3>
                   <p className="text-text-muted leading-relaxed font-light">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Investor Resources CTA */}
      <section className="py-32 bg-ls-supporting/5">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="w-full lg:w-1/2 space-y-10">
              <span className="text-sm font-bold uppercase tracking-[0.4em] text-ls-compliment">Market Intelligence</span>
              <h2 className="text-5xl font-serif font-light leading-tight">Insight-Driven <br /> Reporting</h2>
              <p className="text-xl text-text-muted leading-relaxed font-light">
                Access exclusive white papers and quarterly market reports. Our research provides a unique perspective on emerging market dynamics and cross-border opportunities.
              </p>
              <Link href="/insights" className="inline-flex items-center space-x-4 text-ls-primary font-bold uppercase tracking-widest text-xs group">
                <span>View All Intelligence</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
              </Link>
            </div>
            <div className="w-full lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="border border-border-theme p-12 bg-background hover:border-ls-compliment transition-all group">
                <FileText className="w-10 h-10 mb-8 text-ls-primary group-hover:text-ls-compliment transition-colors" />
                <h4 className="text-lg font-serif font-light">Institutional <br /> White Papers</h4>
              </div>
              <div className="border border-border-theme p-12 bg-background hover:border-ls-compliment transition-all group">
                <TrendingUp className="w-10 h-10 mb-8 text-ls-primary group-hover:text-ls-compliment transition-colors" />
                <h4 className="text-lg font-serif font-light">Quarterly Market <br /> Performance</h4>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Onboarding Request Section */}
      <section id="request-access" className="py-32 lg:py-48">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
             <div className="lg:col-span-5 space-y-8">
                <span className="text-sm font-bold uppercase tracking-[0.4em] text-ls-compliment">Engagement</span>
                <h2 className="text-5xl font-serif font-light leading-tight">Request <br /> Onboarding</h2>
                <p className="text-lg text-text-muted font-light leading-relaxed">
                   To access our detailed portfolio analytics and upcoming co-investment vehicles, please submit a formal onboarding request.
                </p>
             </div>
             <div className="lg:col-span-7">
                <form onSubmit={handleSubmit} className="space-y-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="space-y-4">
                       <label className="text-[10px] font-bold text-ls-compliment uppercase tracking-[0.4em]">Full Name</label>
                       <input name="name" required type="text" placeholder="Your Name" className="w-full bg-transparent border-b border-border-theme py-4 outline-none focus:border-ls-compliment transition-all text-xl font-light" />
                     </div>
                     <div className="space-y-4">
                       <label className="text-[10px] font-bold text-ls-compliment uppercase tracking-[0.4em]">Email Address</label>
                       <input name="email" required type="email" placeholder="john@institution.com" className="w-full bg-transparent border-b border-border-theme py-4 outline-none focus:border-ls-compliment transition-all text-xl font-light" />
                     </div>
                   </div>
                   <div className="space-y-4">
                     <label className="text-[10px] font-bold text-ls-compliment uppercase tracking-[0.4em]">Institution (LPs / Family Offices)</label>
                     <input name="institution" type="text" placeholder="Entity Name" className="w-full bg-transparent border-b border-border-theme py-4 outline-none focus:border-ls-compliment transition-all text-xl font-light" />
                   </div>
                   <div className="space-y-4">
                     <label className="text-[10px] font-bold text-ls-compliment uppercase tracking-[0.4em]">Strategic Interest</label>
                     <textarea name="message" required rows={4} placeholder="Describe your investment objectives..." className="w-full bg-transparent border border-border-theme p-6 outline-none focus:border-ls-compliment transition-all text-xl font-light resize-none leading-relaxed"></textarea>
                   </div>

                   <button
                     disabled={formStatus !== "idle"}
                     type="submit"
                     className="w-full bg-ls-primary py-8 text-ls-white font-bold uppercase tracking-[0.4em] text-xs hover:bg-ls-compliment hover:text-ls-primary transition-all disabled:opacity-50 shadow-2xl"
                   >
                     {formStatus === "idle" && "Submit Formal Request"}
                     {formStatus === "submitting" && "Transmitting..."}
                     {formStatus === "success" && "Transmission Complete"}
                   </button>
                   {formStatus === "success" && (
                     <p className="text-center text-ls-compliment font-bold text-sm uppercase tracking-widest animate-pulse">Request Transmitted Successfully.</p>
                   )}
                </form>
             </div>
          </div>
        </div>
      </section>

    </div>
  );
}
