// === SHARED DATA POOLS for template-based scenario generation ===
// No API calls, fully client-side, zero latency

import { shuffle } from '../constants';

// --- Tech products / companies ---
export const PRODUCTS = [
  'Swiggy', 'Uber', 'Notion', 'Figma', 'Stripe', 'Airbnb', 'Spotify', 'Duolingo',
  'Robinhood', 'Calm', 'Canva', 'Zoom', 'Slack', 'Netflix', 'DoorDash', 'Instacart',
  'Peloton', 'Substack', 'Loom', 'Linear', 'Ramp', 'Brex', 'Vercel',
  'Supabase', 'Intercom', 'Monday.com', 'Airtable', 'Webflow', 'Replika'
];

export const METRICS = [
  'Weekly Active Users', 'Daily Active Users', 'Conversion Rate', 'Retention Rate (D7)',
  'Monthly Recurring Revenue', 'Average Revenue Per User', 'Customer Acquisition Cost',
  'Net Promoter Score', 'Churn Rate', 'Time to First Value', 'Session Duration',
  'Feature Adoption Rate', 'Support Ticket Volume', 'Page Load Time (P95)',
  'Checkout Completion Rate', 'Search Success Rate', 'Referral Rate',
  'Daily Sessions per User', 'Paying User Conversion', 'Bounce Rate'
];

export const PRODUCT_METRICS = [
  { product: 'Swiggy', metric: 'Order Completion Rate', change: 'down 12%', context: 'Users are adding items to cart but dropping off at payment. The drop is concentrated in tier-2 cities. Average order value is unchanged.' },
  { product: 'Uber', metric: 'Weekly Active Riders', change: 'down 8%', context: 'Rider growth has stagnated in mid-sized markets. Trip frequency among existing users is flat, but new rider acquisition has slowed. Surge pricing revenue is up 3%.' },
  { product: 'Notion', metric: 'Feature Adoption Rate', change: 'down 22%', context: 'The new AI writing features are only being used by 8% of users. The power-user segment (20% of users) shows no change, but casual users are not engaging. The AI button is buried in the formatting toolbar.' },
  { product: 'Figma', metric: 'Daily Active Users', change: 'down 5%', context: 'Usage dropped after the new pricing tier announcement. The decline is concentrated among teams on the free tier. Enterprise DAU is stable. Community plugin usage is actually up 12%.' },
  { product: 'Stripe', metric: 'Payment Success Rate', change: 'down 2.3%', context: 'The drop is heavily concentrated in the APAC region, specifically for card-not-present transactions. The decline started after a recent 3DS upgrade. Error messages have increased by 15%.' },
  { product: 'Airbnb', metric: 'Booking Conversion Rate', change: 'down 9%', context: 'More users are searching but fewer are booking. The drop is steepest for stays 7+ nights. Price-filter usage is up 40%, suggesting price sensitivity. Instant Book rates are unchanged.' },
  { product: 'Spotify', metric: 'Premium Conversion Rate', change: 'down 6%', context: 'Free-tier users are listening more but upgrading less. The decline is steepest in the 18-24 demographic. Podcast consumption is up 30%. Student plan conversions are stable.' },
  { product: 'Duolingo', metric: 'Daily Active Users', change: 'down 11%', context: 'The decline follows the removal of the competitive leaderboards. User sessions are shorter by 2 minutes on average. Streak retention is actually up 5%. Lesson completion rate is flat.' },
  { product: 'Robinhood', metric: 'New Account Funding Rate', change: 'down 25%', context: 'Users are signing up but not depositing funds. Web traffic is up 10%, suggesting interest exists. The drop correlates with a competitor offering a 3% cash-back promotion. The referral program has declined 18%.' },
  { product: 'Calm', metric: 'Subscription Retention (D30)', change: 'down 14%', context: 'Users are churning in the second week of their free trial. The daily reminder notifications have an opt-out rate of 68%. Sleep stories have the highest completion rate. The meditation timer feature has low awareness.' },
  { product: 'DoorDash', metric: 'Average Order Value', change: 'down 7%', context: 'Average basket size has decreased. Fewer users are adding drinks and sides. Promotional usage is up 25%. The new "saver" delivery option has 12% take-rate. Restaurant selection is unchanged.' },
  { product: 'Canva', metric: 'Team Invite Acceptance Rate', change: 'down 18%', context: 'More team invites are being sent but fewer accepted. The drop is concentrated in teams with 5+ members. Enterprise SSO users have 90% acceptance. Brand kit usage correlates with higher acceptance.' },
];

