"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, CheckCircle, Clock } from "lucide-react";
import CategoryFilter from "@/components/insights/CategoryFilter";
import SearchBar from "@/components/insights/SearchBar";
import CourseCard from "@/components/insights/CourseCard";

const allCourses = [
  {
    slug: "foundations-of-patient-capital",
    title: "Foundations of Patient Capital",
    description: "Learn how to structure your business model to attract long-term, value-aligned investors rather than quick exit seekers.",
    level: "Beginner",
    duration: "4 Weeks",
    modules: 6,
    pillar: "Wisdom-Backed Growth",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600",
  },
  {
    slug: "due-diligence-masterclass",
    title: "The Founders Guide to Institutional Due Diligence",
    description: "A comprehensive walkthrough of the financial, operational, and psychological metrics leading PE firms evaluate.",
    level: "Advanced",
    duration: "6 Weeks",
    modules: 10,
    pillar: "Deep Insight",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=600",
  },
  {
    slug: "unconventional-market-entry",
    title: "Playbook: Unconventional Market Entry",
    description: "Frameworks for identifying and scaling in overlooked geographies and niche sectors across South Asia.",
    level: "Intermediate",
    duration: "3 Weeks",
    modules: 5,
    pillar: "Unconventional Vision",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600",
  },
  {
    slug: "himalayan-leadership-dynamics",
    title: "Resilient Leadership Dynamics",
    description: "Cultivating grit, emotional intelligence, and clear vision tailored for managing hardware and deep-tech teams.",
    level: "All Levels",
    duration: "2 Weeks",
    modules: 4,
    pillar: "Leadership Activation",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=600",
  }
];

const categories = ["All", "Beginner", "Intermediate", "Advanced", "All Levels"];

export default function CoursesListPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter Logic
  const filteredCourses = allCourses.filter(course => {
    const matchesCategory = activeCategory === "All" || course.level === activeCategory;
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          course.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-ls-primary text-ls-white min-h-screen">
      
      {/* Header */}
      <section className="pt-32 pb-12 bg-ls-supporting/5 border-b border-ls-supporting/10 relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Finlogic Campus</h1>
          <p className="text-xl text-ls-white/60 mb-8 max-w-2xl">
            Structured, proprietary courses designed to prepare founders for institutional capital and sustainable scale.
          </p>
          
          <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-ls-white/40 uppercase tracking-widest hidden md:block">Level:</span>
              <CategoryFilter 
                categories={categories} 
                activeCategory={activeCategory} 
                onCategoryChange={setActiveCategory} 
              />
            </div>
            <SearchBar 
              placeholder="Search curriculum..." 
              value={searchQuery} 
              onChange={setSearchQuery} 
            />
          </div>
        </div>
      </section>

      {/* Course Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          {filteredCourses.length === 0 ? (
            <div className="text-center py-20 opacity-50">
               <Search className="w-12 h-12 mx-auto mb-4" />
               <h3 className="text-xl font-bold">No courses found</h3>
               <p>Try adjusting your search or level filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              {filteredCourses.map((course, i) => (
                <motion.div
                  key={course.slug}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <CourseCard course={course} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* Bottom Teaser */}
      <section className="py-16 text-center border-t border-ls-supporting/10">
         <h2 className="text-2xl font-bold mb-4">Looking for customized workshops?</h2>
         <p className="text-ls-white/60 mb-8 max-w-lg mx-auto">We offer bespoke training sessions for portfolio companies and partner institutions.</p>
         <button className="px-8 py-3 rounded-full border border-ls-compliment text-ls-compliment hover:bg-ls-compliment hover:text-ls-primary font-bold transition-all">
           Contact Advisory Team
         </button>
      </section>
    </div>
  );
}
