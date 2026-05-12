import React from 'react';
import { History } from 'lucide-react';

export default function AuditLogTab({ events }) {
  return (
    <div className="bg-card border border-border-theme rounded-2xl overflow-hidden shadow-2xl theme-transition">
      <div className="p-6 border-b border-border-theme flex items-center gap-3">
        <History size={18} className="text-[#F59F01]" />
        <h3 className="text-sm font-bold text-ls-primary dark:text-white uppercase tracking-widest">Immutable Audit Trail</h3>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="bg-ls-primary/5 dark:bg-white/[0.02] text-ls-primary/30 dark:text-white/20 uppercase text-[10px] font-bold tracking-widest border-b border-border-theme">
          <tr>
            <th className="px-6 py-4">Event Type</th>
            <th className="px-6 py-4">Actor</th>
            <th className="px-6 py-4">Details</th>
            <th className="px-6 py-4 text-right">Timestamp</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ls-primary/5 dark:divide-white/5">
          {events?.map((ev) => (
            <tr key={ev.id} className="hover:bg-ls-primary/5 dark:hover:bg-white/[0.01] transition-colors">
              <td className="px-6 py-5">
                <span className="text-[#F59F01] font-bold text-xs uppercase tracking-tighter">
                  {ev.event_type_display}
                </span>
              </td>
              <td className="px-6 py-5">
                <div className="flex flex-col">
                  <span className="text-ls-primary dark:text-white text-xs font-medium">{ev.actor_email || 'System'}</span>
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-tight">{ev.ip_address || 'Internal'}</span>
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="text-[10px] text-ls-primary/40 dark:text-white/40 font-mono bg-ls-primary/5 dark:bg-black/20 p-2 rounded max-w-xs truncate">
                  {JSON.stringify(ev.payload)}
                </div>
              </td>
              <td className="px-6 py-5 text-right text-text-muted text-xs font-medium">
                {new Date(ev.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
          {(!events || events.length === 0) && (
             <tr>
               <td colSpan={4} className="px-6 py-12 text-center text-text-muted italic">No audit events found</td>
             </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
