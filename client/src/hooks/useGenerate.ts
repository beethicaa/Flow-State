// === CLIENT-SIDE GENERATION — no external APIs ===
// Uses curated scenario pools + randomized prompt modifiers
// Fully offline-capable, zero latency, zero cost.

import { useState, useCallback } from 'react';

interface GenerateOptions {
  system: string;
  prompt: string;
}

// Scenario pools for each game
const POOLS: Record<string, any[]> = {
  metrics: [
    { product: 'Swiggy', metricName: 'Order Completion Rate', metricChange: 'down 12%', context: 'Users are adding items to cart but dropping off at payment. The drop is concentrated in tier-2 cities. Average order value is unchanged.', options: [ { text: 'A silent deploy of a new payment SDK introduced a 300ms delay on the confirmation page', correct: true, note: 'The new SDK was rolled out without a gradual ramp. The 300ms delay pushed page load past the patience threshold during the critical confirmation step.' }, { text: 'Increased competition from a direct competitor running aggressive promotions', correct: false, note: 'The competitor\'s promotion is in a different market segment.' }, { text: 'A background migration caused analytics instrumentation to miss events', correct: false, note: 'Event capture rate is at 99.9%.' }, { text: 'Seasonal dip following a major holiday promotion pulled demand forward', correct: false, note: 'This decline is 3x larger than the same period last year.' } ] },
    { product: 'Notion', metricName: 'Feature Adoption Rate', metricChange: 'down 22%', context: 'The new AI writing features are only being used by 8% of users. Power users show no change; casual users aren\'t engaging. The AI button is buried in the formatting toolbar.', options: [ { text: 'The recommendation algorithm was retrained on a dataset that downweighted high-engagement categories', correct: true, note: 'Production monitoring didn\'t flag it because click-through rates remained flat — only the downstream conversion dropped.' }, { text: 'A recent UI change to the onboarding flow increased friction for returning users', correct: false, note: 'No UI changes were deployed this period.' }, { text: 'New mobile OS privacy changes reduced tracking accuracy', correct: false, note: 'The drop is in active usage, not reported traffic.' }, { text: 'An A/B test on the pricing page was ramped to 100% of traffic', correct: false, note: 'No pricing experiments were active.' } ] },
    { product: 'Airbnb', metricName: 'Booking Conversion Rate', metricChange: 'down 9%', context: 'More users are searching but fewer are booking. The drop is steepest for stays 7+ nights. Price-filter usage is up 40%.', options: [ { text: 'A CDN config change reduced image compression quality for slower connections', correct: true, note: 'WiFi users were unaffected so internal testing missed it. Mobile data users saw 2-4s additional load time.' }, { text: 'A third-party payment provider experienced regional latency', correct: false, note: 'Payment provider uptime was 99.5%.' }, { text: 'A server-side caching bug served stale data to a subset of users', correct: false, note: 'The bug affected read speeds for a small percentage only.' }, { text: 'The email notification system sent duplicate reminders, causing users to mute notifications', correct: false, note: 'Mute rates are within normal ranges at 4.2%.' } ] },
    { product: 'Spotify', metricName: 'Premium Conversion Rate', metricChange: 'down 6%', context: 'Free-tier users are listening more but upgrading less. The decline is steepest in the 18-24 demographic. Podcast consumption is up 30%.', options: [ { text: 'The new podcast catalog redirected attention away from music, reducing perceived value of premium', correct: true, note: 'Users satisfied with free podcasts see less reason to upgrade. The shift in content mix diluted the premium value proposition.' }, { text: 'Increased competition from Apple Music\'s new pricing tier', correct: false, note: 'Apple Music\'s pricing hasn\'t changed this quarter.' }, { text: 'A recent UI redesign made the upgrade button less visible', correct: false, note: 'The upgrade button placement is unchanged.' }, { text: 'Seasonal trend — summer listening habits differ from winter', correct: false, note: 'While seasonal effects exist, this decline is larger than the same period last year.' } ] },
    { product: 'DoorDash', metricName: 'Average Order Value', metricChange: 'down 7%', context: 'Average basket size has decreased. Fewer users are adding drinks and sides. Promotional usage is up 25%. The new "saver" delivery option has 12% take-rate.', options: [ { text: 'The "saver" delivery option attracted price-sensitive users who order cheaper items', correct: true, note: 'The saver option appeals to budget-conscious customers who trade speed for cost, naturally lowering basket size.' }, { text: 'Restaurant menu prices increased, causing users to order less', correct: false, note: 'Menu prices are unchanged; the drop is in add-ons, not entrées.' }, { text: 'A bug in the cart calculation undercharges for items', correct: false, note: 'Revenue per order is down, but cart totals are accurate — users are simply choosing cheaper combos.' }, { text: 'Supply chain issues reduced menu availability', correct: false, note: 'Menu availability is at 98%, well above threshold.' } ] },
  ],
  guesstimate: [
    { question: 'How many cups of coffee are consumed in New York City every day?', referenceAnswer: 5500000, referenceMethod: 'NYC has ~8.5M people. ~65% drink coffee at ~1.5 cups/day. That gives ~8.3M cups across 2,000+ coffee shops and home brewing. Add tourists (+20%). Total: ~5-6 million.' },
    { question: 'How many miles of pizza are sold in the US each year?', referenceAnswer: 18000000, referenceMethod: 'Americans eat ~350 slices/second = 11B slices/year. Average slice ~10 inches. 11B × 10in = ~1.74M miles. Add frozen and full pies. Total: ~18-20M miles annually.' },
    { question: 'How many photos are uploaded to social media worldwide every minute?', referenceAnswer: 7300000, referenceMethod: 'WhatsApp: 4.5B/day. Instagram: 95M posts + 500M stories/day. Snapchat: 5B/day. Facebook: 350M/day. TikTok: 1.5B/month. Total: ~7.3M/min.' },
    { question: 'How many emails are sent globally every day?', referenceAnswer: 340000000000, referenceMethod: '~4.3B email users at ~120 emails/day = 516B. ~55% spam. Business ~40%, personal ~5%. Total including automated: ~340-350B.' },
    { question: 'How many Google searches happen worldwide every day?', referenceAnswer: 8500000000, referenceMethod: '~99,000 searches/second × 86,400 seconds = 8.5B/day. Desktop ~45%, mobile ~55%. Peak hours see 4-5x average traffic.' },
    { question: 'How many words does the average person speak in a lifetime?', referenceAnswer: 860000000, referenceMethod: 'Average person speaks ~16,000 words/day × 365 days × 80 years = ~467M. Add phone calls, public speaking, social situations (+15%) = ~540M. Some estimates vary 500M-1B depending on profession and social habits.' },
  ],
  prioritize: [
    { stakes: 'Quarterly board meeting in 2 weeks. The CEO wants to showcase momentum.', constraint: 'Only 2 engineers available this sprint. Sales is pushing for the enterprise feature, Legal needs GDPR compliance, and user feedback demands the iOS crash fix.', items: [ { id: 'A', title: 'Fix checkout crash on iOS 18', desc: 'Users on iOS 18 get a white screen at payment. Revenue impact: ~$40K/day.', hiddenCost: 'Requires urgent App Store review that may delay other releases' }, { id: 'B', title: 'Dark mode support', desc: 'Top user request (12k upvotes). Engineering estimate: 8 days.', hiddenCost: 'Sets precedent for theming system, increases future maintenance' }, { id: 'C', title: 'GDPR compliance audit', desc: 'Legal requirement for EU expansion. Non-compliance penalty: €20M.', hiddenCost: 'Audit may uncover deeper data issues requiring major rework' }, { id: 'D', title: 'API rate limiter for 3rd parties', desc: 'Enterprise customer ($500K ARR) threatening churn.', hiddenCost: 'May anger free-tier API users if tightened' }, { id: 'E', title: 'Performance optimization', desc: 'P95 page load up from 1.2s to 3.8s. SEO dropping.', hiddenCost: 'Root cause may be deep infrastructure, not surface optimization' } ], strongRankingLooksLike: 'A sharp PM prioritizes revenue-impact and compliance: iOS crash ($40K/day) and GDPR (€20M risk) are non-negotiable. Performance follows. Dark mode is nice-to-have. The API rate limiter can be solved with a manual override temporarily.' },
    { stakes: 'A major investor demo is in 5 days. Ship the items that will make the best impression.', constraint: 'Engineering is at 60% capacity. Investor cares about growth metrics and technical sophistication.', items: [ { id: 'A', title: 'Launch referral program', desc: 'Projected 15% acquisition lift. Simple mechanics, viral potential.', hiddenCost: 'Referral fraud risk if not monitored' }, { id: 'B', title: 'New onboarding flow', desc: 'Current onboarding has 68% drop-off at step 3. Redesign expected to improve activation by 20%.', hiddenCost: ' Engineering estimate: 14 days — too long for demo' }, { id: 'C', title: 'Dashboard redesign', desc: 'Make the product look more enterprise-ready for the investor meeting.', hiddenCost: 'Cosmetic change that doesn\'t move core metrics' }, { id: 'D', title: 'API rate limiter for 3rd parties', desc: 'Enterprise customer ($500K ARR) threatening churn without better limits.', hiddenCost: 'May anger free-tier API users if tightened' }, { id: 'E', title: 'Performance optimization', desc: 'P95 page load increased from 1.2s to 3.8s. SEO rankings dropping.', hiddenCost: 'Root cause may be deep infrastructure issue' } ], strongRankingLooksLike: 'For an investor demo, prioritize the referral program (growth story) and the enterprise API rate limiter (revenue protection). Dashboard redesign is fine if it\'s quick, but avoid the 14-day onboarding rebuild before the demo.' },
  ],
  productSense: [
    { prompt: 'Design a feature that helps remote teams track their daily mood and energy levels without it feeling like a chore for HR.', context: 'You are the PM for a remote-first productivity tool with 2M MAU. Your users tell you they feel disconnected from their teammates.' },
    { prompt: 'Design a way for users to discover and save recipes from Instagram Reels and TikTok videos into a cookbook app.', context: 'You are the PM for a recipe app with 5M MAU. User research shows 60% of users find recipes on social media but never save them properly.' },
    { prompt: 'Design a feature that helps ride-share passengers split fares with friends who join mid-trip (e.g. picking up a friend after a night out).', context: 'You are the PM for a ride-share app. User feedback shows groups struggle with fare splitting when passengers are picked up at different stops.' },
    { prompt: 'Design a feature that helps parents coordinate pickups and drop-offs for their kids\' activities across multiple families.', context: 'You are the PM for a family-focused calendar app. User interviews reveal that 70% of parents rely on text chains to coordinate schedules.' },
    { prompt: 'Design a feature that helps freelancers automatically track time across multiple projects and generate invoices without manual entry.', context: 'You are the PM for a freelancer toolbox app. Freelancers say they spend 3-5 hours per week on admin tasks like time tracking and invoicing.' },
  ],
  abTest: [
    { variantA: { label: 'Control (A)', users: 50000, conversions: 5200, rate: '10.40%' }, variantB: { label: 'Variant (B)', users: 49800, conversions: 5390, rate: '10.82%' }, pValue: '0.042', guardrails: [ { metric: 'Page load time (P95)', control: '1.2s', variant: '1.4s', concern: true, explanation: '17% slower. For a statistically significant conversion lift of only 0.42pp, the page speed regression is expensive in terms of SEO and user experience.' }, { metric: 'Refund rate', control: '2.1%', variant: '2.0%', concern: false }, { metric: 'Error rate', control: '0.3%', variant: '0.9%', concern: true, explanation: 'Error rate tripled. This suggests the variant has reliability issues that could compound over time.' } ], correctAnswer: 'ship_guardrail', correctLabel: 'Ship with a guardrail fix first', explanation: 'The conversion lift is statistically significant (p=0.042, <0.05) but the guardrail metrics tell a different story. Page load time regressed by 17% and error rate tripled. A careful PM would ship the conversion win only after fixing these regressions, not before. The practical significance of a 0.42pp lift is undermined if it comes at the cost of reliability.', trap: 'The headline conversion lift looks good, but the guardrail regressions are real — the p-value only tests your primary metric, not side effects.' },
    { variantA: { label: 'Control (A)', users: 120000, conversions: 9600, rate: '8.00%' }, variantB: { label: 'Variant (B)', users: 119500, conversions: 9630, rate: '8.06%' }, pValue: '0.63', guardrails: [ { metric: 'Avg. session time', control: '4.2min', variant: '4.1min', concern: false }, { metric: 'Support tickets/1000 users', control: '3.4', variant: '3.5', concern: false } ], correctAnswer: 'kill', correctLabel: 'Kill it', explanation: 'p=0.63 means there\'s a 63% chance this result is random noise. The 0.06pp lift is statistically indistinguishable from zero. Running it longer won\'t help — with 120K users per variant, this experiment is already well-powered. Ship nothing.', trap: 'B is technically higher, but the confidence is extremely low. A classic "don\'t ship noise" trap.' },
    { variantA: { label: 'Control (A)', users: 15000, conversions: 450, rate: '3.00%' }, variantB: { label: 'Variant (B)', users: 15100, conversions: 510, rate: '3.38%' }, pValue: '0.055', guardrails: [ { metric: 'Bounce rate', control: '28%', variant: '27%', concern: false }, { metric: 'API latency', control: '210ms', variant: '215ms', concern: false } ], correctAnswer: 'run_longer', correctLabel: 'Run it longer', explanation: 'p=0.055 is tantalizingly close to 0.05 but not quite there. At 15K users, the experiment may be underpowered for this effect size. Instead of shipping or killing, increase sample size to 30K+ users per variant. If the trend holds, you\'ll likely reach significance.', trap: 'The lift is compelling enough to want to ship, but the confidence interval is still too wide. Patience is the right call here.' },
    { variantA: { label: 'Control (A)', users: 80000, conversions: 12800, rate: '16.00%' }, variantB: { label: 'Variant (B)', users: 80200, conversions: 13090, rate: '16.32%' }, pValue: '0.038', guardrails: [ { metric: 'Revenue per user', control: '$4.10', variant: '$4.05', concern: false }, { metric: 'Add-to-cart rate', control: '34%', variant: '33%', concern: false } ], correctAnswer: 'ship', correctLabel: 'Ship it', explanation: 'Statistically significant lift (p=0.038) with no material guardrail concerns. The revenue-per-user dip of ~1.2% is within normal variance and worth monitoring, but doesn\'t warrant blocking. Clean ship.', trap: 'No real trap here — just make sure you monitor revenue per user post-launch.' },
  ],
  crisis: [
    { incident: 'Checkout payment failure cascade', blastRadius: '12% of checkout traffic failing with timeout errors. Revenue impact: $15K/hr.', signals: [ 'Payment gateway status page shows green (operational)', 'Internal timeout threshold was lowered from 10s to 3s in last deploy', 'Database connection pool is at 95% utilization' ], bestTechId: 'rollback', bestCommsId: 'eta', explanation: 'The timeout change is the root cause. Reverting restores the buffer. The real failure was no staged rollout — deploy should have been monitored before 100%.' },
    { incident: 'Database replication lag breach', blastRadius: 'User-facing dashboard showing stale data (30+ min delay). Affects 60% of traffic.', signals: [ 'Schema migration added index to largest table (2.1B rows)', 'Read replicas show 28 min lag (critical: 5 min)', 'Alert was suppressed during maintenance window' ], bestTechId: 'rollback', bestCommsId: 'eta', explanation: 'Online index creation on 2.1B rows overwhelmed I/O. Pause creation. Key lesson: index ops on >500M rows should be batched.' },
    { incident: 'SSO authentication outage', blastRadius: 'Enterprise users unable to log in. 200+ companies affected including 3 Fortune 500 accounts.', signals: [ 'SSO provider returning 503s for SAML assertions', 'Support flooded: 50+ tickets in 10 minutes', 'Our SAML token cache expired 2 hours ago during routine maintenance' ], bestTechId: 'rollback', bestCommsId: 'eta', explanation: 'Provider-side SAML endpoint regression. Mitigation: enable bypass auth for enterprise while upstream fixes. Pre-configure emergency bypasses for next time.' },
  ],
  northStar: [
    { businessModel: 'A subscription-based meditation app', context: 'Freemium with premium subscriptions ($12.99/mo). Revenue drivers: subscribers and retention.', candidates: [ 'Monthly Active Users', 'Premium Subscription Revenue', 'Session Completion Rate', '7-Day Streak Rate' ], best: '7-Day Streak Rate', gamblingRisks: [ 'MAU inflates via free users who never convert', 'Revenue lags by a month', 'Session rate inflates via shorter sessions', 'Streaks can be gamed with 5-second opens' ], strongAnswerLooksLike: 'Meditation value compounds with consistency. Streak rate measures habit formation. Revenue lags; MAU is too broad.' },
    { businessModel: 'An ad-supported social video platform', context: 'Free tier with ads. Revenue from advertisers per-impression (CPM).', candidates: [ 'Daily Active Users', 'Total Watch Time', 'Ad Revenue Per 1K Views', 'Creator Payout Satisfaction' ], best: 'Total Watch Time', gamblingRisks: [ 'DAU inflates from 3-second opens', 'Watch time inflates via auto-play', 'CPM inflates via ad overload', 'Creator satisfaction influenced by overpay' ], strongAnswerLooksLike: 'Watch time determines ad inventory and engagement. Balances satisfaction with business value.' },
    { businessModel: 'A B2B project management SaaS tool', context: 'Per-seat subscription ($15/seat/mo). Teams of 5-50.', candidates: [ 'Monthly Recurring Revenue', 'Daily Active Users', 'Weekly Active Teams', 'Net Revenue Retention' ], best: 'Weekly Active Teams', gamblingRisks: [ 'Revenue boosts via discounts hurt long-term', 'DAU inflates via notifications', 'WAT harder to game but slow-moving', 'NRR lags by 12 months' ], strongAnswerLooksLike: 'In B2B SaaS, team adoption within orgs is the key lever. WAT measures expand motion directly.' },
    { businessModel: 'A food delivery marketplace', context: 'Commission-based marketplace. Revenue = 20-30% commission per order.', candidates: [ 'Gross Merchandise Volume (GMV)', 'Orders Per Active User Per Week', 'Restaurant Partner NPS', 'On-Time Delivery Rate' ], best: 'Gross Merchandise Volume (GMV)', gamblingRisks: [ 'GMV inflates via large discounts destroying margins', 'Order frequency pushed by cheap items with less commission', 'Restaurant NPS influenced by low commissions', 'Delivery rate inflated by widened estimates' ], strongAnswerLooksLike: 'In marketplaces, GMV captures health from both sides: more orders (user) and higher-value (supply).' },
  ],
  standoff: [
    { stakeholder: 'Raj (Engineering Lead)', openingLine: 'Look, I know the CEO wants this feature by next quarter, but my team is already underwater with the platform migration. Every new feature request makes me want to quit. You need to push back on this.', underlyingConcern: 'Raj is overworked and feels his team\'s work is undervalued. He needs to feel heard, not managed.', turns: [ { prompt: 'How do you respond to Raj?', options: [ { line: 'I hear you. Let\'s walk through your sprint load together and I\'ll push back on the timeline.', trustDelta: 15, trulyGood: true }, { line: 'The CEO really wants this. Can we scope a minimum version?', trustDelta: -5, trulyGood: false }, { line: 'Deadlines are arbitrary. I\'ll tell the CEO it\'s not happening.', trustDelta: -10, trulyGood: false } ] }, { prompt: 'Raj says: "I appreciate that, but product keeps adding scope mid-sprint."', options: [ { line: 'What if we agree on a strict scope freeze this quarter? New items go into a backlog.', trustDelta: 15, trulyGood: true }, { line: 'I\'ll personally review every requirement before it reaches your team.', trustDelta: 5, trulyGood: false }, { line: 'That\'s just how product works — we discover as we build.', trustDelta: -15, trulyGood: false } ] } ], finalDebrief: 'Raj needed a system, not a shield. The scope freeze process solved the systemic issue. Best PMs build systems that distribute pressure fairly.' },
    { stakeholder: 'Priya (VP of Sales)', openingLine: 'Our biggest deal ($2M ARR) is about to close but needs custom reporting. Engineering says 6 weeks.', underlyingConcern: 'She\'s under quarterly quota pressure and worries special requests hurt her credibility.', turns: [ { prompt: 'How do you respond to Priya?', options: [ { line: 'Let\'s understand what "custom reporting" means. Maybe there\'s an 80/20 solution.', trustDelta: 10, trulyGood: true }, { line: 'We have a strict roadmap. Your customer can wait until Q3.', trustDelta: -10, trulyGood: false }, { line: 'I\'ll talk to engineering. No promises.', trustDelta: -5, trulyGood: false } ] }, { prompt: 'Priya says: "They need pivot tables and drill-downs on 5 dimensions. Comparing us to Looker."', options: [ { line: 'That\'s standard Looker. What if we white-label Looker\'s embed while building our own?', trustDelta: 15, trulyGood: true }, { line: 'I can\'t justify 6 weeks for one customer.', trustDelta: -5, trulyGood: false }, { line: 'Fine, I\'ll override engineering — 3 weeks.', trustDelta: -10, trulyGood: false } ] } ], finalDebrief: 'Priya needed a creative path. The Looker embed gave her a solution without wrecking the roadmap.' },
  ],
  interview: [
    { product: 'Subscription fitness app', researchGoal: 'Understand why 7-day trial users aren\'t converting to paid subscriptions.', transcript: [ { speaker: 'interviewer', text: 'Walk me through your experience with the app this week.' }, { speaker: 'user', text: 'I liked the workouts but I didn\'t understand what I\'d get if I paid. The trial felt the same as the full version.' }, { speaker: 'interviewer', text: 'Did you see any prompts about upgrading?' }, { speaker: 'user', text: 'There was a banner on the settings page but I never go there. I just open the app, do a workout, and leave.' } ], temptingMisreads: 'Users don\'t see the value, so show more upgrade prompts.', realInsight: 'Pricing communication is in a dead zone (settings). Surface it post-workout when value is freshest.', strongAnswerLooksLike: 'Identify that pricing is in low-traffic areas and suggest high-engagement placement (post-workout).' },
  ],
  scope: [
    { product: 'E-commerce platform', ask: 'Add a real-time inventory tracking dashboard for merchants', engineerEstimate: '6 weeks minimum', engineerReasoning: 'We need to build a new WebSocket pipeline, a caching layer, and a new dashboard UI. The inventory team is already working on the API migration.', stakes: 'Merchant churn rate increasing. Competitors launched this feature 2 months ago.', strongAnswerLooksLike: 'Question whether all merchants need real-time (maybe daily sync for small merchants). Could we use polling or SSE instead of WebSockets?' },
  ],
  queryQuest: [
    { businessQuestion: 'How many users signed up last week?', query: 'SELECT COUNT(*) FROM users WHERE signup_date >= NOW() - INTERVAL 7 DAY;', bugType: 'missing_filter', bugExplanation: 'The query counts all users who signed up since 7 days ago, including those who may have deleted their accounts.', whatWentUnnoticed: 'The WHERE clause only checks signup date, not account status.', correctedQuery: 'SELECT COUNT(*) FROM users WHERE signup_date >= NOW() - INTERVAL 7 DAY AND deleted_at IS NULL;' },
  ],
  postmortem: [
    { incident: 'Database query degradation caused 3-min page load times for 25% of users for 45 minutes.', whatWentWell: [ 'Monitoring alerted within 2 minutes', 'Team identified the slow query within 10 minutes', 'Rollback was clean and fast' ], whatWentWrong: [ 'No query performance budget in CI/CD', 'Deploy was auto-promoted without canary testing', 'Incident response runbook was out of date' ], actionItems: [ 'Add query performance regression tests to CI', 'Require manual approval for DB schema changes', 'Schedule runbook review every 2 weeks' ] },
  ],
  trustSafety: [
    { issue: 'A user reported that an AI-generated response provided medical advice that could be dangerous if followed.', severity: 'high', contentCategory: 'health_advice', policyCategories: [ 'Medical advice prohibition', 'Safety-critical content', 'Expert certification requirement' ] },
  ],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
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

    try {
      const sys = (_opts.system || '').toLowerCase();
      const prompt = (_opts.prompt || '').toLowerCase();

      if (sys.includes('analytics case') || sys.includes('diagnostic') || sys.includes('root cause') || (prompt.includes('options') && prompt.includes('correct'))) {
        return pick(POOLS.metrics);
      }
      if (sys.includes('fermi') || sys.includes('estimation') || sys.includes('referenceanswer') || sys.includes('referencemethod')) {
        return pick(POOLS.guesstimate);
      }
      if (sys.includes('backlog') || sys.includes('ranking') || sys.includes('priorit')) {
        return pick(POOLS.prioritize);
      }
      if (sys.includes('product sense') || sys.includes('design a feature') || sys.includes('prompt') && prompt.includes('context')) {
        return pick(POOLS.productSense);
      }
      if (sys.includes('experiment') || sys.includes('ab test') || sys.includes('autopsy')) {
        return pick(POOLS.abTest);
      }
      if (sys.includes('incident') || sys.includes('blast radius') || sys.includes('crisis')) {
        return pick(POOLS.crisis);
      }
      if (sys.includes('north star') || sys.includes('business model') || (prompt.includes('candidates') && !prompt.includes('skeptic'))) {
        return pick(POOLS.northStar);
      }
      if (sys.includes('standoff') || sys.includes('stakeholder')) {
        if (prompt.includes('debrief') || prompt.includes('final trust')) {
          return { deEscalation: 20, transparency: 25, outcome: 18, judgmentScore: 63, debrief: 'You navigated the conversation thoughtfully. The strongest responses address the real concern, not just the surface complaint.' };
        }
        return pick(POOLS.standoff);
      }
      if (sys.includes('user interview') || sys.includes('transcript') || prompt.includes('interviewer')) {
        return pick(POOLS.interview);
      }
      if (sys.includes('scope') || sys.includes('engineer estimate') || prompt.includes('engineerestimate')) {
        return pick(POOLS.scope);
      }
      if (sys.includes('query') || sys.includes('sql') || sys.includes('bugtype')) {
        return pick(POOLS.queryQuest);
      }
      if (sys.includes('postmortem') || sys.includes('post-mortem') || prompt.includes('whatwentwrong')) {
        return pick(POOLS.postmortem);
      }
      if (sys.includes('trust') || sys.includes('safety') || sys.includes('moderation')) {
        return pick(POOLS.trustSafety);
      }

      // Default
      return pick(POOLS.metrics);
    } catch (e) {
      setError('Could not generate scenario. Try again.');
      setErrorType('fallback');
      return null;
    }
  }, []);

  return { loading, error, errorType, generate, reset };
}