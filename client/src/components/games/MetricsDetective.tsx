import { useState, useRef, useEffect } from 'react';
import { useGenerate } from '../../hooks/useGenerate';
import { shuffle } from '../../constants';
import GameLayout, { LoadingState, ErrorState, Stamp } from '../GameLayout';

interface Option { text: string; note: string; }
interface RawOption { text: string; correct: boolean; note: string; }
interface Scenario { product: string; metricName: string; metricChange: string; context: string; options: RawOption[]; }

interface Props { onComplete: (xp: number, skill: string) => void; }

export default function MetricsDetective({ onComplete }: Props) {
  const { generate, loading, error, reset } = useGenerate();
  const [data, setData] = useState<Scenario | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [correctIndex, setCorrectIndex] = useState<number>(-1);
  const [selected, setSelected] = useState<number | null>(null);
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
    const result = await generate({
      system: "You are a product analytics case-writer creating short diagnostic exercises for PM interview practice.",
      prompt: `Invent a realistic tech product (pick a random category each time) and a metric that recently declined.
Output JSON:
{"product":"short context","metricName":"e.g. Weekly Active Riders","metricChange":"e.g. down 18% over 2 weeks","context":"2-3 sentences of dashboard context","options":[{"text":"hypothesis","correct":true,"note":"why correct, 1-2 sentences"},{"text":"hypothesis","correct":false,"note":"why tempting but wrong, 1 sentence"},{"text":"hypothesis","correct":false,"note":"..."},{"text":"hypothesis","correct":false,"note":"..."}]}
Put the correct option at a RANDOM index (0-3). NEVER put it at the same position twice. Keep under 160 words.`
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

  function handlePick(i: number) {
    if (selected !== null) return;
    setSelected(i);
    onComplete(i === correctIndex ? 30 : 10, 'analytics');
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
      {selected !== null && (
        <>
          <Stamp tier={selected === correctIndex ? 'high' : 'low'} label={selected === correctIndex ? 'Nailed it' : 'Missed it'} xp={selected === correctIndex ? 30 : 10} />
          <div style={{ marginTop: 8 }}><button className="btn btn-primary" onClick={loadScenario}>Next case →</button></div>
        </>
      )}
    </GameLayout>
  );
}