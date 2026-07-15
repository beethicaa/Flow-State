import { useState, useEffect } from 'react';
import { useStorage } from '../hooks/useStorage';

export default function Leaderboard() {
  const { deviceId, profile, updateProfile } = useStorage();
  const [period, setPeriod] = useState<'daily' | 'weekly'>('weekly');
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?period=${period}`)
      .then(r => r.json())
      .then(d => { setEntries(d.entries || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  const toggleOptIn = () => {
    const next = profile.leaderboard_opt_in ? 0 : 1;
    updateProfile({
      leaderboard_opt_in: next,
      display_name: profile.display_name || `Player-${deviceId.slice(0, 6)}`
    } as any);
  };

  return (
    <div className="max-w-[760px] mx-auto">
      <h2 className="text-2xl font-display font-bold mb-1">Leaderboard</h2>
      <p className="text-sm text-ink-soft mb-4">Top players by XP gained this period.</p>

      <div className="panel mb-5" style={{ background: '#FFF7DC', borderColor: 'var(--sticky-dark)' }}>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={!!profile.leaderboard_opt_in} onChange={toggleOptIn} />
          <span className="text-sm font-medium">Opt in to the leaderboard</span>
        </label>
        <p className="text-xs text-ink-soft mt-1 ml-6">Off by default. Opting in shares your display name and XP total with other players.</p>
      </div>

      <div className="flex gap-2 mb-5">
        <button className={`btn btn-small ${period === 'weekly' ? 'btn-primary' : ''}`} onClick={() => setPeriod('weekly')}>Weekly</button>
        <button className={`btn btn-small ${period === 'daily' ? 'btn-primary' : ''}`} onClick={() => setPeriod('daily')}>Daily</button>
      </div>

      {loading && <div className="text-ink-soft">Loading…</div>}
      {!loading && entries.length === 0 && <div className="text-ink-soft italic">No opt-in players yet. Be the first!</div>}

      <div className="flex flex-col gap-2">
        {entries.map((e, i) => (
          <div key={e.device_id} className="panel flex items-center justify-between" style={{ padding: '12px 16px' }}>
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-lg w-6">#{i + 1}</span>
              <span className="font-medium">{e.display_name || 'Anonymous'}</span>
              {e.device_id === deviceId && <span className="text-xs text-blue-600 font-bold">(you)</span>}
            </div>
            <span className="font-mono font-bold">{e.xp_gained} XP</span>
          </div>
        ))}
      </div>
    </div>
  );
}