// --- Metrics Detective ---
export function generateMetricsDetective() {
  const pm = PRODUCT_METRICS[Math.floor(Math.random() * PRODUCT_METRICS.length)];

  const wrong: { text: string; note: string; correct: false }[] = [
    { text: `A recent UI change to the checkout flow increased friction for returning users`, note: 'No UI changes were deployed during this period.', correct: false },
    { text: `Increased competition from a direct competitor running aggressive promotions`, note: 'The competitor\'s promotion is in a different market segment.', correct: false },
    { text: `A background migration caused analytics instrumentation to miss events`, note: 'Event capture rate is at 99.9%. Data pipeline is fully redundant.', correct: false },
    { text: `New mobile OS privacy changes reduced tracking accuracy for attribution`, note: 'The drop is in active usage, not reported traffic.', correct: false },
    { text: `An A/B test on the pricing page was inadvertently ramped to 100% of traffic`, note: 'No pricing experiments were active this period.', correct: false },
    { text: `A third-party payment provider experienced regional latency issues`, note: 'Payment provider uptime was 99.5%. No regional degradation.', correct: false },
    { text: `Seasonal dip following a major holiday promotion pulled demand forward`, note: 'This decline is 3x larger than the same period last year.', correct: false },
    { text: `A server-side caching bug served stale data to a subset of users`, note: 'The bug affected read speeds for a small percentage only.', correct: false },
  ];

  const correct: { text: string; note: string; correct: true }[] = [
    { text: `A silent deploy of a new SDK introduced a 300ms delay on the confirmation page`, note: 'Rolled out without gradual ramp. The delay pushed page load past the patience threshold during the critical confirmation step.', correct: true },
    { text: `The recommendation algorithm was retrained on a dataset that downweighted high-engagement categories`, note: 'Production monitoring didn\'t flag it because click-through rates remained flat — only the downstream conversion dropped.', correct: true },
    { text: `A CDN config change reduced image compression quality for slower connections`, note: 'WiFi users were unaffected so internal testing missed it. Mobile data users saw 2-4s additional load time.', correct: true },
  ];

  const pool = shuffle([...wrong.slice(0, 3), correct[Math.floor(Math.random() * correct.length)]]);
  const correctIndex = pool.findIndex(o => o.correct);

  return {
    product: pm.product, metric: pm.metric, metricChange: pm.change, context: pm.context,
    options: pool.map(o => ({ text: o.text, note: o.note })),
    correctIndex,
    getXp: (i: number) => i === correctIndex ? 30 : 10
  };
}

// --- Guesstimate ---
const GUESSTIMATES = [
  {
    question: 'How many cups of coffee are consumed in New York City every day?',
    reference: '~5-6 million',
    approach: 'NYC has ~8.5M people. ~65% drink coffee at ~1.5 cups/day. ~8.3M cups served across 2,000+ coffee shops, delis, and offices. Add tourists (+20%) and home brewing. Daily total comes to about 5-6 million cups.',
    ranges: [
      { min: 0, max: 100000, label: 'Way off', xp: 5 },
      { min: 100000, max: 3000000, label: 'In the ballpark', xp: 15 },
      { min: 3000000, max: 10000000, label: 'Close range', xp: 25 },
      { min: 10000000, max: 50000000, label: 'In the ballpark', xp: 15 },
      { min: 50000000, max: Infinity, label: 'Way off', xp: 5 },
    ]
  },
  {
    question: 'How many miles of pizza are sold in the US each year?',
    reference: '~18 million miles',
    approach: 'Americans eat ~350 slices per second = 11B slices/year. Average slice ~10 inches. 11B × 10in = ~1.74M miles. Add frozen pizza and full pies (14-inch dia = 44 inch circumference). Total is about 18-20 million miles annually.',
    ranges: [
      { min: 0, max: 100000, label: 'Way off', xp: 5 },
      { min: 100000, max: 5000000, label: 'In the ballpark', xp: 15 },
      { min: 5000000, max: 50000000, label: 'Close range', xp: 25 },
      { min: 50000000, max: 200000000, label: 'In the ballpark', xp: 15 },
      { min: 200000000, max: Infinity, label: 'Way off', xp: 5 },
    ]
  },
  {
    question: 'How many photos are uploaded to social media platforms worldwide every minute?',
    reference: '~7 million per minute',
    approach: 'WhatsApp: 4.5B/day = 3.1M/min. Instagram: 95M posts + 500M stories/day ≈ 413K/min. Snapchat: 5B/day = 3.5M/min. Facebook: 350M/day = 243K/min. TikTok: 1.5B/month ≈ 34K/min. Total is about 7.3 million per minute.',
    ranges: [
      { min: 0, max: 100000, label: 'Way off', xp: 5 },
      { min: 100000, max: 1000000, label: 'In the ballpark', xp: 15 },
      { min: 1000000, max: 10000000, label: 'Close range', xp: 25 },
      { min: 10000000, max: 50000000, label: 'In the ballpark', xp: 15 },
      { min: 50000000, max: Infinity, label: 'Way off', xp: 5 },
    ]
  },
  {
    question: 'How many emails are sent globally every day?',
    reference: '~340 billion',
    approach: '~4.3B email users at ~120 emails/day = 516B. ~55% are spam/automated. Business = ~40%, personal = ~5%. Legitimate human-to-human: ~160B/day. Total including automated: ~340-350B.',
    ranges: [
      { min: 0, max: 1000000000, label: 'Way off', xp: 5 },
      { min: 1000000000, max: 50000000000, label: 'In the ballpark', xp: 15 },
      { min: 50000000000, max: 500000000000, label: 'Close range', xp: 25 },
      { min: 500000000000, max: Infinity, label: 'Way off', xp: 5 },
    ]
  },
  {
    question: 'How many words does the average person speak in a lifetime?',
    reference: '~860 million',
    approach: 'Average person speaks ~16,000 words/day × 365 days × 80 years = ~467M. Add phone calls, public speaking, social situations (+15%) = ~540M. Some estimates vary 500M-1B depending on profession and social habits.',
    ranges: [
      { min: 0, max: 10000000, label: 'Way off', xp: 5 },
      { min: 10000000, max: 100000000, label: 'In the ballpark', xp: 15 },
      { min: 100000000, max: 2000000000, label: 'Close range', xp: 25 },
      { min: 2000000000, max: Infinity, label: 'Way off', xp: 5 },
    ]
  },
  {
    question: 'How many Google searches happen worldwide every day?',
    reference: '~8.5 billion',
    approach: 'Google processes ~99,000 searches/second. 99,000 × 86,400 seconds = 8.5B/day. Desktop ≈ 45%, mobile ≈ 55%. Peak hours see 4-5x average traffic. Google has ~92% global market share.',
    ranges: [
      { min: 0, max: 100000000, label: 'Way off', xp: 5 },
      { min: 100000000, max: 1000000000, label: 'In the ballpark', xp: 15 },
      { min: 1000000000, max: 20000000000, label: 'Close range', xp: 25 },
      { min: 20000000000, max: Infinity, label: 'Way off', xp: 5 },
    ]
  }
];

