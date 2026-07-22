import { useState, useRef, useEffect } from 'react';
import { useGenerate } from '../../hooks/useGenerate';
import GameLayout, { LoadingState, ErrorState, Stamp, RubricRow, JudgmentScore } from '../GameLayout';

interface RawOption { line: string; trustDelta: number; trulyGood: boolean; }
interface Option { line: string; trustDelta: number; }
interface Turn { prompt: string; options: Option[]; optionsRaw?: RawOption[]; }
interface Scenario { stakeholder: string; openingLine: string; underlyingConcern: string; turns: Turn[]; }
interface Grade { deEscalation: number; transparency: number; outcome: number; judgmentScore: number; debrief: string; }
interface Props { onComplete: (xp: number, skill: string) => void; }

export default function StandoffGame({ onComplete }: Props) {
  const { generate, loading, error, reset } = useGenerate();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [trust, setTrust] = useState(50);
  const [turnIdx, setTurnIdx] = useState(0);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const genRef = useRef(false);

  useEffect(() => {
    if (!genRef.current) { genRef.current = true; loadScenario(); }
  }, []);

  async function loadScenario() {
    reset(); setScenario(null); setTrust(50); setTurnIdx(0); setTranscript([]); setGrade(null); setSubmitted(false);
    const data = await generate({
      system: 'You design stakeholder dialogue trees for PM communication training. At least one high-trust option should actually be the wrong move (placating without addressing the underlying concern).',
      prompt: `Generate a 3-turn stakeholder standoff. Output JSON:
{
  "stakeholder": "title, e.g. 'VP of Engineering'",
  "openingLine": "their opening complaint or demand",
  "underlyingConcern": "the real issue they aren't saying directly",
  "turns": [
    {"prompt":"...","options":[{"line":"...","trustDelta":10-25,"trulyGood":true},{"line":"...","trustDelta":15-20,"trulyGood":false},{"line":"...","trustDelta":-15-0,"trulyGood":false}]},
    {"prompt":"...","options":[{"line":"...","trustDelta":...},...]},
    {"prompt":"...","options":[{"line":"...","trustDelta":...},...]}
  ]
}
Ensure turn 2 has at least one high-trust option that is trulyGood=false (placating).`
    });
    if (data) {
      const turns = (data.turns as Turn[]).map((t: any) => {
        const raw = t.options as RawOption[];
        const shuffled = [...raw].sort(() => Math.random() - 0.5);
        return {
          prompt: t.prompt,
          options: shuffled.map((o: RawOption) => ({ line: o.line, trustDelta: o.trustDelta })),
          optionsRaw: raw
        };
      });
      setScenario({ ...data, turns } as Scenario);
    }
  }

  function handlePick(opt: Option) {
    if (!scenario || submitted) return;
    const newTrust = Math.min(100, Math.max(0, trust + opt.trustDelta));
    setTrust(newTrust);
    setTranscript(t => [...t, opt.line]);
    const isLast = turnIdx >= scenario.turns.length - 1;
    if (isLast) {
      setSubmitted(true);
      gradeSubmission(newTrust, [...transcript, opt.line]);
    } else {
      setTurnIdx(t => t + 1);
    }
  }

  function localGrade(finalTrust: number, fullTranscript: string[]): Grade {
    if (!scenario) {
      return { deEscalation: 15, transparency: 15, outcome: 15, judgmentScore: 45, debrief: 'Your conversation was logged.' };
    }

    const transcriptText = fullTranscript.join(' ').toLowerCase();

    // Check if they addressed the real concern vs just placated
    const addressedConcern = /understand|hear|let's|work together|what if|can we|suggest|propose|solve|address|help|support|resource|timeline|priority|concern/i.test(transcriptText);
    const wasPlacating = /absolutely|you're right|i'll tell|no problem|we can do|sure thing|whatever you say/i.test(transcriptText) && !addressedConcern;

    // Check for de-escalation tactics
    const hasDeEscalation = /let's|together|work with|understand|hear you|acknowledge|valid|reasonable|appreciate/i.test(transcriptText);
    
    // Check for transparency (not hiding info)
    const hasTransparency = /explain|transparent|honest|trade-off|constraint|limit|reality|honest/i.test(transcriptText);
    
    // Check outcome orientation
    const hasOutcome = /next step|action|plan|follow up|commit|deliver|timeline|date|deadline/i.test(transcriptText);

    const deEscalation = hasDeEscalation ? 28 : 12;
    const transparency = hasTransparency ? 28 : 12;
    const outcome = hasOutcome && addressedConcern ? 28 : hasOutcome ? 18 : 10;
    const judgmentScore = deEscalation + transparency + outcome;

    let debrief = '';
    if (addressedConcern && !wasPlacating && hasOutcome) {
      debrief = `Strong communication. You navigated ${scenario.stakeholder}'s opening tension and surfaced the real concern: "${scenario.underlyingConcern}". Ending at ${finalTrust}% trust shows you balanced empathy with accountability. A senior PM doesn't just smooth edges — they convert tension into a concrete next step.`;
    } else if (addressedConcern) {
      debrief = `You made progress with ${scenario.stakeholder} by acknowledging their position. The underlying concern was "${scenario.underlyingConcern}". To be more effective, pair empathy with a concrete outcome: what specifically will happen next, by when, and with whose agreement?`;
    } else if (wasPlacating) {
      debrief = `Careful — you placated ${scenario.stakeholder} without addressing the real issue. Their underlying concern is: "${scenario.underlyingConcern}". High trust from placating is fragile; it drops when the promised deliverable doesn't materialize. A sharp PM validates the emotion but redirects to the actual problem.`;
    } else {
      debrief = `Your conversation with ${scenario.stakeholder} was noted. The real issue beneath their opening line: "${scenario.underlyingConcern}". A strong PM would have used the first turn to acknowledge their position, then steered toward the actual blocker. Ending trust: ${finalTrust}%.`;
    }

    return { deEscalation, transparency, outcome, judgmentScore, debrief };
  }

  async function gradeSubmission(finalTrust: number, fullTranscript: string[]) {
    if (!scenario) return;
    const g = localGrade(finalTrust, fullTranscript);
    setGrade(g);
    onComplete(Math.round(g.judgmentScore * 0.4), 'communication');
  }

  if (loading && !scenario) return <LoadingState message="Generating scenario…" />;
  if (error && !scenario) return <ErrorState message={error} onRetry={loadScenario} />;
  if (!scenario) return null;

  const currentTurn = scenario.turns[turnIdx];

  return (
    <GameLayout title="Stakeholder Standoff" subtitle="Communication" icon="✦" iconBg="bg-gradient-to-br from-purple to-purple/60">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-xs font-mono" style={{ color: 'var(--ink-soft)' }}>Trust:</div>
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue transition-all" style={{ width: `${trust}%` }}></div>
        </div>
        <div className="font-mono text-sm font-bold">{trust}</div>
      </div>

      <div className="panel mb-4">
        <p className="font-display font-semibold text-sm">{scenario.stakeholder}</p>
        {transcript.length === 0 ? (
          <p className="text-sm mt-1 hand" style={{ color: 'var(--ink)' }}>"{scenario.openingLine}"</p>
        ) : (
          <p className="text-sm mt-1" style={{ color: 'var(--ink-soft)' }}>{currentTurn?.prompt || ''}</p>
        )}
      </div>

      {transcript.length > 0 && (
        <div className="space-y-1 mb-4">
          {transcript.map((l, i) => (
            <p key={i} className="text-xs" style={{ color: 'var(--ink-soft)' }}>You: "{l}"</p>
          ))}
        </div>
      )}

      {!submitted && currentTurn && (
        <div className="space-y-2">
          {currentTurn.options.map((opt, i) => (
            <button key={i} onClick={() => handlePick(opt)} className="btn w-full text-left text-xs" style={{ lineHeight: 1.4 }}>
              "{opt.line}"
            </button>
          ))}
        </div>
      )}

      {submitted && grade && (
        <div>
          <Stamp tier={grade.judgmentScore >= 80 ? 'high' : grade.judgmentScore >= 55 ? 'mid' : 'low'}
            label={grade.judgmentScore >= 80 ? 'Sharp read' : grade.judgmentScore >= 55 ? 'Defensible' : 'Missed the real signal'}
            xp={Math.round(grade.judgmentScore * 0.4)} />
          <JudgmentScore score={grade.judgmentScore} />
          <RubricRow label="De-escalation" score={grade.deEscalation} max={33} />
          <RubricRow label="Transparency" score={grade.transparency} max={33} />
          <RubricRow label="Outcome" score={grade.outcome} max={33} />
          <div className="panel mt-4" style={{ background: 'var(--paper-alt)' }}>
            <p className="text-xs font-mono uppercase mb-1" style={{ color: 'var(--ink-soft)' }}>Hidden concern: {scenario.underlyingConcern}</p>
            <p className="text-sm">{grade.debrief}</p>
          </div>
          <button onClick={loadScenario} className="btn mt-5" disabled={loading}>{loading ? '…' : 'Next Standoff →'}</button>
        </div>
      )}
    </GameLayout>
  );
}