import { useState, useRef, useEffect } from 'react';
import { useGenerate } from '../../hooks/useGenerate';
import GameLayout, { LoadingState, ErrorState, Stamp, RubricRow, JudgmentScore } from '../GameLayout';

interface Scenario { prompt: string; rubric: string; idealPoints: string[]; }
interface Grade { problemFraming: number; userEmpathy: number; tradeoffs: number; metrics: number; handledPushback: number; judgmentScore: number; debrief: string; }
interface Props { onComplete: (xp: number, skill: string) => void; }

export default function ProductSenseGame({ onComplete }: Props) {
  const { generate, loading, error, reset } = useGenerate();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [firstAnswer, setFirstAnswer] = useState('');
  const [skepticPushback, setSkepticPushback] = useState('');
  const [secondAnswer, setSecondAnswer] = useState('');
  const [phase, setPhase] = useState<'write' | 'pushback' | 'done'>('write');
  const [grade, setGrade] = useState<Grade | null>(null);
  const genRef = useRef(false);

  useEffect(() => {
    if (!genRef.current) { genRef.current = true; loadScenario(); }
  }, []);

  async function loadScenario() {
    reset();
    setScenario(null);
    setPhase('write');
    setFirstAnswer('');
    setSecondAnswer('');
    setGrade(null);
    const data = await generate({
      system: 'You create product sense questions with real constraints — limited eng capacity, a competitive threat, a timeline.',
      prompt: `Generate a product design question. Include explicit constraints (limited eng, a competitive threat, a timeline). Output JSON:
{"prompt":"the question with constraints stated clearly","rubric":"grading rubric for scoring","idealPoints":["point 1","point 2","point 3","point 4"]}`
    });
    if (data) setScenario(data);
  }

  async function handleFirstSubmit() {
    if (!scenario) return;
    setPhase('pushback');
    const data = await generate({
      system: 'You are a skeptical interviewer. Identify the weakest part of their answer and push back with one hard follow-up question.',
      prompt: `Feature prompt: "${scenario.prompt}". Player's answer: """${firstAnswer}""". Generate a skeptical follow-up question targeting the weakest part of their answer. Output JSON: {"followUp":"one specific hard question"}`
    });
    if (data) setSkepticPushback(data.followUp || 'How would you measure whether this actually worked?');
    else setSkepticPushback('How would you measure whether this actually worked?');
  }

  function computeGrade(): Grade {
    if (!scenario) {
      return { problemFraming: 2, userEmpathy: 2, tradeoffs: 2, metrics: 2, handledPushback: 2, judgmentScore: 32, debrief: 'Could not grade your answer.' };
    }

    const firstWords = firstAnswer.split(/\s+/).filter(Boolean).length;
    const secondWords = secondAnswer.split(/\s+/).filter(Boolean).length;

    const hasUserNeed = /user|need|pain|frustrat|problem/i.test(firstAnswer);
    const hasMetrics = /metric|measure|success|kpi|xp|rpm|ltv|retention|conversion|engagement/i.test(firstAnswer);
    const hasTradeoffs = /trade.?off|cost|risk|downside|limit|compete|priority|scope|effort|complexity|spend|decision|weigh|balance/i.test(firstAnswer);
    const hasConstraints = /eng(ineering)?|capacity|time|team|budget|resourc/i.test(firstAnswer);

    const problemFraming = firstWords >= 15 && hasUserNeed ? 4 : firstWords >= 8 ? 2 : 1;
    const userEmpathy = hasUserNeed ? 4 : 1;
    const tradeoffs = hasTradeoffs && hasConstraints ? 4 : hasTradeoffs ? 2 : 1;
    const metrics = hasMetrics ? 4 : 1;
    const handledPushback = secondWords >= 10 ? secondWords >= 20 ? 4 : 3 : 1;

    const rawScore = problemFraming + userEmpathy + tradeoffs + metrics + handledPushback;
    const judgmentScore = Math.round((rawScore / 25) * 100);

    const missing: string[] = [];
    if (!hasUserNeed) missing.push('explicit user need/empathy');
    if (!hasTradeoffs) missing.push('trade-off analysis');
    if (!hasMetrics) missing.push('metrics/success measurement');
    if (secondWords < 10) missing.push('a substantive pushback response');

    let debrief = '';
    if (missing.length === 0) {
      debrief = `Strong answer across all dimensions. You covered user needs, trade-offs, metrics, and addressed the pushback effectively. ${scenario.idealPoints.map((p, i) => `Idea ${i + 1}: ${p}`).join('. ')}`;
    } else if (missing.length <= 2) {
      debrief = `Good foundation. To strengthen: include ${missing.join(' and ')} in your answer. A top response would also reference the specific constraint (engineering capacity, competitive threat, timeline). ${scenario.idealPoints.map((p, i) => `Idea ${i + 1}: ${p}`).join('. ')}`;
    } else {
      debrief = `Your answer was noted but needs more depth. Key missing elements: ${missing.join(', ')}. The rubric mentions: ${scenario.rubric}. ${scenario.idealPoints.map((p, i) => `Idea ${i + 1}: ${p}`).join('. ')}`;
    }

    return { problemFraming: Math.min(5, problemFraming), userEmpathy: Math.min(5, userEmpathy), tradeoffs: Math.min(5, tradeoffs), metrics: Math.min(5, metrics), handledPushback: Math.min(5, handledPushback), judgmentScore, debrief };
  }

  async function handleSecondSubmit() {
    if (!scenario) return;
    // Compute grade synchronously BEFORE setting phase, so grade is available on next render
    const g = computeGrade();
    setGrade(g);
    setPhase('done');
    const strategyXp = Math.round((g.judgmentScore || 50) * 0.4 * 0.6);
    const commXp = Math.round((g.judgmentScore || 50) * 0.4 * 0.4);
    onComplete(strategyXp + commXp, 'strategy');
  }

  if (loading && !scenario) return <LoadingState message="Generating scenario…" />;
  if (error && !scenario) return <ErrorState message={error} onRetry={loadScenario} />;
  if (!scenario) return null;

  return (
    <GameLayout title="Product Sense Sprint" subtitle="Strategy + Communication" icon="✎" iconBg="bg-gradient-to-br from-purple to-purple/60">
      <div className="panel mb-6" style={{ borderLeft: '4px solid var(--purple)' }}>
        <p className="text-sm leading-relaxed">{scenario.prompt}</p>
      </div>

      {phase === 'write' && (
        <>
          <div className="mb-4">
            <div className="text-xs font-mono uppercase mb-2" style={{ color: 'var(--ink-soft)' }}>Your answer</div>
            <textarea value={firstAnswer} onChange={e => setFirstAnswer(e.target.value)} className="panel w-full min-h-[120px] resize-y text-sm" placeholder="Describe your feature and reasoning…" />
          </div>
          <button onClick={handleFirstSubmit} disabled={!firstAnswer || loading} className="btn btn-primary">{loading ? '…' : 'Submit'}</button>
        </>
      )}

      {phase === 'pushback' && (
        <>
          <div className="panel mb-4" style={{ background: 'var(--paper-alt)', borderColor: 'var(--amber)' }}>
            <p className="font-hand text-lg mb-1">Skeptical interviewer:</p>
            <p className="text-sm" style={{ color: 'var(--ink)' }}>{skepticPushback}</p>
          </div>
          <div className="mb-4">
            <div className="text-xs font-mono uppercase mb-2" style={{ color: 'var(--ink-soft)' }}>Your response</div>
            <textarea value={secondAnswer} onChange={e => setSecondAnswer(e.target.value)} className="panel w-full min-h-[100px] resize-y text-sm" placeholder="Address the pushback directly…" />
          </div>
          <button onClick={handleSecondSubmit} disabled={!secondAnswer || loading} className="btn btn-primary">{loading ? 'Grading…' : 'Submit Response'}</button>
        </>
      )}

      {phase === 'done' && grade && (
        <div>
          <Stamp tier={grade.judgmentScore >= 80 ? 'high' : grade.judgmentScore >= 55 ? 'mid' : 'low'}
            label={grade.judgmentScore >= 80 ? 'Sharp read' : grade.judgmentScore >= 55 ? 'Defensible' : 'Missed the real signal'}
            xp={Math.round(grade.judgmentScore * 0.4)} />
          <JudgmentScore score={grade.judgmentScore} />
          <RubricRow label="Problem framing" score={grade.problemFraming} max={5} />
          <RubricRow label="User empathy" score={grade.userEmpathy} max={5} />
          <RubricRow label="Trade-offs" score={grade.tradeoffs} max={5} />
          <RubricRow label="Metrics thinking" score={grade.metrics} max={5} />
          <RubricRow label="Handled pushback" score={grade.handledPushback} max={5} />
          <div className="panel mt-4" style={{ background: 'var(--paper-alt)' }}><p className="text-sm">{grade.debrief}</p></div>
          <button onClick={loadScenario} className="btn mt-5" disabled={loading}>{loading ? '…' : 'Next Question →'}</button>
        </div>
      )}
    </GameLayout>
  );
}