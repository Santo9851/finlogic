import React from 'react';
import { Building2 } from 'lucide-react';

export default function OverviewTab({ deal }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 theme-transition">
      <div className="md:col-span-2 space-y-6">
        <div className="bg-card border border-border-theme rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-black text-foreground mb-6 uppercase tracking-[0.2em] border-b border-border-theme pb-4">Entity Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6">
            <DetailItem label="Legal Name" value={deal.legal_name} />
            <DetailItem label="Registration #" value={deal.ocr_registration_number} />
            <DetailItem label="Fund" value={deal.fund_detail?.name} />
            <DetailItem label="Deal Type" value={deal.deal_type_display} />
            <DetailItem label="Sector" value={deal.sector} />
            <DetailItem label="Status" value={deal.status_display} />
          </div>
        </div>
        
        <div className="bg-card border border-border-theme rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-black text-foreground mb-6 uppercase tracking-[0.2em] border-b border-border-theme pb-4">Investment Parameters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6">
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
        <div className="bg-[#F59F01]/5 border border-[#F59F01]/10 rounded-2xl p-6 shadow-lg">
           <h3 className="text-sm font-black text-[#F59F01] mb-6 uppercase tracking-[0.2em] border-b border-[#F59F01]/10 pb-4">Contact Point</h3>
           <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-foreground/5 border border-border-theme flex items-center justify-center text-[#F59F01] shadow-inner font-black text-lg">
                  {deal.entrepreneur_detail?.first_name?.[0] || 'E'}
                </div>
                <div>
                  <p className="text-foreground text-sm font-black truncate max-w-[180px]">{deal.entrepreneur_detail?.email || 'No contact linked'}</p>
                  <p className="text-text-muted text-[10px] uppercase font-black tracking-widest mt-0.5">Entrepreneur</p>
                </div>
              </div>
              <button className="w-full bg-foreground/5 hover:bg-foreground/10 text-foreground text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all border border-border-theme active:scale-95">
                Send Message
              </button>
           </div>
        </div>

        <div className="bg-card border border-border-theme rounded-2xl p-6 shadow-xl">
           <h3 className="text-sm font-black text-foreground mb-6 uppercase tracking-[0.2em] border-b border-border-theme pb-4">Workflow Metadata</h3>
           <div className="space-y-5">
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
    <div className="group">
      <p className="text-text-muted/60 text-[10px] uppercase font-black mb-1.5 tracking-widest group-hover:text-text-muted transition-colors">{label}</p>
      <p className="text-foreground text-sm font-black tracking-tight">{value || '—'}</p>
    </div>
  );
}
