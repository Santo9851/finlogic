"use client";

import { motion } from "framer-motion";
import { 
  Eye, 
  TrendingUp, 
  UserCheck, 
  Search, 
  Handshake, 
  ChevronRight 
} from "lucide-react";

const pillars = [
  {
    id: 1,
    title: "Unconventional Vision",
    subtitle: "We invest where others don't look.",
    icon: <Eye className="w-10 h-10 text-ls-compliment" />,
    description: "Our approach is driven by a commitment to explore the frontiers of the global economy—emerging markets, breakthrough technologies, and industries on the cusp of structural disruption. We seek out opportunities that are misunderstood, undervalued, or simply overlooked by mainstream capital flows, finding value in complexity.",
    inPractice: [
      "We focus on sectors and geographies with high growth potential but limited institutional coverage.",
      "We cultivate a global proprietary network of entrepreneurs, advisors, and scouts who bring us proprietary deal flow.",
      "We embrace innovation and are not afraid to back unconventional business models."
    ]
  },
  {
    id: 2,
    title: "Wisdom-Backed Growth",
    subtitle: "We grow patiently, not greedily.",
    icon: <TrendingUp className="w-10 h-10 text-ls-compliment" />,
    description: "True growth is a marathon, not a sprint. We invest with a multi-generational horizon, allowing businesses the time and space to scale sustainably. We provide more than just capital; we offer the strategic guidance, operational mentorship, and institutional access required to build enduring value.",
    inPractice: [
      "We partner with companies that have strong ethical foundations and transparent governance.",
      "We add value through operational expertise, strategic introductions, and board-level counsel.",
      "We prioritize long-term value creation over short-term quarterly gains."
    ]
  },
  {
    id: 3,
    title: "Leadership Activation",
    subtitle: "We back leaders, not just businesses.",
    icon: <UserCheck className="w-10 h-10 text-ls-compliment" />,
    description: "We believe that the ultimate driver of success is the human element. We invest in visionary founders who possess the resilience, passion, and clarity of purpose to build world-class enterprises. Our role is to empower this leadership, acting as a supportive partner and coach rather than a controlling force.",
    inPractice: [
      "We assess the founder's vision, track record, and ability to inspire a team.",
      "We provide governance support while respecting entrepreneurial autonomy.",
      "We help founders scale their leadership capabilities as the company grows."
    ]
  },
  {
    id: 4,
    title: "Deep Insight",
    subtitle: "We see what others miss.",
    icon: <Search className="w-10 h-10 text-ls-compliment" />,
    description: "Our due diligence process is designed to uncover the hidden patterns that others overlook. We combine sophisticated data analytics with deep, intuitive, on-the-ground research to understand the fundamental drivers of a business—be it management psychology, supply chain dynamics, or subtle market signals.",
    inPractice: [
      "Our due diligence goes beyond financial audits to include interviews with former employees, suppliers, and customers.",
      "We analyze management psychology and incentives through informal interactions.",
      "Every investment must pass our 'gut check': if something feels wrong, we walk away, even if the numbers look right."
    ]
  },
  {
    id: 5,
    title: "Harmonious Partnerships",
    subtitle: "We build relationships, not transactions.",
    icon: <Handshake className="w-10 h-10 text-ls-compliment" />,
    description: "Success is built on a foundation of trust, transparency, and mutual benefit. We treat our limited partners and portfolio company founders as true collaborators, ensuring that every deal is structured for long-term alignment. We believe in exiting gracefully, ensuring that our legacy is one of shared success and lasting respect.",
    inPractice: [
      "We structure deals that align the interests of all stakeholders.",
      "We maintain open, regular communication with our LPs and portfolio companies.",
      "We exit gracefully, ensuring all parties benefit and relationships remain intact for future opportunities."
    ]
  }
];

export default function PhilosophyPage() {
  return (
    <div className="bg-ls-primary text-ls-white min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-abstract-gradient opacity-20 pointer-events-none" />
        <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block px-4 py-1 rounded-full border border-ls-compliment/30 text-ls-compliment text-sm font-bold uppercase tracking-widest mb-6"
          >
            Our Investment Philosophy
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold mb-8"
          >
            The Wise Ambitious
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-ls-white/70 max-w-3xl mx-auto leading-relaxed"
          >
            At Finlogic Capital, our investment philosophy is not a rigid formula – it's a living framework that guides every decision we make. We combine the ambition to seek extraordinary opportunities with the wisdom to grow them sustainably.
          </motion.p>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="pb-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="space-y-32">
            {pillars.map((pillar, index) => (
              <motion.div 
                key={pillar.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-start lg:items-center gap-12 lg:gap-24`}
              >
                {/* Visual Side */}
                <div className="w-full lg:w-1/2">
                   <div className="relative aspect-square max-w-md mx-auto">
                      <div className="absolute inset-0 bg-ls-compliment/10 rounded-full blur-3xl" />
                      <div className="glass-card absolute inset-0 rounded-3xl flex items-center justify-center p-12 border-ls-compliment/20">
                        <div className="text-center group">
                           <div className="inline-block p-6 rounded-2xl bg-ls-compliment/5 mb-8 transform transition-transform group-hover:scale-110 duration-500">
                             {pillar.icon}
                           </div>
                           <h3 className="text-2xl font-bold mb-4">Pillar {pillar.id}</h3>
                           <div className="text-ls-compliment font-semibold uppercase tracking-widest text-sm opacity-60">Secret Sauce Protocol</div>
                        </div>
                      </div>
                   </div>
                </div>

                {/* Content Side */}
                <div className="w-full lg:w-1/2 space-y-8">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">{pillar.title}</h2>
                    <p className="text-xl text-ls-compliment italic font-medium mb-6">"{pillar.subtitle}"</p>
                    <p className="text-lg text-ls-white/70 leading-relaxed mb-10">
                      {pillar.description}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-ls-white/40">In Practice</h4>
                    <ul className="space-y-4">
                      {pillar.inPractice.map((item, i) => (
                        <li key={i} className="flex items-start group">
                          <div className="mt-1.5 mr-4 p-1 rounded-full bg-ls-compliment/20 text-ls-compliment group-hover:bg-ls-compliment group-hover:text-ls-primary transition-all duration-300">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                          <span className="text-ls-white/80 group-hover:text-ls-white transition-colors">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Commitment Section */}
      <section className="py-24 border-t border-ls-supporting/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-abstract-gradient opacity-10 pointer-events-none" />
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl text-center relative z-10">
          <h2 className="text-4xl font-bold mb-8">The Finlogic Commitment</h2>
          <p className="text-xl text-ls-white/70 leading-relaxed mb-12">
            These five pillars are not just words on a page – they are the lens through which we evaluate every opportunity, manage every portfolio company, and build every relationship. They are the reason our partners trust us, and the reason we have consistently delivered value.
          </p>
          <div className="h-px w-24 bg-ls-compliment mx-auto" />
        </div>
      </section>
    </div>
  );
}
