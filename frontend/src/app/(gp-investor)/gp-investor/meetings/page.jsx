'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  Video, 
  Clock, 
  ExternalLink, 
  User, 
  Phone, 
  Shield, 
  Lock,
  X,
  Download
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/services/api';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const AppointmentModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    topic: '',
    preferred_date: '',
    preferred_time: '',
    notes: ''
  });

  const mutation = useMutation({
    mutationFn: (data) => api.post('/deals/gp-investor/meetings/request/', data),
    onSuccess: () => {
      toast.success("Strategic consultation request submitted.");
      onClose();
    },
    onError: () => toast.error("Submission failed. Please verify institutional access.")
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ls-primary/95 backdrop-blur-md">
      <div className="bg-card border border-ls-compliment/20 w-full max-w-2xl p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6">
          <button onClick={onClose} className="text-text-muted hover:text-ls-compliment transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-serif font-light text-foreground uppercase tracking-tight">Request Bilateral Consultation</h2>
            <p className="text-[10px] text-text-muted uppercase tracking-[0.3em] font-bold">Secure strategic review with the Managing Partners</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Consultation Topic</label>
              <input 
                type="text" 
                placeholder="e.g. Q4 Growth Strategy"
                className="w-full bg-ls-primary border border-border-theme p-4 text-sm focus:border-ls-compliment outline-none transition-all"
                value={formData.topic}
                onChange={(e) => setFormData({...formData, topic: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Preferred Date</label>
              <input 
                type="date" 
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-ls-primary border border-border-theme p-4 text-sm focus:border-ls-compliment outline-none transition-all"
                value={formData.preferred_date}
                onChange={(e) => setFormData({...formData, preferred_date: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Notes & Briefing context</label>
            <textarea 
              rows={4}
              placeholder="Outline the primary objectives for this consultation..."
              className="w-full bg-ls-primary border border-border-theme p-4 text-sm focus:border-ls-compliment outline-none transition-all resize-none"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <button 
            onClick={() => mutation.mutate(formData)}
            disabled={mutation.isPending}
            className="w-full bg-ls-compliment text-ls-primary py-5 text-[11px] font-bold uppercase tracking-[0.5em] hover:bg-ls-white transition-all shadow-xl disabled:opacity-50"
          >
            {mutation.isPending ? 'ENCRYPTING REQUEST...' : 'INITIATE SECURE REQUEST'}
          </button>
        </div>
      </div>
    </div>
  );
};

const GPInvestorMeetingsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ['gp-meetings'],
    queryFn: async () => {
      const res = await api.get('/deals/gp-investor/meetings/');
      return res.data;
    }
  });

  const upcomingMeetings = meetings.filter(m => new Date(m.scheduled_at) > new Date());
  const pastRecordings = meetings.filter(m => new Date(m.scheduled_at) <= new Date());

  if (isLoading) return <div className="p-20 text-center animate-pulse text-ls-compliment font-mono uppercase tracking-widest">Initializing Secure Stream...</div>;

  return (
    <div className="p-12 space-y-16 animate-in fade-in duration-1000">
      <AppointmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Hero Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 border-b border-border-theme pb-16">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-ls-compliment mb-2">
            <Lock size={14} />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Secure Briefing Environment</span>
          </div>
          <h1 className="text-7xl font-serif font-light text-foreground uppercase tracking-tighter leading-none">
            Briefing <span className="text-text-muted/20 italic">Mandates</span>
          </h1>
          <p className="max-w-2xl text-text-muted/60 text-lg font-serif font-light leading-relaxed">
            Direct institutional access to strategic sessions, board protocols, and private managing partner consultations.
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
        <div className="lg:col-span-2 space-y-12">
          <div className="flex items-center gap-4 border-l-2 border-ls-compliment pl-6">
            <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.5em]">Active Mandates</h2>
          </div>
          
          <div className="space-y-8">
            {upcomingMeetings.length > 0 ? upcomingMeetings.map(mtg => (
              <div key={mtg.id} className="bg-card border border-border-theme hover:border-ls-compliment/40 p-10 shadow-2xl group transition-all duration-700 relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-12">
                  <div className="space-y-6 flex-1 min-w-0">
                    <div className="flex items-center gap-6">
                      <span className="px-4 py-1.5 border border-ls-compliment/30 bg-ls-compliment/5 text-ls-compliment text-[9px] font-bold uppercase tracking-[0.3em] font-mono whitespace-nowrap">
                        {mtg.meeting_type || 'GENERAL'}
                      </span>
                      <h3 className="text-3xl font-serif font-light text-foreground group-hover:text-ls-compliment transition-all uppercase tracking-tight truncate">{mtg.title}</h3>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-12">
                      <div className="flex items-center gap-3 text-text-muted/40 group-hover:text-text-muted/60 transition-all font-mono text-[9px] font-bold uppercase tracking-[0.2em]">
                        <Clock size={12} className="text-ls-compliment" />
                        <span>{new Date(mtg.scheduled_at).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-3 text-text-muted/40 group-hover:text-text-muted/60 transition-all font-serif italic text-[13px]">
                        <User size={14} />
                        <span className="truncate">{mtg.speaker}</span>
                      </div>
                    </div>
                  </div>
                  
                  <a 
                    href={mtg.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-ls-primary text-ls-white hover:bg-ls-white hover:text-ls-primary px-10 py-5 text-[10px] font-bold uppercase tracking-[0.4em] transition-all shadow-xl shadow-ls-primary/10 flex items-center gap-4 shrink-0"
                  >
                    <Video size={16} />
                    Initiate Briefing
                  </a>
                </div>
              </div>
            )) : (
              <div className="p-20 bg-card border border-border-theme text-center">
                <p className="text-text-muted/40 text-[10px] font-bold uppercase tracking-[0.4em] font-serif italic">No active briefing mandates in sequence.</p>
              </div>
            )}
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
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-[10px] font-bold text-ls-compliment border border-ls-compliment/40 px-10 py-4 uppercase tracking-[0.4em] hover:bg-ls-compliment hover:text-ls-primary transition-all shadow-lg"
            >
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
            {pastRecordings.length > 0 ? pastRecordings.map(rec => (
              <div key={rec.id} className="p-8 hover:bg-ls-primary group transition-all duration-500">
                <div className="flex items-start justify-between gap-6 min-w-0">
                  <div className="space-y-3 flex-1 min-w-0">
                    <h4 className="text-xl font-serif font-light text-foreground group-hover:text-ls-white transition-all uppercase tracking-tight truncate leading-none" title={rec.title}>
                      {rec.title}
                    </h4>
                    <p className="text-[9px] text-text-muted/40 group-hover:text-ls-white/30 uppercase tracking-[0.3em] font-bold font-mono">
                      {new Date(rec.scheduled_at).toLocaleDateString()} • {rec.duration_minutes}m
                    </p>
                    <p className="text-[8px] text-ls-compliment/40 group-hover:text-ls-compliment font-bold uppercase tracking-[0.5em] pt-1 truncate">
                      {rec.meeting_type}
                    </p>
                  </div>
                  {rec.recording_url && (
                    <a 
                      href={rec.recording_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 border border-border-theme text-text-muted/20 group-hover:text-ls-white group-hover:border-ls-white/20 transition-all hover:bg-ls-white/10 shrink-0"
                    >
                      <Download size={14} />
                    </a>
                  )}
                </div>
              </div>
            )) : (
              <div className="p-20 text-center">
                <p className="text-[10px] text-text-muted/20 uppercase tracking-widest font-bold font-mono italic">Vault remains sealed.</p>
              </div>
            )}
          </div>

          <div className="p-8 border border-border-theme bg-ls-primary/50 space-y-6">
            <div className="flex items-center gap-4 text-ls-compliment">
              <Shield size={16} />
              <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Compliance Protocol</p>
            </div>
            <p className="text-[9px] text-text-muted/60 leading-relaxed uppercase tracking-widest">
              All briefings and archival recordings are subject to strict non-disclosure mandates. Unauthorized dissemination will trigger immediate access termination.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GPInvestorMeetingsPage;
