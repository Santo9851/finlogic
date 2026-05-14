import { notFound } from 'next/navigation';
import PublicShareContent from './PublicShareContent';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

async function getShareData(id) {
  // For Server Components, we might need the internal Docker service name
  let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  
  // If we're on the server and using Docker, 'localhost' won't work.
  // We try 'backend' as a fallback host.
  if (typeof window === 'undefined') {
    apiUrl = apiUrl.replace('localhost', 'backend');
  }

  // Ensure no double slashes and correct path
  const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

  try {
    const res = await fetch(`${cleanApiUrl}/idea-validator/sessions/${id}/share/`, {
      next: { revalidate: 3600 } 
    });
    if (!res.ok) {
      console.error(`Share data fetch failed for ${id}: ${res.status}`);
      return null;
    }
    return res.json();
  } catch (err) {
    console.error("Fetch error in getShareData:", err);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const data = await getShareData(id);
  
  if (!data) {
    return { title: 'Archival Registry | Finlogic Capital' };
  }
  
  return {
    title: `Dossier: ${data.verdict} | Sovereign Venture Architect`,
    description: data.excerpt?.substring(0, 160) || "Analyze your business idea through the Finlogic Sovereign Venture Architect.",
    openGraph: {
      title: `Institutional Validation: ${data.verdict}`,
      description: data.excerpt?.substring(0, 160),
      images: [`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/og?id=${id}`],
    },
  };
}

export default async function PublicSharePage({ params }) {
  const { id } = await params;
  const data = await getShareData(id);

  if (!data) {
    return (
      <div className="min-h-screen bg-[#05010d] text-[#f8fafc] flex flex-col items-center justify-center text-center p-8 relative overflow-hidden">
        {/* Institutional Background Grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#F59F01 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative z-10 max-w-xl space-y-12">
          <div className="w-24 h-24 border border-ls-secondary/30 bg-ls-secondary/5 flex items-center justify-center text-ls-secondary mx-auto">
            <AlertTriangle size={48} />
          </div>
          
          <div className="space-y-6">
            <h1 className="text-4xl font-serif font-light tracking-tight uppercase">Registry Entry <br /> Restricted</h1>
            <p className="text-ls-white/40 leading-relaxed font-serif italic text-lg">
              The requested validation dossier has either been retracted from the public registry 
              or is restricted for internal review only.
            </p>
          </div>

          <div className="pt-8 flex justify-center">
            <Link 
              href="/" 
              className="px-12 py-5 bg-ls-compliment text-ls-primary font-bold text-[10px] uppercase tracking-[0.3em] transition-all hover:bg-ls-white"
            >
               Return to Registry Command
            </Link>
          </div>
          
          <div className="pt-12 text-[10px] font-mono text-ls-white/10 uppercase tracking-[0.4em]">
            REF: FC-AUTH-RSTR-{id.substring(0, 8).toUpperCase()}
          </div>
        </div>
      </div>
    );
  }

  return <PublicShareContent data={data} />;
}
