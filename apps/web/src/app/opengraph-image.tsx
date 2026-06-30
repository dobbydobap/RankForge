import { ImageResponse } from 'next/og';

export const alt = 'RankForge — Competitive Programming Platform';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
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
          <span>RF / COMPETITIVE-PROGRAMMING</span>
          <span>EST. 2026</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 172, fontWeight: 800, lineHeight: 0.9, letterSpacing: -6 }}>RANKFORGE</div>
          <div style={{ fontSize: 34, color: '#8a8a98', marginTop: 18, letterSpacing: 2 }}>
            Compete · Analyze · Rise
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, letterSpacing: 3, color: '#8a8a98' }}>
          <span>TEMPORAL LEADERBOARD</span>
          <span>REAL-TIME JUDGE</span>
          <span>ISBN 0011—RF26</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
