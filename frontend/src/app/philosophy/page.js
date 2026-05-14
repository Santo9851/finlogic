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
    icon: <Eye className="w-10 h-10" />,
    image: "/images/redesign/vision.png",
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
    icon: <TrendingUp className="w-10 h-10" />,
    image: "/images/redesign/wisdom.png",
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
    icon: <UserCheck className="w-10 h-10" />,
    image: "/images/redesign/leadership.png",
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
    icon: <Search className="w-10 h-10" />,
    image: "/images/redesign/insight.png",
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
    icon: <Handshake className="w-10 h-10" />,
    image: "/images/redesign/harmony.png",
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
    <div className="bg-background text-foreground min-h-screen theme-transition">
      {/* Hero Section */}
      <section className="relative pt-40 pb-32 overflow-hidden bg-ls-primary text-ls-white">
        <div className="absolute inset-0 z-0 opacity-40 grayscale mix-blend-luminosity">
          <img src="/images/redesign/vision.png" className="w-full h-full object-cover" alt="Philosophy Hero" />
          <div className="absolute inset-0 bg-ls-primary/80" />
        </div>
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center space-x-3 text-sm font-bold uppercase tracking-[0.4em] text-ls-compliment mb-8"
          >
            <span className="h-[1px] w-12 bg-ls-compliment" />
            <span>The Finlogic Ethos</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-serif font-light mb-10 leading-tight"
          >
            Where Vision <br className="hidden md:block" /> Meets Wisdom
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-ls-white/70 max-w-3xl mx-auto leading-relaxed md:text-2xl"
          >
            Our investment philosophy is not a rigid formula – it's a living framework that guides every decision we make, from Kathmandu to the global stage.
          </motion.p>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="py-32 lg:py-48">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="space-y-48 lg:space-y-64">
            {pillars.map((pillar, index) => (
              <motion.div 
                key={pillar.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1 }}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center`}
              >
                {/* Visual Side */}
                <div className={`lg:col-span-6 ${index % 2 === 1 ? 'lg:order-last' : ''}`}>
                   <div className="relative aspect-[4/5] overflow-hidden grayscale hover:grayscale-0 transition-all duration-1000 group">
                      <img 
                        src={pillar.image} 
                        alt={pillar.title} 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-ls-primary/10 group-hover:bg-transparent transition-colors" />
                   </div>
                </div>

                {/* Content Side */}
                <div className="lg:col-span-6 space-y-10">
                  <div className="space-y-6">
                    <span className="text-sm font-bold uppercase tracking-[0.4em] text-ls-compliment">Pillar 0{pillar.id}</span>
                    <h2 className="text-5xl md:text-7xl font-serif font-light leading-tight">{pillar.title}</h2>
                    <p className="text-2xl text-ls-compliment italic font-serif">"{pillar.subtitle}"</p>
                    <p className="text-xl text-text-muted leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>

                  <div className="space-y-6 pt-6">
                    <h4 className="text-sm font-bold uppercase tracking-[0.3em] text-ls-primary border-b border-border-theme pb-4">Protocol in Practice</h4>
                    <ul className="grid grid-cols-1 gap-6">
                      {pillar.inPractice.map((item, i) => (
                        <li key={i} className="flex items-start group">
                          <div className="mt-1.5 mr-6 h-2 w-2 rounded-full bg-ls-compliment" />
                          <span className="text-lg text-text-muted leading-relaxed group-hover:text-foreground transition-colors">{item}</span>
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
      <section className="py-32 bg-ls-primary text-ls-white relative overflow-hidden">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <h2 className="text-5xl md:text-7xl font-serif font-light">The Finlogic Commitment</h2>
            <p className="text-2xl text-ls-white/70 leading-relaxed font-light italic">
              "These five pillars are not just words on a page – they are the lens through which we evaluate every opportunity and build every relationship."
            </p>
            <div className="pt-8 flex justify-center">
               <div className="h-px w-32 bg-ls-compliment" />
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
