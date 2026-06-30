'use client';

import { useRef, useState } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&/0123456789';

// Glitch-scrambles the text on hover, then settles left-to-right.
export function ScrambleText({ text, className = '' }: { text: string; className?: string }) {
  const [display, setDisplay] = useState(text);
  const raf = useRef<number | undefined>(undefined);
  const frame = useRef(0);

  const run = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    frame.current = 0;
    const tick = () => {
      const revealed = frame.current / 2;
      const out = text
        .split('')
        .map((ch, i) => {
          if (ch === ' ') return ' ';
          if (i < revealed) return text[i];
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join('');
      setDisplay(out);
      frame.current += 1;
      if (revealed <= text.length) {
        raf.current = requestAnimationFrame(tick);
      } else {
        setDisplay(text);
      }
    };
    raf.current = requestAnimationFrame(tick);
  };

  return (
    <span onMouseEnter={run} className={className}>
      {display}
    </span>
  );
}
