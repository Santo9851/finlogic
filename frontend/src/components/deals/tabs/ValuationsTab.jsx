import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';
import { CheckCircle2 } from 'lucide-react';

export default function ValuationsTab({ deal, onRecord, isRecording }) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    valuation_date: new Date().toISOString().split('T')[0],
    fair_value_npr: '',
    methodology: 'MARKET',
    notes: '',
    is_audited: false,
    auditor_name: ''
  });

  const investment = deal.investments?.[0];
  const valuations = [...(investment?.valuations || [])].sort((a, b) => new Date(a.valuation_date) - new Date(b.valuation_date));

  const chartData = valuations.map(v => ({
    date: v.valuation_date,
    value: parseFloat(v.fair_value_npr)
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onRecord({ ...formData, investment: investment.id });
    setShowModal(false);
  };

  if (!investment) return <div className="p-10 text-center text-white/20">No investment record found for this project.</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-white tracking-tight uppercase">Valuation Tracking</h3>
        <button 
          onClick={() => setShowModal(true)}
          className="px-6 py-2.5 bg-[#F59F01] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20"
        >
          Add New Valuation
        </button>
      </div>

      {/* Chart */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
            <XAxis dataKey="date" stroke="#ffffff30" fontSize={10} tickFormatter={(val) => new Date(val).toLocaleDateString()} />
            <YAxis stroke="#ffffff30" fontSize={10} tickFormatter={(val) => (val/10000000).toFixed(1) + 'Cr'} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
              itemStyle={{ fontSize: '10px', fontWeight: '800' }}
              labelStyle={{ fontSize: '10px', color: '#F59F01', fontWeight: '900' }}
              formatter={(val) => [`NPR ${val.toLocaleString()}`, 'Fair Value']}
            />
            <Line type="monotone" dataKey="value" stroke="#F59F01" strokeWidth={3} dot={{ fill: '#F59F01', r: 4 }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5">
              <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Date</th>
              <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Fair Value (NPR)</th>
              <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Methodology</th>
              <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">MoIC</th>
              <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">Change %</th>
              <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[...valuations].reverse().map(v => (
              <tr key={v.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-xs font-bold text-white/60">{new Date(v.valuation_date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-xs font-mono text-white">NPR {parseFloat(v.fair_value_npr).toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-black text-[#F59F01] uppercase tracking-tighter bg-[#F59F01]/10 px-2 py-1 rounded">
                    {v.methodology_display}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs font-mono text-white text-right">{v.moic_implied?.toFixed(2)}x</td>
                <td className={`px-6 py-4 text-xs font-mono text-right ${v.valuation_change_pct > 0 ? 'text-[#10b981]' : v.valuation_change_pct < 0 ? 'text-rose-500' : 'text-white/20'}`}>
                  {v.valuation_change_pct ? (v.valuation_change_pct > 0 ? '+' : '') + v.valuation_change_pct.toFixed(1) + '%' : '—'}
                </td>
                <td className="px-6 py-4">
                  {v.is_audited ? (
                    <div className="flex items-center gap-1.5 text-[#10b981] text-[9px] font-black uppercase">
                      <CheckCircle2 size={12} /> Audited
                    </div>
                  ) : (
                    <span className="text-white/20 text-[9px] font-black uppercase">Un-audited</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-white/10 p-8 rounded-3xl max-w-lg w-full shadow-2xl space-y-6">
            <h3 className="text-white font-black text-xl tracking-tight uppercase">Record Fair Value</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/30 uppercase font-black">Valuation Date</label>
                  <input 
                    type="date" required
                    value={formData.valuation_date}
                    onChange={e => setFormData({...formData, valuation_date: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#F59F01]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/30 uppercase font-black">Fair Value (NPR)</label>
                  <input 
                    type="number" required
                    value={formData.fair_value_npr}
                    onChange={e => setFormData({...formData, fair_value_npr: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#F59F01]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/30 uppercase font-black">Methodology</label>
                <select 
                  value={formData.methodology}
                  onChange={e => setFormData({...formData, methodology: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#F59F01]"
                >
                  <option value="DCF">Discounted Cash Flow</option>
                  <option value="MARKET">Market Comparables</option>
                  <option value="COST">Cost / Book Value</option>
                  <option value="RECENT_TRANSACTION">Recent Transaction</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="flex items-center gap-3 py-2">
                 <input 
                   type="checkbox" id="is_audited"
                   checked={formData.is_audited}
                   onChange={e => setFormData({...formData, is_audited: e.target.checked})}
                   className="w-4 h-4 accent-[#F59F01]"
                 />
                 <label htmlFor="is_audited" className="text-xs text-white/60 font-bold">Is this an audited valuation?</label>
              </div>
              {formData.is_audited && (
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/30 uppercase font-black">Auditor Name</label>
                  <input 
                    type="text"
                    value={formData.auditor_name}
                    onChange={e => setFormData({...formData, auditor_name: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#F59F01]"
                  />
                </div>
              )}
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-white/40 text-xs font-black uppercase">Cancel</button>
                <button type="submit" disabled={isRecording} className="flex-1 py-3 bg-[#F59F01] text-black rounded-xl text-xs font-black uppercase shadow-lg shadow-[#F59F01]/20">
                  {isRecording ? 'Recording...' : 'Save Valuation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
