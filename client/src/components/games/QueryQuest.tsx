import { useState, useEffect } from 'react';
import { useGenerate } from '../../hooks/useGenerate';
import GameLayout, { LoadingState, ErrorState, JudgmentScore } from '../GameLayout';

const BUG_TYPES = ['wrong_join', 'off_by_one_date', 'double_counting', 'missing_filter', 'wrong_aggregation'] as const;
const BUG_LABELS: Record<string, string> = {
  wrong_join: 'Wrong join direction',
  off_by_one_date: 'Off-by-one date boundary',
  double_counting: 'Double-counting from join fan-out',
  missing_filter: 'Missing filter',
  wrong_aggregation: 'Wrong aggregation function'
};

export default function QueryQuest({ onComplete }: { onComplete: (xp: number, skill: string) => void }) {
  const { generate, loading, error, reset } = useGenerate();
  const [scenario, setScenario] = useState<any>(null);
  const [selectedBug, setSelectedBug] = useState<string | null>(null);
  const [explanation, setExplanation] = useState('');
  const [phase, setPhase] = useState<'play' | 'grade'>('play');
  const [result, setResult] = useState<any>(null);
  const genRef = { current: false };

  useEffect(() => {
    if (!genRef.current) {
      genRef.current = true;
      loadScenario();
    }
  }, []);

  async function loadScenario() {
    reset();
    setScenario(null);
    setSelectedBug(null);
    setExplanation('');
    setPhase('play');
    setResult(null);
    const r = await generate({
      system: 'You design SQL-debugging exercises for PM data-literacy practice.',
      prompt: `Invent a business question and a SQL query someone wrote to answer it, containing exactly one bug. Output JSON:
{
  "businessQuestion": "the question the query is supposed to answer",
  "query": "the SQL, formatted with newlines, as a single string",
  "bugType": "wrong_join" | "off_by_one_date" | "double_counting" | "missing_filter" | "wrong_aggregation",
  "bugExplanation": "2-3 sentences on exactly what's wrong and what number it produces instead",
  "whatWentUnnoticed": "1 sentence on why this would slip past a quick glance",
  "correctedQuery": "the fixed version of the query"
}`
    });
    if (r) setScenario(r);
  }

  async function handleSubmit() {
    if (!selectedBug || !explanation.trim() || !scenario) return;
    const bugScore = selectedBug === scenario.bugType ? 50 : 0;
    const gradeResult = await generate({
      system: 'Grade a player explanation against a known answer. Return JSON.',
      prompt: `Known bug explanation: ${scenario.bugExplanation}\nPlayer explanation: ${explanation}\nRate 0-50 on accuracy and specificity. JSON: { "score": number, "feedback": "1 sentence" }`
    });
    const explanationScore = gradeResult?.score || 0;
    const judgmentScore = bugScore + explanationScore;
    const xp = Math.round(judgmentScore / 100 * 30);
    setResult({ judgmentScore, bugScore, explanationScore, feedback: gradeResult?.feedback || '', xp });
    setPhase('grade');
    onComplete(Math.max(10, xp), 'analytics');
  }

  if (loading && !scenario) return <LoadingState message="Generating a SQL query with a hidden bug…" />;
  if (error && !scenario) return <ErrorState message={error} onRetry={loadScenario} />;
  if (!scenario && !loading && !error) return <LoadingState message="Generating a SQL query with a hidden bug…" />;
  if (!scenario) return null;

  return (
    <GameLayout title="Query Quest" subtitle="Analytics" icon="Q" iconBg="bg-blue-600">
      {error && <ErrorState message={error} onRetry={loadScenario} />}
      {phase === 'play' && (
        <div>
          <div className="panel mb-4"><strong>Business Question:</strong> {scenario.businessQuestion}</div>
          <pre className="bg-[#10151A] text-white p-4 rounded-lg text-sm font-mono overflow-x-auto mb-4">{scenario.query}</pre>
          <p className="text-sm text-ink-soft mb-3">Pick the bug type and explain what's wrong:</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {BUG_TYPES.map(bt => (
              <button key={bt} className={`btn btn-small ${selectedBug === bt ? 'btn-primary' : ''}`} onClick={() => setSelectedBug(bt)}>{BUG_LABELS[bt]}</button>
            ))}
          </div>
          <textarea className="sense-textarea" placeholder="Explain what's actually wrong and why it matters…" value={explanation} onChange={e => setExplanation(e.target.value)} />
          <button className="btn btn-primary mt-4" onClick={handleSubmit} disabled={!selectedBug || !explanation.trim()}>Submit</button>
        </div>
      )}
      {result && phase === 'grade' && (
        <div>
          <JudgmentScore score={result.judgmentScore} />
          <div className="explain-box">
            <p><strong>Bug match:</strong> {result.bugScore}/50 — {result.bugScore >= 50 ? 'Correctly identified!' : `Expected: ${BUG_LABELS[scenario.bugType]}`}</p>
            <p className="mt-2"><strong>Explanation grade:</strong> {result.explanationScore}/50 — {result.feedback}</p>
            <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
              <strong className="text-green-700">Corrected Query:</strong>
              <pre className="mt-2 text-sm font-mono overflow-x-auto text-black">{scenario.correctedQuery}</pre>
            </div>
            <p className="mt-3 text-ink-soft italic">{scenario.whatWentUnnoticed}</p>
            <div className="mt-4 p-3 rounded-lg bg-blue-50">
              <strong>Debrief:</strong> {scenario.bugExplanation}
            </div>
          </div>
          <button className="btn btn-primary mt-4" onClick={loadScenario}>New Query</button>
        </div>
      )}
    </GameLayout>
  );
}