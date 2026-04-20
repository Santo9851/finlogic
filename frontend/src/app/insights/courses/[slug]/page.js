"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Clock, BookOpen, ChevronDown, CheckCircle, Video, FileText, ShieldCheck, User } from "lucide-react";
import Link from "next/link";

// Mock Data for a single course
const courseData = {
  slug: "foundations-of-patient-capital",
  title: "Foundations of Patient Capital",
  description: "Learn how to structure your business model to attract long-term, value-aligned investors rather than quick exit seekers. This course fundamentally reframes how founders in emerging markets view growth, capitalization, and eventual liquidation.",
  level: "Beginner",
  duration: "4 Weeks",
  modules: 4,
  pillar: "Wisdom-Backed Growth",
  image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1200",
  instructor: {
     name: "Santosh Poudel",
     role: "Founder & Managing Partner",
     avatar: "https://randomuser.me/api/portraits/men/44.jpg" 
  },
  curriculum: [
    {
      title: "Module 1: The Psychology of Patient Capital",
      lessons: [
        { type: "video", title: "Why fast isn't always good (15 mins)", completed: false },
        { type: "reading", title: "Case Study: The 100-Year Strategy (10 mins)", completed: false }
      ]
    },
    {
      title: "Module 2: Structuring for Endurance",
      lessons: [
        { type: "video", title: "Cap table management for the long haul (20 mins)", completed: false },
        { type: "quiz", title: "Identify structural weaknesses", completed: false }
      ]
    },
    {
      title: "Module 3: Aligning Stakeholder Incentives",
      lessons: [
        { type: "reading", title: "The 'Harmonious Partnership' Matrix (15 mins)", completed: false },
        { type: "video", title: "Drafting term sheets that protect vision (25 mins)", completed: false }
      ]
    },
    {
      title: "Module 4: Exit Strategies vs. Legacy Building",
      lessons: [
        { type: "video", title: "Knowing when (and if) to sell (18 mins)", completed: false },
        { type: "reading", title: "Final Assessment & Reflection", completed: false }
      ]
    }
  ]
};

