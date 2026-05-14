import { notFound } from 'next/navigation';
import PublicShareContent from './PublicShareContent';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

async function getShareData(id) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  try {
    const res = await fetch(`${apiUrl}/idea-validator/sessions/${id}/share/`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.error("Fetch error:", err);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const data = await getShareData(id);
  
  if (!data) {
    return { title: 'Finlogic Idea Validator' };
  }
  
  return {
    title: `Finlogic Idea Validator | Verdict: ${data.verdict}`,
    description: data.excerpt?.substring(0, 160) || "Analyze your business idea through the Finlogic Sovereign Venture Architect.",
    openGraph: {
      title: `Institutional Validation: ${data.verdict}`,
      description: data.excerpt?.substring(0, 160),
      images: [`/api/og?id=${id}`],
    },
  };
}

export default async function PublicSharePage({ params }) {
  const { id } = await params;
  const data = await getShareData(id);

  if (!data) {
    return (
      <div className="min-h-screen bg-[#05010d] flex flex-col items-center justify-center text-center p-6 space-y-8">
        <div className="w-20 h-20 rounded-full bg-ls-secondary/10 flex items-center justify-center text-ls-secondary">
          <AlertTriangle size={40} />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-black uppercase tracking-tight">Record Unavailable</h1>
          <p className="text-text-muted max-w-md mx-auto">This validation record has either been retracted or is restricted for internal review only.</p>
        </div>
        <Link href="/" className="px-10 py-4 bg-ls-compliment text-ls-primary font-bold rounded-full uppercase tracking-widest text-xs transition-all hover:scale-105">
           Return to Finlogic Home
        </Link>
      </div>
    );
  }

  return <PublicShareContent data={data} />;
}