export function generateGuesstimate() {
  const g = GUESSTIMATES[Math.floor(Math.random() * GUESSTIMATES.length)];
  return {
    question: g.question,
    reference: g.reference,
    approach: g.approach,
    ranges: g.ranges,
    getXp: (val: number) => {
      for (const r of g.ranges) {
        if (val >= r.min && val < (r.max ?? Infinity)) return r.xp;
      }
      return 5;
    },
    getLabel: (val: number) => {
      for (const r of g.ranges) {
        if (val >= r.min && val < (r.max ?? Infinity)) return r.label;
      }
      return 'Way off';
    }
  };
}

// === Backlog items for Prioritize This ===
const BACKLOG_ITEMS = [
  { title: 'Fix checkout crash on iOS 18', desc: 'Users on iOS 18 get a white screen at payment. Revenue impact: ~$40K/day. Engineering estimate: 3 days.', effortDays: 3, revenue: 40000, priority: 1 },
  { title: 'Dark mode support', desc: 'Top user request (12k upvotes). Engineering estimate: 8 days. No direct revenue impact.', effortDays: 8, revenue: 0, priority: 4 },
  { title: 'Referral program v2', desc: 'Double referral payout and add social sharing. Est: 10 days. Projected 15% acquisition lift.', effortDays: 10, revenue: 0, priority: 3 },
  { title: 'GDPR compliance audit', desc: 'Legal requirement for EU expansion. Deadline: 6 weeks. Estimated cost of non-compliance: €20M.', effortDays: 5, revenue: 0, priority: 4 },
  { title: 'API rate limiter for 3rd parties', desc: 'Top customer from Enterprise plan threatening to churn ($500K ARR) if limits aren\'t raised.', effortDays: 2, revenue: 500000, priority: 2 },
  { title: 'Performance optimization', desc: 'P95 page load increased from 1.2s to 3.8s after last deploy. SEO rankings dropping.', effortDays: 4, revenue: 0, priority: 1 },
  { title: 'New onboarding flow', desc: 'Current onboarding has 68% drop-off at step 3. Redesign expected to improve activation by 20%.', effortDays: 14, revenue: 30000, priority: 2 },
  { title: 'Export to PDF feature', desc: 'Sales team needs this for 3 enterprise deals in pipeline ($1.2M total). Estimate: 6 days.', effortDays: 6, revenue: 1200000, priority: 2 },
  { title: 'Security patch for Redis vulnerability', desc: 'CVE-2024-25617 requires immediate upgrade. Exploitation in the wild detected.', effortDays: 1, revenue: 0, priority: 1 },
  { title: 'Team dashboard v2', desc: 'Usage data shows team dashboards drive 40% higher retention. Redesign based on user research.', effortDays: 12, revenue: 0, priority: 3 },
];

const CONSTRAINTS = [
  { text: 'You have 2 engineers available this sprint. Only 2 items can ship this week. Choose the highest-value pair.', ideal: [0, 6, 5] },
  { text: 'A major investor demo is in 5 days. Ship the items that will make the best impression.', ideal: [0, 8] },
  { text: 'Quarterly OKRs depend on improving activation and retention. Prioritize accordingly.', ideal: [6, 5] },
  { text: 'Legal deadline for GDPR compliance is approaching. Factor in required work.', ideal: [3, 7, 0] },
  { text: 'The CTO is concerned about technical debt. One item must address infrastructure risk.', ideal: [8, 5] },
];

export function generatePrioritize() {
  const count = 5;
  const items = shuffle(BACKLOG_ITEMS).slice(0, count).map((item, i) => ({ ...item, id: i }));
  const constraint = CONSTRAINTS[Math.floor(Math.random() * CONSTRAINTS.length)];
  return { items, constraint, idealIds: constraint.ideal };
}

