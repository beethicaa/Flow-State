import { GAMES } from '../constants';
import { useStorage } from '../hooks/useStorage';
import { SKILL_META } from '../constants';

interface HubProps {
  onSelectGame: (id: any) => void;
}

const ACHIEVEMENT_META: Record<string, {label:string, icon:string}> = {
  'first-blood': {label:'First Blood', icon:'🎯'},
  'full-house': {label:'Full House', icon:'🏠'},
  'week-warrior': {label:'Week Warrior', icon:'🔥'},
  'sharp-read': {label:'Sharp Read', icon:'🧠'},
  'well-rounded': {label:'Well Rounded', icon:'⭐'},
  'boss-beaten': {label:'Boss Beaten', icon:'👑'},
};

const SKILL_TO_GAME: Record<string, string> = {
  strategy: 'product-sense',
  execution: 'prioritize',
  analytics: 'metrics-detective',
  communication: 'standoff',
};

export default function Hub({ onSelectGame }: HubProps) {
  const storage = useStorage();
  const profile = storage.profile;

  // Weak-spot nudge
  const totalRounds = profile.gamesPlayed;
  const skillEntries = Object.entries(SKILL_META).map(([key, meta]) => ({ key, ...meta, val: profile.skills[key as keyof typeof profile.skills] || 0 }));
  const maxSkill = Math.max(...skillEntries.map(s => s.val));
  const weakSpot = totalRounds >= 3 ? skillEntries.find(s => maxSkill > 0 && s.val < maxSkill * 0.6) : null;

  // Trophy shelf
  const unlocked = new Set(profile.achievements);
  const trophyIds = Object.keys(ACHIEVEMENT_META);

  return (
    <div className="flex-1">
      {/* Trophy shelf */}
      <div style={{ marginBottom: 18, display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--ink-soft)' }}>Achievements</span>
        {trophyIds.map(id => {
          const meta = ACHIEVEMENT_META[id];
          const has = unlocked.has(id);
          return (
            <div key={id} title={has ? meta.label : `${meta.label} (locked)`} style={{ fontSize:22, opacity: has ? 1 : 0.35, filter: has ? 'none' : 'grayscale(1)', transition:'all .2s' }}>{meta.icon}</div>
          );
        })}
      </div>

      {/* Weak-spot nudge */}
      {weakSpot && (
        <div style={{ marginBottom: 16, padding:'10px 14px', borderRadius:10, background:'var(--paper-alt)', border:'1.5px dashed var(--border)', fontSize:13, lineHeight:1.5 }}>
          <strong>{weakSpot.label}</strong> is lagging behind your other skills — <span style={{ color:'var(--blue)', cursor:'pointer', fontWeight:600 }} onClick={() => onSelectGame(SKILL_TO_GAME[weakSpot.key])}>Play {GAMES.find(g => g.id === SKILL_TO_GAME[weakSpot.key])?.title}</span>
        </div>
      )}

      <div className="hub-grid">
        {GAMES.map(game => {
          const isBoss = profile.gamesPlayedByGame[game.id] > 0 && profile.gamesPlayedByGame[game.id] % 5 === 0;
          return (
            <div key={game.id} className={`game-card ${game.cardClass} group`} onClick={() => onSelectGame(game.id)}>
              {isBoss && <div className="boss-ribbon" style={{ position:'absolute', top:-8, right:-8 }}>BOSS NEXT</div>}
              <div className="card-visual">
                {game.icon === 'squiggle' && (
                  <svg className="squiggle" width="120" height="60" viewBox="0 0 120 60"><path d="M0 15 L25 15 L35 40 L55 5 L75 30 L95 10 L120 45" stroke="#E63946" strokeWidth="3" fill="none" /></svg>
                )}
                {game.icon === 'qmark' && <div className="qmark">?</div>}
                {game.icon === 'pencil' && <div className="pencil">✏️</div>}
                {game.icon === 'pulse' && <div className="pulse"></div>}
                {game.icon === 'compass' && <div className="compass">🧭</div>}
                {game.icon === 'bubble' && <div className="bubble">💬</div>}
                {game.icon === 'quote' && <div className="quote">“</div>}
                {game.icon === 'estimate' && <div className="estimate-icon">📐</div>}
              </div>
              <div className="card-body">
                <div className="tag">{game.tag}</div>
                <h2>{game.title}</h2>
                <p>{game.desc}</p>
              </div>
              <div className="btn play">{game.btn}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
