'use client'

import { useState } from 'react';
import Link from 'next/link';
import FinlogicLogo from '@/components/FinlogicLogo';
import { contactService } from '@/services/contact';
import { toast } from 'sonner';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [segment, setSegment] = useState('general');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      // Use the new newsletter endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/newsletter/subscribe/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, segment }),
      });
      
      if (!response.ok) throw new Error('Subscription failed');
      
      toast.success('You have joined our network!');
      setEmail('');
    } catch (err) {
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="w-full bg-card py-12 text-foreground lg:py-20 border-t border-border-theme theme-transition print:hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Brand & Tagline */}
          <div className="space-y-5">
            <FinlogicLogo size={36} variant="full" darkBg={false} className="block dark:hidden" />
            <FinlogicLogo size={36} variant="full" darkBg={true} className="hidden dark:block" />
            <p className="text-lg italic text-text-muted">
              "Where Vision Meets Wisdom"
            </p>
          </div>

          {/* Quick Links & Contact */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#F59F01]">
                Quick Links
              </h3>
              <ul className="space-y-2">
                <li><Link href="/" className="text-sm hover:text-[#F59F01] transition-colors">Home</Link></li>
                <li><Link href="/about" className="text-sm hover:text-[#F59F01] transition-colors">About Us</Link></li>
                <li><Link href="/for-investors" className="text-sm hover:text-[#F59F01] transition-colors">For Investors</Link></li>
                <li><Link href="/insights" className="text-sm hover:text-[#F59F01] transition-colors">Insights</Link></li>
                <li><Link href="/newsletter" className="text-sm hover:text-[#F59F01] transition-colors">Newsletter</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#F59F01]">
                Contact Info
              </h3>
              <ul className="space-y-2 text-sm text-text-muted">
                <li>contact@finlogiccapital.com</li>
                <li>Kathmandu, Nepal</li>
                <li>+977-9851437351</li>
              </ul>
            </div>
          </div>

          {/* Stay Updated */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#F59F01]">
                Stay Updated
              </h3>
              <p className="text-sm text-text-muted">
                Join our exclusive network to receive notifications about new investment opportunities and market insights.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
              <div className="space-y-1">
                <select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  className="w-full rounded-md border border-border-theme bg-card px-4 py-2 text-sm text-foreground focus:border-[#F59F01] focus:outline-none appearance-none transition-all cursor-pointer"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23F59F01\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                >
                  <option value="general" className="bg-card text-foreground">General Subscriber</option>
                  <option value="founder" className="bg-card text-foreground">Founder</option>
                  <option value="lp" className="bg-card text-foreground">Investor (LP)</option>
                  <option value="international" className="bg-card text-foreground">International Partner</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="w-full rounded-md border border-border-theme bg-card px-4 py-2 text-sm text-foreground focus:border-[#F59F01] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md bg-[#F59F01] px-4 py-2 text-sm font-bold text-[#100226] transition-all hover:bg-[#F59F01]/90 disabled:opacity-50"
                >
                  {loading ? 'Joining...' : 'Join'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-16 border-t border-border-theme pt-8 text-center text-xs text-text-muted">
          <p>© {new Date().getFullYear()} Finlogic Capital Limited. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
