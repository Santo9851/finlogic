'use client';

import React, { useState } from 'react';
import { ShieldCheck, Send, X, Loader2, Mail, ExternalLink } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function LPNoProfileError() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="h-[70vh] flex flex-col items-center justify-center gap-12 text-center px-6"
    >
      <LPSupportRequestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      <div className="relative">
        <motion.div 
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 border border-ls-compliment/20 flex items-center justify-center text-ls-compliment bg-ls-compliment/5 shadow-[0_0_80px_rgba(245,159,1,0.15)] relative z-10"
        >
          <ShieldCheck size={48} />
        </motion.div>
        <div className="absolute inset-0 bg-ls-compliment/10 blur-[100px] -z-10" />
      </div>

      <div className="space-y-6 max-w-xl">
        <h2 className="text-4xl md:text-5xl font-serif font-light text-foreground uppercase tracking-tight leading-tight">
          Investor Profile <span className="italic text-ls-compliment">Not Found</span>
        </h2>
        <p className="text-text-muted text-[11px] font-bold uppercase tracking-[0.4em] font-mono opacity-60 leading-relaxed">
          Institutional credentials detected, but no entry exists in the Limited Partner Registry. 
          Please initialize your profile to access wealth tracking.
        </p>
      </div>

      <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsModalOpen(true)}
        className="group relative border border-ls-compliment/40 text-ls-compliment px-16 py-6 text-[10px] font-black uppercase tracking-[0.5em] transition-all overflow-hidden shadow-2xl shadow-ls-compliment/5"
      >
        <span className="relative z-10">Contact LP Support</span>
        <div className="absolute inset-0 bg-ls-compliment translate-y-full group-hover:translate-y-0 transition-transform duration-500 -z-10" />
      </motion.button>
    </motion.div>
  );
}

function LPSupportRequestModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({ subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await api.post('/deals/lp/support-request/', formData);
      toast.success("Support request dispatched successfully.");
      setFormData({ subject: '', message: '' });
      onClose();
    } catch (err) {
      toast.error("Transmission failed. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-ls-primary/95 backdrop-blur-2xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-card border border-ls-compliment/10 w-full max-w-2xl p-10 md:p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden"
          >
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-ls-compliment/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
            
            <div className="absolute top-8 right-8">
              <button onClick={onClose} className="text-text-muted/40 hover:text-ls-compliment transition-all hover:scale-110">
                <X size={28} />
              </button>
            </div>
            
            <div className="space-y-12">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-ls-compliment">
                  <Mail size={18} />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em]">Support Protocol</span>
                </div>
                <h2 className="text-4xl font-serif font-light text-foreground uppercase tracking-tight">Initialize Registry</h2>
                <div className="flex flex-col gap-2 p-5 bg-ls-compliment/5 border border-ls-compliment/10 rounded-xl">
                  <p className="text-[10px] text-text-muted uppercase tracking-widest font-black opacity-60">Direct Assistance:</p>
                  <a href="mailto:lpsupport@finlogiccapital.com" className="text-ls-compliment font-serif italic text-lg flex items-center gap-2 hover:underline">
                    lpsupport@finlogiccapital.com <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-text-muted/40 uppercase tracking-[0.3em] ml-1">Request Subject</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Account Initialization"
                    className="w-full bg-ls-primary/50 border border-border-theme p-5 text-sm focus:border-ls-compliment/40 outline-none transition-all font-serif shadow-inner"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-text-muted/40 uppercase tracking-[0.3em] ml-1">Requirement Brief</label>
                  <textarea 
                    rows={4}
                    placeholder="Provide details regarding your investment entity or requirements..."
                    className="w-full bg-ls-primary/50 border border-border-theme p-5 text-sm focus:border-ls-compliment/40 outline-none transition-all resize-none font-serif shadow-inner leading-relaxed"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  />
                </div>
              </div>

              <button 
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.subject || !formData.message}
                className="group w-full bg-ls-compliment text-ls-primary py-6 text-[11px] font-black uppercase tracking-[0.6em] transition-all shadow-2xl disabled:opacity-20 flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 
                    Transmit Request
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
