import { useState, useRef, useEffect } from 'react';
import { useGenerate } from '../../hooks/useGenerate';
import GameLayout, { LoadingState, ErrorState, Stamp, RubricRow, JudgmentScore } from '../GameLayout';

interface ABPoolScenario {
  variantA: { label: string; users: number; conversions: number; rate: string };
  variantB: { label: string; users: number; conversions: number; rate: string };
  pValue: string;
  guardrails: { metric: string; control: string; variant: string; concern: boolean; explanation?: string }[];
  correctAnswer: string;
  correctLabel: string;
  explanation: string;
  trap: string;
}

interface MappedScenario {
  variants: [Variant, Variant];
  pValue: number;
  guardrails: { metric: string; change: string }[];
  correctAction: string;
  explanation: string;
  trap: string;
  overlappingCI: boolean;
  segmentDetail: string;
}

interface Variant { name: string; rate: number; sample: number; }
interface Grade { statisticalReasoning: number; guardrailAwareness: number; businessJudgment: number; judgmentScore: number; debrief: string; }
interface Props { onComplete: (xp: number, skill: string) => void; }

const ACTIONS = ['Ship it', 'Kill it', 'Run it longer', 'Ship with guardrail fix'];

function mapPoolToScenario(pool: ABPoolScenario): MappedScenario {
  const pVal = parseFloat(pool.pValue);
  return {
    variants: [
      { name: pool.variantA.label, rate: parseFloat(pool.variantA.rate) / 100, sample: pool.variantA.users },
      { name: pool.variantB.label, rate: parseFloat(pool.variantB.rate) / 100, sample: pool.variantB.users }
    ],
    pValue: isNaN(pVal) ? 0.05 : pVal,
    guardrails: pool.guardrails.map(g => {
      const ctrl = parseFloat(g.control);
      const varnt = parseFloat(g.variant);
      if (!isNaN(ctrl) && !isNaN(varnt)) {
        const diff = varnt - ctrl;
        return { metric: g.metric, change: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%` };
      }
      return { metric: g.metric, change: g.variant };
    }),
    correctAction: pool.correctAnswer === 'ship' ? 'Ship it' :
                   pool.correctAnswer === 'kill' ? 'Kill it' :
                   pool.correctAnswer === 'run_longer' ? 'Run it longer' :
                   pool.correctAnswer === 'ship_guardrail' ? 'Ship with guardrail fix' : 'Ship it',
    explanation: pool.explanation,
    trap: pool.trap,
    overlappingCI: pVal > 0.04 && pVal < 0.06,
    segmentDetail: pool.trap
  };
}

export default function ABTestGame({ onComplete }: Props) {
  const { generate, loading, error, reset } = useGenerate();
  const [scenario, setScenario] = useState<MappedScenario | null>(null);
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
    setAction(null);
    setJustification('');

    const raw = await generate({
      system: 'You design A/B test scenarios with statistical traps for PMs.',
      prompt: `Generate an A/B test scenario with traps. Include overlapping CIs, a segment-level heterogeneity detail, and guardrail metrics. Output JSON:
{
  "variants": [{"name":"Control","rate":0.042,"sample":49000},{"name":"Variant B","rate":0.045,"sample":49000}],
  "pValue": 0.03,
  "guardrails": [{"metric":"Latency (P95)","change":"+8%"},{"metric":"Refund rate","change":"+0.2%"},{"metric":"Error rate","change":"+0.6%"}],
  "overlappingCI": true,
  "segmentDetail": "Effect is +9% for new users but -2% for returning users",
  "correctAction": "Run it longer|Ship it|Kill it|Ship with guardrail fix",
  "explanation": "3-4 sentences on what a sharp PM would weigh, including the segment split if present"
}`
    });

    if (raw && typeof raw === 'object' && 'variantA' in raw) {
      setScenario(mapPoolToScenario(raw as ABPoolScenario));
    }
  }

  function computeGrade(): Grade {
    if (!scenario || !action) {
      return { statisticalReasoning: 10, guardrailAwareness: 10, businessJudgment: 10, judgmentScore: 30, debrief: 'Please select an action and provide justification.' };
    }

    const expected = scenario.correctAction;
    const actionMatch = action === expected;
    const justificationWords = justification.split(/\s+/).filter(Boolean).length;

    const hasPvalue = /p.?value|significant|p\s*=|\d\.\d{2,}/i.test(justification);
    const hasCi = /ci|confidence|overlap?|interval/i.test(justification);
    const hasSegment = /segment|user|cohort|group|new.*return|heterogene/i.test(justification);
    const hasGuardrail = /guardrail|latency|refund|error|perf|regression|side.i?effect/i.test(justification);

    const statisticalReasoning = hasPvalue && hasCi ? 32 : hasPvalue || hasCi ? 22 : 12;
    const guardrailAwareness = hasGuardrail ? 25 : justificationWords >= 8 ? 15 : 10;
    const businessJudgment = actionMatch ? 25 : 10;

    const withActionBonus = actionMatch ? 2 : 0;
    const adjustedStatistical = Math.min(40, statisticalReasoning + withActionBonus);
    const judgmentScore = adjustedStatistical + guardrailAwareness + businessJudgment;

    const guardrailConcerns = scenario.guardrails
      .filter(g => g.change.startsWith('+'))
      .map(g => `${g.metric} (${g.change})`)
      .join(', ');

    const debrief = actionMatch
      ? `Correct decision. ${hasGuardrail ? 'Good guardrail awareness — you spotted the regressions.' : guardrailConcerns ? `Watch the guardrail concerns: ${guardrailConcerns}.` : ''} ${hasSegment ? 'You properly considered segment-level effects.' : 'A sharp read would also weigh the segment-level heterogeneity.'} ${scenario.explanation}`
      : `You chose "${action}". The recommended action is "${expected}". ${scenario.explanation} ${guardrailConcerns ? `Key guardrails to watch: ${guardrailConcerns}.` : ''} ${hasSegment ? 'Good segment awareness.' : 'Consider segment-level effects next time.'}`;

    return { statisticalReasoning: adjustedStatistical, guardrailAwareness, businessJudgment, judgmentScore, debrief };
  }

  function handleSubmit(e?: React.MouseEvent) {
    e?.preventDefault();
    if (!scenario || !action) return;
    const g = computeGrade();
    setGrade(g);
    setSubmitted(true);
    onComplete(Math.round(g.judgmentScore * 0.4), 'analytics');
  }

  if (loading && !scenario) {
    return (
      <GameLayout title="A/B Test Autopsy" subtitle="Analytics" icon="↔" iconBg="bg-gradient-to-br from-teal-700 to-teal/60">
        <LoadingState message="Generating experiment…" />
      </GameLayout>
    );
  }
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
              <button key={a} onClick={(e) => { e.preventDefault(); setAction(a); }} className={`btn ${action === a ? 'btn-primary' : ''}`}>{a}</button>
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
          <button onClick={loadScenario} disabled={loading} className="btn mt-5">{loading ? '…' : 'Next Test →'}</button>
        </div>
      )}
    </GameLayout>
  );
}