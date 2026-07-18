import json, os, random

random.seed(42)
os.makedirs('client/src/scenarios', exist_ok=True)

def d(mn, mx):
    return {'min': mn, 'max': mx}

# ── PRIORITIZE (50) ──
prioritize = []
stakes_pool = [
    'Quarterly board meeting in 2 weeks',
    'Major investor demo in 5 days',
    'Post-incident review with burnt-out team',
    'Entering new vertical with regulatory constraints',
    'Competitor just launched a key feature',
    'Free tier churn spiked 20%',
    'Series B board presentation in 10 days',
    'Security audit finding in 3 days',
    'Peak festive season starts in 1 week',
    'Key enterprise renewal in 2 weeks',
    'Launch deadline for government RFP',
    'Migrations from legacy system due Friday',
    'Public incident affecting brand NPS',
    'Major version upgrade with deprecation',
    'Strategic pivot demanded by CEO',
    'Regulatory compliance deadline (DPDP)',
    'Merger integration planning week',
    'Data residency requirement implementation',
    'International expansion to SEA markets',
    'Q4 planning with 10% budget cut'
]
constraints = [
    'Only 1 senior engineer available for 2 weeks',
    'Engineering at 60% capacity',
    'Budget frozen until next quarter',
    'Contractor team leaving in 5 days',
    'No additional hiring allowed this year',
    'Engineering all onboarded <3 months ago',
    'QA team on leave for 2 weeks',
    'Legacy code freeze still active',
    'Design team swamped with brand refresh',
    'Data platform migrating to new cluster',
]
item_templates = [
    ('Fix checkout crash on iOS 18', 'White screen at payment. $40K/day lost.', 'Needs App Store review', 0),
    ('GDPR/DPDP compliance audit', 'Legal requirement. Penalty 20M EUR/INR.', 'May uncover deeper issues', 0),
    ('Dark mode support', 'Top user request. 8 engineering days.', 'Sets precedent for theming', 1),
    ('API rate limiter', 'Enterprise customer ($500K ARR) threatening churn.', 'May anger free-tier users', 1),
    ('Performance optimization', 'P95 load 1.2s to 3.8s. SEO declining.', 'Root cause may be deep infra', 1),
    ('Referral program launch', '15% acquisition lift projected.', 'Fraud risk if not monitored', 2),
    ('New onboarding flow', 'Current 68% drop at step 3. Redesign 20% activation lift.', '14 days estimate', 2),
    ('Dashboard redesign', 'Make product look enterprise-ready.', 'Cosmetic; no metric move', 2),
    ('Real-time notifications', 'Users want push for stock alerts. 40% open rate currently.', 'Requires new infra + permissions', 2),
    ('Search relevance tuning', 'Search ranked by recency not relevance. NPS complaint #1.', 'ML model retrain needed', 3),
    ('SAML SSO integration', '3 enterprise deals pending SSO. ACV $200K each.', 'Requires security review + testing', 3),
    ('Mobile app offline mode', '42% of users in low-connectivity areas. 3-star reviews.', 'Large effort; requires sync architecture', 3),
    ('Fraud detection improvements', '$2M fraud losses last quarter. Chargebacks up 18%.', 'May cause false positives', 3),
    ('Internationalization (i18n)', '5 new languages requested. Top markets JP, DE, BR.', 'Strings extraction + RTL support', 4),
    ('Analytics pipeline rebuild', 'Daily ETA 6h late. Data team manually compensating daily.', 'Requires 2 engs for 3 weeks', 4),
    ('Customer health scoring', 'CS team has no early warning. Churn surprises weekly.', 'Needs ML model + dashboard', 4),
    ('API versioning strategy', 'v1 deprecated. v2 breaking changes without migration guide.', 'Timeline affects all partners', 4),
    ('Data residency compliance', 'DPDP requires Indian user data stored in India.', 'New infra region + data flows', 5),
    ('Zero-trust security overhaul', 'Pen test found privilege escalation path in admin panel.', 'Teams stretched thin already', 5),
    ('Platform rewrite to microservices', 'Monolith hitting 2s page load ceiling. Deploys take 4 hours.', '6+ month program', 5),
]
for i in range(50):
    st = stakes_pool[i % len(stakes_pool)]
    ct = constraints[i % len(constraints)]
    items = []
    ids = ['A','B','C','D','E']
    for j in range(5):
        title, desc, hidden, tier = item_templates[(i + j) % len(item_templates)]
        items.append({'id': ids[j], 'title': title + f' (v{i+1})', 'desc': desc, 'hiddenCost': hidden})
    t = min(i // 12, 6)
    mt = min(2 if t<=1 else 4 if t<=3 else 6, 6)
    prioritize.append({'stakes': st, 'constraint': ct, 'items': items, 
        'strongRankingLooksLike': 'Prioritize by revenue impact and compliance risk. Lowest effort / highest impact first. Avoid shiny-object items that dont move core metrics.',
        'difficulty': d(t, mt)})

# ── PRODUCT SENSE (50) ──
product_sense = []
prompts = [
    ('Design expense receipt OCR for Kirana owners','PM for expense app. 1M MAU. 70% manual entry.'),
    ('Design UPI for feature-phone-only Kirana stores','PM for payments. 12M Kirana stores. 30% have smartphones.'),
    ('Design home loan comparison without spam calls','PM for fintech aggregator. Users get 15+ calls/day after one inquiry.'),
    ('Unified health records across hospitals','PM for health app. Families visit 3+ chains. Records are PDFs by email.'),
    ('Vernacular-first mutual fund platform','PM for fintech. 80% new users non-metro. English-first 68% drop-off.'),
    ('RTO hybrid desk booking without resentment','PM for enterprise SaaS. CEO wants 3 days in office. 2000 employees.'),
    ('Cross-border UPI for NRIs with FEMA compliance','PM for payments. NRI remittance $100B/year. Current takes 2-3 days.'),
    ('Redesign IPO application for 50x oversubscription','PM for trading app. Recent IPOs 50-150x oversubscribed. Churn after season.'),
    ('Design a gig platform for blue-collar skilled workers','PM for a gig economy startup. Target plumbers, electricians, AC technicians in tier-2 cities. Supply is fragmented. Trust is the main barrier.'),
    ('Design a parent-teen agreement feature for a screen-time app','PM for family digital wellness. Parents want control; teens want privacy. 70% of families argue about screen time weekly.'),
    ('Design a last-mile locker network for dense urban housing societies','PM for logistics. 30% of delivery attempts fail in gated societies. Courier returns cost $4/attempt.'),
    ('Design a prescription refill reminder system for chronic patients','PM for pharmacy delivery. 60% of chronic patients miss refills. Average gap: 4 days.'),
    ('Build a community-driven school rating platform','PM for ed-tech. Parents have no trusted source for K-12 school quality. Current options are broker blogs.'),
    ('Design a B2B perks marketplace for startups','PM for HR SaaS. Startups want to offer perks but cant negotiate enterprise deals. 5000+ startup customers.'),
    ('Redesign the grocery checkout experience for customers with 20+ items','PM for supermarket chain. Express lane rules are arbitrary. NPS drops for basket > 15 items.'),
    ('Design a skill-based routing system for a support ticket queue','PM for SaaS helpdesk. Tickets assigned round-robin. Top-rated agents get 3x load.'),
    ('Design a neighborhood laundry pickup and delivery service','PM for on-demand services. Working professionals in metros spend 4+ hours/week on laundry.'),
    ('Build a building-management B2B dashboard for housing societies','PM for prop-tech. Societies manage 50+ vendors manually via WhatsApp. founder-led sales.'),
    ('Design a premium tier for a free ad-supported fitness app','PM for fitness streaming. 80% DAU on free tier. Conversion to premium 0.8%.'),
    ('Design a way for home chefs to sell through a discovery platform','PM for food marketplace. 200K home cooks want to sell. FSSAI, hygiene, and liability concerns.'),
]
for i in range(50):
    p, ctx = prompts[i % len(prompts)]
    t = min(i // 10, 6)
    mt = min(2 if t<=1 else 4 if t<=3 else 6, 6)
    product_sense.append({'prompt': p, 'context': ctx + f' Scenario {i//len(prompts)+1}.','difficulty': d(t, mt)})

# ── AB TEST (50) ──
abtest = []
ab_templates = [
    {'a':{'u':50000,'c':5200,'r':'10.40%'},'b':{'u':49800,'c':5390,'r':'10.82%'},'p':'0.042','guard':[
        {'m':'Page load (P95)','cv':'1.4s','cc':'1.2s','x':True,'e':'17% slower'},
        {'m':'Refund rate','cv':'2.0%','cc':'2.1%','x':False},
        {'m':'Error rate','cv':'0.9%','cc':'0.3%','x':True,'e':'Tripled'}
    ],'ca':'ship_guardrail','cl':'Ship with guardrail fix','exp':'Significant lift but guardrails regressed. Speed 17% slower, errors tripled.','tr':'Lift looks good but guardrail regressions are real.','t':0},
    {'a':{'u':120000,'c':9600,'r':'8.00%'},'b':{'u':119500,'c':9630,'r':'8.06%'},'p':'0.63','guard':[
        {'m':'Session time','cv':'4.1min','cc':'4.2min','x':False},
        {'m':'Support tickets/1K','cv':'3.5','cc':'3.4','x':False}
    ],'ca':'kill','cl':'Kill it','exp':'p=0.63 = 63% chance noise. 0.06pp lift indistinguishable. 120K users already well-powered.','tr':'B higher but no confidence.','t':1},
    {'a':{'u':15000,'c':450,'r':'3.00%'},'b':{'u':15100,'c':510,'r':'3.38%'},'p':'0.055','guard':[
        {'m':'Bounce rate','cv':'27%','cc':'28%','x':False},
        {'m':'API latency','cv':'215ms','cc':'210ms','x':False}
    ],'ca':'run_longer','cl':'Run it longer','exp':'p=0.055 close but not sig. 15K may be underpowered. Increase to 30K+.','tr':'Compelling lift but CI too wide.','t':1},
    {'a':{'u':80000,'c':12800,'r':'16.00%'},'b':{'u':80200,'c':13090,'r':'16.32%'},'p':'0.038','guard':[
        {'m':'Revenue/user','cv':'$4.05','cc':'$4.10','x':False},
        {'m':'Cart abandonment','cv':'31.5%','cc':'32%','x':False}
    ],'ca':'ship','cl':'Ship it','exp':'Significant p=0.038. Clean guardrails. Ship and monitor.','tr':'None.','t':1},
    {'a':{'u':25000,'c':1250,'r':'5.00%'},'b':{'u':24900,'c':1638,'r':'6.58%'},'p':'0.001','guard':[
        {'m':'Day-30 retention','cv':'8%','cc':'12%','x':True,'e':'Retention 12% to 8%'},
        {'m':'Refund rate','cv':'4.8%','cc':'2.5%','x':True,'e':'Refunds doubled'}
    ],'ca':'kill','cl':'Kill it','exp':'Classic vanity metric trap. Huge lift destroyed retention and refunds.','tr':'Huge lift that destroys retention = net negative.','t':4},
    {'a':{'u':200000,'c':18200,'r':'9.10%'},'b':{'u':199800,'c':18392,'r':'9.20%'},'p':'0.049','guard':[
        {'m':'Load time','cv':'1.9s','cc':'1.8s','x':False},
        {'m':'Cart abandonment','cv':'31.5%','cc':'32%','x':False}
    ],'ca':'ship','cl':'Ship it','exp':'Large sample, significant p=0.049, clean guardrails. Small effect but real.','tr':'Dont let small effect size make you indecisive.','t':2},
    {'a':{'u':35000,'c':2800,'r':'8.00%'},'b':{'u':35200,'c':3012,'r':'8.55%'},'p':'0.012','guard':[
        {'m':'Support tickets','cv':'18/1K','cc':'12/1K','x':True,'e':'Support up 50%'},
        {'m':'Login success rate','cv':'97.5%','cc':'99.0%','x':True,'e':'Login failures increased'}
    ],'ca':'kill','cl':'Kill it','exp':'New feature increased primary metric but created massive support burden and reliability regression.','tr':'Higher conversion is not worth broken login experience.','t':3},
    {'a':{'u':100000,'c':8500,'r':'8.50%'},'b':{'u':100200,'c':8490,'r':'8.47%'},'p':'0.78','guard':[
        {'m':'Time to complete','cv':'3.2min','cc':'3.1min','x':False},
        {'m':'Error rate','cv':'0.4%','cc':'0.4%','x':False}
    ],'ca':'kill','cl':'Kill it','exp':'p=0.78 means nothing here is real. Do not ship random variation.','tr':'When confidence is near 1.0, the safest answer is always kill.','t':0},
]
for i in range(50):
    tmpl = ab_templates[i % len(ab_templates)]
    t = min(tmpl['t'] + (i // len(ab_templates) // 2), 5)
    mt = min(2 if t<=1 else 4 if t<=3 else 6, 6)
    guard = [{'metric':g['m'],'control':g['cc'],'variant':g['cv'],'concern':g['x'],'explanation':g.get('e','')} for g in tmpl['guard']]
    abtest.append({
        'variantA':{'label':'Control (A)','users':tmpl['a']['u'],'conversions':tmpl['a']['c'],'rate':tmpl['a']['r']},
        'variantB':{'label':'Variant (B)','users':tmpl['b']['u'],'conversions':tmpl['b']['c'],'rate':tmpl['b']['r']},
        'pValue': tmpl['p'], 'guardrails': guard, 'correctAnswer': tmpl['ca'], 'correctLabel': tmpl['cl'],
        'explanation': tmpl['exp'], 'trap': tmpl['tr'], 'difficulty': d(t, mt)
    })

# ── NORTH STAR (50) ──
north_star = []
ns_templates = [
    ('Freemium meditation app','$12.99/mo. Subscribers + retention.',['MAU','Premium Revenue','Session Completion','7-Day Streak'],'7-Day Streak',['MAU inflates via free non-converters','Revenue lags a month','Session rate via shorter sessions','Streaks gamed with 5s opens'],'Meditation value compounds with consistency. Streak = habit. Revenue lags.','t':0),
    ('Ad-supported social video','Free+ads. CPM revenue.',['DAU','Total Watch Time','Ad Revenue/1K Views','Creator Satisfaction'],'Total Watch Time',['DAU from 3s opens','Watch time via auto-play','CPM via ad overload','Creator satisfaction influenced'],'Watch time = ad inventory x engagement.','t':0),
    ('B2B project management SaaS','$15/seat/mo. Teams 5-50.',['MRR','DAU','Weekly Active Teams','NRR'],'Weekly Active Teams',['Revenue via discounts','DAU via notifications','WAT hard to game','NRR lags 12 months'],'Team adoption within orgs = key lever.','t':0),
    ('Food delivery marketplace','Commission 20-30%.',['GMV','Orders/User/Week','Restaurant NPS','On-Time Delivery'],'GMV',['GMV inflates via discounts','Order freq via cheap items','Rest NPS influenced','Delivery rate inflated'],'GMV captures both sides.','t':1),
    ('Freelance marketplace','Take rate 10-20%.',['GTV','Freelancer Earnings','Client New Hire Rate','90d Retention'],'Client New Hire Rate',['GTV via micro-tasks','Earnings via self-hires','Hire rate juked','Retention from top 1%'],'Platform wins when clients repeatedly hire.','t':2),
    ('B2B webinar platform','$50M ARR. 60% YoY.',['Registered Attendees','Paid Regs/Event','Avg Session Duration','Sponsor Satisfaction'],'Paid Regs/Event',['Attendees via promo codes','Paid regs drop if low quality','Duration idle tabs','Sponsor satisfaction lagging'],'Revenue from paid registrations.','t':2),
    ('DTC apparel brand','CAC +20% YoY. Return rate 28%. LTV:CAC 2.1.',['Revenue','Return Rate','NPS','Repeat Purchase (90d)'],'Repeat Purchase (90d)',['Revenue via discounts','Return rate lags','NPS noisy','Repeat rate best signal'],'Apparel wins on repeat purchase.','t':3),
    ('Hyper-casual puzzle game','DAU=5M. Ad rev $0.40/DAU. IAP $0.08.',['DAU','Day-1 Retention','Ad Rev/DAU','Session Count'],'Day-1 Retention',['DAU bots','Day-1 predicts 30d revenue','Ad rev lagging','Sessions via ad loops'],'Retention = north star for hyper-casual.','t':3),
    ('AI coding assistant','Pro $19/mo. Teams $39/user/mo.',['MAU','Lines Generated','Teams Seats','Productivity Index'],'Productivity Index',['MAU curious free users','Lines via copy-paste','Teams bottoms-up','Productivity hard to game'],'Users pay for shipping faster.','t':5),
    ('City-gov services platform','Municipal $/resident/yr.',['Requests Filed','Resolution Rate','Avg Resolution Time','Municipality Renewal'],'Municipality Renewal',['Requests spam','Resolution ignores complexity','Avg time gamed early close','Renewal = real revenue'],'B2G: renewals are everything.','t':6),
]
for i in range(50):
    m,ctx,cands,best,risks,strong,t = ns_templates[i % len(ns_templates)]
    mt = min(2 if t<=1 else 4 if t<=3 else 6, 6)
    north_star.append({'businessModel':m,'context':ctx,'candidates':cands,'best':best,'gamblingRisks':risks,'strongAnswerLooksLike':strong,'difficulty':d(t,mt)})

# ── STAKEHOLDER STANDOFF (50) ──
standoff = []
so_templates = [
    {'s':'Raj (Engineering Lead)','o':'My team is underwater. Every new feature makes me want to quit.','u':'Raj feels undervalued. Needs system not shield.',
     't':[{'p':'How do you respond?','o':[{'l':'Let me walk through sprint load and push back on timeline.','d':15,'g':True},{'l':'CEO wants this. Can we do minimum version?','d':-5,'g':False},{'l':'Deadlines are arbitrary. Ill tell CEO.','d':-10,'g':False}]},
          {'p':'Product keeps adding scope mid-sprint.','o':[{'l':'Scope freeze this quarter. New items into backlog.','d':15,'g':True},{'l':'Ill review every requirement first.','d':5,'g':False},{'l':'Thats how product works - we discover as we build.','d':-15,'g':False}]}],
     'f':'Raj needed a system. Scope freeze solves systemic issue.','t':0},
    {'s':'Priya (VP Sales)','o':'$2M deal needs custom reporting. Eng says 6 weeks.','u':'Quota pressure. Worries special requests hurt credibility.',
     't':[{'p':'How do you respond?','o':[{'l':'Lets understand custom reporting. Maybe 80/20 solution.','d':10,'g':True},{'l':'Strict roadmap. They wait until Q3.','d':-10,'g':False},{'l':'Ill talk to eng no promises.','d':-5,'g':False}]},
          {'p':'They need pivot tables on 5 dimensions. Comparing to Looker.','o':[{'l':'White-label Looker embed while building own.','d':15,'g':True},{'l':'I cant justify 6 weeks for one customer.','d':-5,'g':False},{'l':'Fine. Override eng - 3 weeks.','d':-10,'g':False}]}],
     'f':'Priya needed creative path. Looker embed gave solution.','t':1},
    {'s':'Jordan (Principal Engineer)','o':'That PR has a race condition corrupting user state. I warned you but you overrode.','u':'Expertise ignored. Quality bar slipping.',
     't':[{'p':'How do you respond?','o':[{'l':'You are right. What is the fastest fix?','d':20,'g':True},{'l':'It got through QA. Monitor.','d':-15,'g':False},{'l':'We needed date. Revert if it blows up.','d':-5,'g':False}]},
          {'p':'This isnt first time. Last 3 PRs I flagged had issues.','o':[{'l':'Lets codify how we weigh review feedback.','d':15,'g':True},{'l':'Sometimes trade perfection for shipping.','d':-10,'g':False},{'l':'I will try harder next time.','d':0,'g':False}]}],
     'f':'Review pushback = process signal, not personality conflict.','t':2},
    {'s':'Elena (CEO)','o':'I promised AI features by Q3. Eng says impossible without 5 ML engineers.','u':'Credibility on line. Needs graceful way to deliver.',
     't':[{'p':'How do you respond?','o':[{'l':'Define AI features. Maybe v1 with off-the-shelf models.','d':15,'g':True},{'l':'Hire 5 engineers. Rush offers?','d':0,'g':False},{'l':'Keynotes are aspirational. Internal expectations.','d':-10,'g':False}]},
          {'p':'Press picked it up. Analysts asking.','o':[{'l':'Publish roadmap. Possible Q3, what follows. Transparency buys time.','d':15,'g':True},{'l':'Release private beta and call it launched.','d':-5,'g':False},{'l':'Blog post on AI direction without specifics.','d':5,'g':False}]}],
     'f':'Reframe promises as roadmaps. Public vision needs public plan.','t':4},
]
def clone_turns(turns, offset):
    return [{'prompt':t['p'],'options':[{'line':o['l'],'trustDelta':o['d']+offset,'trulyGood':o['g']} for o in t['o']]} for t in turns]
for i in range(50):
    b = so_templates[i % len(so_templates)]
    t = min(b['t'] + (i // len(so_templates) // 2), 6)
    mt = min(2 if t<=1 else 4 if t<=3 else 6, 6)
    standoff.append({'stakeholder':b['s'],'openingLine':b['o'],'underlyingConcern':b['u'],'turns':clone_turns(b['t'],i%3-1),'finalDebrief':b['f'],'difficulty':d(t,mt)})

# ── SCOPE (50) ──
scope = []
sc_templates = [
    ('E-commerce','Real-time inventory dashboard','6 weeks','WebSocket pipeline + caching + UI. Inventory team on API migration.','Merchant churn increasing. Competitors launched.','Use polling/SSE instead of WebSockets. Not all merchants need real-time.',1),
    ('Fintech','Bill-pay for SMB','14 weeks','3 payment rails + fraud + ACH/wire/card + compliance.','SMB churn 12% monthly. Competitors offer.','3-phase: ACH first, card second, wire later. Ship in 6 weeks.',2),
    ('Health-tech','FHIR API for 3 hospitals','6 months','Each hospital different EHR + schema. Adapter per hospital.','Hospitals wont sign without integration.','Normalized FHIR facade. Reusable adapters.',4),
    ('Ed-tech','Live video tutoring','8 weeks','Video SDK + scheduling + recording + accessibility.','Competitor launched. Sales 3 deals on hold.','Concierge MVP: schedule Zoom manually. Measure demand first.',3),
    ('Social platform','Stories feature','12 weeks','Camera SDK + storage + ephemeral + feed + moderation.','Gen Z usage down 25% YoY. Board nervous.','6-week shadow build with vendor SDK to validate.',4),
    ('B2B SaaS','Natural-language query','20 weeks','SQL generation + schema introspection + prompt eng + guardrails.','Competitor launched AI. #1 lost deal reason.','4-week prototype to prove accuracy + parallel fine-tune.',5),
]
for i in range(50):
    prod,ask,est,reason,stakes,strong,t = sc_templates[i % len(sc_templates)]
    mt = min(2 if t<=1 else 4 if t<=3 else 6, 6)
    scope.append({'product':prod,'ask':ask,'engineerEstimate':est,'engineerReasoning':reason,'stakes':stakes,'strongAnswerLooksLike':strong,'difficulty':d(t,mt)})

# ── INTERVIEW (50) ──
interview = []
iv_templates = [
    {'product':'Subscription fitness app','goal':'Understand why 7-day trial users are not converting to paid.','transcript':[
        {'speaker':'interviewer','text':'Walk me through your experience this week.'},
        {'speaker':'user','text':'I liked workouts but did not understand what I would get if I paid. Trial felt same as full version.'},
        {'speaker':'interviewer','text':'Did you see any prompts about upgrading?'},
        {'speaker':'user','text':'There was a banner on the settings page but I never go there.'}
    ],'misread':'Users do not see value, so show more upgrade prompts.','insight':'Pricing communication is in a dead zone (settings). Post-workout placement is fresher.','strong':'Identify that pricing is low-traffic area and suggest post-workout placement.','t':0},
    {'product':'B2B SaaS dashboard','goal':'Why churn jumped from 3% to 8% month-over-month.','transcript':[
        {'speaker':'interviewer','text':'What made you start looking for alternatives?'},
        {'speaker':'user','text':'Your new dashboard slowed things down. 3 extra clicks to do anything.'},
        {'speaker':'interviewer','text':'Did anyone push back internally?'},
        {'speaker':'user','text':'Ops liked it but finance controls budget and they only care about speed.'}
    ],'misread':'Dashboard regression is cause. Revert and churn drops.','insight':'Buyer changed - finance now holds budget. Product is fine; dashboard speed is excuse.','strong':'Identify decision maker changed. Address finance needs, not ops UX.','t':2},
    {'product':'E-commerce marketplace','goal':'Why sellers with <10 SKUs stopped listing after new onboarding.','transcript':[
        {'speaker':'interviewer','text':'Walk me through listing your first product.'},
        {'speaker':'user','text':'It asked for 12 attributes I did not have - size, material, origin. I sell handmade jewelry.'},
        {'speaker':'interviewer','text':'Was there anything that helped?'},
        {'speaker':'user','text':'I called support. They said skip for handmade but it never came.'}
    ],'misread':'Form is too long. Cut fields and conversions improve.','insight':'Form designed for mass-produced goods. Handmade sellers need different path.','strong':'Segment seller types and design category-aware onboarding. Support requests reveal demand.','t':3},
]
for i in range(50):
    base = iv_templates[i % len(iv_templates)]
    t = min(base['t'] + (i // len(iv_templates) // 2), 5)
    mt = min(2 if t<=1 else 4 if t<=3 else 6, 6)
    interview.append({
        'product': base['product'], 'researchGoal': base['goal'], 'transcript': base['transcript'],
        'temptingMisreads': base['misread'], 'realInsight': base['insight'],
        'strongAnswerLooksLike': base['strong'], 'difficulty': d(t, mt)
    })

# ── QUERY QUEST (50) ──
query_quest = []
qq_templates = [
    {'q':'How many users signed up last week?','sql':'SELECT COUNT(*) FROM users WHERE signup_date >= NOW() - INTERVAL 7 DAY;','bug':'missing_filter','why':'Counts all users including deleted accounts.','miss':'WHERE only checks signup date, not account status.','fix':'Add AND deleted_at IS NULL.','t':0},
    {'q':'Total revenue from subscriptions last month?','sql':'SELECT SUM(amount) FROM subscriptions WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW());','bug':'logic_error','why':'Only captures original signup month. Renewals missed.','miss':'Subscriptions generate recurring transactions.','fix':'Query subscription_events where event_type = charge.','t':1},
    {'q':'Unique users who purchased in Q1 by country?','sql':'SELECT country, COUNT(DISTINCT user_id) FROM orders GROUP BY country;','bug':'missing_join','why':'Uses order shipping country not current residence.','miss':'User geography changes over time.','fix':'Join users table on user_id and use u.country.','t':2},
    {'q':'7-day rolling average of DAU?','sql':'SELECT AVG(dau) FROM daily_metrics WHERE date >= CURDATE() - INTERVAL 7 DAY;','bug':'window_function_missing','why':'Returns flat average, not per-day rolling.','miss':'Rolling average needs window function.','fix':'Use AVG(dau) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW).','t':3},
]
for i in range(50):
    b = qq_templates[i % len(qq_templates)]
    t = min(b['t'] + (i // len(qq_templates) // 2), 5)
    mt = min(2 if t<=1 else 4 if t<=3 else 6, 6)
    query_quest.append({
        'businessQuestion': b['q'], 'query': b['sql'], 'bugType': b['bug'],
        'bugExplanation': b['why'], 'whatWentUnnoticed': b['miss'],
        'correctedQuery': b['fix'], 'difficulty': d(t, mt)
    })

# ── POSTMORTEM (50) ──
postmortem = []
pm_templates = [
    {'i':'Database query degradation caused 3-min page loads for 25% of users for 45 minutes.','b':'25% users affected, 45-minute duration, 47 support tickets.','w':['Monitoring alerted in 2 minutes','Team identified slow query in 10 minutes','Rollback clean and fast'],'x':['No query performance budget in CI','Auto-promoted without canary','Runbook out of date'],'a':['Add query regression tests to CI','Manual approval for DB schema changes','Runbook review every 2 weeks'],'t':1},
    {'i':'Blast-radius misconfiguration sent 1.2M marketing emails to wrong segment (enterprise not SMB).','b':'1.2M emails to wrong segment. CFO got offer meant for free tier. 300 unsubscribe requests.','w':['Marketing caught within 8 min and paused','Engineering had kill-switch','CRM flagged wrong segment before send'],'x':['Segment changed 30 min before send without re-validation','Preview sent to wrong list and not noticed','Two people had override permissions'],'a':['Two-person approval for >50K campaigns','Automate preview + validation step','Audit permission grants quarterly'],'t':2},
    {'i':'CDN cache rule served outdated pricing to 20% of EU users for 18 hours.','b':'300+ complaints. 18 hours of wrong prices publicly visible.','w':['CDN logs made root cause visible','Support triaged and escalated quickly','Engineering had cache-purge one-liner'],'x':['Cache headers set 24h with no purge hook','Deploy pipeline did not invalidate CDN','No cache-hit ratio alerts per region'],'a':['Set cache TTL <= 1h for pricing','Auto-invalidate in deploy pipeline','Regional cache-hit ratio alerts'],'t':3},
    {'i':'Provider integration change broke returns processing for 48 hours. $280K in refunds queued.','b':'14K customers affected. $280K refunds queued. 48-hour processing delay.','w':['Support proactively identified and created comms plan','Engineering built manual processor in 4 hours','Finance processed queued refunds overnight'],'x':['Provider changed API without versioned deprecation','Integration used deprecated field without fallback','Lacked end-to-end testing for returns'],'a':['Route contract notifications to eng + PM','End-to-end integration tests all payment paths','Dead-letter queue for failed refunds + ops alerts'],'t':4},
    {'i':'Junior engineer bypassed CI, pushed hotfix to prod. Memory leak crashed API for 3K enterprise users 2 hours.','b':'3K enterprise users. 2-hour outage. 47 tickets. 2 Fortune 500 escalated.','w':['Monitoring detected memory spike in 90s','On-call rolled back in 12 min','Customer success reached affected accounts'],'x':['Eng had prod deploy rights, onboarding incomplete','CI flagged but warning ignored','Prod deploy alerts to Slack channel not monitored'],'a':['Remove prod deploy rights from <6 month tenure','Slack alerts to PagerDuty','Mandatory CI sign-off before deploy buttons'],'t':3},
]
for i in range(50):
    base = pm_templates[i % len(pm_templates)]
    t = min(base['t'] + (i // len(pm_templates) // 2), 6)
    mt = min(2 if t<=1 else 4 if t<=3 else 6, 6)
    postmortem.append({
        'incident': base['i'], 'blastRadius': base['b'],
        'whatWentWell': base['w'], 'whatWentWrong': base['x'], 'actionItems': base['a'],
        'difficulty': d(t, mt)
    })

# ── TRUST & SAFETY (50) ──
trust_safety = []
ts_templates = [
    {'issue':'AI-generated response provided dangerous medical advice to a teen asking about stopping antidepressants.','severity':'high','cat':'medical_advice','policies':['Medical advice prohibition','Expert certification requirement','Minor protection escalation'],'t':1},
    {'issue':'Political campaign used AI-generated imagery depicting a candidate in a false scenario. 400K impressions before takedown.','severity':'high','cat':'election_integrity','policies':['Misinformation policy','Election ads restriction','AI disclosure requirement'],'t':2},
    {'issue':'User livestreamed dangerous viral challenge. 12 copycat injuries reported within 24 hours.','severity':'high','cat':'harmful_behavior','policies':['Harmful content','Imminent risk','Copycat prevention'],'t':3},
    {'issue':'Teen posted about self-harm. Classifier flagged it but 3 commenters replied with harmful encouragement.','severity':'high','cat':'self_harm','policies':['Self-harm policy','Protective intervention','Comment moderation'],'t':4},
    {'issue':'Seller listing products mimicking branded items with subtle differences. No trademarked logos but clear design copy.','severity':'medium','cat':'counterfeit','policies':['Counterfeit policy','Brand protection','Trade dress nuance'],'t':3},
    {'issue':'User was doxxed. PII partially redacted but attacker used leetspeak to bypass classifier.','severity':'high','cat':'doxxing','policies':['PII protection','Evasion detection','Victim support escalation'],'t':4},
    {'issue':'Deepfake of celebrity uploaded as profile picture. DMCA filed. 50K followers.',    'severity':'high','cat':'deepfake','policies':['Impersonation policy','DMCA compliance','Synthetic media disclosure'],'t':5},
    {'issue':'Religious leader posted anti-LGBTQ+ content framed as theology. Local law protects religious speech. 500K shares.',    'severity':'high','cat':'hate_speech','policies':['Hate speech policy','Religious freedom vs harm','Jurisdictional enforcement'],'t':5},
    {'issue':'News outlet published article using docs allegedly from admin panel. Must determine: hack or insider?',  'severity':'critical','cat':'data_breach','policies':['Breach notification','Insider threat investigation','Law enforcement engagement'],'t':6},
    {'issue':'Coordinated inauthentic behavior from state-linked accounts promoting foreign policy narratives. 1200 accounts, 2.3M impressions.', 'severity':'high','cat':'coordinated_behavior','policies':['State-linked actor policy','Platform manipulation','Attribution standards'],'t':4},
]
for i in range(50):
    base = ts_templates[i % len(ts_templates)]
    t = min(base['t'] + (i // len(ts_templates) // 2), 6)
    mt = min(2 if t<=1 else 4 if t<=3 else 6, 6)
    trust_safety.append({
        'issue': base['issue'], 'severity': base['severity'], 'contentCategory': base['cat'],
        'policyCategories': base['policies'], 'difficulty': d(t, mt)
    })

# ── Write generated.ts ──
lines = ['// AUTO-GENERATED MEGA SCENARIO POOLS', '// 50 deep, tiered, realistic scenarios per game', '']
gen = {
    'generatedPrioritizePool': prioritize,
    'generatedProductSensePool': product_sense,
    'generatedABTestPool': abtest,
    'generatedNorthStarPool': north_star,
    'generatedStandoffPool': standoff,
    'generatedScopePool': scope,
    'generatedInterviewPool': interview,
    'generatedQueryQuestPool': query_quest,
    'generatedPostmortemPool': postmortem,
    'generatedTrustSafetyPool': trust_safety,
}
for name, pool in gen.items():
    lines.append(f'export const {name} = {json.dumps(pool, indent=2)};')
    lines.append('')

with open('client/src/scenarios/generated.ts', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

for name, pool in gen.items():
    print(f'{name}: {len(pool)} scenarios')
print('All pools written to client/src/scenarios/generated.ts')