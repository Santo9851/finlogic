import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { TrendingUp, Star, CheckCircle2, AlertTriangle, Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';

export default function ExitPlanningTab({ deal, onCreate, onApprove, isCreating }) {
  const [showModal, setShowModal] = useState(false);
  const [ipoReport, setIpoReport] = useState(null);
  const [isLoadingIpo, setIsLoadingIpo] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    exit_type: 'TRADE_SALE',
    target_year: 2085,
    expected_exit_value_npr: '',
    exit_multiple: '',
    probability_pct: 50,
    is_base_case: false,
    notes: ''
  });

  const investment = deal.investments?.[0];
  const scenarios = investment?.exit_scenarios || [];

  const runIpoCheck = async () => {
    setIsLoadingIpo(true);
    try {
      const res = await api.get(`/deals/portfolio/investments/${investment.id}/ipo-eligibility/`);
      setIpoReport(res.data);
    } catch (err) {
      toast.error('Failed to run IPO eligibility check');
    } finally {
      setIsLoadingIpo(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({ ...formData, investment: investment.id });
    setShowModal(false);
  };

  const pieData = scenarios.map(s => ({
    name: s.name,
    value: s.probability_pct
  }));

  const COLORS = ['#F59F01', '#10b981', '#3b82f6', '#8b5cf6', '#f43f5e'];

  if (!investment) return <div className="p-10 text-center text-white/20">No investment record found.</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-white tracking-tight uppercase">Exit Planning & Scenarios</h3>
        <div className="flex gap-4">
           <button 
             onClick={runIpoCheck}
             className="px-6 py-2.5 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
           >
             {isLoadingIpo ? <Loader2 className="animate-spin" size={14} /> : <TrendingUp size={14} className="inline mr-2" />}
             Check IPO Eligibility
           </button>
           <button 
             onClick={() => setShowModal(true)}
             className="px-6 py-2.5 bg-[#F59F01] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20"
           >
             Add Exit Scenario
           </button>
        </div>
      </div>

      {ipoReport && (
        <div className="bg-[#10b981]/10 border border-[#10b981]/30 p-6 rounded-3xl animate-in zoom-in-95 duration-500">
           <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-black text-[#10b981] uppercase tracking-widest">IPO Eligibility Report</h4>
              <button onClick={() => setIpoReport(null)} className="text-white/20 hover:text-white"><Zap size={16} /></button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {ipoReport.criteria.map((c, i) => (
                <div key={i} className="bg-black/20 p-4 rounded-2xl border border-white/5">
                   <p className="text-[9px] text-white/40 uppercase font-black mb-1">{c.label}</p>
                   <div className="flex items-center gap-2">
                      {c.passed ? <CheckCircle2 className="text-[#10b981]" size={14} /> : <AlertTriangle className="text-rose-500" size={14} />}
                      <span className="text-xs text-white font-bold">{c.detail}</span>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5">
                  <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Scenario</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Target Year</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">Exit Value</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">Prob. %</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {scenarios.map(s => (
                  <tr key={s.id} className={`hover:bg-white/5 transition-colors ${s.is_base_case ? 'bg-[#F59F01]/5' : ''}`}>
                    <td className="px-6 py-4 flex items-center gap-2">
                       {s.is_base_case && <Star size={14} className="text-[#F59F01]" fill="#F59F01" />}
                       <span className="text-xs font-bold text-white">{s.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[9px] font-black text-white/60 uppercase border border-white/10 px-2 py-1 rounded">
                        {s.exit_type_display}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-white/60">{s.target_year} BS</td>
                    <td className="px-6 py-4 text-xs font-mono text-white text-right">NPR {parseFloat(s.expected_exit_value_npr).toLocaleString()}</td>
                    <td className="px-6 py-4 text-xs font-mono text-[#F59F01] text-right">{s.probability_pct}%</td>
                    <td className="px-6 py-4">
                      {s.is_approved_by_ic ? (
                        <span className="text-[#10b981] text-[9px] font-black uppercase">Approved</span>
                      ) : (
                        <button 
                          onClick={() => onApprove(s.id)}
                          className="text-[9px] font-black text-white/20 hover:text-[#F59F01] uppercase tracking-widest"
                        >
                          Pending Approval
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col items-center">
           <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-8">Scenario Probabilities</h4>
           <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                      itemStyle={{ fontSize: '10px', fontWeight: '800' }}
                    />
                 </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="mt-8 space-y-2 w-full">
              {scenarios.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between text-[10px]">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-white/40 font-bold">{s.name}</span>
                   </div>
                   <span className="text-white font-black">{s.probability_pct}%</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Exit Scenario Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-white/10 p-8 rounded-3xl max-lg w-full shadow-2xl space-y-6">
            <h3 className="text-white font-black text-xl tracking-tight uppercase">New Exit Scenario</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/30 uppercase font-black">Scenario Name</label>
                <input 
                  type="text" required placeholder="e.g. Base Case Trade Sale"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#F59F01]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/30 uppercase font-black">Exit Type</label>
                  <select 
                    value={formData.exit_type}
                    onChange={e => setFormData({...formData, exit_type: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#F59F01]"
                  >
                    <option value="TRADE_SALE">Trade Sale</option>
                    <option value="IPO">IPO (NEPSE)</option>
                    <option value="SECONDARY">Secondary Sale</option>
                    <option value="WRITE_OFF">Write-Off</option>
                    <option value="DIVIDEND_RECAP">Dividend Recap</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/30 uppercase font-black">Target Year (BS)</label>
                  <input 
                    type="number" required
                    value={formData.target_year}
                    onChange={e => setFormData({...formData, target_year: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#F59F01]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/30 uppercase font-black">Exit Value (NPR)</label>
                  <input 
                    type="number" required
                    value={formData.expected_exit_value_npr}
                    onChange={e => setFormData({...formData, expected_exit_value_npr: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#F59F01]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/30 uppercase font-black">Exit Multiple (x)</label>
                  <input 
                    type="number" step="0.1" required
                    value={formData.exit_multiple}
                    onChange={e => setFormData({...formData, exit_multiple: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#F59F01]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] text-white/30 uppercase font-black">Probability (%)</label>
                    <input 
                      type="number" min="0" max="100"
                      value={formData.probability_pct}
                      onChange={e => setFormData({...formData, probability_pct: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#F59F01]"
                    />
                 </div>
                 <div className="flex items-center gap-3 pt-6">
                    <input 
                      type="checkbox" id="is_base_case"
                      checked={formData.is_base_case}
                      onChange={e => setFormData({...formData, is_base_case: e.target.checked})}
                      className="w-4 h-4 accent-[#F59F01]"
                    />
                    <label htmlFor="is_base_case" className="text-xs text-white/60 font-bold">Set as Base Case</label>
                 </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-white/40 text-xs font-black uppercase">Cancel</button>
                <button type="submit" disabled={isCreating} className="flex-1 py-3 bg-[#F59F01] text-black rounded-xl text-xs font-black uppercase shadow-lg shadow-[#F59F01]/20">
                  {isCreating ? 'Creating...' : 'Create Scenario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
