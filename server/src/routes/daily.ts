import { Router, Request, Response } from 'express';
import { getDB } from '../db.js';
import Groq from 'groq-sdk';

const router = Router();
const db = getDB();

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

function getDateStr(): string {
  return new Date().toISOString().split('T')[0];
}

function getTodaySeed(): number {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return Number(String(y) + String(m).padStart(2, '0') + String(day).padStart(2, '0'));
}

const ALL_GAMES = ['metrics-detective', 'guesstimate', 'prioritize', 'product-sense', 'ab-test', 'crisis', 'north-star', 'standoff', 'query-quest', 'postmortem', 'trust-safety'];

// Prompts per game for generation
const GAME_PROMPTS: Record<string, { system: string; prompt: string }> = {
  'metrics-detective': {
    system: 'You generate product-metric diagnosis exercises.',
    prompt: `Generate a metric that dropped, and 4 hypotheses (one correct, 3 plausible). JSON: { "metricName": "...", "metricContext": "...", "currentValue": "...", "dropDescription": "...", "hypotheses": [{"id":1,"text":"...","correct":true,"explanation":"..."},{"id":2,"text":"...","correct":false,"explanation":"..."},{"id":3,"text":"...","correct":false,"explanation":"..."},{"id":4,"text":"...","correct":false,"explanation":"..."}] }`
  },
  'guesstimate': {
    system: 'You generate Fermi estimation questions for PM practice.',
    prompt: `Generate a Fermi estimation question and a reference answer (approximate log10 midpoint). JSON: { "question": "...", "context": "...", "referenceAnswer": number, "unit": "...", "approachSummary": "..." }`
  },
  'prioritize': {
    system: 'You generate product backlog prioritization exercises.',
    prompt: `Generate a 5-item backlog and a constraint. JSON: { "items": [{"id":1,"title":"...","detail":"..."}], "constraint": "...", "idealOrder": [1,2,3,4,5], "reasoning": "..." }`
  },
  'product-sense': {
    system: 'You generate product sense design prompts.',
    prompt: `Generate a feature design prompt for a product. JSON: { "prompt": "...", "context": "..." }`
  },
  'ab-test': {
    system: 'You generate A/B test post-mortem exercises.',
    prompt: `Generate a fake experiment result with a hidden trap. JSON: { "context": "...", "variantA": {"name":"A (control)","rate":number,"n":number}, "variantB": {"name":"B (treatment)","rate":number,"n":number}, "pValue": number, "confidence": number, "guardrails": [{"metric":"...","a":number,"b":number,"regressed":boolean}], "bestCall": "ship"|"kill"|"run_longer"|"ship_with_guardrail", "explanation": "..." }`
  },
  'crisis': {
    system: 'You generate incident response exercises.',
    prompt: `Generate a P0 incident with conflicting signals. JSON: { "incident": "...", "blastRadius": "...", "signals": ["...","..."], "decisions": [{"id":1,"text":"...","executionScore":number,"communicationScore":number}] }`
  },
  'north-star': {
    system: 'You generate North Star metric selection exercises.',
    prompt: `Generate a business model and 4 candidate metrics. JSON: { "businessModel": "...", "candidates": [{"id":1,"metric":"...","blindSpot":"..."}], "bestId": number }`
  },
  'standoff': {
    system: 'You generate stakeholder influence dialogue exercises.',
    prompt: `Generate a stakeholder scenario. JSON: { "stakeholder": "...", "openingLine": "...", "underlyingConcern": "...", "options": [{"id":1,"text":"...","trustDelta":number,"escalates":boolean}] }`
  },
  'query-quest': {
    system: 'You design SQL-debugging exercises for PM data-literacy practice.',
    prompt: `Invent a business question and a SQL query with exactly one bug. JSON: { "businessQuestion": "...", "query": "...", "bugType": "wrong_join"|"off_by_one_date"|"double_counting"|"missing_filter"|"wrong_aggregation", "bugExplanation": "...", "whatWentUnnoticed": "...", "correctedQuery": "..." }`
  },
  'postmortem': {
    system: 'You design blameless-postmortem writing exercises.',
    prompt: `Invent a product/launch failure. JSON: { "product": "...", "stakes": "...", "whatHappened": "...", "strongAnswerLooksLike": "..." }`
  },
  'trust-safety': {
    system: 'You design product ethics / trust-and-safety trade-off exercises.',
    prompt: `Invent a feature with clear upside and a real safety concern. JSON: { "product": "...", "feature": "...", "upside": "...", "concern": "...", "stakeholderPressure": "...", "strongAnswerLooksLike": "..." }`
  }
};

function cleanJson(str: string): string {
  return str.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const dateStr = getDateStr();

    // Check cache
    const cached = db.prepare('SELECT * FROM daily_challenge WHERE date = ?').get(dateStr) as any;
    if (cached) {
      return res.json({ date: dateStr, game: cached.game, scenario: JSON.parse(cached.scenario_json) });
    }

    // Generate on first request of the day
    const seed = getTodaySeed();
    const game = ALL_GAMES[seed % ALL_GAMES.length];
    const spec = GAME_PROMPTS[game];

    let scenario: any = null;
    try {
      const completion = await getGroq().chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: spec.system + '\n\nRespond with ONLY valid JSON, no markdown fences, no commentary.' },
          { role: 'user', content: spec.prompt }
        ],
        max_tokens: 2000,
        temperature: 0.7
      });
      scenario = JSON.parse(cleanJson(completion.choices[0]?.message?.content || '{}'));
    } catch {
      scenario = { note: 'generation failed' };
    }

    // Cache it
    db.prepare('INSERT OR REPLACE INTO daily_challenge (date, game, scenario_json) VALUES (?, ?, ?)')
      .run(dateStr, game, JSON.stringify(scenario));

    res.json({ date: dateStr, game, scenario });
  } catch (error) {
    console.error('Daily challenge error:', error);
    res.status(500).json({ error: 'Failed to fetch daily challenge.' });
  }
});

export { router as dailyRouter };