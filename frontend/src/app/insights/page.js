"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, BookOpen, Video, FileText, Bookmark } from "lucide-react";
import ArticleCard from "@/components/insights/ArticleCard";
import CourseCard from "@/components/insights/CourseCard";
import WebinarCard from "@/components/insights/WebinarCard";

// Mock Data for the Landing Page
const featuredArticle = {
  slug: "south-asian-pe-beyond-tier-1",
  title: "Private Equity Trends in South Asia: Beyond the Tier-1 Cities",
  excerpt: "An in-depth analysis of emerging investment opportunities in secondary markets across Nepal, India, and Bangladesh as tech infrastructure bridges the urban-rural divide.",
  pillar: "Deep Insight",
  author: "Santosh Poudel",
  date: "Oct 12, 2023",
  image: "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=1200",
};

const recentArticles = [
  {
    slug: "tech-enabled-infrastructure-nepal",
    title: "The Rise of Tech-Enabled Infrastructure in Nepal",
    excerpt: "How digital logistics and renewable energy micro-grids are reshaping the Himalayan economic landscape.",
    pillar: "Unconventional Vision",
    author: "Research Team",
    date: "Sep 28, 2023",
    image: "https://images.unsplash.com/photo-1588661849141-8ddfdf5e7ec9?auto=format&fit=crop&q=80&w=600",
  },
  {
    slug: "sustainable-scaling-wisdom",
    title: "Sustainable Scaling: Bridging Himalayan Traditions with Modern Venture Capital",
    excerpt: "Applying principles of patience and community alignment to build modern, hyper-growth startups.",
    pillar: "Wisdom-Backed Growth",
    author: "Investment Committee",
    date: "Sep 15, 2023",
    image: "https://images.unsplash.com/photo-1526715006943-4e83c2a6d71b?auto=format&fit=crop&q=80&w=600",
  },
  {
    slug: "cross-border-frameworks",
    title: "Cross-Border Investment Frameworks for Emerging Economies",
    excerpt: "A legal and strategic primer for structuring foreign direct investments in transitioning markets.",
    pillar: "Harmonious Partnerships",
    author: "Legal Advisory",
    date: "Aug 30, 2023",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=600",
  }
];

const upcomingWebinar = {
  slug: "navigating-regulatory-shifts",
  title: "Navigating Regulatory Shifts in South Asian Tech Investments",
  description: "Join our panel of legal experts and managing partners as they decode recent policy changes affecting foreign investments in the region.",
  speaker: "Sumanth Rai & Legal Partners",
  date: "Nov 15, 2023",
  time: "14:00 NPT",
  registrationUrl: "#register",
  image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=600",
};

const popularCourses = [
  {
    slug: "foundations-of-patient-capital",
    title: "Foundations of Patient Capital",
    description: "Learn how to structure your business model to attract long-term, value-aligned investors rather than quick exit seekers.",
    level: "Beginner",
    duration: "4 Weeks",
    modules: 6,
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600",
  },
  {
    slug: "due-diligence-masterclass",
    title: "The Founders Guide to Institutional Due Diligence",
    description: "A comprehensive walkthrough of the financial, operational, and psychological metrics leading PE firms evaluate.",
    level: "Advanced",
    duration: "6 Weeks",
    modules: 10,
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=600",
  }
];

const categories = [
  { name: "Articles", icon: <FileText className="w-5 h-5 mb-3" />, link: "/insights/articles", desc: "Deep-dives and market research" },
  { name: "Courses", icon: <BookOpen className="w-5 h-5 mb-3" />, link: "/insights/courses", desc: "Structured learning paths" },
  { name: "Webinars", icon: <Video className="w-5 h-5 mb-3" />, link: "/insights/webinars", desc: "Live sessions and recordings" },
  { name: "Frameworks", icon: <Bookmark className="w-5 h-5 mb-3" />, link: "/insights/articles?category=frameworks", desc: "Proprietary investment models" },
];

