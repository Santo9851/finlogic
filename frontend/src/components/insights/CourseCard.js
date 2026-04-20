import Link from 'next/link';
import { Clock, BookOpen, ChevronRight } from 'lucide-react';

export default function CourseCard({ course }) {
  return (
    <Link href={`/insights/courses/${course.slug}`} className="group relative flex flex-col h-full bg-ls-supporting/10 rounded-3xl overflow-hidden transition-all hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-t from-ls-primary via-transparent to-transparent z-10" />
      
      <div className="relative aspect-square sm:aspect-[4/3] w-full">
         <img 
          src={course.image} 
          alt={course.title} 
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.85] group-hover:brightness-100 transition-all duration-700 group-hover:scale-105"
        />
        <div className="absolute top-4 right-4 z-20 flex space-x-2">
          <span className="bg-ls-primary/90 backdrop-blur text-ls-white text-xs font-bold uppercase tracking-widest py-1.5 px-3 rounded-full border border-ls-white/10">
            {course.level}
          </span>
        </div>
      </div>

      <div className="relative z-20 p-6 flex flex-col flex-grow -mt-20">
        <div className="flex items-center space-x-3 text-xs font-medium text-ls-compliment mb-3">
          <span className="flex items-center"><BookOpen className="w-3 h-3 mr-1" /> {course.modules} Modules</span>
          <span className="w-1 h-1 rounded-full bg-ls-compliment/50" />
          <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {course.duration}</span>
        </div>
        
        <h3 className="text-2xl font-bold mb-3 leading-tight group-hover:text-ls-compliment transition-colors">
          {course.title}
        </h3>
        
        <p className="text-ls-white/70 text-sm mb-6 flex-grow line-clamp-2">
          {course.description}
        </p>

        <div className="mt-auto flex items-center justify-between text-sm font-bold text-ls-white group-hover:text-ls-compliment transition-colors">
          <span>View Course Details</span>
          <div className="w-8 h-8 rounded-full bg-ls-white/10 flex items-center justify-center group-hover:bg-ls-compliment/20 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
