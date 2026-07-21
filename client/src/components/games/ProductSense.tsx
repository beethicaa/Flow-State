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

  async function handleSecondSubmit() {
    if (!scenario) return;
    setPhase('done');
    const data = await generate({
      pool: 'grade',
      system: 'You grade PM answers across 5 dimensions. Be specific and demanding.',
      prompt: `Prompt: "${scenario.prompt}". Rubric: "${scenario.rubric}".
First answer: """${firstAnswer}"""
Follow-up: "${skepticPushback}"
Follow-up response: """${secondAnswer}"""
Output JSON: {"problemFraming":0-5,"userEmpathy":0-5,"tradeoffs":0-5,"metrics":0-5,"handledPushback":0-5,"judgmentScore":<sum/25*100>,"debrief":"2-3 sentences, note if they addressed the pushback or deflected"}`
    });
    if (data) {
      setGrade(data);
      const strategyXp = Math.round((data.judgmentScore || 50) * 0.4 * 0.6);
      const commXp = Math.round((data.judgmentScore || 50) * 0.4 * 0.4);
      onComplete(strategyXp + commXp, 'strategy');
    } else {
      setGrade({ problemFraming: 3, userEmpathy: 3, tradeoffs: 2, metrics: 2, handledPushback: 2, judgmentScore: 48, debrief: 'Your answer was submitted. A stronger answer would address trade-offs more explicitly and show metrics thinking.' });
      onComplete(20, 'strategy');
    }
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