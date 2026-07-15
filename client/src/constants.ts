export const TIERS = [
  {min:0,    title:"Associate PM",       color:"#8AA6C1"},
  {min:150,  title:"Product Manager",    color:"#3A6EA5"},
  {min:400,  title:"Senior PM",          color:"#1F9D7C"},
  {min:800,  title:"Group PM",           color:"#E9A23B"},
  {min:1400, title:"Director of Product",color:"#E63946"},
  {min:2200, title:"VP of Product",      color:"#7B4EA3"},
  {min:3200, title:"Chief Product Officer",color:"#1B2430"},
];

export const SKILL_META: Record<string, {label:string, color:string}> = {
  strategy:    {label:"Strategy",     color:"#7B4EA3"},
  execution:   {label:"Execution",    color:"#E9A23B"},
  analytics:   {label:"Analytics",    color:"#3A6EA5"},
  communication:{label:"Communication",color:"#1F9D7C"},
};

export const GAMES = [
  { id: 'metrics-detective', title: 'Metrics Detective', tag: 'Analytics', desc: 'A metric just tanked. Dig through the dashboard, form a hypothesis, and diagnose the root cause before the exec review.', cardClass: 'card-dashboard', btn: 'Investigate →', icon: 'squiggle' },
  { id: 'guesstimate', title: 'Guesstimate Gauntlet', tag: 'Analytics · Estimation', desc: 'Ballpark a hairy Fermi question the way you would in an interview. Precision doesn\'t matter — reasoning does.', cardClass: 'card-notepad', btn: 'Estimate →', icon: 'qmark' },
  { id: 'prioritize', title: 'Prioritize This', tag: 'Execution', desc: 'A messy backlog, a real constraint, not enough time. Rank it like you\'d defend it in a planning meeting.', cardClass: 'card-sticky', btn: 'Rank it →', icon: '' },
  { id: 'product-sense', title: 'Product Sense Sprint', tag: 'Strategy · Communication', desc: 'Design a feature for a real-sounding prompt. Claude grades your answer like a bar-raiser interviewer would.', cardClass: 'card-doc', btn: 'Write →', icon: 'pencil' },
  { id: 'ab-test', title: 'A/B Test Autopsy', tag: 'Analytics', desc: 'Results are in. Sample size, confidence, a guardrail metric that twitched. Ship it, kill it, or run it longer?', cardClass: 'card-abtest', btn: 'Read the results →', icon: '' },
  { id: 'crisis', title: 'Crisis Console', tag: 'Execution · Communication', desc: 'It\'s a P0. The clock is running. Decide the fix and decide who hears about it, before the timer decides for you.', cardClass: 'card-crisis', btn: 'Enter the war room →', icon: 'pulse' },
  { id: 'north-star', title: 'North Star Navigator', tag: 'Strategy', desc: 'Given the business model, pick the metric this whole team should live and die by — then defend why it can\'t be gamed.', cardClass: 'card-northstar', btn: 'Pick a metric →', icon: 'compass' },
  { id: 'standoff', title: 'Stakeholder Standoff', tag: 'Communication', desc: 'An engineer, an exec, or a sales lead has a complaint. What they say and what they mean aren\'t the same thing.', cardClass: 'card-standoff', btn: 'Take the meeting →', icon: 'bubble' },
  { id: 'query-quest', title: 'Query Quest', tag: 'Analytics', desc: 'A SQL query that looks right but isn\'t. Spot the bug before it hits production.', cardClass: 'card-terminal', btn: 'Debug →', icon: 'qmark' },
  { id: 'postmortem', title: 'The Postmortem', tag: 'Communication · Strategy', desc: 'Something went wrong. Write a blameless postmortem that finds the real root cause.', cardClass: 'card-doc', btn: 'Investigate →', icon: 'pencil' },
  { id: 'trust-safety', title: 'Trust & Safety Dilemma', tag: 'Strategy', desc: 'A feature with clear upside and a non-strawman ethical concern. No clean answer.', cardClass: 'card-confidential', btn: 'Decide →', icon: 'compass' },
  { id: 'interview', title: 'User Interview Debrief', tag: 'Strategy · Communication', desc: 'A transcript, some tempting misreads, and one buried signal. Separate signal from noise before acting on it.', cardClass: 'card-fieldnotes', btn: 'Read the notes →', icon: 'quote' },
  { id: 'scope', title: 'Scope Check', tag: 'Execution · Communication', desc: 'Engineering just gave you a timeline. Is it padded, justified, or somewhere in between?', cardClass: 'card-scope', btn: 'Respond →', icon: 'estimate' },
] as const;

export type GameId = typeof GAMES[number]['id'];
export type GameView = GameId | 'hub' | 'case-log' | 'leaderboard';

export function getTier(xp: number) {
  let t = TIERS[0];
  for (const tier of TIERS) { if (xp >= tier.min) t = tier; }
  return t;
}

export function getTierIndex(xp: number) {
  let idx = 0;
  TIERS.forEach((t, i) => { if (xp >= t.min) idx = i; });
  return idx;
}

export function xpProgress(xp: number) {
  const idx = getTierIndex(xp);
  const cur = TIERS[idx];
  const next = TIERS[idx + 1];
  if (!next) return { pct: 100, maxed: true };
  const span = next.min - cur.min;
  const into = xp - cur.min;
  return { pct: Math.min(100, Math.round(into / span * 100)), remaining: next.min - xp, maxed: false, nextTitle: next.title };
}

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}