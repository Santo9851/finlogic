"use client";
import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Clock, BookOpen, ChevronDown, CheckCircle, 
  Video, FileText, ShieldCheck, User, Sparkles, Star 
} from "lucide-react";
import Link from "next/link";
import { fetchCourse, PILLAR_COLORS } from "@/services/insights";
import { useAuth } from "@/lib/AuthContext";

function CurriculumAccordion({ module, index }) {
  const [isOpen, setIsOpen] = useState(index === 0);
  const lessons = module.lessons || [];

  return (
    <div className="border border-white/5 rounded-3xl mb-4 overflow-hidden bg-white/[0.02]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between text-left group transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-xs font-black text-white/20">
            {index + 1}
          </div>
          <div>
            <span className="text-xl font-bold group-hover:text-[#F59F01] transition-colors">{module.title}</span>
            <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">{lessons.length} Lessons</p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="text-white/20"
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
            <div className="p-6 pt-0 space-y-2 ml-14">
               {lessons.map((lesson, idx) => (
                 <div key={idx} className="flex items-center p-3 rounded-xl hover:bg-white/5 transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mr-4 shrink-0 border border-white/5 group-hover:border-[#F59F01]/20">
                       {lesson.type === 'video' ? <Video size={14} className="text-white/40" /> : <FileText size={14} className="text-white/40" />}
                    </div>
                    <span className="text-sm font-medium text-white/60 group-hover:text-white transition-colors">{lesson.title}</span>
                 </div>
               ))}
               {lessons.length === 0 && <p className="text-xs text-white/20 italic p-3">No lessons added yet.</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CourseDetailPage({ params }) {
  const { slug } = use(params);
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchCourse(slug);
        setCourse(data);
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    if (slug) {
      window.scrollTo(0, 0);
      load();
    }
  }, [slug]);

  if (loading) return (
    <div className="bg-[#100226] min-h-screen pt-32 flex justify-center">
      <div className="animate-pulse space-y-8 w-full max-w-6xl px-4">
        <div className="h-12 w-1/3 bg-white/5 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="h-96 bg-white/5 rounded-[3rem]" />
          <div className="space-y-4">
            <div className="h-8 w-full bg-white/5 rounded-xl" />
            <div className="h-8 w-5/6 bg-white/5 rounded-xl" />
            <div className="h-32 w-full bg-white/5 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );

  if (error || !course) return (
    <div className="bg-[#100226] min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-white/40 mb-4">Course not found.</p>
        <Link href="/insights" className="text-[#F59F01] font-bold">← Back to Campus</Link>
      </div>
    </div>
  );

  const color = PILLAR_COLORS[course.pillar?.toLowerCase()] || "#F59F01";

  return (
    <div className="bg-[#100226] text-white min-h-screen pb-24">
      
      {/* Dynamic Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
           {course.featured_image ? (
             <img src={course.featured_image} alt={course.title} className="w-full h-full object-cover filter brightness-[0.2]" />
           ) : (
             <div className="w-full h-full bg-[#1A0B36]" />
           )}
           <div className="absolute inset-0 bg-gradient-to-t from-[#100226] via-[#100226]/80 to-transparent" />
        </div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
           <Link href="/insights" className="inline-flex items-center gap-2 text-white/40 hover:text-[#F59F01] mb-12 transition-colors text-sm">
              <ArrowLeft size={16} /> Back to Insights
           </Link>
           
           <div className="flex flex-col lg:flex-row gap-16 lg:items-center">
              <div className="flex-grow">
                 <div className="flex flex-wrap gap-3 mb-8">
                    <span className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border"
                          style={{ background: `${color}15`, color, borderColor: `${color}30` }}>
                      {course.pillar}
                    </span>
                    <span className="px-4 py-1 rounded-full bg-white/5 text-white/60 text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">
                      {course.level}
                    </span>
                 </div>
                 <h1 className="text-4xl md:text-7xl font-black mb-8 leading-[1.1] tracking-tight">
                    {course.title}
                 </h1>
                 <p className="text-xl text-white/50 max-w-2xl leading-relaxed mb-12">
                    {course.description}
                 </p>
                 
                 <div className="flex flex-wrap gap-8">
                    <div className="flex items-center gap-3">
                       <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#F59F01]">
                          <Clock size={20} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Duration</p>
                          <p className="font-bold">{course.duration_hours || 'Self-paced'}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#F59F01]">
                          <BookOpen size={20} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Curriculum</p>
                          <p className="font-bold">{course.module_count} Modules</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Enrollment Card */}
              <div className="lg:w-[400px] shrink-0">
                <div className="relative p-10 rounded-[3rem] bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden">
                   <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#F59F01]/10 rounded-full blur-[80px]" />
                   
                   <div className="relative z-10">
                      <div className="flex items-center gap-2 text-[#F59F01] mb-4">
                         <Sparkles size={18} />
                         <span className="text-xs font-black uppercase tracking-[0.2em]">Institutional Access</span>
                      </div>
                      <h3 className="text-2xl font-black mb-2">Master Your Vision</h3>
                      <p className="text-sm text-white/40 mb-8 leading-relaxed">Enroll today to unlock proprietary frameworks and join our network of elite founders.</p>
                      
                      <ul className="space-y-4 mb-10">
                         <li className="flex items-center gap-3 text-sm text-white/70"><CheckCircle size={18} className="text-[#16c784]" /> Lifetime Access</li>
                         <li className="flex items-center gap-3 text-sm text-white/70"><CheckCircle size={18} className="text-[#16c784]" /> Verified Certificate</li>
                         <li className="flex items-center gap-3 text-sm text-white/70"><CheckCircle size={18} className="text-[#16c784]" /> Strategic Templates</li>
                      </ul>

                      <button className="w-full py-5 rounded-2xl bg-[#F59F01] text-[#100226] font-black text-sm hover:scale-[1.02] transition-all shadow-xl shadow-[#F59F01]/20">
                         Enroll in Course
                      </button>
                   </div>
                </div>
              </div>
           </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-8 grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-20">
           
           {/* Curriculum Section */}
           <div>
              <div className="flex items-center gap-4 mb-12">
                 <h2 className="text-3xl font-black">Curriculum</h2>
                 <div className="h-px flex-grow bg-white/10" />
              </div>
              <div className="space-y-4">
                 {course.modules?.map((module, i) => (
                    <CurriculumAccordion key={i} module={module} index={i} />
                 ))}
                 {(!course.modules || course.modules.length === 0) && (
                   <div className="p-20 text-center rounded-[3rem] bg-white/[0.02] border border-dashed border-white/10">
                      <p className="text-white/20">Syllabus is being institutionalized. Check back soon.</p>
                   </div>
                 )}
              </div>
           </div>

           {/* Instructor Sidebar */}
           <aside className="space-y-12">
              <div>
                 <h2 className="text-xl font-black uppercase tracking-widest mb-8 text-white/30">Your Instructor</h2>
                 <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 text-center">
                    <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-[#F59F01] to-yellow-200 p-1 mb-6">
                       <div className="w-full h-full rounded-[1.4rem] bg-[#100226] flex items-center justify-center text-[#F59F01]">
                          <User size={40} />
                       </div>
                    </div>
                    <h3 className="text-xl font-black mb-1">Santosh Poudel</h3>
                    <p className="text-[10px] font-black text-[#F59F01] uppercase tracking-[0.2em] mb-6">Managing Partner</p>
                    <p className="text-sm text-white/40 leading-relaxed text-left">
                      Santosh brings institutional financial expertise and deep philosophical inquiry to the venture capital space, drawing on decades of experience in emerging markets.
                    </p>
                 </div>
              </div>
              
              <div className="p-8 rounded-[2.5rem] bg-[#16c784]/5 border border-[#16c784]/20">
                 <Star className="text-[#16c784] mb-4" size={24} />
                 <h4 className="font-bold mb-2">Student Reviews</h4>
                 <p className="text-xs text-white/40 mb-4 italic">"This course reframed how I view my entire cap table. A must for founders."</p>
                 <div className="flex gap-1 text-[#F59F01]">
                    {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                 </div>
              </div>
           </aside>

        </div>
      </section>

    </div>
  );
}