// === A/B Test Autopsy ===
const AB_SCENARIOS = [
  {
    variantA: { label: 'Control (A)', users: 50000, conversions: 5200, rate: '10.40%' },
    variantB: { label: 'Variant (B)', users: 49800, conversions: 5390, rate: '10.82%' },
    pValue: '0.042',
    guardrails: [
      { metric: 'Page load time (P95)', control: '1.2s', variant: '1.4s', concern: true, explanation: '17% slower. For a statistically significant conversion lift of only 0.42pp, the page speed regression is expensive in terms of SEO and user experience.' },
      { metric: 'Refund rate', control: '2.1%', variant: '2.0%', concern: false },
      { metric: 'Error rate', control: '0.3%', variant: '0.9%', concern: true, explanation: 'Error rate tripled. This suggests the variant has reliability issues that could compound over time.' },
    ],
    correctAnswer: 'ship_guardrail',
    correctLabel: 'Ship with a guardrail fix first',
    explanation: 'The conversion lift is statistically significant (p=0.042, <0.05) but the guardrail metrics tell a different story. Page load time regressed by 17% and error rate tripled. A careful PM would ship the conversion win only after fixing these regressions, not before. The practical significance of a 0.42pp lift is undermined if it comes at the cost of reliability.',
    trap: 'The headline conversion lift looks good, but the guardrail regressions are real — the p-value only tests your primary metric, not side effects.'
  },
  {
    variantA: { label: 'Control (A)', users: 120000, conversions: 9600, rate: '8.00%' },
    variantB: { label: 'Variant (B)', users: 119500, conversions: 9630, rate: '8.06%' },
    pValue: '0.63',
    guardrails: [
      { metric: 'Avg. session time', control: '4.2min', variant: '4.1min', concern: false },
      { metric: 'Support tickets/1000 users', control: '3.4', variant: '3.5', concern: false },
    ],
    correctAnswer: 'kill',
    correctLabel: 'Kill it',
    explanation: 'p=0.63 means there\'s a 63% chance this result is random noise. The 0.06pp lift is statistically indistinguishable from zero. Running it longer won\'t help — with 120K users per variant, this experiment is already well-powered. Ship nothing.',
    trap: 'B is technically higher, but the confidence is extremely low. A classic "don\'t ship noise" trap.'
  },
  {
    variantA: { label: 'Control (A)', users: 15000, conversions: 450, rate: '3.00%' },
    variantB: { label: 'Variant (B)', users: 15100, conversions: 510, rate: '3.38%' },
    pValue: '0.055',
    guardrails: [
      { metric: 'Bounce rate', control: '28%', variant: '27%', concern: false },
      { metric: 'API latency', control: '210ms', variant: '215ms', concern: false },
    ],
    correctAnswer: 'run_longer',
    correctLabel: 'Run it longer',
    explanation: 'p=0.055 is tantalizingly close to 0.05 but not quite there. At 15K users, the experiment may be underpowered for this effect size. Instead of shipping or killing, increase sample size to 30K+ users per variant. If the trend holds, you\'ll likely reach significance.',
    trap: 'The lift is compelling enough to want to ship, but the confidence interval is still too wide. Patience is the right call here.'
  },
  {
    variantA: { label: 'Control (A)', users: 80000, conversions: 12800, rate: '16.00%' },
    variantB: { label: 'Variant (B)', users: 80200, conversions: 13090, rate: '16.32%' },
    pValue: '0.038',
    guardrails: [
      { metric: 'Revenue per user', control: '$4.10', variant: '$4.05', concern: true, explanation: 'Conversion is up 0.32pp but revenue per user is down $0.05. The variant may be attracting lower-quality users or discount-seekers.' },
      { metric: 'Add-to-cart rate', control: '34%', variant: '33%', concern: false },
    ],
    correctAnswer: 'ship',
    correctLabel: 'Ship it',
    explanation: 'Statistically significant lift (p=0.038) with no material guardrail concerns. The revenue-per-user dip of ~1.2% is within normal variance and worth monitoring, but doesn\'t warrant blocking. Clean ship.',
    trap: 'No real trap here — just make sure you monitor revenue per user post-launch.'
  },
  {
    variantA: { label: 'Control (A)', users: 100000, conversions: 8500, rate: '8.50%' },
    variantB: { label: 'Variant (B)', users: 99800, conversions: 9020, rate: '9.04%' },
    pValue: '0.003',
    guardrails: [
      { metric: 'Customer support CSAT', control: '4.2/5', variant: '3.1/5', concern: true, explanation: 'CSAT dropped from 4.2 to 3.1 — a massive 26% decline in satisfaction. Users may be converting more but leaving unhappy.' },
      { metric: 'Returning visitor rate (D7)', control: '34%', variant: '38%', concern: false },
    ],
    correctAnswer: 'ship_guardrail',
    correctLabel: 'Ship with a guardrail fix first',
    explanation: 'The 0.54pp conversion lift is highly significant (p=0.003) and D7 return rate is up. But CSAT cratered. This pattern suggests the variant pushes users through conversion at the cost of experience quality. Ship the conversion improvement but fix the CSAT issue first (likely a misleading UI element).',
    trap: 'The strong p-value and positive return rate mask a serious satisfaction problem. Don\'t optimize for conversion if it destroys trust.'
  },
];

export function generateABTest() {
  const s = AB_SCENARIOS[Math.floor(Math.random() * AB_SCENARIOS.length)];
  return {
    ...s,
    getXp: (answer: string) => answer === s.correctAnswer ? 30 : 10
  };
}

