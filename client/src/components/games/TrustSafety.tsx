import { useState, useEffect } from 'react';
import GameLayout, { LoadingState, JudgmentScore, Stamp } from '../GameLayout';
import { trustSafetyPool } from '../../scenarios/index';
import { useStorage } from '../../hooks/useStorage';

interface Scenario {
  issue: string; severity: string; contentCategory: string;
  policyCategories: string[]; difficulty: { min: number; max: number };
}

interface Grade {
  ethicalReasoning: number; businessPragmatism: number; mitigationConcreteness: number;
  judgmentScore: number; debrief: string; xp: number;
}

export default function TrustSafety({ onComplete }: { onComplete: (xp: number, skill: string) => void }) {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [answer, setAnswer] = useState('');
  const [phase, setPhase] = useState<'play' | 'grade'>('play');
  const [result, setResult] = useState<Grade | null>(null);
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

    // Policy coverage
    const matchedCategories = scenario.policyCategories.filter((c: string) =>
      lower.includes(c.toLowerCase().slice(0, 15))
    );
    const policyCoverage = matchedCategories.length / Math.max(scenario.policyCategories.length, 1);

    // Mitigation language
    const hasMitigation = /mitigat|balance|trade.?off|allow|restrict|review|threshold|escalation|kill|fallback|guardrail|override/i.test(lower);

    // Severity awareness
    const severity = scenario.severity.toLowerCase();
    const acknowledgesSeverity = lower.includes(severity) ||
      (severity === 'high' && /urgent|critical|serious|immediate/i.test(lower)) ||
      (severity === 'medium' && /moderate|balance|careful/i.test(lower)) ||
      (severity === 'critical' && /immediate|legal|regulator|emergency/i.test(lower));

    // Business pragmatism
    const hasBusinessPragmatism = /revenue|growth|engagement|user|trust|platform|community|upside|value/i.test(lower);

    // Concrete mechanisms
    const hasConcreteMechanism = /review gate|escalation path|kill.?switch|time.?bound|appeal|human|audit|log|monitor|threshold|rate.?limit|shadow|gradual|rollout/i.test(lower);

    // Category-specific checks
    const isDeepfake = scenario.contentCategory === 'deepfake';
    const isDoxxing = scenario.contentCategory === 'doxxing';
    const isHealth = scenario.contentCategory === 'health_advice';
    const isElection = scenario.contentCategory === 'election_integrity';
    const isHarmful = scenario.contentCategory === 'harmful_behavior';
    const isSelfHarm = scenario.contentCategory === 'self_harm';
    const isCounterfeit = scenario.contentCategory === 'counterfeit';
    const isHateSpeech = scenario.contentCategory === 'hate_speech';
    const isDataBreach = scenario.contentCategory === 'data_breach';

    let categoryBonus = 0;
    if (isDeepfake && /synthetic|disclosure|label|authentic/i.test(lower)) categoryBonus = 5;
    if (isDoxxing && /victim|support|escalat|law enforcement|safety|redact/i.test(lower)) categoryBonus = 5;
    if (isHealth && /medical|disclaimer|professional|expert|certif/i.test(lower)) categoryBonus = 5;
    if (isElection && /ad|disclosure|voter|foreign|transparen/i.test(lower)) categoryBonus = 5;
    if (isHarmful && /copycat|trending|remov|time|sensitive/i.test(lower)) categoryBonus = 5;
    if (isSelfHarm && /intervention|resource|support|escalat|protect/i.test(lower)) categoryBonus = 5;
    if (isCounterfeit && /trade dress|nuance|brand|report|investigate/i.test(lower)) categoryBonus = 5;
    if (isHateSpeech && /jurisdiction|legal|context|speech|harm/i.test(lower)) categoryBonus = 5;
    if (isDataBreach && /notify|regulator|forensic|contain|law enforcement/i.test(lower)) categoryBonus = 5;

    const ethicalReasoning = Math.min(33, Math.round(33 * (0.3 + 0.7 * policyCoverage)) + (acknowledgesSeverity ? 3 : 0));
    const businessPragmatism = Math.min(33, Math.round(33 * (hasBusinessPragmatism ? 0.85 : 0.3)) + (hasMitigation ? 2 : 0));
    const mitigationConcreteness = Math.min(33, Math.round(33 * Math.min(1, 0.3 + 0.4 * policyCoverage + 0.5 * (hasConcreteMechanism ? 1 : 0))) + categoryBonus);
    const judgmentScore = Math.min(100, Math.round((ethicalReasoning + businessPragmatism + mitigationConcreteness) / 3));
    const xp = Math.max(10, Math.round(judgmentScore / 100 * 30));

    const allPolicies = scenario.policyCategories.join(', ');

    let debrief = '';
    if (policyCoverage >= 0.7 && hasMitigation && hasConcreteMechanism) {
      debrief = `Strong decision on "${scenario.issue}". You acknowledged the ${scenario.severity} severity, named the relevant policies (${allPolicies}), and proposed concrete guardrails rather than a blunt ban. That balance — preserving upside while containing risk — is what separates a senior T&S PM from a junior one. ${scenario.contentCategory === 'deepfake' ? 'On synthetic media, requiring disclosure + authenticity signals is the industry standard approach.' : ''} ${scenario.contentCategory === 'doxxing' ? 'For PII leaks, victim support + escalation to law enforcement is the right play.' : ''} ${scenario.contentCategory === 'health_advice' ? 'On dangerous health advice, the bar is expert certification + clear disclaimers.' : ''} ${scenario.contentCategory === 'election_integrity' ? 'Election ads demand transparency on funding + synthetic content disclosure.' : ''} ${scenario.contentCategory === 'harmful_behavior' ? 'Copycat-risk content needs time-sensitive removal + trending-alert hooks.' : ''} ${scenario.contentCategory === 'self_harm' ? 'Self-harm cases require protective intervention + routing to support resources, not just removal.' : ''} ${scenario.contentCategory === 'counterfeit' ? 'Trade-dress nuance requires brand-protection review + seller investigation, not automatic takedown.' : ''} ${scenario.contentCategory === 'hate_speech' ? 'Hate speech decisions must weigh jurisdiction, context, and actual harm — not just the words.' : ''} ${scenario.contentCategory === 'data_breach' ? 'Data breaches require immediate containment + regulator notification within the statutory window.' : ''}`;
    } else if (policyCoverage >= 0.5 || hasMitigation) {
      debrief = `You showed the right instincts on "${scenario.issue}" (${scenario.severity}). The policies at play: ${allPolicies}. To strengthen, be more concrete: what's the review gate, who gets alerted, and what's the kill-switch? A strong T&S PM designs mechanisms that scale — not one-off judgments.`;
    } else if (acknowledgesSeverity) {
      debrief = `You recognized this is a ${scenario.severity} issue, but your response needs more policy precision. Relevant policies: ${allPolicies}. The best answers name the specific policy tension (free expression vs. harm, growth vs. safety) and propose a time-bound experiment or tiered enforcement path.`;
    } else {
      debrief = `"${scenario.issue}" is a ${scenario.severity} trust-and-safety challenge. Relevant policies: ${allPolicies}. A sharp PM would first calibrate severity, then map the specific policy categories, then propose a concrete mitigation — review gate, escalation path, or kill-switch — that preserves legitimate upside. Blanket bans feel safe but rarely optimal.`;
    }

    setResult({ ethicalReasoning, businessPragmatism, mitigationConcreteness, debrief, judgmentScore, xp });
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
            <p className="text-xs text-ink-soft mt-1">Severity: <span className="font-semibold">{scenario.severity}</span> · Category: {scenario.contentCategory}</p>
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
          <Stamp tier={result.judgmentScore >= 80 ? 'high' : result.judgmentScore >= 55 ? 'mid' : 'low'} label={result.judgmentScore >= 80 ? 'Sharp read' : result.judgmentScore >= 55 ? 'Defensible' : 'Missed the real signal'} xp={result.xp} />
          <JudgmentScore score={result.judgmentScore} />
          <div className="grade-grid">
            <div className="grade-row"><div className="lbl"><span>Ethical Reasoning</span><span className="font-mono">{result.ethicalReasoning}/33</span></div><div className="track"><div className="fill" style={{ width: `${(result.ethicalReasoning/33)*100}%`, background: 'var(--amber)' }}></div></div></div>
            <div className="grade-row"><div className="lbl"><span>Business Pragmatism</span><span className="font-mono">{result.businessPragmatism}/33</span></div><div className="track"><div className="fill" style={{ width: `${(result.businessPragmatism/33)*100}%`, background: 'var(--amber)' }}></div></div></div>
            <div className="grade-row"><div className="lbl"><span>Mitigation Concreteness</span><span className="font-mono">{result.mitigationConcreteness}/33</span></div><div className="track"><div className="fill" style={{ width: `${(result.mitigationConcreteness/33)*100}%`, background: 'var(--amber)' }}></div></div></div>
          </div>
          <div className="explain-box mt-4">{result.debrief}</div>
          <button className="btn btn-primary mt-4" onClick={loadScenario}>New Dilemma</button>
        </div>
      )}
    </GameLayout>
  );
}