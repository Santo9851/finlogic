'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Global Profile Redirect
 * Redirects the user to their role-specific profile page.
 */
export default function ProfileRedirect() {
  const { user, authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      // Determine the redirect path based on roles
      const roles = user.roles || '';
      
      if (roles.includes('admin') || roles.includes('superadmin')) {
        router.replace('/gp/profile');
      } else if (roles.includes('gp_investor')) {
        router.replace('/gp-investor/profile');
      } else if (roles.includes('investor')) {
        router.replace('/lp/profile');
      } else if (roles.includes('entrepreneur')) {
        router.replace('/entrepreneur/profile');
      } else {
        router.replace('/');
      }
    }
  }, [user, authLoading, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center theme-transition">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={32} className="text-ls-secondary animate-spin" />
        <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Redirecting to institutional registry…</p>
      </div>
    </div>
  );
}
