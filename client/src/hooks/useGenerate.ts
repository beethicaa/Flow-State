// === TEMPLATE-BASED GENERATION (no API calls) ===
// Returns data matching each game's expected shape exactly.

import { useState, useCallback } from 'react';

// Helper: pick random item
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// ----- Generator functions matching each game's exact expected shapes -----

function genMetricsDetective() {
  const s = pick([
    {
      product: 'Swiggy', metricName: 'Order Completion Rate', metricChange: 'down 12%',
      context: 'Users are adding items to cart but dropping off at payment. The drop is concentrated in tier-2 cities. Average order value is unchanged.',
      options: [
        { text: 'A silent deploy of a new payment SDK introduced a 300ms delay on the confirmation page', correct: true, note: 'The new SDK was rolled out without a gradual ramp. The 300ms delay pushed page load past the patience threshold during the critical confirmation step.' },
        { text: 'Increased competition from a direct competitor running aggressive promotions', correct: false, note: 'The competitor\'s promotion is in a different market segment.' },
        { text: 'A background migration caused analytics instrumentation to miss events', correct: false, note: 'Event capture rate is at 99.9%.' },
        { text: 'Seasonal dip following a major holiday promotion pulled demand forward', correct: false, note: 'This decline is 3x larger than the same period last year.' },
      ]
    },
    {
      product: 'Notion', metricName: 'Feature Adoption Rate', metricChange: 'down 22%',
      context: 'The new AI writing features are only being used by 8% of users. The power-user segment shows no change, but casual users are not engaging.',
      options: [
        { text: 'The recommendation algorithm was retrained on a dataset that downweighted high-engagement categories', correct: true, note: 'Production monitoring didn\'t flag it because click-through rates remained flat — only the downstream conversion dropped.' },
        { text: 'A recent UI change to the onboarding flow increased friction for returning users', correct: false, note: 'No UI changes were deployed this period.' },
        { text: 'New mobile OS privacy changes reduced tracking accuracy', correct: false, note: 'The drop is in active usage, not reported traffic.' },
        { text: 'An A/B test on the pricing page was ramped to 100% of traffic', correct: false, note: 'No pricing experiments were active.' },
      ]
    },
    {
      product: 'Airbnb', metricName: 'Booking Conversion Rate', metricChange: 'down 9%',
      context: 'More users are searching but fewer are booking. The drop is steepest for stays 7+ nights. Price-filter usage is up 40%.',
      options: [
        { text: 'A CDN config change reduced image compression quality for slower connections', correct: true, note: 'WiFi users were unaffected so internal testing missed it. Mobile data users saw 2-4s additional load time.' },
        { text: 'A third-party payment provider experienced regional latency', correct: false, note: 'Payment provider uptime was 99.5%.' },
        { text: 'A server-side caching bug served stale data to a subset of users', correct: false, note: 'The bug affected read speeds for a small percentage only.' },
        { text: 'The email notification system sent duplicate reminders, causing users to mute notifications', correct: false, note: 'Mute rates are within normal ranges at 4.2%.' },
      ]
    },
  ]);
  return s;
}

function genGuesstimate() {
  return pick([
    { question: 'How many cups of coffee are consumed in New York City every day?', referenceAnswer: 5500000, referenceMethod: 'NYC has ~8.5M people. ~65% drink coffee at ~1.5 cups/day. That gives ~8.3M cups across 2,000+ coffee shops and home brewing. Add tourists (+20%). Total: ~5-6 million.' },
    { question: 'How many miles of pizza are sold in the US each year?', referenceAnswer: 18000000, referenceMethod: 'Americans eat ~350 slices/second = 11B slices/year. Average slice ~10 inches. 11B × 10in = ~1.74M miles. Add frozen and full pies. Total: ~18-20M miles.' },
    { question: 'How many photos are uploaded to social media worldwide every minute?', referenceAnswer: 7300000, referenceMethod: 'WhatsApp: 4.5B/day. Instagram: 95M posts + 500M stories/day. Snapchat: 5B/day. Facebook: 350M/day. TikTok: 1.5B/month. Total: ~7.3M/min.' },
    { question: 'How many emails are sent globally every day?', referenceAnswer: 340000000000, referenceMethod: '~4.3B email users at ~120 emails/day = 516B. ~55% spam. Business ~40%, personal ~5%. Total including automated: ~340-350B.' },
    { question: 'How many Google searches happen daily?', referenceAnswer: 8500000000, referenceMethod: '~99,000 searches/second × 86,400 seconds = 8.5B/day. Desktop ~45%, mobile ~55%. Peak hours see 4-5x average traffic.' },
  ]);
}

