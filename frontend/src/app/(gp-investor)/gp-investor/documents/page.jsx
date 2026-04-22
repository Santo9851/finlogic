'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Search, 
  Filter,
  FileDown,
  Clock,
  ChevronRight,
  Loader2
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

export default function GPInvestorDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');

  const CATEGORIES = [
    { value: 'ALL', label: 'All Documents' },
    { value: 'FINANCIAL', label: 'Financial Reports' },
    { value: 'LEGAL', label: 'Compliance' },
    { value: 'MEETING', label: 'Board Meetings' },
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/deals/gp-investor/ir-documents/');
      setDocuments(res.data.results || res.data || []);
    } catch (error) {
      console.error('Failed to fetch IR documents:', error);
      toast.error('Could not load document repository');
    } finally {
      setLoading(false);
    }
  };

  const filteredDocs = activeCategory === 'ALL' 
    ? documents 
    : documents.filter(d => d.category === activeCategory);

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 size={32} className="text-[#16c784] animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Investor Relations Documents</h1>
          <p className="text-white/40 text-sm mt-1">Official reports, financial statements, and corporate announcements.</p>
        </div>
      </div>

      {/* Tabs / Filters */}
      <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl w-fit">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeCategory === cat.value 
              ? 'bg-white/10 text-white' 
              : 'text-white/40 hover:text-white/60'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Document Grid */}
      {filteredDocs.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
          <FileText size={48} className="text-white/10 mb-4" />
          <p className="text-white/30 text-sm italic">No documents found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map(doc => (
            <div key={doc.id} className="group relative bg-[#08001a] border border-white/8 rounded-2xl p-6 hover:border-[#16c784]/30 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-[#16c784]/10 group-hover:text-[#16c784] transition-all">
                    <FileText size={24} />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 px-2 py-1 bg-white/5 rounded">
                    {doc.category_display}
                  </span>
                </div>
                
                <div>
                  <h3 className="text-white font-bold text-base line-clamp-2 leading-snug group-hover:text-[#16c784] transition-colors">
                    {doc.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 text-white/40">
                    <Clock size={12} />
                    <span className="text-[10px] font-medium">{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">PDF Document</p>
                <a 
                  href={doc.file} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#16c784] hover:text-[#16c784]/80 text-xs font-bold transition-colors"
                >
                  <FileDown size={14} />
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Advisory Note */}
      <div className="max-w-xl p-6 bg-[#16c784]/5 border border-[#16c784]/10 rounded-2xl flex gap-4">
        <div className="w-8 h-8 rounded-full bg-[#16c784]/10 flex items-center justify-center text-[#16c784] flex-shrink-0">
          <Clock size={16} />
        </div>
        <p className="text-xs text-white/50 leading-relaxed italic">
          Investor Relations documents are proprietary to GP Shareholders. Redistribution or publication of these documents without prior consent is strictly prohibited and subject to the Shareholder's Agreement.
        </p>
      </div>
    </div>
  );
}
