// Deal score: a neutral number + word + 5 segments. Never green, never a gauge.
import { scoreSegments, scoreWord } from "@/lib/money";

export function Score({ score }: { score: number }) {
  const n = scoreSegments(score);
  return (
    <div className="score" aria-label={`Score ${score} out of 100, ${scoreWord(score)}`} role="img">
      <span className="sn">
        <span className="num">{score}</span>
        <span className="word">{scoreWord(score)}</span>
      </span>
      <span className="segs" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <i key={i} className={i < n ? "on" : ""} />
        ))}
      </span>
    </div>
  );
}