export default function InsightsLandingPage() {
  return (
    <div className="bg-ls-primary text-ls-white min-h-screen pb-24">
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-abstract-gradient opacity-20 pointer-events-none" />
        <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1 rounded-full bg-ls-compliment/10 text-ls-compliment text-sm font-bold uppercase tracking-widest mb-6"
          >
            Knowledge Center
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            The Wisdom Hub
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-ls-white/70 max-w-2xl mx-auto mb-16"
          >
            Where visionary thinking meets rigorous analysis. Explore our proprietary research, educational courses, and exclusive webinars.
          </motion.p>
          
          {/* Quick Category Navigation */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            {categories.map((cat, i) => (
               <Link key={i} href={cat.link} className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center text-center group hover:bg-ls-supporting/30 border border-ls-supporting/20 hover:border-ls-compliment/50 transition-all hover:-translate-y-1">
                 <div className="text-ls-compliment group-hover:scale-110 transition-transform">{cat.icon}</div>
                 <h3 className="font-bold text-lg leading-tight mb-1">{cat.name}</h3>
                 <p className="text-xs text-ls-white/50">{cat.desc}</p>
               </Link>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Content Slider (Simplified for Landing) */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
           <Link href={`/insights/articles/${featuredArticle.slug}`} className="relative block w-full rounded-[2rem] overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-t from-ls-primary via-ls-primary/60 to-transparent z-10" />
              <img src={featuredArticle.image} alt={featuredArticle.title} className="w-full aspect-video md:aspect-[21/9] object-cover filter brightness-[0.8] group-hover:scale-105 transition-transform duration-700" />
              
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 z-20">
                 <div className="inline-block px-3 py-1 rounded-full bg-ls-compliment text-ls-primary text-xs font-bold uppercase tracking-widest mb-6">
                   Featured Research
                 </div>
                 <h2 className="text-3xl md:text-5xl font-bold mb-4 max-w-4xl group-hover:text-ls-compliment transition-colors">{featuredArticle.title}</h2>
                 <p className="text-lg text-ls-white/70 max-w-3xl mb-8 line-clamp-2 md:line-clamp-none">{featuredArticle.excerpt}</p>
                 <div className="flex items-center text-sm font-bold text-ls-compliment">
                   Read Full Paper <ArrowRight className="ml-2 w-4 h-4 transform group-hover:translate-x-2 transition-transform" />
                 </div>
              </div>
           </Link>
        </div>
      </section>

      {/* Recent Articles Grid */}
      <section className="py-16">
         <div className="container mx-auto px-4 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12">
               <div>
                  <h2 className="text-3xl font-bold mb-2">Latest Insights</h2>
                  <p className="text-ls-white/60">Emerging trends and timeless principles.</p>
               </div>
               <Link href="/insights/articles" className="mt-4 md:mt-0 flex items-center font-bold text-ls-compliment hover:text-ls-white transition-colors">
                 View All Articles <ArrowRight className="ml-2 w-5 h-5" />
               </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {recentArticles.map((article, i) => (
                 <ArticleCard key={i} article={article} />
               ))}
            </div>
         </div>
      </section>

      {/* Webinars Row */}
      <section className="py-16 bg-ls-supporting/5 border-y border-ls-supporting/10">
         <div className="container mx-auto px-4 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12">
               <div>
                  <h2 className="text-3xl font-bold mb-2">Exclusive Webinars</h2>
                  <p className="text-ls-white/60">Live sessions with industry leaders and our investment committee.</p>
               </div>
               <Link href="/insights/webinars" className="mt-4 md:mt-0 flex items-center font-bold text-ls-compliment hover:text-ls-white transition-colors">
                 View Webinar Library <ArrowRight className="ml-2 w-5 h-5" />
               </Link>
            </div>
            
            <div className="w-full">
               <WebinarCard webinar={upcomingWebinar} />
            </div>
         </div>
      </section>

      {/* Popular Courses Grid */}
      <section className="py-16">
         <div className="container mx-auto px-4 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12">
               <div>
                  <h2 className="text-3xl font-bold mb-2">Featured Courses</h2>
                  <p className="text-ls-white/60">Structured learning for visionary founders.</p>
               </div>
               <Link href="/insights/courses" className="mt-4 md:mt-0 flex items-center font-bold text-ls-compliment hover:text-ls-white transition-colors">
                 Explore Campus <ArrowRight className="ml-2 w-5 h-5" />
               </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {popularCourses.map((course, i) => (
                 <CourseCard key={i} course={course} />
               ))}
            </div>
         </div>
      </section>
    </div>
  );
}
