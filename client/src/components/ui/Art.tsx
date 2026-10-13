import type { CSSProperties } from 'react';
import type { Mood } from '../../types';

/**
 * Expressive elements: flowers, the lavender star and blob faces.
 * Per the design system, use them on welcome, empty, success and error
 * screens and the check-in row — never inside clinical content.
 */

interface ArtProps {
  size: number;
  className?: string;
  style?: CSSProperties;
}

const PETALS = [0, 72, 144, 216, 288];

/** Five-petal flower. `bold` has fuller petals (pink hero flower). */
export function Flower({ size, color = '#F0679F', bold = true, stroke, className, style }: ArtProps & { color?: string; bold?: boolean; stroke?: string }) {
  const [cy, rx, ry, r] = bold ? [52, 40, 54, 44] : [50, 34, 52, 40];
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true" className={className} style={style}>
      <g fill={color} stroke={stroke} strokeWidth={stroke ? 3 : undefined}>
        {PETALS.map((deg) => (
          <ellipse key={deg} cx="100" cy={cy} rx={rx} ry={ry} transform={deg ? `rotate(${deg} 100 100)` : undefined} />
        ))}
        <circle cx="100" cy="100" r={r} stroke="none" />
      </g>
    </svg>
  );
}

export function Star({ size, color = '#B48CF5', className, style }: ArtProps & { color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true" className={className} style={style}>
      <path
        d="M100 0 L118 72 L190 60 L128 104 L168 170 L100 130 L32 170 L72 104 L10 60 L82 72 Z"
        fill={color}
        stroke={color}
        strokeWidth="22"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface FaceSpec {
  color: string;
  eyes: string;
  mouth: string;
  /** Open, filled mouth (laughing). */
  mouthFilled?: boolean;
  cheeks?: boolean;
}

export const moodFaces: Record<Mood, FaceSpec & { label: string }> = {
  great: { label: 'Great', color: '#FFA7DC', eyes: 'M9 15q2.5-3 5 0M20 15q2.5-3 5 0', mouth: 'M13 21q4 3.5 8 0' },
  unwell: { label: 'Unwell', color: '#FF8E8E', eyes: 'M9.5 13.5l4 1.5M24.5 13.5l-4 1.5', mouth: 'M13 23q4-3.5 8 0' },
  tired: { label: 'Tired', color: '#9CC9FF', eyes: 'M9.5 15q2 2 4 0M20.5 15q2 2 4 0', mouth: 'M15.5 22h3' },
  anxious: { label: 'Anxious', color: '#C9B2FF', eyes: 'M11.5 13.5v2M22.5 13.5v2', mouth: 'M12.5 22.5q2-2 4.5 0t4.5 0' },
  okay: { label: 'Okay', color: '#FFB690', eyes: 'M9.5 15h4M20.5 15h4', mouth: 'M14 21.5h6' },
};

export const faces = {
  happy: { color: '#FFB690', eyes: 'M9 15q2.5-3 5 0M20 15q2.5-3 5 0', mouth: 'M12.5 21q4.5 4 9 0', cheeks: true },
  laughing: { color: '#FFA7DC', eyes: 'M9.5 14.5q2 2.5 4 0M20.5 14.5q2 2.5 4 0', mouth: 'M13 20.5q4 5 8 0z', mouthFilled: true },
  calm: { color: '#C9B2FF', eyes: 'M11.5 13.5v2M22.5 13.5v2', mouth: 'M14 21.5q3 2.5 6 0' },
  sleepy: { color: '#9CC9FF', eyes: 'M9.5 15q2 2 4 0M20.5 15q2 2 4 0', mouth: 'M15.5 22h3' },
  sad: { color: '#9CC9FF', eyes: 'M9.5 15q2 2 4 0M20.5 15q2 2 4 0', mouth: 'M13.5 23q3.5-3 7 0' },
  upset: { color: '#FF8E8E', eyes: 'M9.5 13.5l4 1.5M24.5 13.5l-4 1.5', mouth: 'M12.5 23q2-2 4.5 0t4.5 0' },
  smile: { color: '#FFB690', eyes: 'M9 15q2.5-3 5 0M20 15q2.5-3 5 0', mouth: 'M13 21q4 3.5 8 0' },
} satisfies Record<string, FaceSpec>;

export function Face({ size, spec, rotate = 0, label, className, style }: ArtProps & { spec: FaceSpec; rotate?: number; label?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 34 34"
      className={className}
      style={{ transform: rotate ? `rotate(${rotate}deg)` : undefined, ...style }}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      <rect x="1" y="1" width="32" height="32" rx="11" fill={spec.color} />
      <path d={spec.eyes} fill="none" stroke="#181818" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d={spec.mouth}
        fill={spec.mouthFilled ? '#181818' : 'none'}
        stroke="#181818"
        strokeWidth={spec.mouthFilled ? 1.2 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {spec.cheeks && (
        <>
          <circle cx="8" cy="19" r="1.6" fill="#F0679F" />
          <circle cx="26" cy="19" r="1.6" fill="#F0679F" />
        </>
      )}
    </svg>
  );
}

/** The big hand-drawn smile used on hero tiles. */
export function SmileMark({ className }: { className?: string }) {
  return (
    <svg width="150" height="110" viewBox="0 0 150 110" aria-hidden="true" className={className}>
      <path d="M40 30q10-10 22 0M92 22q10-10 22 0" fill="none" stroke="#181818" strokeWidth="7" strokeLinecap="round" />
      <path d="M30 70q50 45 110-6" fill="none" stroke="#181818" strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}

/** Flower with a face on top and an optional badge — success/empty/error hero. */
export function FlowerFace({
  size,
  flowerColor = '#F0679F',
  face,
  faceRotate = -6,
  badge,
}: {
  size: number;
  flowerColor?: string;
  face: FaceSpec;
  faceRotate?: number;
  badge?: 'check';
}) {
  const faceSize = Math.round(size * 0.54);
  return (
    <span className="relative block flex-none" style={{ width: size, height: size }}>
      <Flower size={size} color={flowerColor} className="absolute inset-0" />
      <Face
        size={faceSize}
        spec={face}
        rotate={faceRotate}
        className="absolute"
        style={{ left: (size - faceSize) / 2, top: (size - faceSize) / 2 }}
      />
      {badge === 'check' && (
        <span className="absolute bottom-[8%] right-[3%] flex h-[52px] w-[52px] items-center justify-center rounded-full border-4 border-surface bg-ink text-surface">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        </span>
      )}
    </span>
  );
}
