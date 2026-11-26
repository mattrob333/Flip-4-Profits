// Product visuals are the hero of a deal (StockX style): a light #F2F1EC tile
// with the item on it. When a real listing photo exists (`photo_url`, filled in
// by the scrapers later) we show it; until then a drawn product shot in flat
// tones with highlights (no line icons, no emoji, no network).
import * as React from "react";
import { scoreTier, scoreWord } from "@/lib/money";
import { cn } from "@/lib/utils";

type Size = number | "hero";

export function ProductImage({
  kind,
  photoUrl,
  size,
  score,
  alt = "",
  className,
}: {
  kind: string;
  photoUrl?: string | null;
  /** Square px (64 rows, 96 My Stuff) or "hero" (full width, 16:10). */
  size: Size;
  /** When set, the score pill sits on the image (top left). */
  score?: number;
  alt?: string;
  className?: string;
}) {
  const hero = size === "hero";
  const Drawing = DRAWINGS[kind] ?? DRAWINGS.box;
  return (
    <span
      className={cn("pimg", hero ? "hero" : size >= 88 ? "lg" : "", className)}
      style={hero ? undefined : { width: size, height: size }}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
    >
      {photoUrl ? (
        // Listing photos come from many hosts, so a plain <img> (not next/image).
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" loading="lazy" decoding="async" />
      ) : (
        <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
          <ellipse cx="60" cy="104" rx="42" ry="4.5" fill="#1d1c14" opacity=".1" />
          <Drawing />
        </svg>
      )}
      {score != null && <ScorePill score={score} className="on-img" />}
    </span>
  );
}

/** Deal score as a solid pill with its word: Great 75+, OK 60-74, Risky under 60. */
export function ScorePill({ score, className }: { score: number; className?: string }) {
  const tier = scoreTier(score);
  return (
    <span className={cn("spill", tier, className)} role="img" aria-label={`Deal score ${score} out of 100: ${scoreWord(score)}`}>
      {tier === "risky" && (
        <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.5L1.5 21h21z" fill="currentColor" />
          <path d="M12 9.5v5" stroke="var(--warn)" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="12" cy="17.6" r="1.4" fill="var(--warn)" />
        </svg>
      )}
      <b>{scoreWord(score)}</b>
      <span>{score}</span>
    </span>
  );
}

const HL = "#ffffff";

