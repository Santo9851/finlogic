"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import ArticleCard from "@/components/insights/ArticleCard";
import CategoryFilter from "@/components/insights/CategoryFilter";
import SearchBar from "@/components/insights/SearchBar";
import Pagination from "@/components/insights/Pagination";

// Comprehensive mock data
const allArticles = [
  {
    slug: "south-asian-pe-beyond-tier-1",
    title: "Private Equity Trends in South Asia: Beyond the Tier-1 Cities",
    excerpt: "An in-depth analysis of emerging investment opportunities in secondary markets across Nepal, India, and Bangladesh as tech infrastructure bridges the urban-rural divide.",
    pillar: "Deep Insight",
    author: "Santosh Poudel",
    date: "Oct 12, 2023",
    image: "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=1200",
  },
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
    excerpt: "A legal and strategic primer for structuring foreign direct investments in transitioning markets like Nepal.",
    pillar: "Harmonious Partnerships",
    author: "Legal Advisory",
    date: "Aug 30, 2023",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=600",
  },
  {
    slug: "leadership-in-crisis",
    title: "Leadership in Crisis: Lessons from Resilient Founders",
    excerpt: "Case studies of South Asian founders who successfully navigated macroeconomic shocks.",
    pillar: "Leadership Activation",
    author: "Santosh Poudel",
    date: "Aug 12, 2023",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=600",
  },
  {
    slug: "fintech-himalayas",
    title: "Financial Inclusion: The Next Frontier of Himalayan FinTech",
    excerpt: "Mapping the unbanked population and the startups creating bespoke structural solutions.",
    pillar: "Unconventional Vision",
    author: "Research Team",
    date: "Jul 22, 2023",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=600",
  }
];

const categories = ["All", "Unconventional Vision", "Wisdom-Backed Growth", "Leadership Activation", "Deep Insight", "Harmonious Partnerships"];
const ITEMS_PER_PAGE = 6;

export default function ArticlesListPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter Logic
  const filteredArticles = allArticles.filter(article => {
    const matchesCategory = activeCategory === "All" || article.pillar === activeCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE);
  const currentArticles = filteredArticles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setCurrentPage(1);
  };
  
  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  return (
    <div className="bg-ls-primary text-ls-white min-h-screen">
      
      {/* Header */}
      <section className="pt-32 pb-12 bg-ls-supporting/5 border-b border-ls-supporting/10">
        <div className="container mx-auto px-4 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Articles & Research</h1>
          <p className="text-xl text-ls-white/60 mb-8 max-w-2xl">
            Explore our latest market analysis, white papers, and essays on building enduring businesses in emerging markets.
          </p>
          
          <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
            <CategoryFilter 
              categories={categories} 
              activeCategory={activeCategory} 
              onCategoryChange={handleCategoryChange} 
            />
            <SearchBar 
              placeholder="Search articles..." 
              value={searchQuery} 
              onChange={handleSearchChange} 
            />
          </div>
        </div>
      </section>

      {/* Article Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-20 opacity-50">
               <Search className="w-12 h-12 mx-auto mb-4" />
               <h3 className="text-xl font-bold">No articles found</h3>
               <p>Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentArticles.map((article, i) => (
                <motion.div
                  key={article.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <ArticleCard article={article} />
                </motion.div>
              ))}
            </div>
          )}

          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </section>
    </div>
  );
}
