import React from 'react';
import { MessageSquare } from 'lucide-react';

export default function FormResponsesTab({ responses }) {
  return (
    <div className="space-y-6">
      {(!responses || responses.length === 0) ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-white/20 italic">
           No form responses recorded for this deal.
        </div>
      ) : (
        responses.map((r) => (
          <div key={r.id} className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
              <div className="w-8 h-8 rounded-lg bg-[#F59F01]/10 flex items-center justify-center text-[#F59F01]">
                <MessageSquare size={16} />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">Step {r.step_index}: {r.step_name}</h4>
                <p className="text-white/30 text-[10px] uppercase font-bold tracking-tighter">Submitted {new Date(r.submitted_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {Object.entries(r.response_data || {}).map(([key, val]) => (
                 <div key={key}>
                    <p className="text-white/30 text-[10px] uppercase font-black mb-1.5 tracking-widest">{key.replace(/_/g, ' ')}</p>
                    <p className="text-white text-sm">{String(val)}</p>
                 </div>
               ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