const DRAWINGS: Record<string, () => React.ReactElement> = {
  // DeWalt-style 20V drill: yellow housing, black grip and battery, steel chuck.
  drill: () => (
    <g>
      <rect x="30" y="85" width="44" height="15" rx="3.5" fill="#24262b" />
      <rect x="32" y="81" width="40" height="7" rx="2" fill="#34373d" />
      <rect x="35" y="92" width="34" height="3" rx="1.5" fill="#f5c518" />
      <path d="M46 56h16l-4 28H40z" fill="#34373d" />
      <path d="M47 62h11M46.2 68h11M45.4 74h11" stroke="#1b1d21" strokeWidth="2" strokeLinecap="round" />
      <rect x="60" y="58" width="6" height="10" rx="2.5" fill="#1b1d21" />
      <rect x="22" y="26" width="58" height="34" rx="10" fill="#f5c518" />
      <path d="M22 45h58v5c0 5.5-4.5 10-10 10H32c-5.5 0-10-4.5-10-10z" fill="#d9a70e" />
      <rect x="16" y="30" width="15" height="26" rx="7" fill="#24262b" />
      <path d="M20 37h7M20 43h7M20 49h7" stroke="#3e4148" strokeWidth="2" strokeLinecap="round" />
      <rect x="40" y="33" width="27" height="11" rx="3" fill="#24262b" />
      <rect x="43.5" y="37" width="15" height="3" rx="1.5" fill="#f5c518" />
      <rect x="80" y="30" width="9" height="26" rx="3" fill="#34373d" />
      <path d="M82.5 33v20M86 33v20" stroke="#24262b" strokeWidth="1.4" />
      <path d="M89 34l12 3.5v11L89 52z" fill="#b4bac1" />
      <path d="M89 44l12 0v4.5L89 52z" fill="#7d838a" />
      <rect x="101" y="41.5" width="14" height="3.4" rx="1.2" fill="#6e747b" />
      <rect x="28" y="29.5" width="44" height="4" rx="2" fill={HL} opacity=".5" />
    </g>
  ),

  // Folding fat-tire e-bike: black frame, battery on the down tube, mag wheels.
  ebike: () => (
    <g>
      {[30, 92].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="78" r="21" fill="#23262b" />
          <circle cx={cx} cy="78" r="13.5" fill="#9aa1a9" />
          <circle cx={cx} cy="78" r="11" fill="#f2f1ec" />
          {[0, 72, 144, 216, 288].map((a) => (
            <rect key={a} x={cx - 1.4} y="67" width="2.8" height="11" rx="1.2" fill="#5e656d" transform={`rotate(${a} ${cx} 78)`} />
          ))}
          <circle cx={cx} cy="78" r={cx === 30 ? 6 : 3.5} fill="#3a4046" />
          <path d={`M${cx - 19} 70a21 21 0 0 1 9-11`} stroke="#4a5058" strokeWidth="2" strokeLinecap="round" fill="none" />
        </g>
      ))}
      <path d="M30 78L56 80M30 78L49 52M56 80L48 46M56 80L82 44M82 44L92 78" stroke="#2f3b44" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M61 72l17-23 6 4-17 23z" fill="#1c1f23" />
      <path d="M64.5 70l13-17.5" stroke="#3fb6a0" strokeWidth="2" strokeLinecap="round" />
      <path d="M82 44l-4-16" stroke="#2f3b44" strokeWidth="5" strokeLinecap="round" />
      <path d="M71 27.5h16" stroke="#1c1f23" strokeWidth="5" strokeLinecap="round" />
      <rect x="83" y="40" width="7" height="5" rx="1.5" fill="#f2e7a8" />
      <path d="M48 46v-4" stroke="#2f3b44" strokeWidth="4" strokeLinecap="round" />
      <path d="M38 41.5c0-2.5 2-3.5 5-3.5h11c2.5 0 3.5 1.5 3 3.5l-1 2H39z" fill="#1c1f23" />
      <path d="M18 57h26" stroke="#2f3b44" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M22 57l4 12" stroke="#2f3b44" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M53 53.5l24-6.5" stroke={HL} strokeWidth="1.6" strokeLinecap="round" opacity=".35" />
    </g>
  ),

  // Handheld console: blue and red controllers either side of a lit screen.
  handheld: () => (
    <g>
      <path d="M29 37v46h-7c-6.6 0-12-5.4-12-12V49c0-6.6 5.4-12 12-12z" fill="#1fa9e1" />
      <path d="M29 72v11h-7c-6 0-11-4.4-11.9-10.2L29 72z" fill="#1789ba" />
      <path d="M91 37h7c6.6 0 12 5.4 12 12v22c0 6.6-5.4 12-12 12h-7z" fill="#f2473c" />
      <path d="M91 72h18.9c-.9 6-6 11-11.9 11h-7z" fill="#cc3229" />
      <rect x="29" y="37" width="62" height="46" fill="#1e2024" />
      <rect x="32.5" y="40.5" width="55" height="39" rx="2" fill="#4fb3ea" />
      <path d="M32.5 66c10-8 20-9 30-4s17 3 25-2v17.5c0 1.1-.9 2-2 2h-51c-1.1 0-2-.9-2-2z" fill="#58c26c" />
      <path d="M32.5 72c12-5 26-4 55 0v5.5c0 1.1-.9 2-2 2h-51c-1.1 0-2-.9-2-2z" fill="#3e9a52" />
      <circle cx="74" cy="50" r="5" fill="#ffd84a" />
      <path d="M32.5 40.5h22l-14 39h-8z" fill={HL} opacity=".14" />
      <circle cx="19.5" cy="50" r="5.5" fill="#16181b" />
      <circle cx="19.5" cy="50" r="3.4" fill="#2c2f34" />
      {[[19.5, 63], [15, 67.5], [24, 67.5], [19.5, 72]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.1" fill="#16181b" />
      ))}
      {[[100.5, 46], [96, 50.5], [105, 50.5], [100.5, 55]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.1" fill="#16181b" />
      ))}
      <circle cx="100.5" cy="68" r="5.5" fill="#16181b" />
      <circle cx="100.5" cy="68" r="3.4" fill="#2c2f34" />
      <rect x="13" y="40" width="12" height="2.2" rx="1.1" fill={HL} opacity=".45" />
      <rect x="95" y="40" width="12" height="2.2" rx="1.1" fill={HL} opacity=".45" />
    </g>
  ),

  // Cordless leaf blower: lime housing, grey tube, black battery and handle.
  blower: () => (
    <g>
      <path d="M62 49l46 6.5v9L64 67z" fill="#6a6f76" />
      <path d="M63 59l45 3v2.5L64 67z" fill="#53575d" />
      <rect x="101" y="54.5" width="9" height="11" rx="2" fill="#33373c" />
      <path d="M62 49l9 1.3v15.4L64 67z" fill="#c3d82e" />
      <path d="M28 38l4-15c1-3.5 3.5-5 7-5h13c4 0 6.5 2.5 6 6.5L56 38h-6.5l1.5-12.5H39.5L35 38z" fill="#33373c" />
      <rect x="24" y="73" width="31" height="14" rx="3" fill="#33373c" />
      <rect x="33" y="70" width="13" height="5" rx="1.5" fill="#c3d82e" />
      <path d="M18 52c0-8 6-14 14-14h20c6 0 10.5 4 11.5 10l2 13.5C66.8 68.6 61 75 54 75H30c-6.6 0-12-5.4-12-12z" fill="#c3d82e" />
      <path d="M18 60h47.8c.5 8-5 15-11.8 15H30c-6.6 0-12-5.4-12-12z" fill="#9fb31c" />
      <path d="M27 48h16M27 53.5h16" stroke="#33373c" strokeWidth="3" strokeLinecap="round" />
      <rect x="47" y="45" width="10" height="10" rx="5" fill="#33373c" />
      <rect x="24" y="41" width="30" height="3.4" rx="1.7" fill={HL} opacity=".55" />
    </g>
  ),

  // Trading card binder, open: two pages of bright cards in sleeves.
  binder: () => (
    <g>
      <rect x="7" y="21" width="106" height="78" rx="6" fill="#273048" />
      <rect x="11" y="25" width="47" height="70" rx="2.5" fill="#fbfbf7" />
      <rect x="62" y="25" width="47" height="70" rx="2.5" fill="#fbfbf7" />
      {[33, 46, 59, 72, 85].map((y) => (
        <rect key={y} x="57" y={y} width="6" height="3" rx="1.5" fill="#9aa1a9" />
      ))}
      {[14, 65].map((px, pi) =>
        [0, 1, 2].map((row) =>
          [0, 1, 2].map((col) => {
            const colors = ["#f6cb2e", "#e5533d", "#3d8fe0", "#4db86a", "#8e6bd6", "#f08a3a"];
            const c = colors[(row * 3 + col + pi * 2) % colors.length];
            const x = px + col * 14.5;
            const y = 29 + row * 21.5;
            return (
              <g key={`${pi}-${row}-${col}`}>
                <rect x={x} y={y} width="12.5" height="18.5" rx="1.6" fill={c} />
                <rect x={x + 1.6} y={y + 2} width="9.3" height="7.5" rx=".8" fill={HL} opacity=".55" />
                <rect x={x + 1.6} y={y + 12} width="9.3" height="1.6" rx=".8" fill="#000" opacity=".22" />
                <rect x={x + 1.6} y={y + 15} width="6" height="1.4" rx=".7" fill="#000" opacity=".18" />
              </g>
            );
          }),
        ),
      )}
      <path d="M11 25h47l-12 70H11z" fill={HL} opacity=".1" />
    </g>
  ),

  // Wireless earbuds in an open white charging case.
  earbuds: () => (
    <g>
      <path d="M30 41V31c0-6 4.5-10.5 10.5-10.5h39c6 0 10.5 4.5 10.5 10.5v10z" fill="#ecedf0" stroke="#c6c8cc" strokeWidth="1.2" />
      <rect x="34" y="36.5" width="52" height="4" rx="2" fill="#d3d5d9" />
      <path d="M26 45h68v20c0 13.3-10.7 24-24 24H50c-13.3 0-24-10.7-24-24z" fill="#ffffff" stroke="#c6c8cc" strokeWidth="1.2" />
      <path d="M27.5 72c2.5 10 11.5 17 22.5 17h20c11 0 20-7 22.5-17z" fill="#e4e5e9" />
      <rect x="30" y="45.5" width="60" height="7" rx="3.5" fill="#d9dbde" />
      {[47, 73].map((cx, i) => (
        <g key={cx} transform={`rotate(${i ? 18 : -18} ${cx} 47)`}>
          <rect x={cx - 3.5} y="40" width="7" height="13" rx="3.5" fill="#ffffff" stroke="#c6c8cc" strokeWidth="1" />
          <ellipse cx={cx} cy="40.5" rx="6.5" ry="5" fill="#ffffff" stroke="#c6c8cc" strokeWidth="1" />
          <rect x={cx - 3} y="37.6" width="6" height="2.4" rx="1.2" fill="#9a9ea5" />
        </g>
      ))}
      <circle cx="60" cy="68" r="1.8" fill="#49c46e" />
      <rect x="37" y="24" width="30" height="3" rx="1.5" fill={HL} />
      <path d="M31 56c0 8 2 14 6 19" stroke={HL} strokeWidth="3" strokeLinecap="round" fill="none" />
    </g>
  ),

  // Slim console in three-quarter view with a controller in front.
  consolebox: () => (
    <g>
      <path d="M12 50l70-13 28 12-70 14z" fill="#2c3036" />
      <path d="M12 50l28 13v12L12 62z" fill="#25282d" />
      <path d="M40 63l70-14v12L40 75z" fill="#1b1d21" />
      <path d="M26 56.5l70-13.5" stroke="#202328" strokeWidth="1.6" />
      <path d="M12 50l70-13" stroke={HL} strokeWidth="1.4" opacity=".3" />
      <path d="M58 45.5l9-1.7 4 1.8-9 1.7z" fill="#454a52" />
      <path d="M57 78c3-5 8-6 13-4.5h11c5-1.5 10-.5 13 4.5l4 12c1 4-3 6.5-6.5 4L86 89H64l-5.5 5c-3.5 2.5-7.5 0-6.5-4z" fill="#2a2d33" />
      <rect x="69" y="74.5" width="12" height="7" rx="1.5" fill="#3a3e45" />
      <rect x="70" y="73.4" width="10" height="1.6" rx=".8" fill="#4d8ef0" />
      <circle cx="66.5" cy="85" r="3.4" fill="#15171a" />
      <circle cx="83.5" cy="85" r="3.4" fill="#15171a" />
      <path d="M60 79.5h5M62.5 77v5" stroke="#15171a" strokeWidth="1.8" strokeLinecap="round" />
      {[[89, 77.5], [86.5, 80], [91.5, 80], [89, 82.5]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.2" fill="#9aa1a9" />
      ))}
      <path d="M60 77.5c3-3 6-3.5 10-3" stroke={HL} strokeWidth="1.4" strokeLinecap="round" opacity=".3" fill="none" />
    </g>
  ),

  // Fallback: a taped cardboard box.
  box: () => (
    <g>
      <path d="M24 42l36-12 36 12-36 12z" fill="#ddb27a" />
      <path d="M24 42l36 12v38L24 80z" fill="#c99a62" />
      <path d="M60 54l36-12v38L60 92z" fill="#b07f48" />
      <path d="M41 36.4l4.2-1.4 36 12-4.2 1.4z" fill="#ecd7ad" />
      <path d="M77 48.4l4.2-1.4v11l-4.2 1.4z" fill="#d9c094" />
      <path d="M68 66l20-6.6v10L68 76z" fill="#fbfbf7" />
      <path d="M71 67.5l13-4.3M71 71l9-3" stroke="#b07f48" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M24 42l36 12" stroke={HL} strokeWidth="1.4" opacity=".35" />
    </g>
  ),
};
