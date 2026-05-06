import React from 'react';
import { Building2 } from 'lucide-react';

export default function OverviewTab({ deal }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest border-b border-white/5 pb-4">Entity Information</h3>
          <div className="grid grid-cols-2 gap-y-6">
            <DetailItem label="Legal Name" value={deal.legal_name} />
            <DetailItem label="Registration #" value={deal.ocr_registration_number} />
            <DetailItem label="Fund" value={deal.fund_detail?.name} />
            <DetailItem label="Deal Type" value={deal.deal_type_display} />
            <DetailItem label="Sector" value={deal.sector} />
            <DetailItem label="Status" value={deal.status_display} />
          </div>
        </div>
        
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest border-b border-white/5 pb-4">Investment Parameters</h3>
          <div className="grid grid-cols-2 gap-y-6">
            <DetailItem 
              label="Investment Range" 
              value={deal.investment_range_min_npr 
                ? `NPR ${Number(deal.investment_range_min_npr).toLocaleString()} - ${Number(deal.investment_range_max_npr).toLocaleString()}`
                : 'Not specified'} 
            />
            <DetailItem label="Submission Mode" value={deal.submission_type === 'MANUAL_GP' ? 'Manual Entry' : 'Entrepreneur Portal'} />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-[#F59F01]/5 border border-[#F59F01]/10 rounded-2xl p-6">
           <h3 className="text-sm font-bold text-[#F59F01] mb-4 uppercase tracking-widest">Contact Point</h3>
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white">
                  <span className="text-xs font-bold">EP</span>
                </div>
                <div>
                  <p className="text-white text-sm font-bold">{deal.entrepreneur_detail?.email || 'No contact linked'}</p>
                  <p className="text-white/40 text-[10px] uppercase font-bold">Entrepreneur</p>
                </div>
              </div>
              <button className="w-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2 rounded-lg transition-colors">
                Send Message
              </button>
           </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
           <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">Workflow Metadata</h3>
           <div className="space-y-4">
             <DetailItem label="Created By" value={deal.created_by_detail?.email} />
             <DetailItem label="Date Created" value={new Date(deal.created_at).toLocaleDateString()} />
             <DetailItem label="Last Update" value={new Date(deal.updated_at).toLocaleDateString()} />
           </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-white/30 text-[10px] uppercase font-black mb-1.5 tracking-widest">{label}</p>
      <p className="text-white text-sm font-semibold">{value || '—'}</p>
    </div>
  );
}
