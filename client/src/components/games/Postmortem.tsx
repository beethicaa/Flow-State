import { useState, useEffect } from 'react';
import { useGenerate } from '../../hooks/useGenerate';
import GameLayout, { LoadingState, ErrorState, JudgmentScore } from '../GameLayout';

export default function Postmortem({ onComplete }: { onComplete: (xp: number, skill: string) => void }) {
  const { generate, loading, error, reset } = useGenerate();
  const [scenario, setScenario] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [phase, setPhase] = useState<'play' | 'grade'>('play');
  const [result, setResult] = useState<any>(null);
  const genRef = { current: false };

  useEffect(() => {
    if (!genRef.current) {
      genRef.current = true;
      loadScenario();
    }
  }, []);

  async function loadScenario() {
    reset();
    setScenario(null);
    setAnswer('');
    setPhase('play');
    setResult(null);
    const r = await generate({
      system: 'You design blameless-postmortem writing exercises for PM leadership practice.',
      prompt: `Invent a product/launch failure (vary the type each time). Output JSON:
{
  "product": "short context",
  "stakes": "one sentence on why this postmortem matters",
  "whatHappened": "3-4 sentences describing the incident",
  "strongAnswerLooksLike": "2-3 sentences on what a rigorous postmortem would identify as the real root cause"
}`
    });
    if (r) setScenario(r);
  }

  const handleSubmit = async () => {
    if (!answer.trim() || !scenario) return;
    const gradeResult = await generate({
      system: 'Grade a postmortem answer. Return JSON with scores.',
      prompt: `Incident: ${scenario.whatHappened}\nStrong answer: ${scenario.strongAnswerLooksLike}\nPlayer answer: ${answer}\nRate 0-33 each on blamelessness, rootCauseRigor, actionability. JSON: { "scores": { "blamelessness": number, "rootCauseRigor": number, "actionability": number }, "debrief": "2-3 sentences", "judgmentScore": number }`
    });
    const s = gradeResult?.scores || { blamelessness: 0, rootCauseRigor: 0, actionability: 0 };
    const judgmentScore = gradeResult?.judgmentScore || Math.round((s.blamelessness + s.rootCauseRigor + s.actionability) / 3);
    const xp = Math.round(judgmentScore / 100 * 30);
    setResult({ scores: s, debrief: gradeResult?.debrief || '', judgmentScore, xp });
    setPhase('grade');
    onComplete(Math.max(10, xp), 'communication');
  };

  if (loading && !scenario) return <LoadingState message="Generating an incident for postmortem…" />;
  if (error && !scenario) return <ErrorState message={error} onRetry={loadScenario} />;
  if (!scenario) return null;

  if (!scenario && !loading && !error) return <LoadingState message="Generating an incident for postmortem…" />;

  return (
    <GameLayout title="The Postmortem" subtitle="Communication · Strategy" icon="📋" iconBg="bg-red-600">
      {error && !scenario && <ErrorState message={error} onRetry={loadScenario} />}
      {scenario && phase === 'play' && (
        <div>
          <div className="panel mb-4" style={{ borderLeft: '4px solid var(--red)' }}>
            <strong>INCIDENT REPORT</strong>
            <p className="mt-2">{scenario.product}</p>
            <p className="mt-1 text-sm text-ink-soft">{scenario.stakes}</p>
          </div>
          <div className="mb-4 p-4 rounded-lg" style={{ background: '#FBE9EA' }}>{scenario.whatHappened}</div>
          <p className="text-sm font-medium mb-2">Write a blameless postmortem — root cause(s) and what you'd change:</p>
          <textarea className="sense-textarea" value={answer} onChange={e => setAnswer(e.target.value)} />
          <button className="btn btn-primary mt-4" onClick={handleSubmit} disabled={!answer.trim()}>Submit</button>
        </div>
      )}
      {!loading && !error && !scenario && (
        <div className="text-ink-soft">Loading…</div>
      )}
      {result && phase === 'grade' && (
        <div>
          <JudgmentScore score={result.judgmentScore} />
          <div className="grade-grid">
            {Object.entries(result.scores).map(([k, v]) => (
              <div key={k} className="grade-row">
                <div className="lbl">{k.replace(/([A-Z])/g, ' $1')}<span>{v as number}/33</span></div>
                <div className="track"><div className="fill" style={{ width: `${(v as number)/33*100}%` }}></div></div>
              </div>
            ))}
          </div>
          <div className="explain-box mt-4">{result.debrief}</div>
          <button className="btn btn-primary mt-4" onClick={loadScenario}>New Scenario</button>
        </div>
      )}
    </GameLayout>
  );
}