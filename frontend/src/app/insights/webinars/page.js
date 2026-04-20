"use client";

import { motion } from "framer-motion";
import WebinarCard from "@/components/insights/WebinarCard";

const upcomingWebinars = [
  {
    slug: "navigating-regulatory-shifts",
    title: "Navigating Regulatory Shifts in South Asian Tech Investments",
    description: "Join our panel of legal experts and managing partners as they decode recent policy changes affecting foreign investments in the region.",
    speaker: "Sumanth Rai & Legal Partners",
    date: "Nov 15, 2023",
    time: "14:00 NPT",
    registrationUrl: "#register",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=600",
  },
  {
    slug: "due-diligence-2024",
    title: "The New Standard of Due Diligence for 2024",
    description: "An exclusive look into Finlogic Capital's proprietary 'Deep Insight' framework for evaluating founders in uncertain markets.",
    speaker: "Investment Committee",
    date: "Dec 05, 2023",
    time: "15:30 NPT",
    registrationUrl: "#register",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=600",
  }
];

const pastWebinars = [
  {
    slug: "building-defensibility-hardware",
    title: "Building Defensibility in Hardware Startups",
    speaker: "Santosh Poudel",
    date: "Sep 10, 2023",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600",
  },
  {
    slug: "agritech-opportunities-nepal",
    title: "Unlocking Agritech Value Chains in Nepal",
    speaker: "Research Team",
    date: "Aug 22, 2023",
    image: "https://images.unsplash.com/photo-1592982537447-6f23f8510f22?auto=format&fit=crop&q=80&w=600",
  },
  {
    slug: "structuring-cross-border-spvs",
    title: "Structuring Cross-Border SPVs for Emerging Markets",
    speaker: "Legal Advisory",
    date: "Jun 15, 2023",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=600",
  },
  {
    slug: "post-investment-governance",
    title: "Post-Investment Governance: A Founder's Guide",
    speaker: "Operations Team",
    date: "May 08, 2023",
    image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80&w=600",
  }
];

export default function WebinarsListPage() {
  return (
    <div className="bg-ls-primary text-ls-white min-h-screen">
      
      {/* Header */}
      <section className="pt-32 pb-16 bg-ls-supporting/5 border-b border-ls-supporting/10 relative overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-ls-compliment/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="inline-block px-3 py-1 rounded-full bg-ls-supporting/20 border border-ls-supporting/30 text-xs font-bold uppercase tracking-widest mb-6">
            Live & Recorded Events
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Webinars & Masterclasses</h1>
          <p className="text-xl text-ls-white/60 max-w-2xl">
            Join our partners and industry experts for live discussions on market trends, investment frameworks, and sustainable growth strategies.
          </p>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center space-x-4 mb-12">
            <h2 className="text-3xl font-bold">Upcoming Live Events</h2>
            <div className="flex items-center px-3 py-1 bg-ls-up/10 rounded-full border border-ls-up/20">
               <span className="w-2 h-2 rounded-full bg-ls-up animate-pulse mr-2" />
               <span className="text-xs font-bold text-ls-up uppercase tracking-widest">Register Now</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {upcomingWebinars.map((webinar, i) => (
              <motion.div
                key={webinar.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="h-full"
              >
                <div className="h-full">
                  <WebinarCard webinar={webinar} isPast={false} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Past Recordings Archive */}
      <section className="py-20 bg-ls-supporting/5 border-t border-ls-supporting/10">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <h2 className="text-3xl font-bold mb-4">On-Demand Library</h2>
          <p className="text-ls-white/60 mb-12">Access our archive of past masterclasses and panel discussions.</p>
          
          <div className="space-y-4">
            {pastWebinars.map((webinar, i) => (
              <motion.div
                key={webinar.slug}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <WebinarCard webinar={webinar} isPast={true} />
              </motion.div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
             <button className="px-8 py-3 rounded-full border border-ls-white/20 hover:bg-ls-white/10 font-bold transition-all text-sm">
               Load More Recordings
             </button>
          </div>
        </div>
      </section>
      
    </div>
  );
}
