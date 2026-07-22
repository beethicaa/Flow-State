import { useState, useRef, useEffect } from 'react';
import { useGenerate } from '../../hooks/useGenerate';
import { useStorage } from '../../hooks/useStorage';
import GameLayout, { LoadingState, ErrorState, Stamp, JudgmentScore } from '../GameLayout';

interface Scenario { product: string; ask: string; engineerEstimate: string; engineerReasoning: string; stakes: string; strongAnswerLooksLike: string; }
interface Grade { technicalCuriosity: number; collaborativeTone: number; scopeJudgment: number; judgmentScore: number; debrief: string; }

interface Props { onComplete: (xp: number, skill: string, isBoss: boolean, judgmentScore: number, debrief: string, rawAnswer: string) => void; isBoss?: boolean; }

export default function ScopeCheck({ onComplete, isBoss = false }: Props) {
  const { generate, loading, error, reset } = useGenerate();
  const storage = useStorage();
  const [data, setData] = useState<Scenario | null>(null);
  const [answer, setAnswer] = useState('');
  const [grade, setGrade] = useState<Grade | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const genRef = useRef(false);

  useEffect(() => { if (!genRef.current) { genRef.current = true; loadScenario(); } }, []);

  async function loadScenario() {
    reset();
    setData(null);
    setAnswer('');
    setGrade(null);
    const result = await generate({
      system: "You design technical-scoping negotiation exercises for PM practice.",
      prompt: `Invent a scoping scenario. Output JSON:
{"product":"short context","ask":"feature request","engineerEstimate":"e.g. 6 weeks and that's optimistic","engineerReasoning":"1-2 sentences hinting at real reasoning without stating whether it's padded","stakes":"deadline pressure","strongAnswerLooksLike":"2-3 sentences on what a sharp response would do"}
Vary whether the estimate is justified or padded.${isBoss ? ' Make this deliberately harder: less obvious signal, closer call than usual.' : ''}`
    });
    if (result) { setData(result as Scenario); setAnswer(''); setGrade(null); }
  }

  function computeGrade(): Grade {
    if (!data) {
      return { technicalCuriosity: 10, collaborativeTone: 10, scopeJudgment: 10, judgmentScore: 30, debrief: 'No scenario loaded.' };
    }

    const lower = answer.toLowerCase();
    const words = answer.split(/\s+/).filter(Boolean).length;

    const hasTechCuriosity = /why|how|what makes|assumption|breakdown|margin|pad|buffer|risk|complex|uncertain|dependency/i.test(lower);
    const hasCollaborative = /together|collaborate|partner|work with|let's|we could|suggest|propose|discuss|align|explore|understand|help|appreciate/i.test(lower);
    const hasScopeJudgment = /scope|cut|phase|mvp|minimum|v1|trade.?off|alternative|option|split|priority|essential|core|defer|must.?have|nice.?to/i.test(lower);
    const hasStakes = /stake|deadline|board|customer|investor|revenue|impact|critical|important|urgent/i.test(lower);

    const technicalCuriosity = hasTechCuriosity ? 28 : 12;
    const collaborativeTone = hasCollaborative ? 28 : 12;
    const scopeJudgment = hasScopeJudgment && words >= 10 ? 28 : hasScopeJudgment ? 18 : 10;
    const judgmentScore = Math.min(100, technicalCuriosity + collaborativeTone + scopeJudgment);

    const missing: string[] = [];
    if (!hasTechCuriosity) missing.push('question the estimate assumptions');
    if (!hasCollaborative) missing.push('collaborative framing');
    if (!hasScopeJudgment) missing.push('scope negotiation');
    if (!hasStakes) missing.push('acknowledge the stakes');

    const topGap = missing[0] || 'none';
    const est = data.engineerEstimate;

    let debrief = '';
    if (missing.length === 0) {
      debrief = `Strong response to "${data.ask}". You probed the ${est} estimate without busting trust, negotiated scope instead of just accepting the timeline, and anchored on what matters given ${data.stakes}. A senior PM would pair this with a written "decision memo" so the compromise is preserved across org noise. ${data.strongAnswerLooksLike}`;
    } else if (missing.length <= 2) {
      debrief = `Good instincts on this ask, but your response still leans on "${topGap}" being implicit. Given the estimate is "${est}" and the stakes are ${data.stakes}, a sharp PM makes the trade-offs visible: here's what we cut, here's what we defer, here's what could change the plan. ${data.strongAnswerLooksLike}`;
    } else {
      debrief = `Your response to "${data.ask}" needs more structure. The engineering estimate is "${est}" and ${data.engineerReasoning}. Key gaps: ${missing.join(', ')}. A senior PM reframes impossible asks as choices: "We can hit the deadline if we defer X and Y, or we extend the timeline and ship Z now." ${data.strongAnswerLooksLike}`;
    }

    return { technicalCuriosity, collaborativeTone, scopeJudgment, judgmentScore, debrief };
  }

  function submitAnswer() {
    if (!answer.trim() || !data || submitting) return;
    const g = computeGrade();
    setGrade(g);
    setSubmitting(true);
    const xp = Math.round((g.judgmentScore / 100) * 40 + (isBoss ? 20 : 0));
    storage.playGame('execution', Math.round(xp * 0.6), 'scope');
    storage.playGame('communication', Math.round(xp * 0.4), 'scope');
    onComplete(xp, 'execution/communication', isBoss, g.judgmentScore, g.debrief, answer);
  }

  if (loading && !data) return <LoadingState message="Reading the ticket…" />;
  if (error && !data) return <ErrorState message={error} onRetry={loadScenario} />;
  if (!data) return null;

  return (
    <GameLayout title="Scope Check" subtitle="Execution + Communication" icon="📏" iconBg="bg-gradient-to-br from-blue to-blue/60">
      {isBoss && <div className="boss-ribbon">BOSS ROUND</div>}
      <div style={{ fontWeight: 600, marginBottom: 4 }}>The ask</div>
      <div style={{ marginBottom: 12, fontSize: 14 }}>{data.ask}</div>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Engineering estimate</div>
      <div style={{ marginBottom: 6, fontSize: 14 }}>{data.engineerEstimate}</div>
      <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 12 }}>{data.engineerReasoning}</div>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Stakes</div>
      <div style={{ fontSize: 13, color: 'var(--red)', marginBottom: 14 }}>{data.stakes}</div>
      <textarea className="sense-textarea" placeholder="How do you respond to move this forward?" value={answer} onChange={e => setAnswer(e.target.value)} />
      <div style={{ marginTop: 12 }}>
        <button className="btn btn-primary" disabled={!answer.trim() || submitting} onClick={submitAnswer}>{submitting ? 'Graded' : 'Submit response →'}</button>
      </div>
      {grade && (
        <>
          <Stamp tier={grade.judgmentScore >= 70 ? 'high' : grade.judgmentScore >= 55 ? 'mid' : 'low'} label={grade.judgmentScore >= 70 ? 'Nailed it' : grade.judgmentScore >= 55 ? 'Defensible' : 'Missed the real signal'} xp={Math.round((grade.judgmentScore / 100) * 40 + (isBoss ? 20 : 0))} />
          <JudgmentScore score={grade.judgmentScore} />
          <div className="grade-grid">
            <div className="grade-row"><div className="lbl"><span>Technical Curiosity</span><span className="font-mono">{grade.technicalCuriosity}/33</span></div><div className="track"><div className="fill" style={{ width: `${(grade.technicalCuriosity/33)*100}%` }}></div></div></div>
            <div className="grade-row"><div className="lbl"><span>Collaborative Tone</span><span className="font-mono">{grade.collaborativeTone}/33</span></div><div className="track"><div className="fill" style={{ width: `${(grade.collaborativeTone/33)*100}%` }}></div></div></div>
            <div className="grade-row"><div className="lbl"><span>Scope Judgment</span><span className="font-mono">{grade.scopeJudgment}/33</span></div><div className="track"><div className="fill" style={{ width: `${(grade.scopeJudgment/33)*100}%` }}></div></div></div>
          </div>
          <div className="explain-box">
            <div><strong>Debrief:</strong></div>
            <div style={{ marginTop: 6 }}>{grade.debrief}</div>
          </div>
          <div style={{ marginTop: 10 }}><button className="btn btn-primary" onClick={loadScenario}>New case →</button></div>
        </>
      )}
    </GameLayout>
  );
}