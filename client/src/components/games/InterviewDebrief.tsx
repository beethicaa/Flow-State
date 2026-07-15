import { useState, useRef, useEffect } from 'react';
import { useGenerate } from '../../hooks/useGenerate';
import { useStorage } from '../../hooks/useStorage';
import GameLayout, { LoadingState, ErrorState, Stamp, JudgmentScore } from '../GameLayout';

interface TranscriptTurn { speaker: 'interviewer' | 'user'; text: string; }
interface Scenario { product: string; researchGoal: string; transcript: TranscriptTurn[]; temptingMisreads: string; realInsight: string; strongAnswerLooksLike: string; }
interface Grade { signalVsNoise: number; biasAwareness: number; validationRigor: number; judgmentScore: number; debrief: string; }

interface Props { onComplete: (xp: number, skill: string, isBoss: boolean, judgmentScore: number, debrief: string, rawAnswer: string) => void; isBoss?: boolean; }

export default function InterviewDebrief({ onComplete, isBoss = false }: Props) {
  const { generate, loading, error, reset } = useGenerate();
  const storage = useStorage();
  const [data, setData] = useState<Scenario | null>(null);
  const [answer, setAnswer] = useState('');
  const [grade, setGrade] = useState<Grade | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const genRef = useRef(false);

  useEffect(() => { if (!genRef.current) { genRef.current = true; loadScenario(); } }, []);
  useEffect(() => { if (isBoss && data && !grade) { /* boss marker can be used in UI */ } }, [isBoss, data, grade]);

  async function loadScenario() {
    reset();
    setData(null);
    setAnswer('');
    setGrade(null);
    const result = await generate({
      system: "You design qualitative-research interpretation exercises for PM practice.",
      prompt: `Invent a user research scenario. Output JSON:
{"product":"short context","researchGoal":"what the team was trying to learn","transcript":[{"speaker":"interviewer","text":"..."},{"speaker":"user","text":"..."}],"temptingMisreads":"1-2 sentences on what a biased reader might wrongly conclude","realInsight":"the actual signal, stated plainly","strongAnswerLooksLike":"2-3 sentences on what a rigorous read would identify and how they'd validate it"}
Keep transcript 150-250 words.${isBoss ? ' Make this deliberately harder: less clean information, subtler trap, closer call than usual.' : ''}`
    });
    if (result) { setData(result as Scenario); setAnswer(''); setGrade(null); }
  }

  async function submitAnswer() {
    if (!answer.trim() || !data || submitting) return;
    setSubmitting(true);
    const result = await generate({
      system: "You are an exacting PM interviewer grading qualitative reasoning.",
      prompt: `Grade this answer to an interview-debrief exercise. Output JSON: {"signalVsNoise":0-33,"biasAwareness":0-33,"validationRigor":0-33,"judgmentScore":0-100,"debrief":"2-3 sentences explaining what they missed and what a strong answer looks like"}

Goal: ${data.researchGoal}
Transcript: ${data.transcript.map(t => `${t.speaker}: ${t.text}`).join('\n')}
Real insight: ${data.realInsight}
Tempting misreads: ${data.temptingMisreads}
Player answer: ${answer}`
    });
    if (result) {
      const g = result as Grade;
      setGrade(g);
      const xp = Math.round((g.judgmentScore / 100) * 40 + (isBoss ? 20 : 0));
      storage.playGame('strategy', Math.round(xp * 0.6), 'interview');
      storage.playGame('communication', Math.round(xp * 0.4), 'interview');
      onComplete(xp, 'strategy/communication', isBoss, g.judgmentScore, g.debrief, answer);
    }
    setSubmitting(false);
  }

  if (loading && !data) return <LoadingState message="Pulling the field notes…" />;
  if (error && !data) return <ErrorState message={error} onRetry={loadScenario} />;
  if (!data) return null;

  return (
    <GameLayout title="Interview Debrief" subtitle="Strategy + Communication" icon="📝" iconBg="bg-gradient-to-br from-purple to-purple/60">
      {isBoss && <div className="boss-ribbon">BOSS ROUND</div>}
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Research goal</div>
      <div className="field-notes" style={{ marginBottom: 14 }}>{data.researchGoal}</div>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Transcript</div>
      <div className="field-notes" style={{ marginBottom: 14, whiteSpace: 'pre-wrap' }}>
        {data.transcript.map((t, i) => (
          <div key={i} style={{ marginBottom: 8 }}><strong>{t.speaker === 'interviewer' ? 'Interviewer' : 'User'}:</strong> {t.text}</div>
        ))}
      </div>
      <textarea className="sense-textarea" placeholder="What's the real insight here — and what would you deliberately NOT conclude from this alone?" value={answer} onChange={e => setAnswer(e.target.value)} />
      <div style={{ marginTop: 12 }}>
        <button className="btn btn-primary" disabled={!answer.trim() || submitting} onClick={submitAnswer}>{submitting ? 'Grading…' : 'Submit debrief →'}</button>
      </div>
      {grade && (
        <>
          <Stamp tier={grade.judgmentScore >= 70 ? 'high' : grade.judgmentScore >= 55 ? 'mid' : 'low'} label={grade.judgmentScore >= 70 ? 'Nailed it' : grade.judgmentScore >= 55 ? 'Defensible' : 'Missed the real signal'} xp={Math.round((grade.judgmentScore / 100) * 40 + (isBoss ? 20 : 0))} />
          <JudgmentScore score={grade.judgmentScore} />
          <div className="grade-grid">
            <div className="grade-row"><div className="lbl"><span>Signal vs Noise</span><span className="font-mono">{grade.signalVsNoise}/33</span></div><div className="track"><div className="fill" style={{ width: `${(grade.signalVsNoise/33)*100}%` }}></div></div></div>
            <div className="grade-row"><div className="lbl"><span>Bias Awareness</span><span className="font-mono">{grade.biasAwareness}/33</span></div><div className="track"><div className="fill" style={{ width: `${(grade.biasAwareness/33)*100}%` }}></div></div></div>
            <div className="grade-row"><div className="lbl"><span>Validation Rigor</span><span className="font-mono">{grade.validationRigor}/33</span></div><div className="track"><div className="fill" style={{ width: `${(grade.validationRigor/33)*100}%` }}></div></div></div>
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