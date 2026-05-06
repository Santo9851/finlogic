import React from 'react';
import { History } from 'lucide-react';

export default function AuditLogTab({ events }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-white/10 flex items-center gap-3">
        <History size={18} className="text-[#F59F01]" />
        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Immutable Audit Trail</h3>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="bg-white/[0.02] text-white/20 uppercase text-[10px] font-bold tracking-widest border-b border-white/5">
          <tr>
            <th className="px-6 py-4">Event Type</th>
            <th className="px-6 py-4">Actor</th>
            <th className="px-6 py-4">Details</th>
            <th className="px-6 py-4 text-right">Timestamp</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {events?.map((ev) => (
            <tr key={ev.id} className="hover:bg-white/[0.01] transition-colors">
              <td className="px-6 py-5">
                <span className="text-[#F59F01] font-bold text-xs uppercase tracking-tighter">
                  {ev.event_type_display}
                </span>
              </td>
              <td className="px-6 py-5">
                <div className="flex flex-col">
                  <span className="text-white text-xs font-medium">{ev.actor_email || 'System'}</span>
                  <span className="text-[10px] text-white/20 font-bold uppercase tracking-tight">{ev.ip_address || 'Internal'}</span>
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="text-[10px] text-white/40 font-mono bg-black/20 p-2 rounded max-w-xs truncate">
                  {JSON.stringify(ev.payload)}
                </div>
              </td>
              <td className="px-6 py-5 text-right text-white/30 text-xs font-medium">
                {new Date(ev.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
          {(!events || events.length === 0) && (
             <tr>
               <td colSpan={4} className="px-6 py-12 text-center text-white/20 italic">No audit events found</td>
             </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
