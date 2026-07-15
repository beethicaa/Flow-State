import { useState, useCallback, useEffect } from 'react'
import Hub from './components/Hub'
import MetricsDetective from './components/games/MetricsDetective'
import Guesstimate from './components/games/Guesstimate'
import Prioritize from './components/games/Prioritize'
import ProductSense from './components/games/ProductSense'
import ABTest from './components/games/ABTest'
import CrisisConsole from './components/games/CrisisConsole'
import NorthStar from './components/games/NorthStar'
import StakeholderStandoff from './components/games/StakeholderStandoff'
import QueryQuest from './components/games/QueryQuest'
import Postmortem from './components/games/Postmortem'
import TrustSafety from './components/games/TrustSafety'
import InterviewDebrief from './components/games/InterviewDebrief'
import ScopeCheck from './components/games/ScopeCheck'
import { useStorage } from './hooks/useStorage'
import { getTier, getTierIndex, xpProgress, SKILL_META, GameView, GAMES } from './constants'

let xpIdCounter = 0;

function App() {
  const [view, setView] = useState<GameView>('hub');
  const [xpFloats, setXpFloats] = useState<{id:number, xp:number, x:number, y:number}[]>([]);
  const [recap, setRecap] = useState<{gamesPlayed:number; xp:number; topSkill:string} | null>(null);
  const storage = useStorage();
  const tier = getTier(storage.profile.xp);
  const tierIndex = getTierIndex(storage.profile.xp);
  const prog = xpProgress(storage.profile.xp);

  // Weekly recap on boot
  useEffect(() => {
    const p = storage.profile;
    if (!p.lastRecapShown) {
      const today = new Date().toISOString().split('T')[0];
      const last = p.lastRecapShown ? new Date(p.lastRecapShown) : null;
      const daysSince = last ? Math.floor((Date.now() - last.getTime()) / 86400000) : 999;
      if (daysSince > 6) {
        const baseline = p.recapBaseline || { xp: 0, gamesPlayed: 0, skills: p.skills, snapshotAt: today };
        const deltaGames = (p.gamesPlayed - baseline.gamesPlayed) || 0;
        const deltaXp = (p.xp - baseline.xp) || 0;
        const skills = Object.entries(p.skills) as [keyof typeof p.skills, number][];
        const topSkill = skills.reduce((a, b) => (b[1] - a[1]) > 0 ? b : a, ['strategy', 0] as any);
        if (deltaGames > 0) {
          setRecap({ gamesPlayed: deltaGames, xp: deltaXp, topSkill: SKILL_META[topSkill[0]].label });
        }
      }
    }
  }, [storage.profile.lastRecapShown, storage.profile.gamesPlayed, storage.profile.xp, storage.profile.skills, storage.profile.recapBaseline]);

  function dismissRecap() {
    const p = storage.profile;
    storage.updateProfile({
      lastRecapShown: new Date().toISOString(),
      recapBaseline: { xp: p.xp, gamesPlayed: p.gamesPlayed, skills: p.skills, snapshotAt: new Date().toISOString() }
    });
    setRecap(null);
  }

  const handleReset = useCallback(() => {
    storage.updateProfile({
      xp: 0, streak: 0, gamesPlayed: 0, skills: { strategy: 0, execution: 0, analytics: 0, communication: 0 }, achievements: []
    });
  }, [storage]);

  const handleComplete = useCallback((xp: number, skill: string, isBoss = false, _judgmentScore = 0, _debrief = '', _rawAnswer = '') => {
    const finalXp = isBoss ? Math.round(xp * 1.5) : xp;
    const skillKey = (skill.split('/')[0]) as keyof typeof storage.profile.skills;
    const gameId = (view === 'hub' ? undefined : view) as string | undefined;
    storage.playGame(skillKey, finalXp, gameId);
    const id = ++xpIdCounter;
    setXpFloats(prev => [...prev, { id, xp: finalXp, x: 60 + Math.random() * 20, y: 40 + Math.random() * 10 }]);
    setTimeout(() => setXpFloats(prev => prev.filter(f => f.id !== id)), 1000);

    // Achievements
    const p = storage.profile;
    const newAchievements: string[] = [];
    const has = (id: string) => p.achievements.includes(id);
    const totalRounds = p.gamesPlayed + (gameId ? 1 : 0);
    if (totalRounds >= 1) newAchievements.push('first-blood');
    if (Object.keys(p.gamesPlayedByGame).length + (gameId ? 1 : 0) >= GAMES.length) newAchievements.push('full-house');
    if (p.streak + 1 >= 7) newAchievements.push('week-warrior');
    if (_judgmentScore >= 90) newAchievements.push('sharp-read');
    const allSkillsHigh = Object.values(p.skills).every(v => v >= 50);
    if (allSkillsHigh) newAchievements.push('well-rounded');
    if (isBoss) newAchievements.push('boss-beaten');

    const toAdd = newAchievements.filter(a => !has(a));
    if (toAdd.length > 0) {
      setXpFloats(prev => [...prev, { id: ++xpIdCounter, xp: 0, x: 80, y: 10 }]);
      storage.updateProfile({ achievements: [...p.achievements, ...toAdd] });
    }
  }, [storage, view]);

  const renderGame = () => {
    switch (view) {
      case 'metrics-detective': return <MetricsDetective onComplete={handleComplete} />;
      case 'guesstimate': return <Guesstimate onComplete={handleComplete} />;
      case 'prioritize': return <Prioritize onComplete={handleComplete} />;
      case 'product-sense': return <ProductSense onComplete={handleComplete} />;
      case 'ab-test': return <ABTest onComplete={handleComplete} />;
      case 'crisis': return <CrisisConsole onComplete={handleComplete} />;
      case 'north-star': return <NorthStar onComplete={handleComplete} />;
      case 'standoff': return <StakeholderStandoff onComplete={handleComplete} />;
      case 'query-quest': return <QueryQuest onComplete={handleComplete} />;
      case 'postmortem': return <Postmortem onComplete={handleComplete} />;
      case 'trust-safety': return <TrustSafety onComplete={handleComplete} />;
      case 'interview': return <InterviewDebrief onComplete={handleComplete} />;
      case 'scope': return <ScopeCheck onComplete={handleComplete} />;
      default: return null;
    }
  };

  return (
    <div className="app-container">
      <div className="px-10 py-6 flex-1 flex flex-col">
        {/* Header row */}
        <div className="header-row flex flex-col md:flex-row justify-between items-center gap-4 mb-5">
          <div>
            <div className="eyebrow" style={{ fontSize: 12, letterSpacing: '.14em', color: 'var(--ink-soft)', fontWeight: 600, textTransform: 'uppercase' }}>PM Skills, Gamified</div>
            <h1 style={{ fontSize: 30, letterSpacing: '-.02em' }}>Flow State</h1>
          </div>
          <div style={{ position: 'relative' }}>
            <div className="lanyard"></div>
            <div className="badge id-card">
              <div className="id-header">
                <span className="id-company"></span>
                <span className="id-label">Access Pass</span>
              </div>
              <div className="id-body">
                <div className="id-tier" style={{ background: tier.color }}>{tier.title}</div>
                <div className="id-name">Level {tierIndex + 1}</div>
                <div className="id-meta">
                  <div className="id-xp"><span className="mono">{storage.profile.xp} XP</span></div>
                  <div className="id-streak">🔥 {storage.profile.streak} day streak</div>
                </div>
                <div className="xpbar-track"><div className="xpbar-fill" style={{ width: `${prog.pct}%` }}></div></div>
                <div className="id-footer">{prog.maxed ? 'MAX TIER' : `${prog.remaining} to next`}</div>
                <button onClick={handleReset} className="btn btn-small reset-btn">reset</button>
              </div>
              <div className="id-barcode"></div>
            </div>
          </div>
        </div>

        {/* Skills row */}
        <div className="skills-row skillbars mb-5">
            {Object.keys(SKILL_META).map(k => {
              const meta = SKILL_META[k as keyof typeof SKILL_META];
              const val = storage.profile.skills[k as keyof typeof storage.profile.skills] || 0;
              const pct = Math.min(100, Math.round(val / 6));
              return (
                <div key={k} className="skillbar-box">
                  <div className="label">{meta.label}</div>
                  <div className="track"><div className="fill" style={{ width: `${pct}%`, background: meta.color }}></div></div>
                  <div className="mono">{val} pts</div>
                </div>
              );
            })}
        </div>

        {/* Games section — minHeight keeps page from compressing during loading */}
        <div style={{ minHeight: '55vh' }}>
          {view === 'hub' ? (
            <Hub onSelectGame={setView} />
          ) : (
            <div className="game-shell">
              <button onClick={() => setView('hub')} className="group flex items-center gap-2 mb-4 text-ink-soft hover:text-ink transition-colors font-body">
                <span className="text-lg transition-transform group-hover:-translate-x-1">←</span>
                <span className="text-sm font-medium">Back to Hub</span>
              </button>
              <div className="game-container">
                {renderGame()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Weekly recap modal */}
      {recap && (
        <div style={{ position:'fixed', inset:0, background:'rgba(27,36,48,0.6)', zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div className="panel" style={{ maxWidth:420, width:'100%' }}>
            <h2 style={{ fontSize:20, marginBottom:8 }}>Welcome back 👋</h2>
            <div style={{ fontSize:14, lineHeight:1.6 }}>
              <strong>This week:</strong> {recap.gamesPlayed} rounds played, <strong>+{recap.xp} XP</strong>, fastest-growing skill: <strong>{recap.topSkill}</strong>
            </div>
            <div style={{ marginTop:14, display:'flex', justifyContent:'flex-end' }}>
              <button className="btn btn-primary" onClick={dismissRecap}>Got it</button>
            </div>
          </div>
        </div>
      )}

      <footer className="footer-note">made with <span className="heart">❤</span> by beethica</footer>

      {xpFloats.map(f => (
        <div key={f.id} className="xp-float font-hand text-2xl font-bold text-green" style={{ left: `${f.x}%`, top: `${f.y}%` }}>
          +{f.xp} XP
        </div>
      ))}
    </div>
  );
}

export default App;