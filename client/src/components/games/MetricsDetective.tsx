import { useState, useRef, useEffect } from 'react';
import { useGenerate } from '../../hooks/useGenerate';
import { shuffle } from '../../constants';
import GameLayout, { LoadingState, ErrorState, Stamp, RubricRow, JudgmentScore } from '../GameLayout';

interface Option { text: string; note: string; }
interface RawOption { text: string; correct: boolean; note: string; }
interface Scenario { product: string; metricName: string; metricChange: string; context: string; options: RawOption[]; }

interface Grade { rootCause: number; evidenceWeighting: number; alternativeConsideration: number; judgmentScore: number; debrief: string; }

interface Props { onComplete: (xp: number, skill: string) => void; }

export default function MetricsDetective({ onComplete }: Props) {
  const { generate, loading, error, reset } = useGenerate();
  const [data, setData] = useState<Scenario | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [correctIndex, setCorrectIndex] = useState<number>(-1);
  const [selected, setSelected] = useState<number | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);
  const genRef = useRef(false);

  useEffect(() => {
    if (!genRef.current) { genRef.current = true; loadScenario(); }
  }, []);

  async function loadScenario() {
    reset();
    setData(null);
    setOptions([]);
    setCorrectIndex(-1);
    setSelected(null);
    setGrade(null);
    const result = await generate({
      system: "You are a product analytics case-writer creating diagnostic exercises for PM interview practice.",
      prompt: `Invent a realistic product and metric decline. Output JSON:
{"product":"short context","metricName":"e.g. Weekly Active Riders","metricChange":"e.g. down 18% over 2 weeks","context":"2-3 sentences of dashboard context","options":[{"text":"hypothesis","correct":true,"note":"why correct, 1-2 sentences"},{"text":"hypothesis","correct":false,"note":"why tempting but wrong, 1 sentence"},{"text":"hypothesis","correct":false,"note":"..."},{"text":"hypothesis","correct":false,"note":"..."}]}
Put the correct option at a RANDOM index (0-3).`
    });
    if (result) {
      const raw = result.options as RawOption[];
      const shuffled = shuffle(raw);
      const ci = shuffled.findIndex((o: RawOption) => o.correct);
      setCorrectIndex(ci);
      setOptions(shuffled.map((o: RawOption) => ({ text: o.text, note: o.note })));
      setData(result);
    }
  }

  function computeGrade(): Grade {
    if (!data || selected === -1 || selected === null) {
      return { rootCause: 10, evidenceWeighting: 10, alternativeConsideration: 10, judgmentScore: 30, debrief: 'No scenario loaded.' };
    }

    const isCorrect = selected === correctIndex;
    const correctOption = data.options.find(o => o.correct);
    const selectedOption = data.options[selected];

    const rootCause = isCorrect ? 33 : 12;
    const evidenceWeighting = isCorrect ? 33 : 15;
    const alternativeConsideration = isCorrect ? 34 : 15;
    const judgmentScore = rootCause + evidenceWeighting + alternativeConsideration;

    let debrief = '';
    if (isCorrect) {
      debrief = `Correct diagnosis. "${selectedOption?.text}" is the most likely root cause for ${data.product}'s ${data.metricName} ${data.metricChange}. ${correctOption?.note || selectedOption?.note} A sharp PM doesn't stop at the first plausible explanation — they'd validate with a cohort analysis or a quick experiment. But as the leading hypothesis, this is the right place to invest investigation time.`;
    } else {
      const correctText = correctOption?.text || 'the correct option';
      const correctNote = correctOption?.note || '';
      debrief = `You picked "${selectedOption?.text}", but the most likely root cause is "${correctText}". ${correctNote} The tempting misread here is that the surface symptoms (${data.metricChange}) feel like they could match several explanations — but the context clues in the dashboard point specifically to the correct answer. A senior PM asks: "What would I see in the data to disprove my hypothesis?"`;
    }

    return { rootCause, evidenceWeighting, alternativeConsideration, judgmentScore, debrief };
  }

  function handlePick(i: number) {
    if (selected !== null) return;
    setSelected(i);
    const g = computeGrade();
    setGrade(g);
    onComplete(Math.round(g.judgmentScore * 0.3), 'analytics');
  }

  const showLoading = loading && !data;
  const showError = error && !data;

  if (showLoading) return <LoadingState message="Pulling up the dashboard…" />;
  if (showError) return <ErrorState message={error} onRetry={loadScenario} />;
  if (!data || options.length === 0) return null;

  return (
    <GameLayout title="Metrics Detective" subtitle="Analytics" icon="📈" iconBg="bg-gradient-to-br from-red to-red/60">
      <div className="metric-tile">
        <div className="mname">{data.product} · {data.metricName}</div>
        <div className="mval">↓ {data.metricChange}</div>
        <div className="mctx">{data.context}</div>
      </div>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>What's the most likely root cause?</div>
      <div className="hyp-list">
        {options.map((o, i) => {
          let cls = 'hyp-card';
          if (selected !== null) {
            cls += ' revealed';
            if (i === correctIndex) cls += ' correct';
            else if (i === selected) cls += ' incorrect';
            cls += ' locked';
          }
          return (
            <div key={i} className={cls} onClick={() => handlePick(i)}>
              {o.text}
              <div className="note">{o.note}</div>
            </div>
          );
        })}
      </div>
      {grade && selected !== null && (
        <div>
          <Stamp tier={grade.judgmentScore >= 80 ? 'high' : grade.judgmentScore >= 40 ? 'mid' : 'low'} label={grade.judgmentScore >= 80 ? 'Sharp read' : grade.judgmentScore >= 40 ? 'Defensible' : 'Missed the real signal'} xp={Math.round(grade.judgmentScore * 0.3)} />
          <JudgmentScore score={grade.judgmentScore} />
          <RubricRow label="Root cause identification" score={grade.rootCause} max={33} />
          <RubricRow label="Evidence weighting" score={grade.evidenceWeighting} max={33} />
          <RubricRow label="Alternative consideration" score={grade.alternativeConsideration} max={34} />
          <div className="explain-box mt-4">
            <div style={{ marginTop: 6 }}>{grade.debrief}</div>
          </div>
          <div style={{ marginTop: 10 }}><button className="btn btn-primary" onClick={loadScenario}>Next case →</button></div>
        </div>
      )}
    </GameLayout>
  );
}