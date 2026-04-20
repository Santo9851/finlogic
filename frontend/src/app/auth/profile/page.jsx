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
    <div className="min-h-screen bg-[#0a0014] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={32} className="text-[#0B6EC3] animate-spin" />
        <p className="text-white/40 text-xs uppercase tracking-widest">Redirecting to profile…</p>
      </div>
    </div>
  );
}
