'use client';

import React from 'react';
import { 
  Calendar, 
  Video, 
  Clock, 
  ExternalLink, 
  User, 
  Phone,
  PlayCircle,
  Download
} from 'lucide-react';

export default function GPInvestorMeetingsPage() {
  const upcomingMeetings = [
    {
      id: 1,
      title: 'Q1 2081/82 Performance Briefing',
      date: 'May 15, 2026',
      time: '10:00 AM - 11:30 AM',
      type: 'Video Call',
      host: 'Sagar Rana (Managing Partner)',
      status: 'SCHEDULED'
    },
    {
      id: 2,
      title: 'Investment Committee Review: Project Solar-X',
      date: 'June 02, 2026',
      time: '2:00 PM - 3:30 PM',
      type: 'Video Call',
      host: 'Bikash Koirala (Investment Director)',
      status: 'PENDING'
    }
  ];

  const pastRecordings = [
    {
      id: 101,
      title: 'Annual Shareholder Meeting FY 2080/81',
      date: 'March 20, 2026',
      duration: '1h 45m',
      category: 'Annual General Meeting'
    },
    {
      id: 102,
      title: 'Monthly Portfolio Update - February 2026',
      date: 'Feb 28, 2026',
      duration: '45m',
      category: 'Portfolio Review'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Investor Briefings & Meetings</h1>
        <p className="text-white/50 mt-1">Join live discussions, review upcoming committee meetings, and access past recordings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Upcoming */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-[#16c784]" />
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Upcoming Calls</h2>
          </div>
          
          <div className="space-y-4">
            {upcomingMeetings.map(mtg => (
              <div key={mtg.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#16c784]/30 transition-all group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 bg-[#16c784]/15 text-[#16c784] text-[9px] font-bold rounded uppercase tracking-tighter">
                        {mtg.type}
                      </span>
                      <h3 className="text-white font-bold">{mtg.title}</h3>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-2 text-white/40">
                        <Clock size={14} />
                        <span className="text-[10px] font-medium">{mtg.date} • {mtg.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/40">
                        <User size={14} />
                        <span className="text-[10px] font-medium">{mtg.host}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button className="bg-white text-black hover:bg-[#16c784] hover:text-black px-6 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                    <Video size={16} />
                    Join Briefing
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 rounded-2xl bg-[#16c784]/5 border border-[#16c784]/20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#16c784]/10 flex items-center justify-center text-[#16c784]">
                <Phone size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Need a one-on-one?</p>
                <p className="text-[10px] text-white/40">Request a private review with the Managing Partners.</p>
              </div>
            </div>
            <button className="text-[10px] font-bold text-[#16c784] uppercase tracking-widest px-4 py-2 hover:bg-[#16c784]/10 rounded-lg transition-all">
              Request Call
            </button>
          </div>
        </div>

        {/* Right: Recordings */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <PlayCircle size={18} className="text-white/40" />
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Past Briefings</h2>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
            {pastRecordings.map(rec => (
              <div key={rec.id} className="p-4 hover:bg-white/[0.02] transition-colors group">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-white mb-1 group-hover:text-[#16c784] transition-colors">{rec.title}</h4>
                    <p className="text-[10px] text-white/30 uppercase tracking-tighter">{rec.date} • {rec.duration}</p>
                  </div>
                  <button className="p-2 text-white/20 hover:text-white transition-colors">
                    <Download size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-[#16c784]/10 to-transparent border border-white/5 rounded-2xl p-6 text-center">
            <Video className="mx-auto text-white/20 mb-3" size={32} />
            <p className="text-xs text-white/60 leading-relaxed italic">
              "We maintain full transparency with our shareholders. Monthly call recordings are available for 24 months."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
