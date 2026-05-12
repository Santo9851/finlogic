import { Calendar, Video, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function WebinarCard({ webinar, isPast = false }) {
  if (isPast) {
    return (
      <div className="glass-card flex flex-col sm:flex-row items-center gap-6 p-4 pr-6 rounded-2xl group transition-all hover:bg-ls-primary/5 dark:hover:bg-white/5 theme-transition">
        <div className="w-full sm:w-48 aspect-video rounded-xl overflow-hidden relative shrink-0">
          <img src={webinar.image} alt={webinar.title} className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500" />
          <div className="absolute inset-0 flex items-center justify-center bg-ls-primary/40 dark:bg-ls-primary-fixed/40 group-hover:bg-ls-primary/10 transition-colors">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform">
               <Video className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
        <div className="flex-grow">
          <div className="flex items-center text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">
            <Calendar className="w-3 h-3 mr-1" /> {webinar.date}
          </div>
          <h4 className="text-lg font-bold mb-1 text-ls-primary dark:text-white group-hover:text-[#F59F01] transition-colors line-clamp-1">{webinar.title}</h4>
          <p className="text-sm text-text-muted">Speaker: {webinar.speaker}</p>
        </div>
        <Link href={`/insights/webinars/${webinar.slug}`} className="shrink-0 w-full sm:w-auto text-center sm:text-left text-sm font-bold text-[#F59F01] hover:text-ls-primary dark:hover:text-white transition-colors">
          Watch Recording
        </Link>
      </div>
    );
  }

  // Upcoming Webinar Layout
  return (
    <div className="glass-card rounded-3xl p-8 relative overflow-hidden group theme-transition">
      <div className="absolute top-0 right-0 w-32 h-32 bg-ls-up/10 rounded-bl-[100px] -z-10 group-hover:bg-ls-up/20 transition-colors" />
      
      <div className="inline-block px-3 py-1 rounded-full bg-ls-up/20 text-ls-up text-xs font-bold uppercase tracking-widest mb-6">
        Upcoming Live Event
      </div>
      
      <h3 className="text-2xl font-bold mb-2 pr-8 text-ls-primary dark:text-white">{webinar.title}</h3>
      <p className="text-text-muted text-sm mb-6 max-w-sm">{webinar.description}</p>
      
      <div className="space-y-3 mb-8">
        <div className="flex items-center text-sm font-medium text-ls-primary dark:text-white">
          <div className="w-8 h-8 rounded-full bg-ls-primary/5 dark:bg-white/5 flex items-center justify-center mr-3">
            <Calendar className="w-4 h-4 text-[#F59F01]" />
          </div>
          {webinar.date} at {webinar.time}
        </div>
        <div className="flex items-center text-sm font-medium text-ls-primary dark:text-white">
          <div className="w-8 h-8 rounded-full bg-ls-primary/5 dark:bg-white/5 flex items-center justify-center mr-3 text-text-muted font-black">
            @
          </div>
          Host: {webinar.speaker}
        </div>
      </div>
      
      <Link href={webinar.registrationUrl} className="inline-flex items-center justify-center w-full sm:w-auto rounded-full bg-ls-primary-fixed px-6 py-3 text-sm font-bold text-white transition-all hover:scale-105">
        Register Now <ArrowRight className="ml-2 w-4 h-4" />
      </Link>
    </div>
  );
}
