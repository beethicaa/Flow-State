import { useState, useRef, useCallback } from 'react';

interface GenerateOptions {
  system: string;
  prompt: string;
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
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts),
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