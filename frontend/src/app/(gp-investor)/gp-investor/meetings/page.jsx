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
      type: 'VIDEO_PROTOCOL',
      host: 'Sagar Rana (Managing Partner)',
      status: 'SCHEDULED'
    },
    {
      id: 2,
      title: 'Investment Committee Review: Project Solar-X',
      date: 'June 02, 2026',
      time: '2:00 PM - 3:30 PM',
      type: 'BOARD_SESSION',
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
      category: 'AGM_ARCHIVE'
    },
    {
      id: 102,
      title: 'Monthly Portfolio Update - February 2026',
      date: 'Feb 28, 2026',
      duration: '45m',
      category: 'STRATEGIC_REVIEW'
    }
  ];

  return (
    <div className="space-y-20 animate-in fade-in duration-1000 pb-32 max-w-7xl mx-auto">
      {/* Header - Institutional Schedule */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-border-theme pb-12">
        <div className="space-y-6">
          <div className="flex items-center gap-4 text-ls-compliment text-[10px] font-bold uppercase tracking-[0.5em]">
            <Calendar size={14} /> Strategic Briefing Schedule
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-light text-foreground tracking-tight leading-tight">
            Session <span className="italic">Calendar</span>
          </h1>
          <p className="text-xl text-text-muted font-serif font-light italic max-w-xl">
            Live strategic discussions, institutional committee reviews, and secure archival of historical briefings.
          </p>
        </div>
        <div className="flex items-center gap-6 px-10 py-5 bg-border-theme/20 border border-border-theme shadow-sm">
           <div className="space-y-1 text-right">
             <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em]">Schedule Identifier</p>
             <p className="text-[9px] text-text-muted/40 font-bold uppercase tracking-widest font-mono">SESSIONS-2075-PROT</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Upcoming Sessions Ledger */}
        <div className="lg:col-span-2 space-y-12">
          <div className="flex items-center gap-4 border-l-2 border-ls-compliment pl-6">
            <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.5em]">Active Mandates</h2>
          </div>
          
          <div className="space-y-8">
            {upcomingMeetings.map(mtg => (
              <div key={mtg.id} className="bg-card border border-border-theme hover:border-ls-compliment/40 p-10 shadow-2xl group transition-all duration-700 relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-12">
                  <div className="space-y-6 flex-1 min-w-0">
                    <div className="flex items-center gap-6">
                      <span className="px-4 py-1.5 border border-ls-compliment/30 bg-ls-compliment/5 text-ls-compliment text-[9px] font-bold uppercase tracking-[0.3em] font-mono">
                        {mtg.type}
                      </span>
                      <h3 className="text-3xl font-serif font-light text-foreground group-hover:text-ls-compliment transition-all uppercase tracking-tight truncate">{mtg.title}</h3>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-12">
                      <div className="flex items-center gap-3 text-text-muted/40 group-hover:text-text-muted/60 transition-all font-mono text-[9px] font-bold uppercase tracking-[0.2em]">
                        <Clock size={12} className="text-ls-compliment" />
                        <span>{mtg.date} • {mtg.time}</span>
                      </div>
                      <div className="flex items-center gap-3 text-text-muted/40 group-hover:text-text-muted/60 transition-all font-serif italic text-[13px]">
                        <User size={14} />
                        <span>{mtg.host}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button className="bg-ls-primary text-ls-white hover:bg-ls-white hover:text-ls-primary px-10 py-5 text-[10px] font-bold uppercase tracking-[0.4em] transition-all shadow-xl shadow-ls-primary/10 flex items-center gap-4 shrink-0">
                    <Video size={16} />
                    Initiate Briefing
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-10 bg-ls-compliment/5 border border-ls-compliment/20 flex flex-col md:flex-row items-center justify-between gap-10 group hover:bg-ls-compliment/10 transition-all duration-700">
            <div className="flex items-start gap-8">
              <div className="w-14 h-14 border border-ls-compliment/40 flex items-center justify-center text-ls-compliment bg-ls-compliment/5">
                <Phone size={24} />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-serif font-light text-foreground uppercase tracking-tight leading-none">Bilateral Consultations</p>
                <p className="text-[10px] text-text-muted uppercase tracking-[0.3em] font-bold">Request private strategic review with managing partners.</p>
              </div>
            </div>
            <button className="text-[10px] font-bold text-ls-compliment border border-ls-compliment/40 px-10 py-4 uppercase tracking-[0.4em] hover:bg-ls-compliment hover:text-ls-primary transition-all shadow-lg">
              Secure Appointment
            </button>
          </div>
        </div>

        {/* Archival Vault */}
        <div className="space-y-12">
          <div className="flex items-center gap-4 border-l-2 border-border-theme pl-6">
            <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.5em]">Session Vault</h2>
          </div>

          <div className="bg-card border border-border-theme shadow-2xl overflow-hidden divide-y divide-border-theme">
            {pastRecordings.map(rec => (
              <div key={rec.id} className="p-8 hover:bg-ls-primary group transition-all duration-500 cursor-pointer">
                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-3">
                    <h4 className="text-xl font-serif font-light text-foreground group-hover:text-ls-white transition-all uppercase tracking-tight truncate leading-none">{rec.title}</h4>
                    <p className="text-[9px] text-text-muted/40 group-hover:text-ls-white/30 uppercase tracking-[0.3em] font-bold font-mono">{rec.date} • {rec.duration}</p>
                    <p className="text-[8px] text-ls-compliment/40 group-hover:text-ls-compliment font-bold uppercase tracking-[0.5em] pt-1">{rec.category}</p>
                  </div>
                  <button className="p-3 border border-border-theme text-text-muted/20 group-hover:text-ls-white group-hover:border-ls-white/20 transition-all hover:bg-ls-white/10">
                    <Download size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-ls-primary p-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-ls-compliment/10 blur-[50px] rounded-full -mr-12 -mt-12 pointer-events-none" />
            <Video className="text-ls-compliment/40 mb-6 group-hover:text-ls-compliment transition-all" size={32} />
            <p className="text-base font-serif italic text-ls-white/60 leading-relaxed mb-6">
              "Archival records maintained for 24 months per institutional transparency protocols."
            </p>
            <div className="text-[8px] text-ls-white/20 font-bold uppercase tracking-[0.5em]">VAULT_STATUS: SECURE</div>
          </div>
        </div>
      </div>
    </div>
  );
}
