import { useState, useRef, useEffect } from 'react';
import { useGenerate } from '../../hooks/useGenerate';
import GameLayout, { LoadingState, ErrorState, Stamp, RubricRow, JudgmentScore } from '../GameLayout';

interface Scenario { businessModel: string; context: string; candidates: string[]; best: string; gamblingRisks: string[]; strongAnswerLooksLike: string; }
interface Grade { metricSelection: number; reasoningQuality: number; rebuttalHandling: number; judgmentScore: number; debrief: string; }
interface Props { onComplete: (xp: number, skill: string) => void; }

export default function NorthStarGame({ onComplete }: Props) {
  const { generate, loading, error, reset } = useGenerate();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [pick, setPick] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [skepticLine, setSkepticLine] = useState('');
  const [rebuttal, setRebuttal] = useState('');
  const [phase, setPhase] = useState<'select' | 'rebut' | 'done'>('select');
  const [grade, setGrade] = useState<Grade | null>(null);
  const genRef = useRef(false);

  useEffect(() => {
    if (!genRef.current) { genRef.current = true; loadScenario(); }
  }, []);

  async function loadScenario() {
    reset(); setScenario(null); setPhase('select'); setPick(null); setReasoning(''); setSkepticLine(''); setRebuttal(''); setGrade(null);
    const data = await generate({
      system: 'You create North Star metric exercises for PM strategy training.',
      prompt: `Generate a North Star metric exercise. Output JSON:
{"businessModel":"...","context":"2-3 sentences","candidates":["metric 1","metric 2","metric 3","metric 4"],"best":"the best metric","gamblingRisks":["risk of metric 1","risk 2","risk 3","risk 4"],"strongAnswerLooksLike":"2-3 sentences"}`
    });
    if (data) setScenario(data);
  }

  async function handlePickSubmit() {
    if (!scenario || !pick) return;
    setPhase('rebut');
    const data = await generate({
      system: 'You are a skeptical stakeholder pushing back on the player\'s chosen metric.',
      prompt: `Business model: "${scenario.businessModel}". Player picked metric: "${pick}". Player's reasoning: """${reasoning}"""
Generate a skeptical counter-argument specifically against this metric. Output JSON: {"skepticLine":"a pointed question about why this metric is flawed or gameable"}`
    });
    if (data) setSkepticLine(data.skepticLine || 'How would you ensure this metric doesn\'t get gamed?');
    else setSkepticLine('How would you ensure this metric doesn\'t get gamed?');
  }

  function computeGrade(): Grade {
    if (!scenario || !pick) {
      return { metricSelection: 10, reasoningQuality: 10, rebuttalHandling: 10, judgmentScore: 30, debrief: 'Please complete all sections before submitting.' };
    }
    // Metric selection: full marks if they picked the best metric
    const metricSelection = pick === scenario.best ? 30 : 10;
    // Reasoning quality: based on length and depth
    const reasoningWords = reasoning.split(/\s+/).filter(Boolean).length;
    const reasoningQuality = reasoningWords >= 20 ? 28 : reasoningWords >= 10 ? 20 : 12;
    // Rebuttal handling: based on length of response
    const rebuttalWords = rebuttal.split(/\s+/).filter(Boolean).length;
    const rebuttalHandling = rebuttalWords >= 15 ? 28 : rebuttalWords >= 8 ? 18 : 10;
    const judgmentScore = metricSelection + reasoningQuality + rebuttalHandling;

    const correct = pick === scenario.best;
    const bestName = scenario.best;
    let debrief = correct
      ? `Strong pick — "${bestName}" is indeed the best North Star. ${reasoningQuality >= 20 ? 'Your reasoning shows good understanding of the trade-offs.' : 'Work on explaining why this metric drives the business model directly.'} ${rebuttalHandling >= 18 ? 'You handled the pushback well.' : 'When pushed back, address the gaming risk head-on with specific mitigation strategies.'}`
      : `You picked "${pick}", but the strongest North Star here is "${bestName}". ${scenario.strongAnswerLooksLike}. ${rebuttalHandling >= 18 ? 'Your rebuttal was solid even with the wrong pick.' : 'Try defending your choice by anticipating gaming risks directly.'}`;

    return { metricSelection, reasoningQuality, rebuttalHandling, judgmentScore, debrief };
  }

  async function handleRebuttalSubmit() {
    if (!scenario) return;
    setPhase('done');
    // Use generate for a richer evaluation, but fall back to local compute if it returns null
    const data = await generate({
      pool: 'grade',
      system: 'You grade a PM\'s metric selection, reasoning, and ability to defend under pushback.',
      prompt: `Business: "${scenario.businessModel}". Strong answer looks like: "${scenario.strongAnswerLooksLike}".
Best metric: "${scenario.best}". Risks: ${scenario.gamblingRisks.join('; ')}.
Player's pick: "${pick}". Reasoning: """${reasoning}"""
Skeptic: "${skepticLine}". Rebuttal: """${rebuttal}"""
Output JSON: {"metricSelection":0-30,"reasoningQuality":0-35,"rebuttalHandling":0-35,"judgmentScore":<sum>,"debrief":"2-3 sentences on whether they anticipated gaming risks and handled pushback"}`
    });
    if (data && typeof data.metricSelection === 'number') {
      setGrade(data);
      onComplete(Math.round((data.judgmentScore || 50) * 0.4), 'strategy');
    } else {
      const g = computeGrade();
      setGrade(g);
      onComplete(Math.round((g.judgmentScore || 50) * 0.4), 'strategy');
    }
  }

  if (loading && !scenario) return <LoadingState message="Generating scenario…" />;
  if (error && !scenario) return <ErrorState message={error} onRetry={loadScenario} />;
  if (!scenario) return null;

  return (
    <GameLayout title="North Star Navigator" subtitle="Strategy" icon="⌖" iconBg="bg-gradient-to-br from-amber to-amber/60">
      <div className="panel mb-4">
        <p className="font-display font-semibold text-sm">{scenario.businessModel}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--ink-soft)' }}>{scenario.context}</p>
      </div>

      {phase === 'select' && (
        <>
          <div className="text-xs font-mono uppercase mb-2" style={{ color: 'var(--ink-soft)' }}>Pick your North Star metric</div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {scenario.candidates.map(c => (
              <button key={c} onClick={() => setPick(c)} className={`btn text-left text-xs ${pick === c ? 'btn-primary' : ''}`}>{c}</button>
            ))}
          </div>
          <div className="mb-4">
            <div className="text-xs font-mono uppercase mb-2" style={{ color: 'var(--ink-soft)' }}>Why this one? (2-3 sentences)</div>
            <textarea value={reasoning} onChange={e => setReasoning(e.target.value)} className="panel w-full min-h-[80px] resize-y text-sm" placeholder="What makes this metric the best North Star? What risks does it have?" />
          </div>
          <button onClick={handlePickSubmit} disabled={!pick || !reasoning || loading} className="btn btn-primary">{loading ? '…' : 'Submit Pick'}</button>
        </>
      )}

      {phase === 'rebut' && (
        <>
          <div className="panel mb-4" style={{ background: 'var(--paper-alt)', borderColor: 'var(--amber)' }}>
            <p className="font-hand text-lg mb-1">Skeptical stakeholder:</p>
            <p className="text-sm">{skepticLine}</p>
          </div>
          <div className="mb-4">
            <div className="text-xs font-mono uppercase mb-2" style={{ color: 'var(--ink-soft)' }}>Your response</div>
            <textarea value={rebuttal} onChange={e => setRebuttal(e.target.value)} className="panel w-full min-h-[80px] resize-y text-sm" placeholder="Address their concern directly…" />
          </div>
          <button onClick={handleRebuttalSubmit} disabled={!rebuttal || loading} className="btn btn-primary">{loading ? 'Grading…' : 'Submit Response'}</button>
        </>
      )}

      {phase === 'done' && grade && (
        <div>
          <Stamp tier={grade.judgmentScore >= 80 ? 'high' : grade.judgmentScore >= 55 ? 'mid' : 'low'}
            label={grade.judgmentScore >= 80 ? 'Sharp read' : grade.judgmentScore >= 55 ? 'Defensible' : 'Missed the real signal'}
            xp={Math.round(grade.judgmentScore * 0.4)} />
          <JudgmentScore score={grade.judgmentScore} />
          <RubricRow label="Metric selection" score={grade.metricSelection} max={30} />
          <RubricRow label="Reasoning quality" score={grade.reasoningQuality} max={35} />
          <RubricRow label="Rebuttal handling" score={grade.rebuttalHandling} max={35} />
          <div className="panel mt-4" style={{ background: 'var(--paper-alt)' }}>
            <p className="text-xs font-mono uppercase mb-1" style={{ color: 'var(--ink-soft)' }}>Best metric: {scenario.best}</p>
            <p className="text-xs mb-2" style={{ color: 'var(--ink-soft)' }}>Failure modes: {scenario.gamblingRisks.join('; ')}</p>
            <p className="text-sm">{grade.debrief}</p>
          </div>
          <button onClick={loadScenario} className="btn mt-5" disabled={loading}>{loading ? '…' : 'Next Challenge →'}</button>
        </div>
      )}
    </GameLayout>
  );
}