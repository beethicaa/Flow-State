import { useState, useRef, useEffect } from 'react';
import { useGenerate } from '../../hooks/useGenerate';
import GameLayout, { LoadingState, ErrorState, Stamp, RubricRow, JudgmentScore } from '../GameLayout';

interface Scenario {
  question: string;
  referenceAnswer: number;
  referenceMethod: string;
}

interface Grade {
  methodQuality: 'shallow' | 'structured' | 'rigorous';
  note: string;
  numericScore: number;
  methodScore: number;
  judgmentScore: number;
}

interface Props {
  onComplete: (xp: number, skill: string) => void;
}

export default function GuesstimateGame({ onComplete }: Props) {
  const { generate, loading, error, reset } = useGenerate();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [guess, setGuess] = useState('');
  const [method, setMethod] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [grade, setGrade] = useState<Grade | null>(null);
  const genRef = useRef(false);

  useEffect(() => {
    if (!genRef.current) {
      genRef.current = true;
      loadScenario();
    }
  }, []);

  async function loadScenario() {
    reset();
    setScenario(null);
    setSubmitted(false);
    setGrade(null);
    setGuess('');
    setMethod('');
    const data = await generate({
      system: 'You create hard market-sizing Fermi questions for senior PM candidates.',
      prompt: `Generate a genuinely hard Fermi estimation question a senior candidate would get. Output JSON:
{
  "question": "the question, e.g. 'Estimate the total annual cost of expired grocery store inventory in the US.'",
  "referenceAnswer": <number>,
  "referenceMethod": "2-3 sentences explaining the model approach"
}`
    });
    if (data) setScenario(data);
  }

  async function handleSubmit() {
    if (!scenario || !guess || !method) return;
    setSubmitted(true);

    const numeric = Math.abs(parseFloat(guess) - scenario.referenceAnswer);
    const ratio = numeric / scenario.referenceAnswer;
    const numericScore = ratio < 0.1 ? 40 : ratio < 0.5 ? 25 : ratio < 1 ? 15 : 5;

    const gradeData = await generate({
      system: 'You grade the reasoning behind a Fermi estimate, not just the number. A lucky close guess with a shallow method should score lower than a well-reasoned estimate in the right order of magnitude.',
      prompt: `Question: "${scenario.question}". Reference method: "${scenario.referenceMethod}".
Player's method: """${method}"""
Numeric proximity: ${numericScore}/40 (their guess was off by ${ratio > 1 ? `${ratio.toFixed(1)}x` : `${(ratio * 100).toFixed(0)}%`}).
Output JSON:
{
  "methodQuality": "shallow"|"structured"|"rigorous",
  "note": "1-2 sentence assessment of their reasoning",
  "numericScore": <same 0-40>,
  "methodScore": 0-60,
  "judgmentScore": <sum of numericScore + methodScore, 0-100>
}`
    });
    if (gradeData) {
      setGrade(gradeData);
      onComplete(Math.round((gradeData.judgmentScore || 50) * 0.4), 'analytics');
    } else {
      const js = numericScore + 30;
      setGrade({ methodQuality: 'structured', note: 'Your approach was noted.', numericScore, methodScore: 30, judgmentScore: js });
      onComplete(Math.round(js * 0.4), 'analytics');
    }
  }

  if (loading && !scenario) return <LoadingState message="Generating question…" />;
  if (error && !scenario) return <ErrorState message={error} onRetry={loadScenario} />;
  if (!scenario) return null;

  return (
    <GameLayout title="Guesstimate Gauntlet" subtitle="Analytics" icon="?" iconBg="bg-gradient-to-br from-amber to-amber/60">
      <div className="panel mb-6" style={{ background: 'var(--paper-alt)', backgroundImage: 'repeating-linear-gradient(var(--paper-alt) 0 27px, #D8DCE2 27px 28px)' }}>
        <p className="font-display text-lg leading-relaxed">{scenario.question}</p>
      </div>

      {!submitted ? (
        <>
          <div className="mb-4">
            <div className="text-xs font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--ink-soft)' }}>Your numeric estimate</div>
            <input
              type="number"
              value={guess}
              onChange={e => setGuess(e.target.value)}
              placeholder="0"
              className="panel w-full font-mono text-lg"
            />
          </div>
          <div className="mb-4">
            <div className="text-xs font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--ink-soft)' }}>Your method (1-2 sentences)</div>
            <textarea
              value={method}
              onChange={e => setMethod(e.target.value)}
              className="panel w-full min-h-[80px] resize-y text-sm"
              placeholder="Walk through your assumptions and math…"
            />
          </div>
          <button onClick={handleSubmit} disabled={!guess || !method || loading} className="btn btn-primary">
            {loading ? 'Grading…' : 'Submit'}
          </button>
        </>
      ) : grade && (
        <div>
          <Stamp
            tier={grade.judgmentScore >= 70 ? 'high' : grade.judgmentScore >= 40 ? 'mid' : 'low'}
            label={grade.judgmentScore >= 70 ? 'Sharp read' : grade.judgmentScore >= 40 ? 'Defensible' : 'Missed the real signal'}
            xp={Math.round(grade.judgmentScore * 0.4)}
          />
          <JudgmentScore score={grade.judgmentScore} />
          <RubricRow label="Numeric proximity" score={grade.numericScore} max={40} />
          <RubricRow label="Method quality" score={grade.methodScore} max={60} />

          <div className="panel mb-4" style={{ background: 'var(--paper-alt)' }}>
            <p className="text-xs font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--ink-soft)' }}>How a sharp candidate breaks this down</p>
            <p className="font-mono text-lg font-bold" style={{ color: 'var(--ink)' }}>{scenario.referenceAnswer.toLocaleString()}</p>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--ink)' }}>{scenario.referenceMethod}</p>
          </div>

          <div className="panel mb-4">
            <p className="text-sm leading-relaxed hand" style={{ color: 'var(--ink)' }}>{grade.note}</p>
          </div>

          <button onClick={loadScenario} className="btn" disabled={loading}>
            {loading ? 'Generating…' : 'Next Question →'}
          </button>
        </div>
      )}
    </GameLayout>
  );
}