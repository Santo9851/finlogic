"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Linkedin, Twitter, Facebook, X, Target, Lightbulb, Users, Eye, ShieldCheck, ArrowRight } from "lucide-react";

export default function AboutPage() {
  const [selectedMember, setSelectedMember] = useState(null);

  const advisoryBoard = [
    {
      name: "Mr. Badri Khanal",
      social: { linkedin: "#", facebook: "#" }
    },
    {
      name: "Mr. Himal Aryal",
      social: { linkedin: "#", facebook: "#" }
    },
  ];

  const values = [
    {
      title: "Vision",
      description: "We look where others don't, embracing innovation and the unconventional.",
      icon: <Eye className="w-8 h-8" />,
    },
    {
      title: "Wisdom",
      description: "We seek knowledge, learn from experience, and act with integrity.",
      icon: <Lightbulb className="w-8 h-8" />,
    },
    {
      title: "Leadership",
      description: "We empower founders to lead boldly and confidently.",
      icon: <Users className="w-8 h-8" />,
    },
    {
      title: "Insight",
      description: "We dig deep, trust our intuition, and uncover hidden truths.",
      icon: <Target className="w-8 h-8" />,
    },
    {
      title: "Harmony",
      description: "We build partnerships based on mutual respect and aligned interests.",
      icon: <ShieldCheck className="w-8 h-8" />,
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
          text: "From 2011 to 2017, Santosh served as Finance Officer at Open Consultant & Research Centre, where he led investment proposal preparation, equity fundamental research, deal negotiation, and Investment Committee advisory work. He went on to spend six formative years at Sani Securities Company Limited as Financial Data Analyst and Research Analyst — pioneering data-driven investment frameworks, building KYC-compliant digital onboarding systems, leveraging Python and Power BI for institutional analytics, and engaging directly with government and regulatory stakeholders on market policy.",
        },
        {
          text: "In June 2024, Santosh founded Finlogic Capital Limited with a mandate to institutionalize private equity practice in Nepal and represent the country's financial sector in regional and bilateral forums.",
        },
        {
          text: "Parallel to Finlogic, Santosh serves as a co-founder and strategic advisor to Silicon Himalayas Pvt Ltd, a project development and advisory firm operating across five high-potential verticals — Green Energy, Technology & Digital, Agri-tech, Tourism, and Smart Infrastructure. This dual role positions Santosh at the intersection of deal origination and institutional capital deployment — a unique vantage point that directly informs Finlogic's investment strategy and pipeline.",
          highlight: "Silicon Himalayas Pvt Ltd",
        },
        {
          text: "His professional certifications span Google Data Analytics (Coursera), Sustainable Finance (UN CC:Learn), Green Industrial Policy (UN CC:Learn), Blockchain Essentials (IBM), Financial Forecasting with Big Data, and Data Governance — reflecting a deliberate commitment to staying at the frontier of both finance and technology.",
        },
      ],
      image: "/images/santosh-poudel.jpg",
      social: { linkedin: "#", twitter: "#", facebook: "#" },
    },
    {
      id: 2,
      name: "Amrit Rana Chhetri",
      role: "Co-Founder & Director",
      bio: "Amrit is an entrepreneur and institutional finance professional with deep expertise in fund management, investor relations, and clean energy development.",
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
      social: { linkedin: "#", twitter: "#", facebook: "#" },
    },
    {
      id: 3,
      name: "Asmita Raut",
      role: "Chief Executive Officer",
      bio: "Asmita is a seasoned finance and investment professional with over a decade of experience spanning compliance, business valuation, investment analysis, and strategic business development.",
      bioFull: [
        {
          text: "Asmita Raut is a seasoned finance and investment professional with over a decade of progressively senior experience spanning compliance, business valuation, investment analysis, and strategic business development. As Chief Executive Officer of Finlogic Capital Limited, she provides the firm's day-to-day leadership and drives its mandate to institutionalize private equity practice in Nepal.",
        },
        {
          text: "Asmita began her professional career at I. Dhakal & Associates, a Chartered Accountancy firm, where she served as Compliance Manager and Finance Officer — building a rigorous foundation in regulatory compliance, financial reporting, internal controls, and coordination with audit and regulatory bodies.",
          highlight: "I. Dhakal & Associates",
        },
        {
          text: "She subsequently joined Kairavi Investment Pvt. Ltd. as Chief Valuation Officer, where over approximately five years she led business and asset valuation assignments, reviewed investment proposals, conducted financial analysis, and supported strategic investment decisions — experience that sits directly at the core of Finlogic Capital's deal evaluation function.",
          highlight: "Kairavi Investment Pvt. Ltd.",
        },
        {
          text: "Most recently, she has served as Business Development Analyst at Rock International Pvt. Ltd., managing investment strategies, portfolio performance monitoring, risk assessment, and regulatory compliance.",
        },
        {
          text: "She holds an MBA in Global Business with a CGPA of 3.77 from South Asian Institute of Management, Pokhara University, and a BBA in Marketing with a CGPA of 3.12 from Kathmandu College of Management, Kathmandu University — a dual academic foundation that equips her to bridge analytical rigor with strategic market thinking.",
        },
      ],
      image: "/images/asmita-raut.png",
      social: { linkedin: "#", twitter: "#", facebook: "#" },
    },
    {
      id: 4,
      name: "Suman Subedi",
      role: "Director",
      bio: "Suman is a seasoned financial management professional with over eight years of experience spanning financial structuring, investment management, portfolio oversight, and corporate financial leadership.",
      bioFull: [
        {
          text: "Suman Subedi is a seasoned financial management professional with over eight years of experience spanning financial structuring, investment management, portfolio oversight, and corporate financial leadership. As a Director at Finlogic Capital Limited, he brings deep operational finance expertise and a strong track record of building institutional-grade financial systems within Nepal's investment landscape.",
        },
        {
          text: "Suman has spent eight years at Wealth Bee Investment Pvt. Ltd., progressing from Finance Manager to Chief Financial Officer. As Finance Manager, he established the firm's foundational financial systems, internal controls, and reporting frameworks from the ground up. Elevated to CFO, he took on broader responsibilities including strategic business expansion planning, investment evaluation, portfolio performance monitoring, business and asset valuation, and data-driven decision support for senior management.",
          highlight: "Wealth Bee Investment Pvt. Ltd.",
        },
        {
          text: "Alongside this, Suman has served as Chief Financial Officer at Routine of Nepal for approximately three years, further deepening his experience in corporate financial governance and multi-entity financial oversight.",
        },
        {
          text: "Suman holds a Master of Business Administration (MBA) with a CGPA of 3.32 from Lincoln International College, affiliated to Lincoln University College, Malaysia — with equivalence certified by Tribhuvan University's Curriculum Development Centre. He completed his undergraduate studies with a Bachelor of Business Studies (BBS) from Shanker Dev Campus, Tribhuvan University.",
        },
        {
          text: "His combination of hands-on CFO experience and investment management background makes him a vital contributor to Finlogic Capital's financial governance and operational integrity.",
        },
      ],
      image: "/images/suman-subedi.png",
      social: { linkedin: "#", twitter: "#", facebook: "#" },
    },
    {
      id: 5,
      name: "Anju Bhattarai",
      role: "Director",
      bio: "Anju is a finance and compliance professional with over six years of progressive experience spanning regulatory compliance, financial management, and private equity deal structuring.",
      bioFull: [
        {
          text: "Anju Bhattarai is a finance and compliance professional with over six years of progressive experience spanning regulatory compliance, financial management, investment evaluation, and private equity deal structuring. As a Director at Finlogic Capital Limited, she brings a disciplined, detail-oriented approach to the firm's governance, compliance architecture, and deal evaluation processes.",
        },
        {
          text: "Anju began her career at ANK-Mountain JV, a Kathmandu-based infrastructure joint venture, where she served as Compliance Manager and Finance Officer. In this role, she was responsible for regulatory compliance, financial record management, internal audits, and strengthening reporting systems — building a strong foundation in financial governance and institutional controls.",
          highlight: "ANK-Mountain JV",
        },
        {
          text: "She subsequently joined Mountain Holding and Private Equity Pvt. Ltd. as Deal Evaluation and Valuation Specialist, where she developed deep expertise in evaluating investment opportunities, conducting detailed financial and business valuations, and supporting strategic deal structuring across Nepal's private equity landscape.",
          highlight: "Mountain Holding and Private Equity Pvt. Ltd.",
        },
        {
          text: "Anju holds a Master of Business Studies (MBS) in First Division from Lumbini Banijya Campus, Tribhuvan University, and a Bachelor of Business Administration (BBA) with a CGPA of 3.71 from Kshitiz International College, affiliated to Pokhara University.",
        },
        {
          text: "Her combination of compliance rigor and private equity deal experience positions her as a critical pillar in Finlogic Capital's mission to institutionalize responsible, transparent investment practice in Nepal.",
        },
      ],
      image: "/images/anju-bhattarai.jpg",
      social: { linkedin: "#", twitter: "#", facebook: "#" },
    },
    {
      id: 6,
      name: "Gita Devi Khanal",
      role: "Director",
      bio: "Gita is an investment advisory professional with over eight years of experience providing investment oversight, portfolio analysis, and strategic advisory support across diversified sectors.",
      bioFull: [
        {
          text: "Gita Devi Khanal is an investment advisory professional with over eight years of experience providing investment oversight, portfolio analysis, and strategic advisory support across diversified sectors. As a Director at Finlogic Capital Limited, she contributes a cross-sector investment perspective and a disciplined approach to capital allocation and risk assessment.",
        },
        {
          text: "Gita has served as a Part-Time Investment Consultant at Beta Business Consulting Pvt. Ltd. for more than eight years, where she provided investment advisory and oversight support across subsidiaries operating in financial services, hospitality, real estate, manufacturing, and energy sectors.",
          highlight: "Beta Business Consulting Pvt. Ltd.",
        },
        {
          text: "Her responsibilities spanned evaluation of investment opportunities and sector-wise feasibility analysis, oversight of investment performance across diversified portfolios, business and asset valuation for strategic decision-making, risk assessment and return analysis across multiple industries, capital allocation advisory, and preparation of analytical reports for senior management.",
        },
        {
          text: "Her profile is notable for the breadth of sectoral exposure she brings — spanning industries that closely align with Finlogic Capital's own investment verticals — and for the practical financial acumen she has developed across a sustained long-term advisory engagement.",
        },
        {
          text: "Gita holds a Master of Arts in History and a Bachelor of Arts with Honours in History, both from North-Eastern Hill University, Shillong, India — reflecting an intellectual foundation in analytical thinking and critical inquiry that has translated effectively into her investment advisory career.",
        },
      ],
      image: "/images/gita-devi-khanal.png",
      social: { linkedin: "#", twitter: "#", facebook: "#" },
    },
    {
      id: 7,
      name: "Janak Tiwari",
      role: "Independent Director",
      bio: "Janak is a business development professional with over a decade of experience in client relationship management, strategic planning, and market development.",
      bioFull: [
        {
          text: "Janak Tiwari is a business development professional with over a decade of experience in client relationship management, strategic planning, and market development. As Independent Director at Finlogic Capital Limited, he brings an independent governance perspective and practical business acumen to the firm's board — strengthening oversight, accountability, and strategic direction.",
        },
        {
          text: "Janak has served as Business Development Manager at Mountain Infra Company Limited for over ten years, where he has been responsible for identifying new business opportunities, building and maintaining client relationships, and developing strategic plans to drive company growth.",
          highlight: "Mountain Infra Company Limited",
        },
        {
          text: "His sustained tenure in this role reflects strong market insight, communication capability, and a results-oriented approach to business strategy that complements the investment and governance functions of the Finlogic Capital board.",
        },
        {
          text: "He holds a Bachelor of Commerce from Shobhit University, Meerut, India — with a grounding in financial accounting, cost accounting, auditing, taxation, management accounting, and business law — providing him with a sound commercial and financial literacy foundation.",
        },
        {
          text: "As an Independent Director, Janak fulfills a critical governance role within Finlogic Capital's board structure, providing objective oversight and ensuring that the firm's investment decisions and operational conduct remain aligned with the best interests of its investors and stakeholders.",
        },
      ],
      image: "/images/janak-tiwari.png",
      social: { linkedin: "#", twitter: "#", facebook: "#" },
    },
  ];

  return (
    <div className="bg-background text-foreground min-h-screen theme-transition">
      {/* Hero Section */}
      <section className="relative pt-40 pb-32 overflow-hidden bg-ls-primary text-ls-white">
        <div className="absolute inset-0 z-0 opacity-40 grayscale mix-blend-luminosity">
          <img src="/images/redesign/leadership.png" className="w-full h-full object-cover" alt="About Hero" />
          <div className="absolute inset-0 bg-ls-primary/80" />
        </div>
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <span className="text-sm font-bold uppercase tracking-[0.4em] text-ls-compliment">Our Heritage & Vision</span>
            <h1 className="text-6xl md:text-8xl font-serif font-light leading-tight">Institutionalizing <br /> Opportunity</h1>
            <p className="text-xl text-ls-white/70 max-w-2xl leading-relaxed md:text-2xl font-light">
              Founded on the intersection of visionary foresight and disciplined wisdom, we are Nepal's premier private equity partner.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Intro & Story Section */}
      <section className="py-32 lg:py-48">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
            <div className="lg:col-span-5 space-y-10">
              <h2 className="text-sm font-bold uppercase tracking-[0.4em] text-ls-compliment">Who We Are</h2>
              <h3 className="text-5xl font-serif font-light leading-tight">Bridging Kathmandu <br /> with Global Capital</h3>
              <p className="text-xl text-text-muted leading-relaxed">
                Finlogic Capital Limited is a Kathmandu-based private equity firm institutionalizing deal origination, evaluation, and capital deployment across high-growth emerging sectors.
              </p>
            </div>
            <div className="lg:col-span-7 space-y-12 text-lg text-text-muted leading-relaxed">
              <p>
                Finlogic Capital was born from a simple observation: the most successful investments are not just about numbers; they are about vision, relationships, and timing. Our founder, <span className="text-ls-secondary font-bold">Santosh Poudel</span>, spent years studying the patterns of successful businesses and the deeper principles that drive sustainable growth.
              </p>
              <p>
                Since our inception, we have remained true to that vision – backing exceptional entrepreneurs, uncovering hidden opportunities, and building lasting partnerships with our investors. Our name reflects our approach: <span className="text-ls-secondary font-bold">Fin</span> for finance, <span className="text-ls-secondary font-bold">logic</span> for the disciplined, insight-driven process we apply to every decision.
              </p>
              <div className="pt-6">
                <div className="h-px w-24 bg-ls-compliment" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values Grid */}
      <section className="py-32 bg-ls-primary text-ls-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-24 space-y-6">
            <span className="text-sm font-bold uppercase tracking-[0.4em] text-ls-compliment">Our Foundation</span>
            <h2 className="text-5xl font-serif font-light">Core Values & Mission</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-ls-white/10">
            {values.map((v, i) => (
              <div key={i} className="bg-ls-primary p-12 transition-all hover:bg-ls-supporting/20 group">
                <div className="mb-8 text-ls-compliment opacity-60 group-hover:opacity-100 transition-opacity">
                  {v.icon}
                </div>
                <h3 className="text-2xl font-serif font-light mb-4">{v.title}</h3>
                <p className="text-ls-white/50 group-hover:text-ls-white/70 transition-colors leading-relaxed">
                  {v.description}
                </p>
              </div>
            ))}
            {/* Mission as the 6th block */}
            <div className="bg-ls-primary p-12 lg:col-span-1 border-t md:border-t-0 border-ls-white/10">
              <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-ls-compliment mb-6">Our Mission</h3>
              <p className="text-2xl font-serif font-light italic leading-relaxed">
                "To generate exceptional risk-adjusted returns by identifying and nurturing visionary businesses across South Asia."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Grid - Editorial Style */}
      <section className="py-32 lg:py-48">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-24 flex flex-col items-end justify-between md:flex-row md:items-center border-b border-border-theme pb-12">
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-[0.4em] text-ls-compliment">The Collective</h2>
              <h3 className="text-5xl font-serif font-light md:text-7xl">Our Leadership</h3>
            </div>
            <p className="max-w-xs text-text-muted text-sm italic mt-6 md:mt-0">
              A diverse team of financial experts, strategists, and visionary leaders dedicated to Nepal's growth.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {teamMembers.map((member) => (
              <motion.div
                key={member.id}
                layoutId={`member-container-${member.id}`}
                className="group cursor-pointer space-y-6"
                onClick={() => setSelectedMember(member)}
              >
                <div className="relative aspect-[3/4] overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-ls-primary/10 group-hover:bg-transparent transition-colors" />

                  {/* Social Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-gradient-to-t from-ls-primary/80 to-transparent flex justify-center gap-6">
                    <a
                      href={member.social.linkedin}
                      onClick={(e) => e.stopPropagation()}
                      className="text-ls-white hover:text-ls-compliment transition-colors"
                    >
                      <Linkedin size={20} />
                    </a>
                    <a
                      href={member.social.facebook}
                      onClick={(e) => e.stopPropagation()}
                      className="text-ls-white hover:text-ls-compliment transition-colors"
                    >
                      <Facebook size={20} />
                    </a>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-serif font-light group-hover:text-ls-compliment transition-colors">{member.name}</h3>
                  <p className="text-text-muted text-xs font-bold uppercase tracking-[0.2em]">{member.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Advisory Board Section */}
      <section className="py-32 bg-ls-primary text-ls-white border-t border-ls-white/5">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-[0.4em] text-ls-compliment">Strategic Guidance</h2>
            <h3 className="text-5xl font-serif font-light leading-tight">Advisory Board</h3>
          </div>

          <div className="flex flex-wrap justify-center gap-16 md:gap-32">
            {advisoryBoard.map((member, idx) => (
              <div key={idx} className="group space-y-6 text-center">
                <div className="text-2xl md:text-3xl font-serif font-light tracking-widest text-ls-white/80 group-hover:text-ls-white transition-colors duration-500">
                  {member.name}
                </div>
                <div className="flex justify-center gap-6 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                  {member.social.linkedin && (
                    <a href={member.social.linkedin} target="_blank" rel="noopener noreferrer" className="text-ls-compliment hover:text-ls-white transition-colors">
                      <Linkedin size={20} />
                    </a>
                  )}
                  {member.social.facebook && (
                    <a href={member.social.facebook} target="_blank" rel="noopener noreferrer" className="text-ls-compliment hover:text-ls-white transition-colors">
                      <Facebook size={20} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
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
              className="absolute inset-0 bg-ls-primary/90 backdrop-blur-2xl"
            />

            <motion.div
              layoutId={`member-container-${selectedMember.id}`}
              className="bg-background max-w-5xl w-full rounded-none overflow-hidden relative z-10 grid grid-cols-1 md:grid-cols-2 shadow-2xl"
            >
              <div className="aspect-[3/4] md:aspect-auto grayscale">
                <img
                  src={selectedMember.image}
                  alt={selectedMember.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-10 md:p-16 flex flex-col justify-center relative">
                <button
                  onClick={() => setSelectedMember(null)}
                  className="absolute top-8 right-8 p-3 hover:bg-ls-primary/5 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="mb-10 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-[0.3em] text-ls-compliment">Executive Leadership</span>
                  <h3 className="text-4xl md:text-5xl font-serif font-light">{selectedMember.name}</h3>
                  <p className="text-ls-primary font-bold uppercase tracking-widest text-xs">{selectedMember.role}</p>
                </div>
                <div className="space-y-6 text-text-muted leading-relaxed mb-12 max-h-[40vh] overflow-y-auto pr-6 scrollbar-thin">
                  {selectedMember.bioFull
                    ? selectedMember.bioFull.map((para, i) => (
                      <p key={i} className="text-lg">
                        {para.highlight
                          ? para.text.split(para.highlight).map((part, j, arr) =>
                            j < arr.length - 1 ? (
                              <span key={j}>
                                {part}
                                <span className="text-ls-primary font-bold">{para.highlight}</span>
                              </span>
                            ) : (
                              part
                            )
                          )
                          : para.text}
                      </p>
                    ))
                    : <p className="text-lg">{selectedMember.bio}</p>
                  }
                </div>
                <div className="flex space-x-6">
                  <a href={selectedMember.social.linkedin} target="_blank" rel="noopener noreferrer" className="text-ls-primary hover:text-ls-compliment transition-colors">
                    <Linkedin className="w-6 h-6" />
                  </a>
                  <a href={selectedMember.social.facebook} target="_blank" rel="noopener noreferrer" className="text-ls-primary hover:text-ls-compliment transition-colors">
                    <Facebook className="w-6 h-6" />
                  </a>
                  <a href={selectedMember.social.twitter} target="_blank" rel="noopener noreferrer" className="text-ls-primary hover:text-ls-compliment transition-colors">
                    <Twitter className="w-6 h-6" />
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
