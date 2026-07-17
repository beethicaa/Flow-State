// === TEMPLATE-BASED GENERATION (no API calls) ===
// All scenario generation is now client-side via curated template pools.
// This hook still provides the same interface but returns instantly.

import { useState, useCallback } from 'react';

interface GenerateOptions {
  system: string;
  prompt: string;
}

export function useGenerate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);

  const reset = useCallback(() => {
    setError(null);
    setErrorType(null);
  }, []);

  const generate = useCallback(async (opts: GenerateOptions): Promise<any> => {
    setLoading(true);
    setError(null);
    setErrorType(null);

    // Simulate a tiny delay so loading states flash briefly (good UX)
    await new Promise(r => setTimeout(r, 100));

    setLoading(false);

    // Parse the system prompt to determine which game generator to use
    const sys = opts.system.toLowerCase();

    // Dynamic import of scenario generators
    const scenarios = await import('../scenarios/index');

    try {
      if (sys.includes('analytics case') || sys.includes('diagnostic') || sys.includes('metric')) {
        return scenarios.generateMetricsDetective();
      }
      if (sys.includes('fermi') || sys.includes('estimation') || sys.includes('guess') || sys.includes('guesstimate')) {
        return scenarios.generateGuesstimate();
      }
      if (sys.includes('backlog') || sys.includes('priorit')) {
        return scenarios.generatePrioritize();
      }
      if (sys.includes('experiment') || sys.includes('ab test') || sys.includes('autopsy')) {
        return scenarios.generateABTest();
      }
      if (sys.includes('incident') || sys.includes('crisis') || sys.includes('p0')) {
        return scenarios.generateCrisis();
      }
      if (sys.includes('north star') || sys.includes('business model') || sys.includes('metric selection')) {
        return scenarios.generateNorthStar();
      }
      if (sys.includes('stakeholder') || sys.includes('standoff') || sys.includes('influence')) {
        return scenarios.generateStandoff();
      }

      // Default — return a generic metrics detective scenario as fallback
      return scenarios.generateMetricsDetective();
    } catch (e) {
      setError('Could not generate scenario. Try again.');
      setErrorType('fallback');
      return null;
    }
  }, []);

  return { loading, error, errorType, generate, reset };
}