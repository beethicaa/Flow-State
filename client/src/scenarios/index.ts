// === TEMPLATE DATA for randomized prompt modifiers ===
// These widen the question library by randomly selecting diverse prompt modifiers

const MODIFIERS = [
  'Make the product feel real — pick an actual company category and realistic scale numbers.',
  'Add a surprising secondary metric that most candidates would miss but a strong PM would catch.',
  'Bake in a subtle political constraint — the VPs disagree, one stakeholder is being unreasonable, etc.',
  'Include a concrete number or percentage somewhere that sharpens the scenario.',
  'Add context that makes the "obvious" answer slightly wrong — create a real trade-off.',
  'Make the constraint non-obvious — don\'t say "time is tight," show it through the scenario details.',
  'Add a competitor dimension — what is a rival doing that shifts the calculus?',
  'Include a data signal that points in the opposite direction from the headline metric.',
  'Make the setting current — 2025 tech landscape, modern PM practices, realistic team sizes.',
  'Add a customer segment detail that changes the right answer (e.g. enterprise vs. self-serve).',
  'Include a realistic budget or headcount constraint that materially changes the decision.',
  'Make the wording feel like an actual Slack thread / email chain / dashboard alert, not a textbook.',
];

const RATIONALE_STYLES = [
  'Focus on reasoning over recall. The strongest answers connect the metric to real user behavior.',
  'Prioritize actionable insights over theoretical frameworks.',
  'Reward structured thinking — a clear framework applied imperfectly beats a wild guess.',
  'Make the "why" more important than the "what." A justified wrong pick beats an unjustified right pick.',
  'Add a layer where the candidate has to explain their reasoning to a skeptical engineer.',
];

export function randomModifier(): string {
  return MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];
}

export function randomRationaleStyle(): string {
  return RATIONALE_STYLES[Math.floor(Math.random() * RATIONALE_STYLES.length)];
}