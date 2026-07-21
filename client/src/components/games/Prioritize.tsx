import { useState, useRef, useEffect } from 'react';
import { useGenerate } from '../../hooks/useGenerate';
import GameLayout, { LoadingState, ErrorState, Stamp, RubricRow, JudgmentScore } from '../GameLayout';

interface Item {
  id: string; title: string; desc: string; hiddenCost: string;
}

interface Scenario {
  stakes: string;
  constraint: string;
  items: Item[];
  strongRankingLooksLike: string;
}

interface Grade {
  tradeoffAwareness: number; politicalRealism: number; clarity: number; judgmentScore: number; debrief: string;
}

interface Props { onComplete: (xp: number, skill: string) => void; }

export default function PrioritizeGame({ onComplete }: Props) {
  const { generate, loading, error, reset } = useGenerate();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [order, setOrder] = useState<string[]>([]);
  const [rationale, setRationale] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [grade, setGrade] = useState<Grade | null>(null);
  const genRef = useRef(false);

  useEffect(() => {
    if (!genRef.current) { genRef.current = true; loadScenario(); }
  }, []);

  async function loadScenario() {
    reset();
    setScenario(null);
    setSubmitted(false);
    setGrade(null);
    const data = await generate({
      system: 'You design roadmap-prioritization exercises with real organizational tension — competing stakeholder asks, a political constraint, and no ranking that is uncontroversial.',
      prompt: `Invent a backlog scenario with 5 items and a constraint that creates real tension. Output JSON:
{
  "stakes": "one sentence on why this ranking matters right now",
  "constraint": "1-2 sentences describing the limiting factor and political pressure",
  "items": [
    {"id":"A","title":"...","desc":"enough detail to reason about impact/effort","hiddenCost":"a non-obvious cost or risk"},
    {"id":"B","title":"...","desc":"...","hiddenCost":"..."},
    {"id":"C","title":"...","desc":"...","hiddenCost":"..."},
    {"id":"D","title":"...","desc":"...","hiddenCost":"..."},
    {"id":"E","title":"...","desc":"...","hiddenCost":"..."}
  ],
  "strongRankingLooksLike": "3-4 sentences on how a sharp PM would reason through this — not a single fixed order, but the trade-offs a strong ranking should reflect"
}`
    });
    if (data) { setScenario(data); setOrder(data.items.map((i: any) => i.id)); }
  }

  function moveItem(index: number, dir: number) {
    const next = [...order]; const t = index + dir;
    if (t < 0 || t >= next.length) return;
    [next[index], next[t]] = [next[t], next[index]];
    setOrder(next);
  }

  async function handleSubmit() {
    if (!scenario) return;
    if (!rationale || rationale.split(' ').filter(Boolean).length < 6) {
      alert('Please write at least 6 words explaining your rationale.');
      return;
    }
    setSubmitted(true);
    const data = await generate({
      pool: 'grade',
      system: 'You evaluate how PMs prioritize under constraints.',
      prompt: `Stakes: "${scenario.stakes}". Constraint: "${scenario.constraint}".
Strong ranking looks like: "${scenario.strongRankingLooksLike}".
Items: ${scenario.items.map(i => `${i.id}: ${i.title} (${i.desc}, hidden cost: ${i.hiddenCost})`).join('; ')}.
Player's order: ${order.map((id, i) => `${i + 1}. ${scenario.items.find(x => x.id === id)?.title}`).join(' → ')}.
Player's rationale: """${rationale}"""
Output JSON: {"tradeoffAwareness":0-33,"politicalRealism":0-33,"clarity":0-33,"judgmentScore":<sum>,"debrief":"2-3 sentences noting which hidden costs they seem to have missed"}`
    });
    if (data) {
      setGrade(data);
      onComplete(Math.round((data.judgmentScore || 50) * 0.4), 'execution');
    } else {
      setGrade({ tradeoffAwareness: 15, politicalRealism: 15, clarity: 15, judgmentScore: 45, debrief: 'Your submission was received. A stronger ranking would weigh hidden costs more explicitly.' });
      onComplete(18, 'execution');
    }
  }

  if (loading && !scenario) return <LoadingState message="Generating scenario…" />;
  if (error && !scenario) return <ErrorState message={error} onRetry={loadScenario} />;
  if (!scenario) return null;

  return (
    <GameLayout title="Roadmap Under Fire" subtitle="Execution" icon="★" iconBg="bg-amber-400">
      <div className="text-sm hand mb-3" style={{ color: 'var(--red)' }}>{scenario.stakes}</div>
      <div className="panel mb-4" style={{ background: 'var(--paper-alt)' }}>
        <p className="text-sm"><strong>Constraint:</strong> {scenario.constraint}</p>
      </div>

      {!submitted ? (
        <>
          <div className="space-y-2 mb-4">
            {order.map((id, i) => {
              const item = scenario.items.find(x => x.id === id)!;
              return (
                <div key={id} className="panel flex items-center gap-3 py-2 px-3" style={{ background: 'var(--sticky)', borderColor: 'var(--sticky-dark)' }}>
                  <span className="font-mono text-sm font-bold w-5">{i + 1}</span>
                  <div className="flex-1">
                    <div className="font-display font-semibold text-sm">{item.title}</div>
                    <div className="text-xs" style={{ opacity: 0.7 }}>{item.desc}</div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => moveItem(i, -1)} disabled={i === 0} className="btn text-xs py-1 px-2">↑</button>
                    <button onClick={() => moveItem(i, 1)} disabled={i === order.length - 1} className="btn text-xs py-1 px-2">↓</button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mb-4">
            <div className="text-xs font-mono uppercase mb-2" style={{ color: 'var(--ink-soft)' }}>Your rationale (2-3 sentences)</div>
            <textarea value={rationale} onChange={e => setRationale(e.target.value)} className="panel w-full min-h-[80px] resize-y text-sm" placeholder="Why this order? What trade-offs did you consider…" />
          </div>
          <button onClick={handleSubmit} disabled={!rationale || loading} className="btn btn-primary">{loading ? 'Grading…' : 'Submit Ranking'}</button>
          {rationale && rationale.split(' ').filter(Boolean).length < 6 && <p className="text-xs mt-1" style={{color:'var(--red)'}}>Write at least 6 words</p>}
        </>
      ) : grade && (
        <div>
          <Stamp tier={grade.judgmentScore >= 80 ? 'high' : grade.judgmentScore >= 55 ? 'mid' : 'low'}
            label={grade.judgmentScore >= 80 ? 'Sharp read' : grade.judgmentScore >= 55 ? 'Defensible' : 'Missed the real signal'}
            xp={Math.round(grade.judgmentScore * 0.4)} />
          <JudgmentScore score={grade.judgmentScore} />
          <RubricRow label="Trade-off awareness" score={grade.tradeoffAwareness} max={33} />
          <RubricRow label="Political realism" score={grade.politicalRealism} max={33} />
          <RubricRow label="Clarity" score={grade.clarity} max={33} />
          <div className="panel mt-4" style={{ background: 'var(--paper-alt)' }}><p className="text-sm">{grade.debrief}</p></div>
          <button onClick={loadScenario} className="btn mt-5" disabled={loading}>{loading ? '…' : 'Next Challenge →'}</button>
        </div>
      )}
    </GameLayout>
  );
}