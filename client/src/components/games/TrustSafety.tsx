import { useState, useEffect } from 'react';
import { useGenerate } from '../../hooks/useGenerate';
import GameLayout, { LoadingState, ErrorState, JudgmentScore } from '../GameLayout';

export default function TrustSafety({ onComplete }: { onComplete: (xp: number, skill: string) => void }) {
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

  const loadScenario = async () => {
    reset();
    setScenario(null);
    setAnswer('');
    setPhase('play');
    setResult(null);
    const r = await generate({
      system: 'You design product ethics / trust-and-safety trade-off exercises for senior PM practice. No clean right answer.',
      prompt: `Invent a feature with clear upside and a real safety/ethical concern (vary the domain each time). Output JSON:
{
  "product": "short context",
  "feature": "the feature under consideration",
  "upside": "the metric/business impact if shipped as-is",
  "concern": "the specific safety/privacy/ethical issue, stated seriously",
  "stakeholderPressure": "1 sentence on who's pushing to ship anyway",
  "strongAnswerLooksLike": "2-3 sentences on what a thoughtful decision would weigh"
}`
    });
    if (r) setScenario(r);
  };

  const handleSubmit = async () => {
    if (!answer.trim() || !scenario) return;
    const gradeResult = await generate({
      system: 'Grade an ethics trade-off answer. Return JSON with scores.',
      prompt: `Scenario: ${scenario.feature}\nUpside: ${scenario.upside}\nConcern: ${scenario.concern}\nStrong answer: ${scenario.strongAnswerLooksLike}\nPlayer answer: ${answer}\nRate 0-33 each on ethicalReasoning, businessPragmatism, mitigationConcreteness. JSON: { "scores": { "ethicalReasoning": number, "businessPragmatism": number, "mitigationConcreteness": number }, "debrief": "2-3 sentences", "judgmentScore": number }`
    });
    const s = gradeResult?.scores || { ethicalReasoning: 0, businessPragmatism: 0, mitigationConcreteness: 0 };
    const judgmentScore = gradeResult?.judgmentScore || Math.round((s.ethicalReasoning + s.businessPragmatism + s.mitigationConcreteness) / 3);
    const xp = Math.round(judgmentScore / 100 * 30);
    setResult({ scores: s, debrief: gradeResult?.debrief || '', judgmentScore, xp });
    setPhase('grade');
    onComplete(Math.max(10, xp), 'strategy');
  };

  return (
    <GameLayout title="Trust & Safety Dilemma" subtitle="Strategy" icon="⚖️" iconBg="bg-amber-600">
      {loading && !scenario && <LoadingState message="Generating an ethical dilemma…" />}
      {error && !scenario && <ErrorState message={error} onRetry={loadScenario} />}
      {scenario && phase === 'play' && (
        <div>
          <div className="panel mb-4" style={{ borderLeft: '4px solid var(--amber)', background: '#FFFDF5' }}>
            <p className="text-sm text-ink-soft">{scenario.product}</p>
            <p className="mt-2 font-bold">{scenario.feature}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-lg" style={{ background: '#E4F5EF' }}>
              <strong className="text-green-700 text-sm">Upside</strong>
              <p className="text-sm mt-1">{scenario.upside}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: '#FBE9EA' }}>
              <strong className="text-red-700 text-sm">Concern</strong>
              <p className="text-sm mt-1">{scenario.concern}</p>
            </div>
          </div>
          <p className="text-sm italic text-ink-soft mb-3">{scenario.stakeholderPressure}</p>
          <p className="text-sm font-medium mb-2">What do you decide, and how do you mitigate the concern without killing the upside?</p>
          <textarea className="sense-textarea" value={answer} onChange={e => setAnswer(e.target.value)} />
          <button className="btn btn-primary mt-4" onClick={handleSubmit} disabled={!answer.trim()}>Submit</button>
        </div>
      )}
      {result && phase === 'grade' && (
        <div>
          <JudgmentScore score={result.judgmentScore} />
          <div className="grade-grid">
            {Object.entries(result.scores).map(([k, v]) => (
              <div key={k} className="grade-row">
                <div className="lbl">{k.replace(/([A-Z])/g, ' $1')}<span>{v as number}/33</span></div>
                <div className="track"><div className="fill" style={{ width: `${(v as number)/33*100}%`, background: 'var(--amber)' }}></div></div>
              </div>
            ))}
          </div>
          <div className="explain-box mt-4">{result.debrief}</div>
          <button className="btn btn-primary mt-4" onClick={loadScenario}>New Dilemma</button>
        </div>
      )}
    </GameLayout>
  );
}