// === Crisis Console ===
const CRISIS_INCIDENTS = [
  {
    title: 'Checkout payment failure cascade',
    description: '12% of checkout traffic failing with timeout errors. Payment gateway reporting 5x normal error rate. Blast radius: $15K/hr revenue impact. Support tickets spiking +400%.',
    signals: [
      'Payment gateway status page shows green (operational)',
      'Internal timeout threshold was lowered from 10s to 3s in last week\'s deploy',
      'Database connection pool is at 95% utilization',
      'Load balancer reports 0.2% 503 rate (within normal range)'
    ],
    steps: [
      {
        prompt: 'What\'s your first move?',
        choices: [
          { text: 'Rollback the timeout threshold change immediately', correct: true, next: 2, explanation: 'The timeout change is the most likely culprit — reverting it restores the buffer that was masking latency issues.' },
          { text: 'Page more engineers: frontend, backend, and infrastructure', correct: false, next: 3, explanation: 'Wastes critical minutes. A single root cause is most likely. Paging everyone creates noise, not clarity.' },
          { text: 'Send a status page update saying "we\'re investigating"', correct: false, next: 3, explanation: 'Communicating is good, but 5 more minutes of $15K/hr revenue loss while composing an update is expensive. Fix first, then communicate.' },
          { text: 'Restart the payment gateway service', correct: false, next: 3, explanation: 'The gateway itself reports green. Restarting won\'t help if the issue is your timeout config.' },
        ]
      },
      {
        prompt: 'The rollback is deployed. Error rate dropped to 2%. The payment gateway is now showing yellow status. Do you:',
        choices: [
          { text: 'Send an incident update: "Root cause identified and mitigated. Monitoring closely."', correct: true, next: 4, explanation: 'Honest, timely, specific. Stakeholders don\'t need more detail yet. They need confidence the problem is handled.' },
          { text: 'Wait until error rate hits 0% before saying anything', correct: false, next: 4, explanation: 'Silence is the worst communication failure in incidents. Your stakeholders are already wondering what\'s happening.' },
          { text: 'Send a postmortem analysis to the whole company now', correct: false, next: 4, explanation: 'Too premature. You don\'t have full root cause yet. Postmortems are for after the incident, not during.' },
        ]
      },
      {
        prompt: 'Timer expired. The investigation stalled while you debated next steps.',
        choices: [
          { text: 'Reassess: timeout change was the most recent deploy. Roll it back.', correct: true, next: 4, explanation: 'The correct action all along. Indecision is a real failure mode in incidents. Always revert the most recent change first.' },
          { text: 'Declare a major incident and call in the VP of Engineering', correct: false, next: 4, explanation: 'Escalating without a diagnosis just moves the indecision up the chain.' },
          { text: 'Restart everything: load balancers, app servers, DB', correct: false, next: 4, explanation: 'Shotgun approach. You\'ll disturb unrelated systems and make the problem harder to diagnose.' },
        ]
      },
    ],
    finalDebrief: 'The timeout threshold change was the root cause. It took 18 minutes total to resolve once the rollback was applied. Revenue loss: ~$4,500. The real failure was the lack of a staged rollout — this change should have been monitored before reaching 100%.'
  },
  {
    title: 'Database replication lag breach',
    description: 'User-facing dashboard showing stale data (30+ min delay). Data team reports replication lag spiked after a schema migration. Affected: all reporting features (~60% of traffic).',
    signals: [
      'Schema migration added a new index to the largest table (2.1B rows)',
      'Read replicas show 28 min lag (critical threshold: 5 min)',
      'Primary DB CPU at 98%, replicas at 45%',
      'Alert was suppressed during maintenance window (ended 1hr ago)'
    ],
    steps: [
      {
        prompt: 'The replication lag is growing. What\'s your call?',
        choices: [
          { text: 'Pause the index creation and let replication catch up', correct: true, next: 2, explanation: 'The migration is the obvious cause. Online index creation on a 2.1B-row table is I/O heavy. Pausing it lets replicas recover.' },
          { text: 'Fail over to a read replica and direct all traffic there', correct: false, next: 3, explanation: 'The replicas have the same lag. Failing over doesn\'t help — they\'re behind too.' },
          { text: 'Increase replica count from 3 to 6', correct: false, next: 3, explanation: 'Takes 20+ minutes to provision new replicas. The problem needs seconds, not minutes.' },
          { text: 'Ignore — the maintenance window ended but teams know about it', correct: false, next: 3, explanation: 'The alert was suppressed for too long. 30+ min of stale data is unacceptable for user-facing features.' },
        ]
      },
      {
        prompt: 'Index creation paused. Lag dropping (now 12 min and decreasing). Stakeholders are asking for an ETA. What do you say?',
        choices: [
          { text: '"Root cause identified (schema migration). Fix applied. Recovery in progress — estimated 8-10 min to full catch-up."', correct: true, next: 4, explanation: 'Specific, honest, gives confidence. Includes ETA based on current recovery rate.' },
          { text: '"We\'ll send an update when we know more."', correct: false, next: 4, explanation: 'Vague and unsatisfying. You DO know more — share what you know.' },
          { text: 'Post to status page: "Degraded performance — investigating"', correct: false, next: 4, explanation: 'Too generic. You\'ve already identified the cause. Update the status with your findings.' },
        ]
      },
    ],
    finalDebrief: 'The schema migration was performed during low traffic but the index creation on the orders table (2.1B rows) overwhelmed the primary\'s I/O capacity. The maintenance window suppression masked the alert escalation. Key lesson: online index operations on tables >500M rows should be batched or scheduled at different times. Re-engage the alert suppression policy.'
  },
  {
    title: 'SSO authentication outage',
    description: 'Enterprise users unable to log in. SSO provider returning 503s for SAML assertions. 200+ companies affected including 3 Fortune 500 accounts. SLA guarantee: 99.99% uptime.',
    signals: [
      'SSO provider status page: "Investigating increased error rates for SAML endpoints"',
      'Support flooded: 50+ tickets in 10 minutes',
      'Our SAML token cache expired 2 hours ago during routine maintenance',
      'Downgraded auth (email+password) still works for non-SSO users'
    ],
    steps: [
      {
        prompt: 'Enterprise SSO is down. What\'s the priority?',
        choices: [
          { text: 'Enable a bypass: temporarily allow enterprise users to sign in via email+password with manual domain verification', correct: true, next: 2, explanation: 'SSO is down and the provider is investigating. Give users a path back in while upstream fixes the issue. Manual domain verification is acceptable for a short window.' },
          { text: 'Page the SSO provider\'s support with P1 escalation', correct: false, next: 3, explanation: 'They already know. Your time is better spent on your own mitigation, not waiting on hold.' },
          { text: 'Send a blast email to all affected companies saying it\'s the provider\'s fault', correct: false, next: 3, explanation: 'Blaming the vendor doesn\'t help your users. Own the communication and provide a workaround.' },
          { text: 'Wait 15 minutes — the provider often recovers automatically', correct: false, next: 3, explanation: 'Each minute of downtime affects hundreds of paying customers. Passive waiting is not a plan.' },
        ]
      },
      {
        prompt: 'The bypass is live. Enterprise users are back in via email auth. SSO provider ETA: 2 hours. Do you:',
        choices: [
          { text: 'Communicate: "We\'ve enabled a temporary login bypass for enterprise accounts. SSO expected to recover within 2 hours. Affected accounts: 200 companies."', correct: true, next: 4, explanation: 'Transparent, actionable, specific. Users know what to do and what to expect.' },
          { text: 'Don\'t announce the bypass — just let users discover it if they try logging in', correct: false, next: 4, explanation: 'Users are stuck. They won\'t retry unless they know it works. Announce it on the status page and via email.' },
          { text: 'Wait until SSO is fully restored, then explain everything', correct: false, next: 4, explanation: 'Silent outage with known workaround is a waste of your users\' time.' },
        ]
      },
    ],
    finalDebrief: 'SSO provider had a SAML endpoint regression triggered by a certificate rotation. Our team handled it well: identified a bypass within 9 minutes, communicated within 12 minutes. The main improvement: pre-configure emergency auth bypasses for enterprise accounts so they require zero deploy time during an incident.'
  }
];

