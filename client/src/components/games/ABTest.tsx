import { useState, useRef, useEffect } from 'react';
import { useGenerate } from '../../hooks/useGenerate';
import GameLayout, { LoadingState, ErrorState, Stamp, RubricRow, JudgmentScore } from '../GameLayout';

interface Variant { name: string; rate: number; sample: number; }
interface Guardrail { metric: string; change: string; }
interface Scenario {
  variants: [Variant, Variant]; pValue: number; guardrails: Guardrail[];
  overlappingCI: boolean; segmentDetail: string;
  correctAction: string; explanation: string;
}
interface Grade { statisticalReasoning: number; guardrailAwareness: number; businessJudgment: number; judgmentScore: number; debrief: string; }
interface Props { onComplete: (xp: number, skill: string) => void; }

const ACTIONS = ['Ship it', 'Kill it', 'Run it longer', 'Ship with guardrail fix'];

export default function ABTestGame({ onComplete }: Props) {
  const { generate, loading, error, reset } = useGenerate();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [action, setAction] = useState<string | null>(null);
  const [justification, setJustification] = useState('');
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
      system: 'You design A/B test scenarios with statistical traps for PMs.',
      prompt: `Generate an A/B test scenario with traps. Include overlapping CIs, a segment-level heterogeneity detail, and guardrail metrics. Output JSON:
{
  "variants": [{"name":"Control","rate":0.042,"sample":49000},{"name":"Variant B","rate":0.045,"sample":49000}],
  "pValue": 0.03,
  "guardrails": [{"metric":"Latency (p95)","change":"+8%"},{"metric":"Refund rate","change":"+0.2%"}],
  "overlappingCI": true,
  "segmentDetail": "Effect is +9% for new users but -2% for returning users",
  "correctAction": "Run it longer|Ship it|Kill it|Ship with guardrail fix",
  "explanation": "3-4 sentences on what a sharp PM would weigh, including the segment split if present"
}`
    });
    if (data) setScenario(data);
  }

  const handleSubmit = async () => {
    if (!scenario || !action) return;
    setSubmitted(true);
    const data = await generate({
      system: 'You evaluate PMs on A/B test interpretation — statistical reasoning, guardrail awareness, and business judgment.',
      prompt: `Test data: p=${scenario.pValue}, CIs overlap: ${scenario.overlappingCI}, segment detail: ${scenario.segmentDetail}.
Guardrails: ${scenario.guardrails.map(g => `${g.metric} ${g.change}`).join(', ')}.
Player's action: "${action}". Player's justification: """${justification}"""
Output JSON: {"statisticalReasoning":0-40,"guardrailAwareness":0-30,"businessJudgment":0-30,"judgmentScore":<sum>,"debrief":"3-4 sentences explaining what a sharp read would have weighed"}`
    });
    if (data) {
      setGrade(data);
      onComplete(Math.round((data.judgmentScore || 50) * 0.4), 'analytics');
    } else {
      setGrade({ statisticalReasoning: 20, guardrailAwareness: 15, businessJudgment: 15, judgmentScore: 50, debrief: 'Your analysis was submitted. Consider whether the effect is practically significant even if statistically significant.' });
      onComplete(20, 'analytics');
    }
  };

  if (loading && !scenario) return <LoadingState message="Generating experiment…" />;
  if (error && !scenario) return <ErrorState message={error} onRetry={loadScenario} />;
  if (!scenario) return null;

  return (
    <GameLayout title="A/B Test Autopsy" subtitle="Analytics" icon="↔" iconBg="bg-gradient-to-br from-teal-700 to-teal/60">
      <div className="panel mb-4">
        <div className="grid grid-cols-2 gap-4 mb-3">
          {scenario.variants.map(v => (
            <div key={v.name}>
              <div className="text-xs font-mono" style={{ color: 'var(--ink-soft)' }}>{v.name}</div>
              <div className="font-display font-bold text-lg">{(v.rate * 100).toFixed(2)}%</div>
              <div className="text-xs font-mono" style={{ color: 'var(--ink-soft)' }}>n={v.sample.toLocaleString()}</div>
            </div>
          ))}
        </div>
        <div className="text-xs font-mono" style={{ color: 'var(--ink-soft)' }}>p = {scenario.pValue.toFixed(4)}</div>
        {scenario.guardrails.map((g, i) => (
          <div key={i} className="text-xs mt-1" style={{ color: g.change.startsWith('+') ? 'var(--red)' : 'var(--green)' }}>
            {g.metric}: {g.change}
          </div>
        ))}
        {scenario.overlappingCI && <div className="text-xs mt-1" style={{ color: 'var(--amber)' }}>Confidence intervals overlap</div>}
        <div className="text-xs mt-1 font-mono" style={{ color: 'var(--ink-soft)' }}>{scenario.segmentDetail}</div>
      </div>

      {!submitted ? (
        <>
          <div className="text-xs font-mono uppercase mb-2" style={{ color: 'var(--ink-soft)' }}>What do you do?</div>
          <div className="flex flex-wrap gap-2 mb-4">
            {ACTIONS.map(a => (
              <button key={a} onClick={() => setAction(a)} className={`btn ${action === a ? 'btn-primary' : ''}`}>{a}</button>
            ))}
          </div>
          <div className="mb-4">
            <div className="text-xs font-mono uppercase mb-2" style={{ color: 'var(--ink-soft)' }}>Why? (1-2 sentences)</div>
            <textarea value={justification} onChange={e => setJustification(e.target.value)} className="panel w-full min-h-[60px] resize-y text-sm" placeholder="What's driving your decision…" />
          </div>
          <button onClick={handleSubmit} disabled={!action || !justification || loading} className="btn btn-primary">{loading ? 'Grading…' : 'Submit'}</button>
        </>
      ) : grade && (
        <div>
          <Stamp tier={grade.judgmentScore >= 80 ? 'high' : grade.judgmentScore >= 55 ? 'mid' : 'low'}
            label={grade.judgmentScore >= 80 ? 'Sharp read' : grade.judgmentScore >= 55 ? 'Defensible' : 'Missed the real signal'}
            xp={Math.round(grade.judgmentScore * 0.4)} />
          <JudgmentScore score={grade.judgmentScore} />
          <RubricRow label="Statistical reasoning" score={grade.statisticalReasoning} max={40} />
          <RubricRow label="Guardrail awareness" score={grade.guardrailAwareness} max={30} />
          <RubricRow label="Business judgment" score={grade.businessJudgment} max={30} />
          <div className="panel mt-4" style={{ background: 'var(--paper-alt)' }}><p className="text-sm">{grade.debrief}</p></div>
          <button onClick={loadScenario} className="btn mt-5" disabled={loading}>{loading ? '…' : 'Next Test →'}</button>
        </div>
      )}
    </GameLayout>
  );
}