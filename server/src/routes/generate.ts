import { Router, Request, Response } from 'express';
import Groq from 'groq-sdk';

const router = Router();

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

router.post('/', async (req: Request, res: Response) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const { system, prompt } = req.body;
    if (!system || !prompt) {
      return res.status(400).json({ error: 'Missing system or prompt', errorType: 'invalid_request' });
    }

    const fullSystem = system + '\n\nRespond with ONLY valid JSON, no markdown fences, no commentary.';
    const groqClient = getGroq();
    let lastError: any;

    // Retry up to 3 times with exponential backoff
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        const delay = [500, 1500, 3000][attempt - 1] || 3000;
        await sleep(delay);
      }

      try {
        // --- First pass: generate ---
        const completion = await groqClient.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: fullSystem },
            { role: 'user', content: prompt }
          ],
          max_tokens: 2000,
          temperature: 0.7
        });

        let content = completion.choices[0]?.message?.content || '';
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        try {
          const parsed = JSON.parse(content);
          clearTimeout(timeout);
          return res.json({ result: parsed });
        } catch {
          // Repair pass: send invalid text back
          const repairCompletion = await groqClient.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: fullSystem },
              { role: 'user', content: prompt },
              { role: 'user', content: `This is not valid JSON: ${content}. Return the corrected JSON only.` }
            ],
            max_tokens: 2000,
            temperature: 0.5
          });

          let repairContent = repairCompletion.choices[0]?.message?.content || '';
          repairContent = repairContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

          try {
            const parsed = JSON.parse(repairContent);
            clearTimeout(timeout);
            return res.json({ result: parsed });
          } catch {
            // Repair also failed — continue to retry
            lastError = 'invalid_response';
            continue;
          }
        }
      } catch (error: any) {
        if (error?.status === 429 || error?.code === 'rate_limit_exceeded') {
          lastError = 'rate_limited';
          continue;
        }
        if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT' || error?.code === 'UND_ERR_ABORTED') {
          lastError = 'network';
          continue;
        }
        lastError = 'network';
        continue;
      }
    }

    clearTimeout(timeout);
    return res.status(502).json({
      error: 'Failed to generate after retries.',
      errorType: lastError || 'invalid_response'
    });

  } catch (error) {
    clearTimeout(timeout);
    console.error('Generate error:', error);
    return res.status(500).json({ error: 'Failed to generate scenario.', errorType: 'network' });
  }
});

export { router as generateRouter };