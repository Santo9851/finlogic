"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Clock, User, Share2, Linkedin, Twitter } from "lucide-react";
import Link from "next/link";
import ArticleCard from "@/components/insights/ArticleCard";

// Mock Data for a single article
const articleData = {
  slug: "south-asian-pe-beyond-tier-1",
  title: "Private Equity Trends in South Asia: Beyond the Tier-1 Cities",
  pillar: "Deep Insight",
  author: "Santosh Poudel",
  date: "Oct 12, 2023",
  readTime: "8 min read",
  image: "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=1200",
  content: `
    <h3>Introduction</h3>
    <p>The narrative of South Asian economic growth has long been dominated by its tier-1 mega-cities. Hubs like Mumbai, Bangalore, and increasingly Kathmandu, serve as the visible locus of technological and financial innovation. However, a silent revolution is brewing beyond these metropolitan borders. Driven by rapid digital penetration, improved infrastructure, and a burgeoning middle class, tier-2 and tier-3 cities are emerging as the new frontiers for private equity.</p>
    
    <h3>The Infrastructure Catalyst</h3>
    <p>Our recent analysis of cross-border capital flows indicates a structural shift. The deployment of tech-enabled infrastructure—from digital payment rails to renewable energy micro-grids—has effectively collapsed the geographic distance between markets. In Nepal, for instance, localized agritech and logistics platforms are demonstrating unit economics that rival, and sometimes surpass, their urban counterparts.</p>
    
    <blockquote>
      "The true alpha in the next decade of South Asian private equity won't come from fighting for deals in saturated capitals, but from identifying the silent compounders in secondary markets."
    </blockquote>

    <h3>Strategic Implications for Patient Capital</h3>
    <p>Investing in these emerging ecosystems requires a departure from standard Silicon Valley playbooks.</p>
    <ul>
      <li><strong>Hyper-local Nuance:</strong> Supply chains and consumer behaviors are deeply contextual. What works in a tier-1 city may fail completely in a tier-2 hub.</li>
      <li><strong>Governance Engineering:</strong> Many high-potential regional businesses lack institutional governance frameworks. Capital must be paired with operational mentorship.</li>
      <li><strong>Extended Horizons:</strong> Value creation in these markets is structural, not superficial. It requires patient, long-term alignment.</li>
    </ul>

    <h3>Conclusion</h3>
    <p>As the primary markets become increasingly competitive and valuations stretch, the disciplined investor must look where others don't. By applying our 'Deep Insight' framework to these overlooked regions, Finlogic Capital is positioning itself to partner with the next generation of foundational South Asian enterprises.</p>
  `
};

const relatedArticles = [
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
    slug: "cross-border-frameworks",
    title: "Cross-Border Investment Frameworks for Emerging Economies",
    excerpt: "A legal and strategic primer for structuring foreign direct investments in transitioning markets like Nepal.",
    pillar: "Harmonious Partnerships",
    author: "Legal Advisory",
    date: "Aug 30, 2023",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=600",
  }
];

export default function ArticleDetailPage({ params }) {
  // In a real app, you would fetch the article based on params.slug
  const { slug } = params;

  return (
    <div className="bg-ls-primary text-ls-white min-h-screen">
      {/* Progress Bar (Optional nice touch for reading) */}
      <div className="fixed top-0 left-0 w-full h-1 bg-ls-supporting/20 z-50">
        <div className="h-full bg-ls-compliment w-1/3" /> {/* Fixed width for mock, usually controlled by scroll */}
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-24">
        
        {/* Back Link */}
        <Link href="/insights/articles" className="inline-flex items-center text-ls-white/50 hover:text-ls-compliment mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Articles
        </Link>
        
        <div className="max-w-4xl mx-auto">
          {/* Article Header */}
          <header className="mb-12">
            <div className="inline-block px-3 py-1 rounded-full bg-ls-compliment/10 text-ls-compliment text-xs font-bold uppercase tracking-widest mb-6">
              {articleData.pillar}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {articleData.title}
            </h1>
            
            <div className="flex flex-wrap items-center justify-between border-y border-ls-supporting/20 py-4 text-sm text-ls-white/60">
              <div className="flex items-center space-x-6">
                <span className="flex items-center font-bold text-ls-white"><User className="w-4 h-4 mr-2" /> {articleData.author}</span>
                <span className="flex items-center"><Clock className="w-4 h-4 mr-2" /> {articleData.date}</span>
                <span className="flex items-center">{articleData.readTime}</span>
              </div>
              
              <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                <span className="text-xs uppercase tracking-widest mr-2">Share:</span>
                <button className="p-2 rounded-full hover:bg-ls-supporting/20 transition-colors"><Linkedin className="w-4 h-4" /></button>
                <button className="p-2 rounded-full hover:bg-ls-supporting/20 transition-colors"><Twitter className="w-4 h-4" /></button>
              </div>
            </div>
          </header>

          {/* Featured Image */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden mb-12">
            <img src={articleData.image} alt={articleData.title} className="w-full h-full object-cover" />
          </div>

          {/* Article Content */}
          <article 
            className="prose prose-invert prose-lg max-w-none 
                       prose-headings:font-bold prose-headings:text-ls-white 
                       prose-a:text-ls-compliment hover:prose-a:text-ls-compliment/80
                       prose-blockquote:border-ls-compliment prose-blockquote:bg-ls-supporting/5 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:font-medium prose-blockquote:italic
                       prose-li:marker:text-ls-compliment"
            dangerouslySetInnerHTML={{ __html: articleData.content }}
          />

          {/* Author Bio Box */}
          <div className="mt-16 p-8 rounded-2xl bg-ls-supporting/5 border border-ls-supporting/10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
             <div className="w-20 h-20 rounded-full bg-ls-supporting/20 flex items-center justify-center shrink-0 border border-ls-compliment/20">
               <User className="w-10 h-10 text-ls-compliment" />
             </div>
             <div>
               <h4 className="text-xl font-bold mb-2">About the Author: {articleData.author}</h4>
               <p className="text-ls-white/70 text-sm leading-relaxed">
                 Santosh brings decades of experience bridging traditional wisdom with modern venture capital frameworks across South Asia. Currently focusing on deep-tech integration within regional supply chains.
               </p>
             </div>
          </div>
        </div>
      </div>

      {/* Related Articles Section */}
      <section className="py-24 bg-ls-supporting/5 border-t border-ls-supporting/10">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold">Related Insights</h2>
            <Link href="/insights/articles" className="text-ls-compliment font-bold hover:text-ls-white transition-colors">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {relatedArticles.map((article, i) => (
              <ArticleCard key={i} article={article} />
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
