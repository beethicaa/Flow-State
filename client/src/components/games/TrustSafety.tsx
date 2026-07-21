import { useState, useEffect } from 'react';
import GameLayout, { LoadingState, JudgmentScore } from '../GameLayout';
import { trustSafetyPool } from '../../scenarios/index';
import { useStorage } from '../../hooks/useStorage';

export default function TrustSafety({ onComplete }: { onComplete: (xp: number, skill: string) => void }) {
  const [scenario, setScenario] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [phase, setPhase] = useState<'play' | 'grade'>('play');
  const [result, setResult] = useState<any>(null);
  const genRef = { current: false };
  const { profile } = useStorage();

  function getTier(): number {
    const xp = profile?.xp || 0;
    if (xp >= 3200) return 6;
    if (xp >= 2200) return 5;
    if (xp >= 1400) return 4;
    if (xp >= 800) return 3;
    if (xp >= 400) return 2;
    if (xp >= 150) return 1;
    return 0;
  }

  useEffect(() => {
    if (!genRef.current) {
      genRef.current = true;
      loadScenario();
    }
  }, []);

  function loadScenario() {
    setScenario(null);
    setAnswer('');
    setPhase('play');
    setResult(null);
    const tier = getTier();
    const eligible = trustSafetyPool.filter(s => s.difficulty.min <= tier && s.difficulty.max >= tier);
    if (eligible.length === 0) {
      setScenario(trustSafetyPool[Math.floor(Math.random() * trustSafetyPool.length)]);
    } else {
      setScenario(eligible[Math.floor(Math.random() * eligible.length)]);
    }
  }

  function handleSubmit() {
    if (!answer.trim() || !scenario) return;
    const lower = answer.toLowerCase();
    const matchedCategories = scenario.policyCategories.filter((c: string) => lower.includes(c.toLowerCase().slice(0, 15)));
    const matchRate = matchedCategories.length / Math.max(scenario.policyCategories.length, 1);
    const hasMitigation = lower.includes('mitigat') || lower.includes('balance') || lower.includes('trade') || lower.includes('allow') || lower.includes('restrict') || lower.includes('review') || lower.includes('threshold') || lower.includes('escalation') || lower.includes('kill') || lower.includes('fallback');
    const ethicalReasoning = Math.round(33 * Math.min(1, matchRate + 0.4));
    const businessPragmatism = Math.round(33 * (hasMitigation ? 0.85 : 0.3));
    const mitigationConcreteness = Math.round(33 * Math.min(1, matchRate + 0.4 + (hasMitigation ? 0.3 : 0)));
    const scores = { ethicalReasoning, businessPragmatism, mitigationConcreteness };
    const judgmentScore = Math.round((ethicalReasoning + businessPragmatism + mitigationConcreteness) / 3);
    const xp = Math.max(10, Math.round(judgmentScore / 100 * 30));

    const allPolicies = scenario.policyCategories.join(', ');

    let debrief = '';
    if (hasMitigation && matchRate >= 0.5) {
      debrief = `Strong decision. You balanced the ethical concerns with a concrete mitigation plan. The policies at play: ${allPolicies}. The issue (${scenario.issue}) requires careful enforcement — your approach preserves the upside while addressing the risk.`;
    } else if (hasMitigation) {
      debrief = `Good mitigation thinking. To strengthen, directly reference the relevant policy categories: ${allPolicies}. The issue here is ${scenario.issue}. A sharp answer explicitly names which policies apply and proposes specific guardrails.`;
    } else {
      debrief = `Consider a more concrete mitigation. Relevant policies: ${allPolicies}. The issue: ${scenario.issue}. Strong decisions propose specific mechanisms — review gates, escalation paths, kill-switches — rather than just taking a side.`;
    }

    setResult({ scores, debrief, judgmentScore, xp });
    setPhase('grade');
    onComplete(xp, 'strategy');
  }

  if (!scenario) return <LoadingState message="Generating an ethical dilemma…" />;

  return (
    <GameLayout title="Trust & Safety Dilemma" subtitle="Strategy" icon="⚖️" iconBg="bg-amber-600">
      {scenario && phase === 'play' && (
        <div>
          <div className="panel mb-4" style={{ borderLeft: '4px solid var(--amber)', background: '#FFFDF5' }}>
            <p className="text-sm font-medium">{scenario.issue}</p>
            <p className="text-xs text-ink-soft mt-1">Severity: <span className="font-semibold">{scenario.severity}</span> &middot; Category: {scenario.contentCategory}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-lg" style={{ background: '#E4F5EF' }}>
              <strong className="text-green-700 text-sm">Upside</strong>
              <p className="text-sm mt-1">The feature drives engagement and revenue. Shipping it builds user trust in the platform's responsiveness.</p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: '#FBE9EA' }}>
              <strong className="text-red-700 text-sm">Concern</strong>
              <p className="text-sm mt-1">{scenario.issue}</p>
            </div>
          </div>
          <div className="mb-3">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft mb-1">Policy categories to consider</p>
            <ul className="list-disc pl-5 text-sm space-y-1">{scenario.policyCategories?.map((c: string, i: number) => <li key={i}>{c}</li>)}</ul>
          </div>
          <p className="text-sm font-medium mb-2">What do you decide, and how do you mitigate the concern without killing the upside?</p>
          <textarea className="sense-textarea" value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Example: I would ship the feature but with a mandatory review gate for high-severity cases, a 48-hour escalation path, and a kill-switch if the false-positive rate exceeds 5%..." />
          <button className="btn btn-primary mt-4" onClick={handleSubmit} disabled={!answer.trim()}>Submit Decision</button>
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