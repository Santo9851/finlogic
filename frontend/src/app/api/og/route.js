import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response('Missing ID', { status: 400 });
    }

    // Fetch share data
    // Use internal service name for edge/server-side fetch
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    const internalApiUrl = apiUrl.replace('localhost', 'backend');
    
    const res = await fetch(`${internalApiUrl}/idea-validator/sessions/${id}/share/`);
    if (!res.ok) {
       return new Response('Session not found', { status: 404 });
    }
    const data = await res.json();

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#100226',
            backgroundImage: 'radial-gradient(circle at top left, rgba(245, 159, 1, 0.1), transparent), radial-gradient(circle at bottom right, rgba(11, 110, 195, 0.1), transparent)',
            padding: '40px',
            color: 'white',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
             <span style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '4px', color: '#F59F01' }}>FINLOGIC CAPITAL</span>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '30px',
              padding: '60px',
              textAlign: 'center',
              maxWidth: '900px',
            }}
          >
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'rgba(255,255,255,0.5)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>
               Strategic Validation
            </div>
            <div style={{ fontSize: '64px', fontWeight: 'black', marginBottom: '30px', color: '#F59F01' }}>
              {data.verdict}
            </div>
            <div style={{ fontSize: '24px', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', lineHeight: '1.4' }}>
               "{data.excerpt?.substring(0, 150)}..."
            </div>
          </div>
          <div style={{ marginTop: '40px', fontSize: '18px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>
            Verify your business idea at finlogiccapital.com
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