function genGuesstimateGrade(prompt: string) {
  // Parse out player guess info from the prompt to give contextual feedback
  const methodMatch = prompt.match(/Player's method: """([\s\S]*?)"""/);
  const proxMatch = prompt.match(/Numeric proximity: (\d+)\/40/);
  const numericScore = proxMatch ? parseInt(proxMatch[1]) : 25;
  const methodScore = methodMatch && methodMatch[1].length > 30 ? 45 : 25;
  return {
    methodQuality: methodScore >= 40 ? 'rigorous' : methodScore >= 30 ? 'structured' : 'shallow',
    note: methodScore >= 40 ? 'Strong reasoning — clear assumptions and structured approach.' : methodScore >= 30 ? 'Decent structure but some gaps in assumptions.' : 'Your method lacked structure. Always break the problem into parts.',
    numericScore, methodScore, judgmentScore: numericScore + methodScore
  };
}

function genPrioritize() {
  return {
    stakes: 'Quarterly board meeting in 2 weeks. The CEO wants to showcase product momentum.',
    constraint: 'Only 2 engineers available this sprint. Sales is pushing for the enterprise feature, Legal needs GDPR compliance, and user feedback demands the iOS crash fix.',
    items: [
      { id: 'A', title: 'Fix checkout crash on iOS 18', desc: 'Users on iOS 18 get a white screen at payment. Revenue impact: ~$40K/day.', hiddenCost: 'Requires urgent App Store review that may delay other releases' },
      { id: 'B', title: 'Dark mode support', desc: 'Top user request (12k upvotes). Engineering estimate: 8 days.', hiddenCost: 'Sets precedent for theming system, increases future maintenance' },
      { id: 'C', title: 'GDPR compliance audit', desc: 'Legal requirement for EU expansion. Non-compliance penalty: €20M.', hiddenCost: 'Audit may uncover deeper data issues requiring major rework' },
      { id: 'D', title: 'API rate limiter for 3rd parties', desc: 'Enterprise customer ($500K ARR) threatening churn.', hiddenCost: 'May anger free-tier API users if tightened' },
      { id: 'E', title: 'Performance optimization', desc: 'P95 page load up from 1.2s to 3.8s. SEO dropping.', hiddenCost: 'Root cause may be deep infrastructure, not surface optimization' },
    ],
    strongRankingLooksLike: 'A sharp PM prioritizes revenue-impact and compliance: iOS crash ($40K/day) and GDPR (€20M risk) are non-negotiable. Performance follows. Dark mode is nice-to-have. The API rate limiter can be solved with a manual override temporarily.'
  };
}

function genPrioritizeGrade(_prompt: string) {
  return {
    tradeoffAwareness: 22, politicalRealism: 20, clarity: 18, judgmentScore: 60,
    debrief: 'Strong awareness of trade-offs. Consider the hidden costs of each decision more explicitly next time.'
  };
}

function genProductSense() {
  const p = pick([
    { prompt: 'Design a feature that helps remote teams track their daily mood and energy levels without feeling like a chore for HR.', context: 'You are the PM for a remote-first productivity tool with 2M MAU. Users feel disconnected from teammates.' },
    { prompt: 'Design a way for users to discover and save recipes from Instagram Reels and TikTok videos into a cookbook app.', context: 'You are the PM for a recipe app with 5M MAU. 60% of users find recipes on social media but never save them.' },
    { prompt: 'Design a feature that helps ride-share passengers split fares with friends who join mid-trip.', context: 'You are the PM for a ride-share app. Groups struggle with fare splitting at different stops.' },
  ]);
  return p;
}

function genProductSenseGrade(_prompt: string) {
  return {
    problemFraming: 3, userEmpathy: 4, tradeoffs: 3, metrics: 2, handledPushback: 0, judgmentScore: 60,
    strengths: ['Good understanding of user needs', 'Clear problem framing'],
    gaps: ['Consider edge cases more thoroughly', 'Define success metrics upfront'],
    feedback: 'Your answer shows solid product thinking. Next time, include specific success metrics and trade-off analysis.',
    rubricScores: [
      { label: 'Problem Framing', score: 3, max: 5 },
      { label: 'User Empathy', score: 4, max: 5 },
      { label: 'Trade-off Awareness', score: 3, max: 5 },
      { label: 'Success Metrics', score: 2, max: 5 },
    ]
  };
}

function genABTest() {
  return pick([
    {
      variantA: { label: 'Control (A)', users: 50000, conversions: 5200, rate: '10.40%' },
      variantB: { label: 'Variant (B)', users: 49800, conversions: 5390, rate: '10.82%' },
      pValue: '0.042', correctAnswer: 'ship_guardrail', correctLabel: 'Ship with a guardrail fix first',
      guardrails: [
        { metric: 'Page load time (P95)', control: '1.2s', variant: '1.4s', concern: true, explanation: '17% slower. The page speed regression is expensive.' },
        { metric: 'Refund rate', control: '2.1%', variant: '2.0%', concern: false },
        { metric: 'Error rate', control: '0.3%', variant: '0.9%', concern: true, explanation: 'Error rate tripled. Reliability issue.' },
      ],
      explanation: 'Significant (p=0.042) but page load regressed 17% and error rate tripled. Fix guardrails first.', trap: 'Headline lift looks good but guardrail regressions are real.'
    },
    {
      variantA: { label: 'Control (A)', users: 120000, conversions: 9600, rate: '8.00%' },
      variantB: { label: 'Variant (B)', users: 119500, conversions: 9630, rate: '8.06%' },
      pValue: '0.63', correctAnswer: 'kill', correctLabel: 'Kill it',
      guardrails: [
        { metric: 'Avg. session time', control: '4.2min', variant: '4.1min', concern: false },
        { metric: 'Support tickets/1000 users', control: '3.4', variant: '3.5', concern: false },
      ],
      explanation: 'p=0.63 means 63% chance this is noise. Experiment is well-powered. Ship nothing.', trap: 'B is higher but confidence is extremely low.'
    },
    {
      variantA: { label: 'Control (A)', users: 15000, conversions: 450, rate: '3.00%' },
      variantB: { label: 'Variant (B)', users: 15100, conversions: 510, rate: '3.38%' },
      pValue: '0.055', correctAnswer: 'run_longer', correctLabel: 'Run it longer',
      guardrails: [
        { metric: 'Bounce rate', control: '28%', variant: '27%', concern: false },
        { metric: 'API latency', control: '210ms', variant: '215ms', concern: false },
      ],
      explanation: 'p=0.055 close but not significant. Increase sample size to 30K+.', trap: 'Lift is compelling but confidence interval too wide.'
    },
    {
      variantA: { label: 'Control (A)', users: 80000, conversions: 12800, rate: '16.00%' },
      variantB: { label: 'Variant (B)', users: 80200, conversions: 13090, rate: '16.32%' },
      pValue: '0.038', correctAnswer: 'ship', correctLabel: 'Ship it',
      guardrails: [
        { metric: 'Revenue per user', control: '$4.10', variant: '$4.05', concern: false },
        { metric: 'Add-to-cart rate', control: '34%', variant: '33%', concern: false },
      ],
      explanation: 'Significant lift (p=0.038). Monitor revenue per user post-launch.', trap: 'Clean ship.'
    },
  ]);
}

function genCrisis() {
  return pick([
    {
      incident: 'Checkout payment failure cascade', blastRadius: '12% of checkout traffic failing with timeout errors. Revenue impact: $15K/hr.',
      signals: ['Payment gateway shows green (operational)', 'Timeout threshold lowered from 10s to 3s in last week\'s deploy', 'Database connection pool at 95% utilization'],
      bestTechId: 'rollback', bestCommsId: 'eta',
      explanation: 'The timeout change is the root cause. Reverting restores the buffer. The real failure was no staged rollout.'
    },
    {
      incident: 'Database replication lag breach', blastRadius: 'User-facing dashboard showing stale data (30+ min delay). Affects 60% of traffic.',
      signals: ['Schema migration added index to 2.1B-row table', 'Read replicas show 28 min lag (threshold: 5 min)', 'Alert suppressed during maintenance window'],
      bestTechId: 'rollback', bestCommsId: 'eta',
      explanation: 'Index creation on 2.1B rows overwhelmed I/O. Pause creation. Key lesson: index ops on >500M rows should be batched.'
    },
  ]);
}

function genNorthStar() {
  const s = pick([
    {
      businessModel: 'A subscription-based meditation app', context: 'Freemium with premium subscriptions ($12.99/mo). Revenue drivers: subscribers and retention.',
      candidates: ['Monthly Active Users', 'Premium Subscription Revenue', 'Session Completion Rate', '7-Day Streak Rate'], best: '7-Day Streak Rate',
      gamblingRisks: ['MAU inflates via free users who never convert', 'Revenue lags by a month', 'Session rate inflates via shorter sessions', 'Streaks can be gamed with 5-second opens'],
      strongAnswerLooksLike: 'Meditation value compounds with consistency. Streak rate measures habit formation.'
    },
    {
      businessModel: 'An ad-supported social video platform', context: 'Free tier with ads. Revenue from advertisers per-impression (CPM).',
      candidates: ['Daily Active Users', 'Total Watch Time', 'Ad Revenue Per 1K Views', 'Creator Payout Satisfaction'], best: 'Total Watch Time',
      gamblingRisks: ['DAU inflates from 3-second opens', 'Watch time inflates via auto-play', 'CPM inflates via ad overload', 'Creator satisfaction influenced by overpay'],
      strongAnswerLooksLike: 'Watch time determines ad inventory and engagement. Balances satisfaction with business value.'
    },
    {
      businessModel: 'A B2B project management SaaS tool', context: 'Per-seat subscription ($15/seat/mo). Teams of 5-50.',
      candidates: ['Monthly Recurring Revenue', 'Daily Active Users', 'Weekly Active Teams', 'Net Revenue Retention'], best: 'Weekly Active Teams',
      gamblingRisks: ['Revenue boosts via discounts hurt long-term', 'DAU inflates via notifications', 'WAT harder to game but slow-moving', 'NRR lags by 12 months'],
      strongAnswerLooksLike: 'In B2B SaaS, team adoption within orgs is the key lever. WAT measures expand motion directly.'
    },
  ]);
  return s;
}

function genSkepticLine(_scenario: any, pick: string) {
  return { skepticLine: `"${pick}" can be misleading — ${pick === 'Daily Active Users' ? 'a user who opens for 3 seconds counts the same as one who spends 30 minutes.' : pick === 'Total Watch Time' ? 'users can be watching without caring. Doom-scrolling isn\'t healthy engagement.' : pick === 'Premium Subscription Revenue' ? 'revenue can grow while users are unhappy. It\'s a lagging indicator.' : pick === 'Monthly Active Users' ? 'this includes free users who may never convert. Not all engagement is equal.' : pick === '7-Day Streak Rate' ? 'streaks can be gamed by opening the app for 5 seconds. Are they actually meditating?' : pick === 'Weekly Active Teams' ? 'teams move slowly. This metric won\'t change week to week — too lagging for decision-making.' : 'this metric has blind spots that a savvy PM would anticipate.'}` };
}

function genStandoff() {
  return pick([
    {
      stakeholder: 'Raj (Engineering Lead)', openingLine: 'Look, I know the CEO wants this feature, but my team is underwater with the platform migration. Every new request makes me want to quit.',
      underlyingConcern: 'Raj is overworked and feels his team\'s work is undervalued. He needs to feel heard.',
      turns: [
        {
          prompt: 'How do you respond to Raj?',
          options: [
            { line: 'I hear you. Let\'s walk through your sprint load and I\'ll push back on the timeline.', trustDelta: 15, trulyGood: true },
            { line: 'The CEO really wants this. Can we scope a minimum version?', trustDelta: -5, trulyGood: false },
            { line: 'Deadlines are arbitrary. I\'ll tell the CEO it\'s not happening.', trustDelta: -10, trulyGood: false },
          ]
        },
        {
          prompt: 'Raj says: "I appreciate that, but product keeps adding scope mid-sprint."',
          options: [
            { line: 'What if we agree on a strict scope freeze this quarter? New items go to backlog.', trustDelta: 15, trulyGood: true },
            { line: 'I\'ll personally review every requirement before it reaches your team.', trustDelta: 5, trulyGood: false },
            { line: 'That\'s just how product works — we discover as we build.', trustDelta: -15, trulyGood: false },
          ]
        },
        {
          prompt: 'Raj: "That sounds good but I\'ve heard promises before."',
          options: [
            { line: 'Let\'s put it in writing. I\'ll send a scope agreement doc this week.', trustDelta: 15, trulyGood: true },
            { line: 'Trust me, I\'ve got your back this time.', trustDelta: 0, trulyGood: false },
            { line: 'I can\'t control everything but I\'ll do my best.', trustDelta: -10, trulyGood: false },
          ]
        },
      ]
    },
    {
      stakeholder: 'Priya (VP of Sales)', openingLine: 'Our biggest deal ($2M ARR) is about to close but needs custom reporting. Engineering says 6 weeks.',
      underlyingConcern: 'She\'s under quarterly quota pressure and worries special requests hurt her credibility.',
      turns: [
        {
          prompt: 'How do you respond to Priya?',
          options: [
            { line: 'Let\'s understand what "custom reporting" means. Maybe there\'s an 80/20 solution.', trustDelta: 10, trulyGood: true },
            { line: 'We have a strict roadmap. Your customer can wait until Q3.', trustDelta: -10, trulyGood: false },
            { line: 'I\'ll talk to engineering. No promises.', trustDelta: -5, trulyGood: false },
          ]
        },
        {
          prompt: 'Priya says: "They need pivot tables and drill-downs on 5 dimensions. Comparing us to Looker."',
          options: [
            { line: 'That\'s standard Looker. What if we white-label Looker\'s embed while building our own?', trustDelta: 15, trulyGood: true },
            { line: 'I can\'t justify 6 weeks for one customer.', trustDelta: -5, trulyGood: false },
            { line: 'Fine, I\'ll override engineering — 3 weeks.', trustDelta: -10, trulyGood: false },
          ]
        },
        {
          prompt: 'Priya: "The customer wants to see progress this week or they walk."',
          options: [
            { line: 'I\'ll put together a mockup by Friday so the customer sees we\'re moving.', trustDelta: 15, trulyGood: true },
            { line: 'If they walk, they walk. We can\'t build everything.', trustDelta: -15, trulyGood: false },
            { line: 'Let me see if I can squeeze in a prototype.', trustDelta: 5, trulyGood: false },
          ]
        },
      ]
    },
  ]);
}

function genStandoffGrade(_prompt: string) {
  return {
    deEscalation: 20, transparency: 25, outcome: 18, judgmentScore: 63,
    debrief: 'You navigated the conversation thoughtfully. The strongest responses address the real concern, not the surface complaint.'
  };
}

// ----- Main hook -----
export function useGenerate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);

  const reset = useCallback(() => { setError(null); setErrorType(null); }, []);

  const generate = useCallback(async (opts: { system: string; prompt: string }): Promise<any> => {
    setLoading(true);
    setError(null);
    setErrorType(null);
    await new Promise(r => setTimeout(r, 60));
    setLoading(false);

    const p = (opts.prompt || '').toLowerCase();
    // sys response

    try {
      // ---- Metrics Detective ----
      if (p.includes('root cause') || (p.includes('options') && p.includes('correct'))) return genMetricsDetective();

      // ---- Guesstimate: scenario vs grade ----
      if (p.includes('referenceanswer') || p.includes('referencemethod')) return genGuesstimate();
      if (p.includes('player\'s method') || p.includes('numeric proximity')) return genGuesstimateGrade(opts.prompt);

      // ---- Prioritize: scenario vs grade ----
      if (p.includes('backlog') || (p.includes('stakes') && p.includes('constraint'))) return genPrioritize();
      if (p.includes('tradeoff') || (p.includes('player\'s ranking') || p.includes('rationale') && p.includes('debrief'))) return genPrioritizeGrade(opts.prompt);

      // ---- Product Sense: scenario vs grade ----
      if (p.includes('design a feature') || (p.includes('prompt') && p.includes('context'))) return genProductSense();
      if (p.includes('rubric') || p.includes('player\'s answer') || p.includes('strengths') || p.includes('gaps')) return genProductSenseGrade(opts.prompt);

      // ---- AB Test ----
      if (p.includes('variant a') || p.includes('control') || p.includes('experiment')) return genABTest();

      // ---- Crisis ----
      if (p.includes('incident') || p.includes('blast radius')) return genCrisis();

      // ---- North Star: multiple calls ----
      if (p.includes('north star') || (p.includes('candidates') && !p.includes('skeptic'))) return genNorthStar();
      if (p.includes('skeptic') || p.includes('metric is flawed')) {
        // Need to extract the scenario and pick from prompt
        return genSkepticLine(null, '');
      }

      // ---- Stakeholder Standoff ----
      if (p.includes('standoff') || p.includes('stakeholder')) {
        if (p.includes('debrief') || (p.includes('transcript') && p.includes('final trust'))) return genStandoffGrade(opts.prompt);
        return genStandoff();
      }

      // ---- Interview Debrief ----
      if (p.includes('transcript') || p.includes('interviewer') || p.includes('research goal')) {
        return {
          product: 'Subscription fitness app', researchGoal: 'Understand why 7-day trial users aren\'t converting.',
          transcript: [
            { speaker: 'interviewer', text: 'Walk me through your experience with the app this week.' },
            { speaker: 'user', text: 'I liked the workouts but I didn\'t understand what I\'d get if I paid.' },
            { speaker: 'interviewer', text: 'Did you see upgrade prompts?' },
            { speaker: 'user', text: 'There was a banner on settings. I never go there — I just do a workout and leave.' },
          ],
          temptingMisreads: 'Users don\'t see value, so show more prompts.',
          realInsight: 'Pricing communication is in a dead zone. Surface it post-workout when value is freshest.',
          strongAnswerLooksLike: 'Identify that pricing is in low-traffic areas and suggest high-engagement placement (post-workout).'
        };
      }

      // ---- Scope Check ----
      if (p.includes('engineerestimate') || p.includes('scoping') || (p.includes('engineer') && p.includes('estimate'))) {
        return {
          product: 'E-commerce platform', ask: 'Add real-time inventory tracking for merchants',
          engineerEstimate: '6 weeks minimum',
          engineerReasoning: 'Need new WebSocket pipeline, caching layer, and dashboard UI. Inventory team is on API migration.',
          stakes: 'Merchant churn increasing. Competitors launched this 2 months ago.',
          strongAnswerLooksLike: 'Question whether all merchants need real-time. Could polling or SSE work instead of WebSockets?'
        };
      }

      // ---- Query Quest (keeps API call for SQL) ----
      if (p.includes('sql') || p.includes('bugtype') || p.includes('business question')) {
        // Fallback to a minimal valid scenario
        return {
          businessQuestion: 'How many users signed up last week?',
          query: 'SELECT COUNT(*) FROM users WHERE signup_date >= NOW() - INTERVAL 7 DAY;',
          bugType: 'missing_filter',
          bugExplanation: 'The query counts all users who signed up any time since 7 days ago, including those who may have deleted their accounts.',
          whatWentUnnoticed: 'The WHERE clause only checks signup date, not account status.',
          correctedQuery: 'SELECT COUNT(*) FROM users WHERE signup_date >= NOW() - INTERVAL 7 DAY AND deleted_at IS NULL;'
        };
      }

      // ---- Postmortem ----
      if (p.includes('postmortem') || p.includes('post-mortem') || p.includes('retrospective')) {
        return {
          incident: 'Database query degradation caused 3-min page load times for 25% of users for 45 minutes.',
          whatWentWell: ['Monitoring alerted within 2 minutes', 'Team identified the slow query within 10 minutes', 'Rollback was clean and fast'],
          whatWentWrong: ['No query performance budget in CI/CD', 'The deploy was auto-promoted without canary testing', 'Incident response runbook was out of date'],
          actionItems: ['Add query performance regression tests to CI', 'Require manual approval for DB schema changes', 'Schedule runbook review every 2 weeks']
        };
      }

      // ---- Trust Safety ----
      if (p.includes('trust') || p.includes('safety') || p.includes('moderation') || p.includes('harmful')) {
        return {
          issue: 'A user reported that an AI-generated response provided medical advice that could be dangerous if followed.',
          severity: 'high', contentCategory: 'health_advice',
          policyCategories: ['Medical advice prohibition', 'Safety-critical content', 'Expert certification requirement']
        };
      }

      return genMetricsDetective();
    } catch (e) {
      setError('Could not generate. Try again.');
      setErrorType('fallback');
      return null;
    }
  }, []);

  return { loading, error, errorType, generate, reset };
}