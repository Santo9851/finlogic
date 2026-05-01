'use client'

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/services/api';
import { 
  FileText, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Users,
  Calendar
} from 'lucide-react';

export default function StatementAdmin() {
  const [formData, setFormData] = useState({
    fund_id: '',
    quarter: 'Q1',
    year: '2081',
    lp_profile_id: ''
  });

  const { data: funds } = useQuery({
    queryKey: ['admin', 'funds'],
    queryFn: async () => {
      const res = await api.get('/deals/funds/');
      return res.data;
    }
  });

  const { data: lps } = useQuery({
    queryKey: ['admin', 'lps', formData.fund_id],
    queryFn: async () => {
      if (!formData.fund_id) return [];
      const res = await api.get(`/deals/funds/${formData.fund_id}/lps/`);
      return res.data;
    },
    enabled: !!formData.fund_id
  });

  const generateMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/deals/lp/generate-statement/', data);
      return res.data;
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    generateMutation.mutate(formData);
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-white">Statement Management</h1>
        <p className="text-white/40 text-sm mt-1">Generate and distribute capital account statements to LPs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                    <FileText size={14} /> Select Fund
                  </label>
                  <select
                    required
                    value={formData.fund_id}
                    onChange={(e) => setFormData({...formData, fund_id: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#F59F01] transition-all"
                  >
                    <option value="">Select a fund...</option>
                    {funds?.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={14} /> Period
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.quarter}
                      onChange={(e) => setFormData({...formData, quarter: e.target.value})}
                      className="w-1/3 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#F59F01] transition-all"
                    >
                      {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Year (e.g. 2081)"
                      value={formData.year}
                      onChange={(e) => setFormData({...formData, year: e.target.value})}
                      className="w-2/3 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#F59F01] transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <Users size={14} /> Specific LP (Optional)
                </label>
                <select
                  value={formData.lp_profile_id}
                  onChange={(e) => setFormData({...formData, lp_profile_id: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#F59F01] transition-all"
                >
                  <option value="">All LPs in Fund</option>
                  {lps?.map(lp => (
                    <option key={lp.id} value={lp.id}>{lp.full_name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-white/20 italic">Leave empty to generate statements for all committed LPs.</p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={generateMutation.isPending}
                  className="w-full bg-[#F59F01] hover:bg-[#F59F01]/90 disabled:opacity-50 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all transform active:scale-95"
                >
                  {generateMutation.isPending ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                  {generateMutation.isPending ? 'Queuing Task...' : 'Generate & Distribute Statements'}
                </button>
              </div>
            </form>

            {generateMutation.isSuccess && (
              <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400">
                <CheckCircle2 size={20} />
                <div className="text-sm">
                  <p className="font-bold">Success!</p>
                  <p className="text-xs opacity-80">Generation task has been queued (Task ID: {generateMutation.data.task_id}). LPs will receive email notifications once ready.</p>
                </div>
              </div>
            )}

            {generateMutation.isError && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                <AlertCircle size={20} />
                <div className="text-sm">
                  <p className="font-bold">Error</p>
                  <p className="text-xs opacity-80">{generateMutation.error?.response?.data?.detail || 'Failed to queue task.'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Admin Notice</h3>
            <ul className="text-xs text-white/40 space-y-3 list-disc pl-4">
              <li>Statements are generated using <strong>WeasyPrint</strong> and stored on <strong>Backblaze B2</strong>.</li>
              <li>Watermarks are automatically applied with investor-specific details.</li>
              <li>LPs will receive an automated email notification via <strong>Brevo</strong>.</li>
              <li>Calculations are based on current fund valuations and commitment data.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
