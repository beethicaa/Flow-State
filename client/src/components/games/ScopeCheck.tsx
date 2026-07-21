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

  async function submitAnswer() {
    if (!answer.trim() || !data || submitting) return;
    setSubmitting(true);
    const result = await generate({
      pool: 'grade',
      system: "You are an exacting PM interviewer grading scope negotiation responses.",
      prompt: `Grade this answer to a scope-check exercise. Output JSON: {"technicalCuriosity":0-33,"collaborativeTone":0-33,"scopeJudgment":0-33,"judgmentScore":0-100,"debrief":"2-3 sentences explaining what they missed and what a strong answer looks like"}

Ask: ${data.ask}
Engineer estimate: ${data.engineerEstimate}
Engineer reasoning: ${data.engineerReasoning}
Stakes: ${data.stakes}
Strong answer looks like: ${data.strongAnswerLooksLike}
Player answer: ${answer}`
    });
    if (result) {
      const g = result as Grade;
      setGrade(g);
      const xp = Math.round((g.judgmentScore / 100) * 40 + (isBoss ? 20 : 0));
      storage.playGame('execution', Math.round(xp * 0.6), 'scope');
      storage.playGame('communication', Math.round(xp * 0.4), 'scope');
      onComplete(xp, 'execution/communication', isBoss, g.judgmentScore, g.debrief, answer);
    }
    setSubmitting(false);
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
        <button className="btn btn-primary" disabled={!answer.trim() || submitting} onClick={submitAnswer}>{submitting ? 'Grading…' : 'Submit response →'}</button>
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