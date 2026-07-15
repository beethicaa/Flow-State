import { useState, useEffect } from 'react';
import { useStorage } from '../hooks/useStorage';
import { GAMES } from '../constants';

export default function CaseLog() {
  const { deviceId } = useStorage();
  const [entries, setEntries] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  const gameTitle = (id: string) => GAMES.find(g => g.id === id)?.title || id;

  useEffect(() => {
    setLoading(true);
    const qs = filter !== 'all' ? `?game=${filter}` : '';
    fetch(`/api/case-log/${deviceId}${qs}`)
      .then(r => r.json())
      .then(d => { setEntries(d.entries || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [deviceId, filter]);

  return (
    <div className="max-w-[760px] mx-auto">
      <h2 className="text-2xl font-display font-bold mb-1">Case Log</h2>
      <p className="text-sm text-ink-soft mb-4">Every round you've played, with your answer and the debrief.</p>

      <div className="flex flex-wrap gap-2 mb-5">
        <button className={`btn btn-small ${filter === 'all' ? 'btn-primary' : ''}`} onClick={() => setFilter('all')}>All</button>
        {GAMES.map(g => (
          <button key={g.id} className={`btn btn-small ${filter === g.id ? 'btn-primary' : ''}`} onClick={() => setFilter(g.id)}>{g.title}</button>
        ))}
      </div>

      {loading && <div className="text-ink-soft">Loading…</div>}
      {!loading && entries.length === 0 && <div className="text-ink-soft italic">No cases yet — go play a round!</div>}

      <div className="flex flex-col gap-3">
        {entries.map((e) => (
          <div key={e.id} className="panel cursor-pointer" onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-bold uppercase text-ink-soft">{gameTitle(e.game)}</span>
                <p className="text-sm font-medium mt-1">{e.scenario_summary || '(no summary)'}</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-lg font-bold" style={{ color: e.judgment_score >= 70 ? 'var(--green)' : e.judgment_score >= 50 ? 'var(--amber)' : 'var(--red)' }}>{e.judgment_score}</span>
                <span className="text-xs text-ink-soft block">/100</span>
              </div>
            </div>
            {expanded === e.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="mb-3">
                  <strong className="text-sm">Your answer:</strong>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{e.player_answer}</p>
                </div>
                <div>
                  <strong className="text-sm">Debrief:</strong>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{e.debrief}</p>
                </div>
                <div className="text-xs text-ink-soft mt-3">{new Date(e.created_at).toLocaleString()}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}