function CurriculumAccordion({ module, index }) {
  const [isOpen, setIsOpen] = useState(index === 0);

  return (
    <div className="border border-ls-supporting/20 rounded-2xl mb-4 overflow-hidden bg-ls-supporting/5 pb-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between text-left group"
      >
        <span className="text-xl font-bold group-hover:text-ls-compliment transition-colors">{module.title}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="text-ls-white/40"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 pt-0 space-y-3">
               {module.lessons.map((lesson, idx) => (
                 <div key={idx} className="flex items-center p-3 rounded-lg hover:bg-ls-supporting/10 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-ls-primary/50 flex items-center justify-center mr-4 shrink-0 border border-ls-supporting/20">
                       {lesson.type === 'video' && <Video className="w-4 h-4 text-ls-white/60" />}
                       {lesson.type === 'reading' && <FileText className="w-4 h-4 text-ls-white/60" />}
                       {lesson.type === 'quiz' && <ShieldCheck className="w-4 h-4 text-ls-white/60" />}
                    </div>
                    <span className="text-sm font-medium text-ls-white/80">{lesson.title}</span>
                 </div>
               ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CourseDetailPage({ params }) {
  const { slug } = params;

  return (
    <div className="bg-ls-primary text-ls-white min-h-screen">
      
      {/* Dynamic Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
           <img src={courseData.image} alt={courseData.title} className="w-full h-full object-cover filter brightness-[0.25]" />
           <div className="absolute inset-0 bg-gradient-to-t from-ls-primary via-ls-primary/80 to-transparent" />
        </div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10 flex flex-col lg:flex-row gap-12 lg:items-end">
           <div className="flex-grow">
              <Link href="/insights/courses" className="inline-flex items-center text-ls-white/50 hover:text-ls-compliment mb-8 transition-colors">
                 <ArrowLeft className="w-4 h-4 mr-2" /> Back to Campus
              </Link>
              <div className="flex flex-wrap gap-3 mb-6">
                 <span className="px-3 py-1 rounded-full bg-ls-compliment/20 text-ls-compliment text-xs font-bold uppercase tracking-widest border border-ls-compliment/30">
                   {courseData.pillar}
                 </span>
                 <span className="px-3 py-1 rounded-full bg-ls-white/10 text-ls-white text-xs font-bold uppercase tracking-widest border border-ls-white/10">
                   {courseData.level}
                 </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 max-w-3xl leading-tight">
                 {courseData.title}
              </h1>
              <p className="text-xl text-ls-white/80 max-w-2xl leading-relaxed mb-8">
                 {courseData.description}
              </p>
              
              <div className="flex flex-wrap gap-6 text-sm font-bold text-ls-white/60 bg-ls-supporting/20 p-4 rounded-xl border border-ls-supporting/30 inline-flex shadow-xl backdrop-blur-md">
                 <div className="flex items-center"><Clock className="w-5 h-5 mr-2 text-ls-compliment" />{courseData.duration}</div>
                 <div className="flex items-center"><BookOpen className="w-5 h-5 mr-2 text-ls-compliment" />{courseData.modules} Modules</div>
              </div>
           </div>

           {/* Sticky Enrollment Card Placeholder */}
           <div className="lg:w-[400px] shrink-0">
             <div className="glass-card p-8 rounded-3xl border border-ls-compliment/30 shadow-[0_0_30px_rgba(245,159,1,0.1)] relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-ls-compliment/20 rounded-full blur-3xl pointer-events-none" />
                <h3 className="text-2xl font-bold mb-2">Ready to scale?</h3>
                <p className="text-sm text-ls-white/60 mb-8">Enroll now to access proprietary frameworks and join the community.</p>
                
                <ul className="space-y-4 mb-8">
                   <li className="flex items-start text-sm"><CheckCircle className="w-5 h-5 text-ls-up mr-3 shrink-0" /> Full lifetime access</li>
                   <li className="flex items-start text-sm"><CheckCircle className="w-5 h-5 text-ls-up mr-3 shrink-0" /> Certificate of completion</li>
                   <li className="flex items-start text-sm"><CheckCircle className="w-5 h-5 text-ls-up mr-3 shrink-0" /> Direct Q&A with instructor</li>
                </ul>

                <button className="w-full py-4 rounded-xl bg-ls-compliment text-ls-primary font-bold text-lg hover:scale-[1.02] transition-transform active:scale-95 shadow-lg shadow-ls-compliment/20">
                   Enroll in Course
                </button>
             </div>
           </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-8 flex flex-col lg:flex-row gap-16">
           
           {/* Curriculum Section */}
           <div className="w-full lg:w-2/3">
              <h2 className="text-3xl font-bold mb-8">Course Curriculum</h2>
              <div className="space-y-4">
                 {courseData.curriculum.map((module, i) => (
                    <CurriculumAccordion key={i} module={module} index={i} />
                 ))}
              </div>
           </div>

           {/* Instructor Sidebar */}
           <div className="w-full lg:w-1/3">
              <h2 className="text-2xl font-bold mb-8">Your Instructor</h2>
              <div className="glass-card p-8 rounded-3xl text-center">
                 <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-ls-supporting/30 mb-6 bg-ls-white/5 flex items-center justify-center">
                    {courseData.instructor.avatar ? (
                      <img src={courseData.instructor.avatar} alt={courseData.instructor.name} className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-500" />
                    ) : (
                      <User className="w-16 h-16 text-ls-white/20" />
                    )}
                 </div>
                 <h3 className="text-xl font-bold mb-2">{courseData.instructor.name}</h3>
                 <p className="text-sm font-bold text-ls-compliment uppercase tracking-widest mb-6">{courseData.instructor.role}</p>
                 <p className="text-sm text-ls-white/70 leading-relaxed text-left">
                   Santosh brings a unique blend of formal financial training and deep philosophical inquiry to the venture capital space, drawing on decades of experience in emerging markets.
                 </p>
              </div>
           </div>

        </div>
      </section>

    </div>
  );
}
