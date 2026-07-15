import { useState, useRef, useEffect } from 'react';
import { useGenerate } from '../../hooks/useGenerate';
import GameLayout, { LoadingState, ErrorState, Stamp, RubricRow, JudgmentScore } from '../GameLayout';

interface Scenario {
  incident: string;
  blastRadius: string;
  signals: string[];
  bestTechId: string;
  bestCommsId: string;
  explanation: string;
}

interface Grade {
  techDecision: number;
  communication: number;
  speed: number;
  judgmentScore: number;
  debrief: string;
}

interface Props {
  onComplete: (xp: number, skill: string) => void;
}

const TECH_OPTIONS = [
  { id: 'rollback', label: 'Rollback now' },
  { id: 'hotfix', label: 'Hotfix in place' },
  { id: 'page_more', label: 'Page more engineers' },
];

const COMM_OPTIONS = [
  { line: '"We\'re assessing — I\'ll have an ETA in 3."', trustDelta: 10, id: 'eta' },
  { line: '"Under control. Will update by end of incident."', trustDelta: -5, id: 'vague' },
  { line: '"Nothing to worry about."', trustDelta: -15, id: 'dismiss' },
];

export default function CrisisConsoleGame({ onComplete }: Props) {
  const { generate, loading, error, reset } = useGenerate();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [phase, setPhase] = useState<'main' | 'vp' | 'done'>('main');
  const [techPick, setTechPick] = useState<string | null>(null);
  const [commPick, setCommPick] = useState<string | null>(null);
  const [mainTimeLeft, setMainTimeLeft] = useState(60);
  const [vpTimeLeft, setVpTimeLeft] = useState(10);
  const [grade, setGrade] = useState<Grade | null>(null);
  const genRef = useRef(false);

  useEffect(() => {
    if (!genRef.current) { genRef.current = true; loadScenario(); }
  }, []);

  useEffect(() => {
    if (!scenario || phase === 'done') return;
    if (phase === 'main') {
      if (mainTimeLeft <= 0) { handleAutoSubmit('timeout'); return; }
      const t = setInterval(() => setMainTimeLeft(p => p - 1), 1000);
      return () => clearInterval(t);
    }
    if (phase === 'vp') {
      if (vpTimeLeft <= 0) { handleAutoSubmit('timeout'); return; }
      const t = setInterval(() => setVpTimeLeft(p => p - 1), 1000);
      return () => clearInterval(t);
    }
  }, [phase, mainTimeLeft, vpTimeLeft, scenario]);

  async function loadScenario() {
    reset();
    setScenario(null);
    setPhase('main');
    setGrade(null);
    const data = await generate({
      system: 'You design P0 incident response scenarios for PM practice.',
      prompt: `Generate a P0 incident. Output JSON:
{
  "incident": "what broke, 1 sentence",
  "blastRadius": "affected users/systems, 1 sentence",
  "signals": ["conflicting signal 1", "conflicting signal 2", "conflicting signal 3"],
  "bestTechId": "rollback|hotfix|page_more",
  "bestCommsId": "eta|vague|dismiss",
  "explanation": "3-4 sentence debrief on what a sharp PM would do and why"
}`
    });
    if (data) setScenario(data);
  }

  function handleTechPick(id: string) {
    setTechPick(id);
    setPhase('vp');
    setVpTimeLeft(10);
  }

  function handleCommPick(id: string) {
    setCommPick(id);
    handleAutoSubmit('normal');
  }

  function handleAutoSubmit(reason: string) {
    if (!scenario) return;
    setPhase('done');
    const isTimeout = reason === 'timeout';
    const td = isTimeout ? 0 : techPick === scenario.bestTechId ? 35 : 15;
    const comm = isTimeout ? 0 : commPick === scenario.bestCommsId ? 25 : 10;
    const speed = isTimeout ? 0 : 30;
    const js = td + comm + speed;
    setGrade({
      techDecision: td, communication: comm, speed,
      judgmentScore: js,
      debrief: isTimeout
        ? 'Indecision has a cost. In real incidents, a wrong call at the right time is often better than the right call too late. Your team needed direction.'
        : scenario.explanation
    });
    const xp = Math.round(js * 0.4);
    onComplete(xp, 'execution');
  }

  if (loading && !scenario) return <LoadingState message="Generating incident…" />;
  if (error && !scenario) return <ErrorState message={error} onRetry={loadScenario} />;
  if (!scenario) return null;

  if (grade) {
    return (
      <GameLayout title="Crisis Console" subtitle="Execution + Communication" icon="⚠" iconBg="bg-red">
        <Stamp tier={grade.judgmentScore >= 80 ? 'high' : grade.judgmentScore >= 55 ? 'mid' : 'low'}
          label={grade.judgmentScore >= 80 ? 'Sharp read' : grade.judgmentScore >= 55 ? 'Defensible' : 'Missed the real signal'}
          xp={Math.round(grade.judgmentScore * 0.4)} />
        <JudgmentScore score={grade.judgmentScore} />
        <RubricRow label="Tech decision" score={grade.techDecision} max={40} />
        <RubricRow label="Communication" score={grade.communication} max={30} />
        <RubricRow label="Speed" score={grade.speed} max={30} />
        <div className="panel mt-4" style={{ background: 'var(--paper-alt)' }}>
          <p className="text-sm leading-relaxed">{grade.debrief}</p>
        </div>
        <button onClick={loadScenario} className="btn mt-5" disabled={loading}>{loading ? '…' : 'Next Incident →'}</button>
      </GameLayout>
    );
  }

  return (
    <GameLayout title="Crisis Console" subtitle="Execution + Communication" icon="⚠" iconBg="bg-red">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm font-mono" style={{ color: 'var(--ink-soft)' }}>
          {phase === 'main' ? `Time: ${mainTimeLeft}s` : `VP timer: ${vpTimeLeft}s`}
        </div>
        <div className="w-32 h-2 rounded-full bg-gray-200 overflow-hidden">
          <div className="h-full bg-red transition-all" style={{ width: `${(mainTimeLeft / 60) * 100}%` }}></div>
        </div>
      </div>

      <div className="panel mb-4" style={{ borderColor: 'var(--red)' }}>
        <p className="font-display font-semibold text-lg">{scenario.incident}</p>
        <p className="text-sm mt-2" style={{ color: 'var(--ink-soft)' }}>Blast radius: {scenario.blastRadius}</p>
        <div className="mt-2 text-xs">
          {scenario.signals.map((s, i) => <div key={i} className="mt-1" style={{ color: 'var(--ink-soft)' }}>Signal {i + 1}: {s}</div>)}
        </div>
      </div>

      {phase === 'main' && (
        <div>
          <p className="text-xs font-mono uppercase mb-3" style={{ color: 'var(--ink-soft)' }}>Technical response</p>
          <div className="flex flex-wrap gap-2">
            {TECH_OPTIONS.map(o => (
              <button key={o.id} onClick={() => handleTechPick(o.id)} className="btn">{o.label}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'vp' && (
        <div className="panel" style={{ background: 'var(--paper-alt)', borderColor: 'var(--amber)' }}>
          <p className="font-hand text-lg mb-1">Your VP just Slacked: "ETA?"</p>
          <p className="text-xs font-mono mb-3" style={{ color: 'var(--red)' }}>Respond within {vpTimeLeft}s</p>
          <div className="flex flex-wrap gap-2">
            {COMM_OPTIONS.map(o => (
              <button key={o.id} onClick={() => handleCommPick(o.id)} className="btn text-xs">{o.line}</button>
            ))}
          </div>
        </div>
      )}
    </GameLayout>
  );
}