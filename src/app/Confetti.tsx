import { useMemo } from 'react';

const EMOJIS = ['🎉', '⚽', '🏆', '🥳', '✨', '🟢', '⭐'];

/** Kertaluontoinen emoji-konfettisade sivun latautuessa (juhlistaa kärkeä). */
export function Confetti({ count = 28 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        emoji: EMOJIS[i % EMOJIS.length],
        left: Math.random() * 100,
        delay: Math.random() * 2.5,
        duration: 3 + Math.random() * 2.5,
        size: 0.9 + Math.random() * 1.1,
      })),
    [count],
  );

  return (
    <div aria-hidden className="pointer-events-none">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}vw`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            fontSize: `${p.size}rem`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
