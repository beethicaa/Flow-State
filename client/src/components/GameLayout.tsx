import React from 'react';

interface GameLayoutProps {
  title: string;
  subtitle: string;
  icon: string;
  iconBg: string;
  children: React.ReactNode;
}

export default function GameLayout({ title, subtitle, icon, iconBg, children }: GameLayoutProps) {
  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1 }}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold font-hand text-lg ${iconBg}`}>
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-ink">{title}</h2>
          <p className="text-sm text-ink-soft font-body">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export function LoadingState({ message }: { message?: string }) {
  return (
    <div className="loader">
      <div className="spinner"></div>
      <div className="msg">{message || 'Loading…'}</div>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="error-box">
      {message}
      <br /><br />
      <button className="btn btn-red" onClick={onRetry}>Try again</button>
    </div>
  );
}

interface StampProps {
  tier: 'high' | 'mid' | 'low';
  label: string;
  xp: number;
}

export function Stamp({ tier, label, xp }: StampProps) {
  const cls = tier === 'high' ? 'stamp-high' : tier === 'mid' ? 'stamp-mid' : 'stamp-low';
  return (
    <div className="flex items-center gap-4 mb-6">
      <span className={`stamp ${cls}`}>{label}</span>
      <span className="font-hand text-lg text-ink-soft">+{xp} XP</span>
    </div>
  );
}

interface RubricRowProps {
  label: string;
  score: number;
  max: number;
}

export function RubricRow({ label, score, max }: RubricRowProps) {
  const pct = (score / max) * 100;
  return (
    <div className="rubric-row">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-ink">{label}</span>
        <span className="font-mono text-ink-soft">{score}/{max}</span>
      </div>
      <div className="track">
        <div className="fill" style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
}

export function JudgmentScore({ score, max }: { score: number; max?: number }) {
  const m = max || 100;
  return (
    <div className="flex items-baseline gap-2 mb-4">
      <span className="judgment-score" style={{ color: score >= 80 ? 'var(--green)' : score >= 55 ? 'var(--amber)' : 'var(--red)' }}>
        {score}
      </span>
      <span className="text-ink-soft font-body">/ {m}</span>
    </div>
  );
}