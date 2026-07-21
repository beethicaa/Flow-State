// === CLIENT-SIDE GENERATION — no external APIs ===
// Uses curated scenario pools + randomized prompt modifiers
// Fully offline-capable, zero latency, zero cost.

import { useState, useCallback } from 'react';
import { pickForPool } from '../scenarios/index';

interface GenerateOptions {
  system: string;
  prompt: string;
  pool?: string;
}

function getTier(): number {
  try {
    const raw = localStorage.getItem('flowstate_profile');
    if (!raw) return 0;
    const p = JSON.parse(raw);
    const xp = p.xp || 0;
    if (xp >= 3200) return 6;
    if (xp >= 2200) return 5;
    if (xp >= 1400) return 4;
    if (xp >= 800) return 3;
    if (xp >= 400) return 2;
    if (xp >= 150) return 1;
    return 0;
  } catch {
    return 0;
  }
}

export function useGenerate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);

  const reset = useCallback(() => {
    setError(null);
    setErrorType(null);
  }, []);

  const generate = useCallback(async (_opts: GenerateOptions): Promise<any> => {
    setLoading(true);
    setError(null);
    setErrorType(null);

    // Tiny delay so loading states flash briefly
    await new Promise(r => setTimeout(r, 80));
    setLoading(false);

    // GRADE/EVAL calls: return null so the game's own fallback grading is used.
    // This avoids content-based keyword routing accidentally matching scenario
    // pools and returning wrong-shaped data (e.g. a Scenario object instead of a Grade).
    if (_opts.pool === 'grade') {
      return null;
    }

    try {
      const tier = getTier();
      const poolKey = _opts.pool || '';

      const sys = (_opts.system || '').toLowerCase();
      const prompt = (_opts.prompt || '').toLowerCase();

      // Map to pool keys
      if (poolKey === 'metrics' || sys.includes('analytics case') || sys.includes('diagnostic') || sys.includes('root cause') || (prompt.includes('options') && prompt.includes('correct'))) {
        return pickForPool('metrics', tier);
      }
      if (poolKey === 'guesstimate' || sys.includes('fermi') || sys.includes('estimation') || sys.includes('referenceanswer') || sys.includes('referencemethod')) {
        return pickForPool('guesstimate', tier);
      }
      if (poolKey === 'prioritize' || sys.includes('backlog') || sys.includes('ranking') || sys.includes('priorit')) {
        return pickForPool('prioritize', tier);
      }
      if (poolKey === 'productSense' || sys.includes('product sense') || sys.includes('design a feature') || (sys.includes('prompt') && prompt.includes('context'))) {
        return pickForPool('productSense', tier);
      }
      if (poolKey === 'abTest' || sys.includes('experiment') || sys.includes('ab test') || sys.includes('a/b') || sys.includes('autopsy')) {
        return pickForPool('abTest', tier);
      }
      if (poolKey === 'crisis' || sys.includes('incident') || sys.includes('blast radius') || sys.includes('crisis')) {
        return pickForPool('crisis', tier);
      }
      if (poolKey === 'northStar' || sys.includes('north star') || sys.includes('business model') || (prompt.includes('candidates') && !prompt.includes('skeptic'))) {
        return pickForPool('northStar', tier);
      }
      if (poolKey === 'standoff' || sys.includes('standoff') || sys.includes('stakeholder')) {
        if (prompt.includes('debrief') || prompt.includes('final trust')) {
          return { deEscalation: 20, transparency: 25, outcome: 18, judgmentScore: 63, debrief: 'You navigated the conversation thoughtfully. The strongest responses address the real concern, not just the surface complaint.' };
        }
        return pickForPool('standoff', tier);
      }
      if (poolKey === 'interview' || sys.includes('user interview') || sys.includes('transcript') || prompt.includes('interviewer')) {
        return pickForPool('interview', tier);
      }
      if (poolKey === 'scope' || sys.includes('scope') || sys.includes('engineer estimate') || prompt.includes('engineerestimate')) {
        return pickForPool('scope', tier);
      }
      if (poolKey === 'queryQuest' || sys.includes('query') || sys.includes('sql') || sys.includes('bugtype')) {
        return pickForPool('queryQuest', tier);
      }
      if (poolKey === 'postmortem' || sys.includes('postmortem') || sys.includes('post-mortem') || prompt.includes('whatwentwrong')) {
        return pickForPool('postmortem', tier);
      }
      if (poolKey === 'trustSafety' || sys.includes('trust') || sys.includes('safety') || sys.includes('moderation')) {
        return pickForPool('trustSafety', tier);
      }

      // Default fallback
      return pickForPool('metrics', tier);
    } catch (e) {
      setError('Could not generate scenario. Try again.');
      setErrorType('fallback');
      return null;
    }
  }, []);

  return { loading, error, errorType, generate, reset };
}