export function generateCrisis() {
  return CRISIS_INCIDENTS[Math.floor(Math.random() * CRISIS_INCIDENTS.length)];
}

// === North Star Navigator ===
const BUSINESS_MODELS = [
  {
    product: 'A subscription-based meditation app',
    model: 'Freemium with monthly/annual premium subscriptions ($12.99/mo). Revenue drivers: subscriber count, retention. Cost drivers: content production, cloud hosting, marketing CAC.',
    candidates: [
      { name: 'Monthly Active Users', description: 'Total users who complete at least one session per month', gamingRisk: 'Can be inflated by free users who never convert. Doesn\'t capture willingness to pay.', blindSpot: 'Doesn\'t differentiate between free and paid engagement.', ideal: false },
      { name: 'Premium Subscription Revenue', description: 'Total MRR from paying subscribers', gamingRisk: 'Can be increased by aggressive discounts that attract low-LTV users who churn quickly.', blindSpot: 'Lags behind user behavior by a month. Doesn\'t capture satisfaction.', ideal: false },
      { name: 'Session Completion Rate', description: '% of started sessions that users finish', gamingRisk: 'Easy to inflate by making sessions shorter. A 2-minute session is not the same as a 15-minute one.', blindSpot: 'A user who completes a session may still hate the app. Doesn\'t measure sentiment.', ideal: false },
      { name: '7-Day Streak Rate', description: '% of users who use the app 7 consecutive days', gamingRisk: 'Gamification can create fake engagement (opening app for 5 seconds to keep streak).', blindSpot: 'Doesn\'t capture depth of usage. A 7-day streaker could be doing the bare minimum.', ideal: true },
    ],
    idealPick: 3,
    bestMetric: '7-Day Streak Rate',
    bestReason: 'Meditation\'s value compounds with consistency. Streak rate directly measures habit formation — the core promise of the product. Revenue lags; MAU is too broad.',
    gamingExplanation: 'True — streaks can be gamed. But well-designed streak mechanics (imperfect days, streak freezes earned through actual use) mitigate this. Of all options, streak rate best proxies for real behavior change.'
  },
  {
    product: 'An ad-supported social video platform',
    model: 'Free tier with ads. Revenue from advertisers paying per-impression (CPM). Key levers: watch time, daily active users, ad inventory fill rate.',
    candidates: [
      { name: 'Daily Active Users', description: 'Users who open the app at least once per day', gamingRisk: 'A user who opens the app for 3 seconds counts as DAU. This is the most inflated metric in social media.', blindSpot: 'Quality of engagement. 10M DAU with 2 min avg. vs 5M DAU with 45 min avg. — which is healthier?', ideal: false },
      { name: 'Total Watch Time', description: 'Sum of all video watch time across the platform', gamingRisk: 'Easy to boost by auto-playing low-quality content or making the feed infinite. Users may be "watching" without caring.', blindSpot: 'Doesn\'t measure satisfaction. Users stuck in doom-scrolling aren\'t happy users.', ideal: true },
      { name: 'Ad Revenue Per 1K Views (CPM)', description: 'Revenue generated per thousand ad impressions', gamingRisk: 'Can be inflated by showing more ads per session at the cost of user experience. Harvesting today, destroying retention tomorrow.', blindSpot: 'Short-term optimization metric. Doesn\'t capture user health.', ideal: false },
      { name: 'Creator Payout Satisfaction', description: 'Survey score of creators satisfied with their earnings', gamingRisk: 'Creators are always dissatisfied. This metric can only go up if you overpay.', blindSpot: 'Important but niche. Doesn\'t cover the user side of the marketplace.', ideal: false },
    ],
    idealPick: 1,
    bestMetric: 'Total Watch Time',
    bestReason: 'For an ad-supported platform, watch time determines ad inventory and engagement. It balances satisfaction with business value.',
    gamingExplanation: 'Watch time can be gamed — but segmented by quality signals (completion rate, shares) it becomes robust. Pure DAU is worse.'
  },
  {
    product: 'A B2B project management SaaS tool',
    model: 'Per-seat subscription ($15/seat/mo). Teams of 5-50. Revenue = seats × ARPU. Growth driver: team adoption (land and expand).',
    candidates: [
      { name: 'Monthly Recurring Revenue', description: 'Sum of subscription revenue per month', gamingRisk: 'Can be boosted by discounting annual plans at the cost of long-term revenue.', blindSpot: 'Aggregate number that can grow even while satisfaction declines.', ideal: false },
      { name: 'Daily Active Users', description: 'Unique users who interact with the platform each day', gamingRisk: 'Can be inflated by unnecessary notifications.', blindSpot: 'Doesn\'t capture whether the user shipped work or just checked a box.', ideal: false },
      { name: 'Weekly Active Teams', description: 'Teams where 70%+ of members use the product at least 3 days/week', gamingRisk: 'Harder to game — requires team-level adoption.', blindSpot: 'Might be slow-moving week to week.', ideal: true },
      { name: 'Net Revenue Retention (NRR)', description: '% of revenue retained year-over-year, including expansions', gamingRisk: 'Can be inflated by price hikes that cause future churn.', blindSpot: 'Lags by 12 months. Too slow for weekly decisions.', ideal: false },
    ],
    idealPick: 2,
    bestMetric: 'Weekly Active Teams',
    bestReason: 'In B2B SaaS, the key lever is team adoption within orgs (expand motion). WAT measures that directly.',
    gamingExplanation: 'Hard to game. Getting 70% of a team to use it 3 days/week requires genuine value delivery.'
  },
  {
    product: 'A food delivery marketplace',
    model: 'Commission-based marketplace. Revenue = 20-30% commission per order. Key levers: order frequency, basket size, restaurant supply.',
    candidates: [
      { name: 'Gross Merchandise Volume (GMV)', description: 'Total dollar value of all orders processed', gamingRisk: 'Can be inflated by large discounts that destroy margins.', blindSpot: 'Doesn\'t capture profitability. GMV can grow while losing more money.', ideal: true },
      { name: 'Orders Per Active User Per Week', description: 'Order frequency among active users', gamingRisk: 'Can be pushed by cheap items with less commission.', blindSpot: 'Churn — users ordering 3x/week for a month then never again looks great here.', ideal: false },
      { name: 'Restaurant Partner NPS', description: 'NPS among restaurant partners', gamingRisk: 'Low-commission partners rate you highly — but less profitable.', blindSpot: 'One side of marketplace. High restaurant NPS with low users = no orders.', ideal: false },
      { name: 'On-Time Delivery Rate', description: '% of orders within estimated window', gamingRisk: 'Can be inflated by widening estimates.', blindSpot: 'Doesn\'t capture food quality or order accuracy.', ideal: false },
    ],
    idealPick: 0,
    bestMetric: 'Gross Merchandise Volume (GMV)',
    bestReason: 'In marketplaces, GMV captures health from both sides: more orders (user) and higher-value (supply).',
    gamingExplanation: 'GMV can be gamed by discounts, but segmented GMV (full-price vs. discounted) reveals true health.'
  },
];

