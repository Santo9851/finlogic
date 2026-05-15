'use client'

import { useState } from 'react';
import { toast } from 'sonner';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [segment, setSegment] = useState('general');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/newsletter/subscribe/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, first_name: firstName, segment }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Subscription failed');
      
      toast.success('Welcome to Capital Lines!');
      setEmail('');
      setFirstName('');
    } catch (err) {
      toast.error(err.message || 'Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border-theme bg-card/50 p-8 backdrop-blur-xl theme-transition">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-muted">First name</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jane"
              className="w-full rounded-md border border-border-theme bg-background px-4 py-3 text-sm text-foreground focus:border-ls-compliment focus:outline-none theme-transition"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-muted">Work email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@company.com"
              className="w-full rounded-md border border-border-theme bg-background px-4 py-3 text-sm text-foreground focus:border-ls-compliment focus:outline-none theme-transition"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-text-muted">I am primarily a…</label>
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            className="w-full rounded-md border border-border-theme bg-background px-4 py-3 text-sm text-foreground focus:border-ls-compliment focus:outline-none appearance-none theme-transition"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23c09736\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
          >
            <option value="general">General Observer</option>
            <option value="founder">Founder / Entrepreneur</option>
            <option value="lp">Institutional Investor (LP)</option>
            <option value="international">International Partner</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-ls-compliment py-4 text-sm font-black uppercase tracking-widest text-ls-primary transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Joining Network...' : 'Subscribe to Capital Lines →'}
        </button>
        
        <p className="text-center text-[10px] text-text-muted/60 uppercase tracking-widest">
          No spam &bull; Unsubscribe any time
        </p>
      </form>
    </div>
  );
}
