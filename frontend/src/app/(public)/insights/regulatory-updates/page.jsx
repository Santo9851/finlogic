'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { motion } from 'framer-motion';
import { ShieldCheck, Calendar, ArrowRight, ExternalLink, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function PublicRegulatoryUpdatesPage() {
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('');

  const { data: updates = [], isLoading } = useQuery({
    queryKey: ['public-regulatory-updates'],
    queryFn: async () => {
      const res = await api.get('/insights/regulatory-updates/');
      return res.data;
    },
  });

  const filteredUpdates = updates.filter(u => {
    if (source && u.source_name !== source) return false;
    if (search && !u.title.toLowerCase().includes(search.toLowerCase()) && !u.summary.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header section similar to Wisdom Hub */}
      <div className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ls-compliment/10 text-ls-compliment text-xs font-black uppercase tracking-widest border border-ls-compliment/20">
            <ShieldCheck size={14} />
            Wisdom Hub
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tight uppercase">
            Regulatory <span className="text-ls-compliment">Feed</span>
          </h1>
          <p className="text-text-muted text-sm md:text-base font-bold uppercase tracking-widest leading-relaxed">
            Stay compliant with real-time AI-summarized insights from NRB, SEBON, and IRD.
          </p>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 pb-32">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-12">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50" />
            <input 
              type="text"
              placeholder="SEARCH CIRCULARS..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-card border border-border-theme rounded-2xl text-xs font-black uppercase tracking-widest text-foreground outline-none focus:border-ls-compliment transition-all shadow-sm"
            />
          </div>
          <select
            value={source}
            onChange={e => setSource(e.target.value)}
            className="px-6 py-4 bg-card border border-border-theme rounded-2xl text-xs font-black uppercase tracking-widest text-foreground outline-none focus:border-ls-compliment transition-all shadow-sm min-w-[200px] cursor-pointer"
          >
            <option value="">ALL AUTHORITIES</option>
            <option value="NRB">Nepal Rastra Bank</option>
            <option value="SEBON">SEBON</option>
            <option value="IRD">Inland Revenue</option>
          </select>
        </div>

        {/* Feed */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 text-ls-compliment animate-spin" />
            <p className="text-text-muted text-xs font-black uppercase tracking-[0.3em] animate-pulse">Syncing Regulatory Data...</p>
          </div>
        ) : filteredUpdates.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-border-theme rounded-[3rem] bg-card/50">
            <ShieldCheck size={64} className="mx-auto text-text-muted/20 mb-6" />
            <p className="text-xl font-black text-foreground uppercase tracking-tight">No Circulars Found</p>
            <p className="text-xs text-text-muted mt-2 font-bold uppercase tracking-widest">Adjust your search parameters.</p>
          </div>
        ) : (
          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border-theme before:to-transparent">
            {filteredUpdates.map((update, idx) => (
              <motion.div
                key={update.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
              >
                {/* Timeline dot */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-ls-compliment/20 text-ls-compliment shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <ShieldCheck size={16} />
                </div>
                
                {/* Card */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card border border-border-theme p-8 rounded-[2rem] shadow-sm hover:shadow-xl transition-all hover:border-ls-compliment/30 group-hover:-translate-y-1 duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="px-3 py-1 bg-background border border-border-theme rounded-lg text-[10px] font-black uppercase tracking-[0.2em] text-foreground">
                      {update.source_name}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                      <Calendar size={12} />
                      {new Date(update.published_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-black text-foreground leading-tight tracking-tight mb-6">
                    {update.title}
                  </h3>
                  
                  <div className="space-y-4 mb-8">
                    {update.summary ? (
                      update.summary.split('\n').filter(l => l.trim()).map((line, i) => {
                        const match = line.match(/\*\*(.*?)\*\*(.*)/);
                        if (match) {
                          return (
                            <div key={i} className="flex gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-ls-compliment mt-2 shrink-0" />
                              <p className="text-sm text-foreground/80 leading-relaxed">
                                <strong className="text-foreground">{match[1]}</strong>{match[2]}
                              </p>
                            </div>
                          );
                        }
                        const cleanLine = line.replace(/^[\*\-]\s/, '');
                        return (
                          <div key={i} className="flex gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-ls-compliment mt-2 shrink-0" />
                            <p className="text-sm text-foreground/80 leading-relaxed">{cleanLine}</p>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-text-muted italic">Full document available for review.</p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-border-theme">
                    {update.original_file ? (
                      <a 
                        href={update.original_file} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-ls-compliment transition-colors group/link"
                      >
                        <FileText size={14} />
                        View Original PDF
                        <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                      </a>
                    ) : update.source_url ? (
                      <a 
                        href={update.source_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-ls-compliment transition-colors group/link"
                      >
                        <ExternalLink size={14} />
                        Source Link
                        <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                      </a>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted/50">Internal Knowledge</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
