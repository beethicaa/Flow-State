import { useState, useEffect } from 'react';
import GameLayout, { LoadingState, JudgmentScore } from '../GameLayout';
import { postmortemPool } from '../../scenarios/index';
import { useStorage } from '../../hooks/useStorage';

export default function Postmortem({ onComplete }: { onComplete: (xp: number, skill: string) => void }) {
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
    const eligible = postmortemPool.filter(s => s.difficulty.min <= tier && s.difficulty.max >= tier);
    const picked = eligible.length > 0 ? eligible[Math.floor(Math.random() * eligible.length)] : postmortemPool[Math.floor(Math.random() * postmortemPool.length)];
    setScenario(picked);
  }

  function handleSubmit() {
    if (!answer.trim() || !scenario) return;
    const lower = answer.toLowerCase();
    const matchedItems = scenario.actionItems.filter((item: string) => lower.includes(item.toLowerCase().slice(0, 30)));
    const matchRate = matchedItems.length / Math.max(scenario.actionItems.length, 1);
    const hasBlameless = /blameless|root cause|process|system|prevent|recurrence|gap|miss/i.test(lower);
    const hasWhatWentWrong = scenario.whatWentWrong?.some((w: string) => lower.includes(w.toLowerCase().slice(0, 20))) || false;
    const blamelessness = Math.round(33 * (hasBlameless ? 0.85 : 0.35));
    const rootCauseRigor = Math.round(33 * Math.min(1, matchRate + 0.5 + (hasWhatWentWrong ? 0.2 : 0)));
    const actionability = Math.round(33 * Math.min(1, matchRate + 0.2));
    const scores = { blamelessness, rootCauseRigor, actionability };
    const judgmentScore = Math.round((blamelessness + rootCauseRigor + actionability) / 3);
    const xp = Math.max(10, Math.round(judgmentScore / 100 * 30));

    // Contextual debrief using specific scenario data
    const whatWentWrongItems = scenario.whatWentWrong?.join('; ') || '';
    const actionItemsList = scenario.actionItems?.map((a: string, i: number) => `${i + 1}. ${a}`).join('\n') || '';

    let debrief = '';
    if (hasBlameless && matchRate >= 0.5) {
      debrief = `Strong postmortem. You identified the systemic issues and proposed concrete fixes. The key failure points to address: ${whatWentWrongItems}. Recommended actions:\n${actionItemsList}`;
    } else if (hasBlameless) {
      debrief = `Good blameless framing. For deeper root cause analysis, explicitly connect each failure to an action item. What went wrong: ${whatWentWrongItems}. Key action items: ${actionItemsList}`;
    } else {
      debrief = `Your postmortem identified some issues. Aim for a blameless tone that focuses on systems, not people. What went wrong: ${whatWentWrongItems}. Strong action items to consider:\n${actionItemsList}`;
    }

    setResult({ scores, debrief, judgmentScore, xp });
    setPhase('grade');
    onComplete(xp, 'communication');
  }

  if (!scenario) return <LoadingState message="Loading incident report…" />;

  return (
    <GameLayout title="The Postmortem" subtitle="Communication · Strategy" icon="📋" iconBg="bg-red-600">
      {scenario && phase === 'play' && (
        <div>
          <div className="panel mb-4" style={{ borderLeft: '4px solid var(--red)' }}>
            <strong>INCIDENT REPORT</strong>
            {scenario.blastRadius && <p className="mt-2 text-sm font-medium text-red-700">{scenario.blastRadius}</p>}
            <p className="mt-2 text-sm p-3 rounded" style={{ background: '#FBE9EA' }}>{scenario.incident}</p>
          </div>
          <div className="mb-3">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft mb-1">What went well</p>
            <ul className="list-disc pl-5 text-sm space-y-1">{scenario.whatWentWell?.map((w: string, i: number) => <li key={i}>{w}</li>)}</ul>
          </div>
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wide text-red-700 mb-1">What went wrong</p>
            <ul className="list-disc pl-5 text-sm space-y-1">{scenario.whatWentWrong?.map((w: string, i: number) => <li key={i} className="text-red-800">{w}</li>)}</ul>
          </div>
          <p className="text-sm font-medium mb-2">Write a blameless postmortem — root cause(s) and what you'd change:</p>
          <textarea className="sense-textarea" value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Example: The root cause was not the engineer but the lack of a mandatory peer review gate for production deploys. We should add a CI check that blocks direct-to-prod pushes..." />
          <button className="btn btn-primary mt-4" onClick={handleSubmit} disabled={!answer.trim()}>Submit Postmortem</button>
        </div>
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
          <div className="explain-box mt-4" style={{ whiteSpace: 'pre-wrap' }}>{result.debrief}</div>
          <button className="btn btn-primary mt-4" onClick={loadScenario}>New Scenario</button>
        </div>
      )}
    </GameLayout>
  );
}