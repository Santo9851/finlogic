'use client'

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children }) {
  const pathname = usePathname();
  
  // Define routes that should NOT have the main website header/footer
  const isPortal = pathname.startsWith('/gp') || 
                   pathname.startsWith('/lp') || 
                   pathname.startsWith('/entrepreneur') || 
                   pathname.startsWith('/admin') ||
                   pathname.startsWith('/auth') ||
                   pathname.startsWith('/superadmin');

  if (isPortal) {
    return <div className="min-h-screen bg-background text-foreground selection:bg-[#F59F01]/30 theme-transition">{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col font-sans bg-background text-foreground theme-transition">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}
