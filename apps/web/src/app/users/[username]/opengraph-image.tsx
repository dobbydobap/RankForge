import { ImageResponse } from 'next/og';

export const alt = 'RankForge profile';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0a0a0a',
          color: '#e8e8ec',
          padding: 72,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22, letterSpacing: 4, color: '#8a8a98' }}>
          <span>RANKFORGE / PROFILE</span>
          <span>EST. 2026</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 30, color: '#8a8a98', letterSpacing: 2 }}>COMPETITIVE PROGRAMMER</div>
          <div style={{ fontSize: 150, fontWeight: 800, lineHeight: 0.9, letterSpacing: -4 }}>
            @{username}
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 22, letterSpacing: 3, color: '#8a8a98' }}>
          rank-forge-web.vercel.app
        </div>
      </div>
    ),
    { ...size },
  );
}
