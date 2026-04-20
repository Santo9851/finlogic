import { Calendar, Video, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function WebinarCard({ webinar, isPast = false }) {
  if (isPast) {
    return (
      <div className="glass-card flex flex-col sm:flex-row items-center gap-6 p-4 pr-6 rounded-2xl group transition-all hover:bg-ls-supporting/20">
        <div className="w-full sm:w-48 aspect-video rounded-xl overflow-hidden relative shrink-0">
          <img src={webinar.image} alt={webinar.title} className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500" />
          <div className="absolute inset-0 flex items-center justify-center bg-ls-primary/40 group-hover:bg-ls-primary/10 transition-colors">
            <div className="w-10 h-10 rounded-full bg-ls-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform">
               <Video className="w-4 h-4 text-ls-white" />
            </div>
          </div>
        </div>
        <div className="flex-grow">
          <div className="flex items-center text-xs font-semibold text-ls-white/40 uppercase tracking-widest mb-2">
            <Calendar className="w-3 h-3 mr-1" /> {webinar.date}
          </div>
          <h4 className="text-lg font-bold mb-1 group-hover:text-ls-compliment transition-colors line-clamp-1">{webinar.title}</h4>
          <p className="text-sm text-ls-white/60">Speaker: {webinar.speaker}</p>
        </div>
        <Link href={`/insights/webinars/${webinar.slug}`} className="shrink-0 w-full sm:w-auto text-center sm:text-left text-sm font-bold text-ls-compliment hover:text-ls-white transition-colors">
          Watch Recording
        </Link>
      </div>
    );
  }

  // Upcoming Webinar Layout
  return (
    <div className="glass-card rounded-3xl p-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-ls-up/10 rounded-bl-[100px] -z-10 group-hover:bg-ls-up/20 transition-colors" />
      
      <div className="inline-block px-3 py-1 rounded-full bg-ls-up/20 text-ls-up text-xs font-bold uppercase tracking-widest mb-6">
        Upcoming Live Event
      </div>
      
      <h3 className="text-2xl font-bold mb-2 pr-8">{webinar.title}</h3>
      <p className="text-ls-white/60 text-sm mb-6 max-w-sm">{webinar.description}</p>
      
      <div className="space-y-3 mb-8">
        <div className="flex items-center text-sm font-medium">
          <div className="w-8 h-8 rounded-full bg-ls-white/5 flex items-center justify-center mr-3">
            <Calendar className="w-4 h-4 text-ls-compliment" />
          </div>
          {webinar.date} at {webinar.time}
        </div>
        <div className="flex items-center text-sm font-medium">
          <div className="w-8 h-8 rounded-full bg-ls-white/5 flex items-center justify-center mr-3 text-ls-white/50 font-black">
            @
          </div>
          Host: {webinar.speaker}
        </div>
      </div>
      
      <Link href={webinar.registrationUrl} className="inline-flex items-center justify-center w-full sm:w-auto rounded-full bg-ls-white px-6 py-3 text-sm font-bold text-ls-primary transition-all hover:scale-105">
        Register Now <ArrowRight className="ml-2 w-4 h-4" />
      </Link>
    </div>
  );
}
