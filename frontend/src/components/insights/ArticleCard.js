import Link from 'next/link';
import { ArrowRight, Clock, User } from 'lucide-react';

export default function ArticleCard({ article }) {
  return (
    <Link href={`/insights/articles/${article.slug}`} className="group flex flex-col h-full glass-card rounded-2xl overflow-hidden transition-all hover:border-[#F59F01]/30 hover:shadow-lg hover:shadow-[#F59F01]/5 theme-transition">
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <img 
          src={article.image} 
          alt={article.title} 
          className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute top-4 left-4 bg-ls-primary/80 dark:bg-ls-primary-fixed/80 backdrop-blur-md text-[#F59F01] text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full border border-[#F59F01]/20">
          {article.pillar}
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold mb-3 text-ls-primary dark:text-white group-hover:text-[#F59F01] transition-colors line-clamp-2">
          {article.title}
        </h3>
        <p className="text-text-muted mb-6 text-sm line-clamp-3 flex-grow">
          {article.excerpt}
        </p>
        
        <div className="mt-auto pt-4 border-t border-border-theme flex items-center justify-between text-xs text-text-muted font-medium">
          <div className="flex items-center space-x-4">
            <span className="flex items-center"><User className="w-3 h-3 mr-1" /> {article.author}</span>
            <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {article.date}</span>
          </div>
          <ArrowRight className="w-4 h-4 text-[#F59F01] transform transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
