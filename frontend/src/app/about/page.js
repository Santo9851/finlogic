"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Linkedin, Twitter, X, Target, Lightbulb, Users, Eye, ShieldCheck } from "lucide-react";

export default function AboutPage() {
  const [selectedMember, setSelectedMember] = useState(null);

  const values = [
    {
      title: "Vision",
      description: "We look where others don't, embracing innovation and the unconventional.",
      icon: <Eye className="w-8 h-8 text-ls-compliment" />,
    },
    {
      title: "Wisdom",
      description: "We seek knowledge, learn from experience, and act with integrity.",
      icon: <Lightbulb className="w-8 h-8 text-ls-compliment" />,
    },
    {
      title: "Leadership",
      description: "We empower founders to lead boldly and confidently.",
      icon: <Users className="w-8 h-8 text-ls-compliment" />,
    },
    {
      title: "Insight",
      description: "We dig deep, trust our intuition, and uncover hidden truths.",
      icon: <Target className="w-8 h-8 text-ls-compliment" />,
    },
    {
      title: "Harmony",
      description: "We build partnerships based on mutual respect and aligned interests.",
      icon: <ShieldCheck className="w-8 h-8 text-ls-compliment" />,
    },
  ];

  const teamMembers = [
    {
      id: 1,
      name: "Santosh Poudel",
      role: "Founder & Chairman",
      bio: "Santosh brings over thirteen years of progressive experience across Nepal's financial sector, spanning securities research, capital market analytics, institutional investment strategy, and private equity structuring.",
      bioFull: [
        {
          text: "Santosh brings over thirteen years of progressive experience across Nepal's financial sector, spanning securities research, capital market analytics, institutional investment strategy, and private equity structuring.",
        },
        {
          text: "His career began at the Institute of Chartered Accountants of India, where he pursued Chartered Accountancy before completing a Bachelor of Commerce (Finance & Accounting) from Indira Gandhi Open University and a Master of Business Administration from Lincoln International College, Kathmandu.",
        },
        {
          text: "From 2011 to 2017, Santosh served as Finance Officer at Open Consultant & Research Centre, where he led investment proposal preparation, equity fundamental research, deal negotiation, and Investment Committee advisory work. He went on to spend six formative years (2018–2024) at Sani Securities Company Limited as Financial Data Analyst and Research Analyst — pioneering data-driven investment frameworks, building KYC-compliant digital onboarding systems, leveraging Python and Power BI for institutional analytics, and engaging directly with government and regulatory stakeholders on market policy.",
        },
        {
          text: "In June 2024, Santosh founded Finlogic Capital Limited with a mandate to institutionalize private equity practice in Nepal and represent the country's financial sector in regional and bilateral forums.",
        },
        {
          text: "Parallel to Finlogic, Santosh serves as a co-founder and strategic advisor to Silicon Himalayas Pvt Ltd, a project development and advisory firm operating across five high-potential verticals — Green Energy, Technology & Digital, Agri-tech, Tourism, and Smart Infrastructure. Silicon Himalayas employs a proprietary SPV Incubation Engine that systematically de-risks early-stage ventures through four stages: Validation, DPR/IP Creation, IRC Audit & SPV Formation, and Capitalization. This dual role positions Santosh at the intersection of deal origination and institutional capital deployment — a unique vantage point that directly informs Finlogic's investment strategy and pipeline.",
          highlight: "Silicon Himalayas Pvt Ltd",
        },
        {
          text: "His professional certifications span Google Data Analytics (Coursera), Sustainable Finance (UN CC:Learn), Green Industrial Policy (UN CC:Learn), Blockchain Essentials (IBM), Financial Forecasting with Big Data, and Data Governance — reflecting a deliberate commitment to staying at the frontier of both finance and technology.",
        },
      ],
      image: "/images/santosh-poudel.jpg",
      social: { linkedin: "#", twitter: "#" },
    },
    {

      id: 2,
      name: "Amrit Rana Chhetri",
      role: "Co-Founder & Director",
      bio: "Amrit Rana Chhetri is an entrepreneur and institutional finance professional with deep expertise in fund management, investor relations, and clean energy development.",
      bioFull: [
        {
          text: "Amrit Rana Chhetri is an entrepreneur and institutional finance professional with deep expertise in fund management, investor relations, and clean energy development. As Co-Founder and Director at Finlogic Capital Limited, he brings regulated fund management experience and a macro-level understanding of Nepal's structural growth opportunity.",
        },
        {
          text: "Amrit serves as Director of Investor Relations at GlobeX Global Fund Management (GGFM), a Government of Nepal-registered fund management company authorized to operate across private equity, venture capital, hedge funds, and separately managed accounts. In this capacity, he manages institutional investor relationships, fund structuring, regulatory compliance, and risk management — experience that directly strengthens Finlogic Capital's governance and investor relations framework.",
          highlight: "GlobeX Global Fund Management (GGFM)",
        },
        {
          text: "He is also Founder of GlobeX Technology and Director of GlobeX Power Pvt Ltd, reflecting his commitment to Nepal's technology and clean energy sectors.",
        },
        {
          text: "Amrit holds a Postgraduate Degree in International Finance from Leeds Beckett University (UK) and a BBA in Accounting and Finance from the School of Management, Tribhuvan University — a combination that allows him to bridge international investor expectations with Nepal's regulatory realities.",
        },
        {
          text: "As a Co-Founder of Silicon Himalayas Pvt Ltd, Amrit is integral to the structured pipeline between project origination and institutional capital deployment, ensuring that ventures entering the Finlogic ecosystem have undergone rigorous validation before reaching the investment stage.",
          highlight: "Silicon Himalayas Pvt Ltd",
        },
        {
          text: "His core competencies span investor relations, corporate relations, and risk management across fund management, energy, and technology sectors.",
        },
      ],
      image: "/images/amrit-rana-chhetri.png",
      social: { linkedin: "#", twitter: "#" },
    },

    {
      id: 3,
      name: "Suman Subedi",
      role: "Director",
      bio: "Detailed bio highlighting operational excellence, strategic guidance, and value creation for portfolio companies.",
      image: "/images/suman-subedi.png",
      social: { linkedin: "#", twitter: "#" },
    },
    {
      id: 4,
      name: "Anju Bhattarai",
      role: "DIrector",
      bio: "Focusing on digital transformation and evaluating high-growth tech ventures within the frontier markets.",
      image: "/images/anju-bhattarai.jpg",
      social: { linkedin: "#", twitter: "#" },
    },
    {
      id: 5,
      name: "Gita Devi Khanal",
      role: "Director",
      bio: "Leading strategic research and alignment across the five-pillar proprietary framework.",
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400&h=400&auto=format&fit=crop",
      social: { linkedin: "#", twitter: "#" },
    },
    {
      id: 6,
      name: "Janak Tiwari",
      role: "Independent Director",
      bio: "Supporting deal sourcing, due diligence, and market scouting in diverse frontier economies.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&h=400&auto=format&fit=crop",
      social: { linkedin: "#", twitter: "#" },
    },
    {
      id: 7,
      name: "Asmita Raut",
      role: "Chief Executive Officer",
      bio: "Focused on quantitative analysis and financial modeling for sustainable scaling ventures.",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400&h=400&auto=format&fit=crop",
      social: { linkedin: "#", twitter: "#" },
    },
  ];

  return (
    <div className="bg-ls-primary text-ls-white min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-abstract-gradient opacity-20 pointer-events-none" />
        <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            About Us
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-ls-white/70 max-w-2xl mx-auto"
          >
            Bridging visionary thinking with disciplined, insight-driven action.
          </motion.p>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-24 border-y border-ls-supporting/20">
        <div className="container mx-auto px-4 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <h2 className="text-3xl font-bold mb-8 text-ls-compliment">Who We Are</h2>
            <div className="space-y-6 text-lg text-ls-white/80 leading-relaxed">
              <p>
                Finlogic Capital Limited is a private equity firm founded on the belief that the best investments are those that combine visionary thinking with timeless wisdom. Our name reflects our approach: <span className="text-ls-white font-bold">Fin</span> for finance, <span className="text-ls-white font-bold">logic</span> for the disciplined, insight-driven process we apply to every decision.
              </p>
              <p>
                We are headquartered in Kathmandu, Nepal, with a focus on emerging markets and cross-border opportunities. Our team brings together diverse backgrounds – finance, entrepreneurship, technology, and advisory – united by a shared philosophy: to invest beyond the obvious.
              </p>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-8 text-ls-compliment">Our Story</h2>
            <div className="space-y-6 text-lg text-ls-white/80 leading-relaxed">
              <p>
                Finlogic Capital was born from a simple observation: the most successful investments are not just about numbers; they are about vision, relationships, and timing. Our founder, <span className="text-ls-white">Santosh Poudel</span>, spent years studying the patterns of successful businesses and the deeper principles that drive sustainable growth.
              </p>
              <p>
                Since our inception, we have remained true to that vision – backing exceptional entrepreneurs, uncovering hidden opportunities, and building lasting partnerships with our investors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-ls-supporting/5">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-12 text-ls-compliment">Our Mission</h2>
          <p className="text-3xl md:text-4xl font-light leading-snug text-ls-white italic">
            "To generate exceptional, risk-adjusted returns for our investors by identifying and nurturing visionary businesses, while fostering trust, transparency, and positive impact in every community we touch."
          </p>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-3xl font-bold mb-16 text-center text-ls-compliment">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="glass-card p-8 rounded-2xl flex flex-col items-center text-center group"
              >
                <div className="mb-6 transform transition-transform group-hover:scale-110">
                  {v.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{v.title}</h3>
                <p className="text-sm text-ls-white/60">{v.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Grid */}
      <section className="py-24 border-t border-ls-supporting/20">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-3xl font-bold mb-16 text-center text-ls-compliment">Meet Our Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {teamMembers.map((member) => (
              <motion.div
                key={member.id}
                layoutId={`member-container-${member.id}`}
                className="group cursor-pointer"
                onClick={() => setSelectedMember(member)}
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-6 filter grayscale group-hover:grayscale-0 transition-all duration-500">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-ls-primary/20 group-hover:bg-transparent transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-1 group-hover:text-ls-compliment transition-colors">{member.name}</h3>
                <p className="text-ls-white/50 text-sm font-medium uppercase tracking-widest">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Advisory Board Placeholder */}
      <section className="py-24 bg-ls-supporting/5 text-center">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-ls-compliment">Advisory Board</h2>
          <p className="text-ls-white/50 italic mb-8">Our advisors include distinguished leaders from technology, finance, and international developmental agencies across Asia and beyond.</p>
          <div className="flex flex-wrap justify-center gap-8 opacity-40">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="h-12 w-48 bg-ls-white/10 rounded flex items-center justify-center font-bold">[Board Member {idx}]</div>
            ))}
          </div>
        </div>
      </section>

      {/* Careers Section */}
      <section className="py-16 text-center">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">Join Our Journey</h2>
          <p className="text-ls-white/60 mb-10 max-w-xl mx-auto">We are always looking for talented individuals who share our passion for vision and wisdom.</p>
          <button className="rounded-full border border-ls-compliment px-10 py-4 text-ls-compliment font-bold hover:bg-ls-compliment hover:text-ls-primary transition-all">
            See Current Openings
          </button>
        </div>
      </section>

      {/* Team Modal Overlay */}
      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMember(null)}
              className="absolute inset-0 bg-ls-primary/80 backdrop-blur-xl"
            />

            <motion.div
              layoutId={`member-container-${selectedMember.id}`}
              className="glass-card max-w-4xl w-full rounded-3xl overflow-hidden relative z-10 grid grid-cols-1 md:grid-cols-2"
            >
              <div className="aspect-square md:aspect-auto">
                <img
                  src={selectedMember.image}
                  alt={selectedMember.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <button
                  onClick={() => setSelectedMember(null)}
                  className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="mb-8">
                  <h3 className="text-3xl font-bold mb-2">{selectedMember.name}</h3>
                  <p className="text-ls-compliment font-semibold uppercase tracking-widest text-sm">{selectedMember.role}</p>
                </div>
                <div className="space-y-4 text-ls-white/70 leading-relaxed mb-10 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin">
                  {selectedMember.bioFull
                    ? selectedMember.bioFull.map((para, i) => (
                      <p key={i}>
                        {para.highlight
                          ? para.text.split(para.highlight).map((part, j, arr) =>
                            j < arr.length - 1 ? (
                              <span key={j}>
                                {part}
                                <span className="text-ls-compliment font-semibold">{para.highlight}</span>
                              </span>
                            ) : (
                              part
                            )
                          )
                          : para.text}
                      </p>
                    ))
                    : <p>{selectedMember.bio}</p>
                  }
                </div>
                <div className="flex space-x-4">
                  <a href={selectedMember.social.linkedin} className="p-3 bg-white/5 hover:bg-ls-compliment hover:text-ls-primary rounded-full transition-all">
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a href={selectedMember.social.twitter} className="p-3 bg-white/5 hover:bg-ls-compliment hover:text-ls-primary rounded-full transition-all">
                    <Twitter className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