export function generateNorthStar() {
  return BUSINESS_MODELS[Math.floor(Math.random() * BUSINESS_MODELS.length)];
}

// === Stakeholder Standoff ===
const STANDOFF_SCENARIOS = [
  {
    npcName: 'Raj (Engineering Lead)',
    opener: 'Look, I know the CEO wants this feature by next quarter, but my team is already underwater with the platform migration. Every new feature request makes me want to quit. You need to push back on this.',
    hiddenConcern: 'Raj is overworked. The migration is real, but he also feels his team\'s work is undervalued. Needs to feel heard, not managed.',
    turns: [
      {
        choices: [
          { text: 'I hear you. Let\'s walk through your sprint load together and I\'ll push back on the timeline.', trustDelta: 15, next: 1, explanation: 'Validates his workload and shows action. Trust up.' },
          { text: 'The CEO really wants this. Can we scope a minimum version?', trustDelta: -5, next: 1, explanation: 'Pushing too fast. He\'ll feel steamrolled.' },
          { text: 'Deadlines are arbitrary. I\'ll tell the CEO it\'s not happening.', trustDelta: -10, next: 2, explanation: 'Over-promises. He won\'t trust future commitments either.' },
        ]
      },
      {
        dialogue: 'I appreciate that, but it\'s not just timelines. Every time we agree on scope, product adds "one more thing." I can\'t plan.',
        hiddenConcern: 'He needs a real scope management process, not just sympathy.',
        choices: [
          { text: 'What if we agree on a strict scope freeze this quarter? New items go into a backlog for next quarter.', trustDelta: 15, next: 3, explanation: 'Gives him concrete process control. Addresses his real concern.' },
          { text: 'I\'ll personally review every requirement before it reaches your team.', trustDelta: 5, next: 3, explanation: 'Helpful but still a personal gate. He wants systemic protection.' },
          { text: 'That\'s just how product works — we discover as we build.', trustDelta: -15, next: 3, explanation: 'Dismisses his pain. He won\'t trust you going forward.' },
        ]
      },
    ],
    finalTrustRange: [20, 30],
    debrief: 'Raj needed a system, not a shield. By giving him scope freeze process, you solved the systemic issue. Best PMs build systems that distribute pressure fairly.'
  },
  {
    npcName: 'Priya (VP of Sales)',
    opener: 'Our biggest enterprise deal ($2M ARR) is about to close but the customer needs custom reporting. Engineering says 6 weeks. Make it happen.',
    hiddenConcern: 'She\'s under quarterly quota pressure. She also worries special requests hurt her credibility with product.',
    turns: [
      {
        choices: [
          { text: 'Let\'s understand what "custom reporting" means. Maybe there\'s an 80/20 solution in 1 week.', trustDelta: 10, next: 1, explanation: 'Exploring real need without saying no. PM sweet spot.' },
          { text: 'We have a strict roadmap. Your customer can use standard reports or wait until Q3.', trustDelta: -10, next: 1, explanation: 'Too rigid. She has a quota too.' },
          { text: 'I\'ll talk to engineering. No promises.', trustDelta: -5, next: 1, explanation: 'Vague. She needs a concrete path.' },
        ]
      },
      {
        dialogue: 'They need pivot tables and drill-downs on 5 dimensions. Comparing us to Looker.',
        hiddenConcern: 'She\'s scared of losing the deal and doesn\'t know what\'s technically feasible.',
        choices: [
          { text: 'That\'s standard Looker. What if we white-label Looker\'s embed while building our own? Cheaper and faster.', trustDelta: 15, next: 3, explanation: 'Creative solution. Positions you as a partner.' },
          { text: 'I can\'t justify 6 weeks for one customer. Help me craft messaging around our existing reports.', trustDelta: -5, next: 3, explanation: 'Right but not helpful.' },
          { text: 'Fine, I\'ll override engineering — 3 weeks.', trustDelta: -10, next: 3, explanation: 'Over-promising destroys trust.' },
        ]
      },
    ],
    finalTrustRange: [20, 30],
    debrief: 'Priya needed a creative path, not a blank check or wall. Best PMs find third options neither party considered.'
  },
  {
    npcName: 'Marcus (Head of Design)',
    opener: 'The new onboarding needs a visual refresh before shipping. User research shows confusion at step 4. I need 3 more weeks.',
    hiddenConcern: 'He takes design quality personally. His team\'s recent work was rushed.',
    turns: [
      {
        choices: [
          { text: 'Let\'s focus the redesign on step 4 where confusion is. That\'s 1 week, not 3.', trustDelta: 10, next: 1, explanation: 'Surgical fix. Shows you respect his data and his time.' },
          { text: 'We have a deadline. Ship the current version and iterate.', trustDelta: -10, next: 1, explanation: 'Dismisses valid research.' },
          { text: 'Sure, take 3 weeks. Quality matters.', trustDelta: -5, next: 1, explanation: 'Too agreeable. Won\'t trust a PM who greenlights without pushback.' },
        ]
      },
      {
        dialogue: 'Step 4 isn\'t everything. The whole flow has spacing issues, mismatched illustrations, robotic microcopy.',
        hiddenConcern: 'He wants ownership of a cohesive vision. The microcopy comment hints he wants input on copy too.',
        choices: [
          { text: 'What if we spec a design system for spacing/illustrations (in parallel), fix step 4 first, then roll out incrementally?', trustDelta: 15, next: 3, explanation: 'Respects quality with a pragmatic roadmap.' },
          { text: 'The deadline is hard. Ship as-is and plan a v2 next quarter.', trustDelta: -10, next: 3, explanation: 'Ignores his core concern.' },
          { text: 'I\'ll get engineering to give us the 3 weeks. Just scope it clearly.', trustDelta: 0, next: 3, explanation: 'Capitulating without pushback.' },
        ]
      },
    ],
    finalTrustRange: [20, 30],
    debrief: 'Marcus needed quality respected without ignoring business realities. Split the problem: fix step 4 now, design system overhaul (his true north) long-term.'
  }
];

export function generateStandoff() {
  return STANDOFF_SCENARIOS[Math.floor(Math.random() * STANDOFF_SCENARIOS.length)];
}