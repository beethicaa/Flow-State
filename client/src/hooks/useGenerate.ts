import { useState, useRef, useCallback } from 'react';
import { randomModifier } from '../scenarios/index';

interface GenerateOptions {
  system: string;
  prompt: string;
}

function getDifficulty(): number {
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
  const aborterRef = useRef<AbortController | null>(null);
  const inflightRef = useRef(false);

  const reset = useCallback(() => {
    setError(null);
    setErrorType(null);
  }, []);

  const generate = useCallback(async (opts: GenerateOptions): Promise<any> => {
    if (inflightRef.current) return null;
    if (aborterRef.current) aborterRef.current.abort();

    const controller = new AbortController();
    aborterRef.current = controller;
    inflightRef.current = true;
    setLoading(true);
    setError(null);
    setErrorType(null);

    try {
      const diff = getDifficulty();
      const labels = ['beginner-friendly Associate PM level', 'Product Manager level', 'Senior PM level', 'Group PM level', 'Director of Product level', 'VP of Product level', 'Chief Product Officer level'];
      const systemWithDiff = opts.system + `\n\nPlayer tier: ${labels[diff]}. Make this scenario appropriately ${diff <= 1 ? 'straightforward with clear signals' : diff <= 3 ? 'nuanced with competing trade-offs and ambiguity' : 'complex with subtle traps, multi-stakeholder politics, and no obvious answer'}.`;
      const modifier = randomModifier();
      const body = { system: systemWithDiff, prompt: opts.prompt + '\n\nAdditional instruction: ' + modifier };

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      const data = await res.json();

      if (!res.ok) {
        const type = data.errorType || 'network';
        const messages: Record<string, string> = {
          rate_limited: 'A lot of requests right now — give it a few seconds.',
          invalid_response: 'That one didn\'t generate cleanly — try again.',
          timeout: 'The generation timed out. Try a simpler prompt or try again.',
          network: 'Could not reach the server. Check your connection.',
          invalid_request: 'Something was wrong with the request. Let\'s try again.'
        };
        throw { errorType: type, message: messages[type] || 'Failed to generate.' };
      }

      inflightRef.current = false;
      setLoading(false);
      return data.result;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        inflightRef.current = false;
        setLoading(false);
        return null;
      }
      const type = err?.errorType || 'network';
      const msg = err?.message || 'Failed to generate scenario.';
      setError(msg);
      setErrorType(type);
      inflightRef.current = false;
      setLoading(false);
      return null;
    }
  }, []);

  return { loading, error, errorType, generate, reset };
}