import json, os

def d(mn, mx):
    return {'min': mn, 'max': mx}

# Read base template scenarios from a JSON file
# This avoids Python string escaping issues
os.makedirs('client/src/scenarios', exist_ok=True)

# Generate metrics pool (50 scenarios from 20 base templates with tier variations)
metrics_base = json.loads('''[
  {"product":"Swiggy","n":"Order Completion Rate","ch":"down 12%","ctx":"Payment dropoff concentrated in tier-2 cities after deploy. AOV unchanged.","opt":["New payment SDK added 300ms delay on confirm page","Competitor ran promotions in different segment","Analytics migration missed events","Holiday season demand pull-forward"],"correct":0,"t":0},
  {"product":"Zomato","n":"Restaurant Onboarding Time","ch":"up 35%","ctx":"New restaurants take 5 days longer to go live after form redesign. 18% churn of pending restaurants.","opt":["FSSAI license now mandatory field - most small restaurants lack it","KYC provider had 48h outage","Input cost inflation causing delays","Increased verification due to festival season"],"correct":0,"t":0},
  {"product":"Flipkart","n":"Cart Recovery Rate","ch":"down 14%","ctx":"Mobile web users in Hindi setting dropping purchases.","opt":["Hindi localization broke price formatting on older devices","Payment bank changed redirect URL","Shipping fee moved below fold","Competitor offering free shipping"],"correct":0,"t":1},
  {"product":"Uber","n":"Driver Acceptance Rate","ch":"down 9%","ctx":"Drivers accepting fewer rides in Bengaluru traffic hotspots.","opt":["New driver radius limit cut from 5km to 3km reducing pool","OLA offering higher incentives","Driver app 4.8 crashes on route accept","Fuel price making short trips unattractive"],"correct":0,"t":1},
  {"product":"CRED","n":"Referral Conversion","ch":"down 28%","ctx":"25-35 age group not completing onboarding after clicking referral link.","opt":["PAN verification required before showing value - 68% drop at step 1","Referral reward cut from Rs500 to Rs200","RBI change slowed credit score fetching","Deep link app opening on blank screen"],"correct":0,"t":2},
  {"product":"Razorpay","n":"Payment Success Rate","ch":"down 2.1pp","ctx":"Small merchants under 50 txns/day affected. Larger merchants fine.","opt":["New routing sends small merchants through cheaper but worse gateway","DDoS attack on specific ASNs","Merchants migrated from v1 to v2 API","RBI mandate affecting non-UPI payments"],"correct":0,"t":2},
  {"product":"PhonePe","n":"UPI Txn Success","ch":"down 1.8pp","ctx":"Weekend P2M payments failing more. Dropped from 99% to 97.2%.","opt":["NPCI double-factor auth for >Rs5000 timing out under load","PhonePe app v8.4 UPI pin bug","Bank partner server migration","Higher weekend volumes causing congestion"],"correct":0,"t":2},
  {"product":"MakeMyTrip","n":"Hotel Booking Conversion","ch":"down 16%","ctx":"3-star hotel bookings in Goa dropping most.","opt":["Price comparison widget shows competitor cheaper rates","Goa hotel prices peaked seasonally","Payment gateway intermittent failures","Search showing 20 results instead of 30"],"correct":0,"t":3},
  {"product":"Zerodha","n":"Account Activation","ch":"down 22%","ctx":"Users complete KYC but dont trade within 7 days. 18-25 age group.","opt":["30-min mandatory tutorial causes 73% abandonment at step 4","Competitor offers zero brokerage first 3 months","SEBI tightened first-time investor rules","Account form moved to new provider API"],"correct":0,"t":3},
  {"product":"Nykaa","n":"Repeat Purchase Rate","ch":"down 11%","ctx":"Skincare customers not returning within 60 days.","opt":["Free shipping now requires Rs5000 spend vs Rs999. 68% customers affected.","Skincare GST price inflation 30%","Delivery times 3->6 days in non-metro","Competitor launched skincare subscription"],"correct":0,"t":3},
  {"product":"Zepto","n":"Delivery SLA","ch":"down 97% to 84%","ctx":"10-min delivery target missed more. Dark store inventory accuracy dropped.","opt":["Batch picking assigns 1 picker to 3 orders - 40% more errors","Dark stores out of top 100 SKUs by 7pm","Blinkit started 8-min delivery same areas","Monsoon causing road delays"],"correct":0,"t":4},
  {"product":"BookMyShow","n":"Ticket Abandonment","ch":"up 24%","ctx":"IMAX screenings on weekends most affected.","opt":["Convenience fee shown only at payment - 43% abandon on seeing total","Seat selection UI refreshes every 60s losing state","Movie cancellations due to low occupancy","Netflix big titles shifting leisure time"],"correct":0,"t":4},
  {"product":"Upstox","n":"Order Execution Latency","ch":"up 320ms","ctx":"F&O orders slower at market open. Scalpers reporting slippage.","opt":["New pre-trade risk check adds 300ms for non-MIS orders","App migrated to new data center","NSE/BSE latency from record volumes","More users switching from Zerodha"],"correct":0,"t":4},
  {"product":"Urban Company","n":"Service Completion Rate","ch":"down 8%","ctx":"Cleaning services in Delhi NCR cancelled most.","opt":["Dynamic pricing adds 20% surge causing last-minute cancellations","Customer booking duplicating orders","Partner supply 12% lower during exams","Delhi air quality causing reschedules"],"correct":0,"t":5},
  {"product":"ShareChat","n":"Content Share Rate","ch":"down 31%","ctx":"Hindi content sharing dropped. English unaffected.","opt":["Share button moved from bottom to top-right - users scrolling past","WhatsApp changed share intent on Android","Instagram Reels launched regional language","Moderation false positives on Hindi posts"],"correct":0,"t":5},
  {"product":"Apna","n":"Job Application Completion","ch":"down 19%","ctx":"Blue-collar candidates dropping at resume upload step.","opt":["Resume builder requires Aadhaar - many blue-collar workers uncomfortable","Competitor foundit launched free resume tool","Video interview requirement now built-in","Higher minimum education requirements"],"correct":0,"t":5},
  {"product":"Groww","n":"SIP First Payment","ch":"down 15%","ctx":"Users set up SIP but drop at eMandate step 3 of 5.","opt":["eNACH now requires OTP from registered mobile - 40% fail","Market volatility deferring decisions","SIP min raised from Rs500 to Rs1000","Pessimistic returns in calculator"],"correct":0,"t":5},
  {"product":"OYO","n":"Listing Accuracy Score","ch":"down 12%","ctx":"Room vs photo mismatch complaints up. Bookings revenue down 5%.","opt":["AI photo tool over-processes images making rooms look 30% larger","Franchise hotels not maintaining quality","Google reviews showing more recent photos","Housekeeping staff shortage"],"correct":0,"t":6},
  {"product":"Rivigo","n":"On-Time Delivery Rate","ch":"down 14%","ctx":"Delhi-Mumbai route worst. Relay driver model breaking.","opt":["Relay points cut from 3 to 2 hubs - last leg 200km longer without rest","Fuel prices up 18% causing slower routes","Highway construction on Delhi-Jaipur","Fleet reduced 10% for maintenance"],"correct":0,"t":6},
  {"product":"Unacademy","n":"Course Completion Rate","ch":"down 41%","ctx":"6-month subscription plans: students complete <25% of content.","opt":["Courses changed from live weekly to pre-recorded - engagement dropped 60%","Auto-renewal confusion causing passive enrolments","JEE pattern changed reducing relevance","Students switching to YouTube free content"],"correct":0,"t":6}
]''')

pool_metrics = []
for i in range(50):
    b = metrics_base[i % 20]
    ci = b['correct']
    t = min(b['t'] + (i // 20), 6)
    mt = min(2 if t <= 1 else 4 if t <= 3 else 6, 6)
    # Build options with one correct, three wrong
    opts_list = []
    for j in range(4):
        opts_list.append({
            'text': b['opt'][(ci + j) % 4],
            'correct': False,
            'note': f'{"Root cause identified after investigation." if j == 0 else "Timeline analysis does not support this."}'
        })
    opts_list[0]['correct'] = True
    opts_list[0]['note'] = f'Root cause. The team isolated this after {["8h","3h","45m","2h","6h"][i%5]}. Fix: {["rollback","config change","feature flag","version rollback","hotfix"][i%5]}.'
    pool_metrics.append({
        'product': b['product'], 'metricName': b['n'], 'metricChange': b['ch'],
        'context': b['ctx'] + f' Incident pattern v{i//20 + 1}.',
        'options': opts_list, 'difficulty': d(t, mt)
    })

# Crisis pool (50)
crisis_base = json.loads('''[
  {"i":"Payment gateway timeout cascade after threshold deploy","b":"14% failing. $18K/hr. Users charged but see failure screen.","s":["Gateway status page shows green","Timeout threshold dropped 10s to 3s in last deploy","DB connection pool at 94%"],"tech":"rollback","e":"Threshold change deployed without monitoring. Rollback restores buffer. Lesson: staged rollout for all config changes."},
  {"i":"Memory leak from feature flag cache never invalidated","b":"OOM-kill every 6h. 40% personalization falls back. $12K/hr.","s":["Memory grew from 2GB to 14GB in 3h","CDN hit rate dropped sharply","Users reporting: I keep seeing the same items"],"tech":"rollback","e":"Feature flag cache pointer chain too deep for GC. Rollback + memory leak detection needed."},
  {"i":"SSO SAML token cache expired during maintenance window","b":"Enterprise users locked out. 200+ companies. 3 Fortune 500.","s":["SSO provider returning 503s for SAML assertions","50+ support tickets in 10 minutes","SAML token cache expired 2h ago during maintenance"],"tech":"hotfix","e":"Enable bypass auth for enterprise while upstream fixes. Pre-configure emergency bypass for next time."},
  {"i":"Database migration script timed out mid-execution on 2.1B row table","b":"40% of users see stale data. Replicas 45min behind.","s":["Online index creation on 2.1B row table","Read replicas show 45 min lag (critical: 5 min)","Alert was suppressed during maintenance window"],"tech":"rollback","e":"Index creation on 2.1B rows overwhelmed I/O. Key lesson: index ops on >500M rows should be batched."},
  {"i":"CDN cache purge missed all pricing endpoints after deploy","b":"20% of EU users saw wrong prices for 18h. 300+ complaints.","s":["Cache headers set for 24h with no purge-on-update hook","Deploy pipeline did not invalidate CDN after pricing update","No alert on cache-hit ratio per region"],"tech":"hotfix","e":"Set cache TTL <= 1h for pricing. Auto-invalidate on deploy. Add cache-hit ratio alerts by region."},
  {"i":"Kubernetes ingress misconfiguration exposed staging databases for 6h","b":"~500K customer records potentially accessible via misconfigured ingress rule.","s":["Security scanner flagged 7h after deploy","Access logs incomplete for exfiltration detection","Junior security engineer on-call. CISO vacation."],"tech":"hotfix","e":"Lock ingress immediately. Rotate all DB creds. Enable full audit logging. IaC needs OPA/Gatekeeper policy checks."},
  {"i":"Chatbot safety classifier disabled for speed gave medical advice","b":"Parenting app chatbot told 34 teens to stop antidepressants. 3 parents tweeted.","s":["Safety classifier disabled for speed in last deploy","Medical advice prohibitions not in fine-tuned model","Conversation logs show teens named their medication","Head of AI safety unreachable in conference"],"tech":"hotfix","e":"Re-enable classifier immediately. Flag conversation pattern for model retraining. Safety classifiers are liability controls."}
]''')

pool_crisis = []
for i in range(50):
    sc = crisis_base[i % len(crisis_base)]
    t = min(i // 8, 5)
    mt = min(2 if t <= 1 else 4 if t <= 3 else 6, 6)
    pool_crisis.append({
        'incident': sc['i'], 'blastRadius': sc['b'], 'signals': sc['s'],
        'bestTechId': sc['tech'], 'bestCommsId': 'eta', 'explanation': sc['e'],
        'difficulty': d(t, mt)
    })

# Write the generated file
gen = {
    'generatedMetricsPool': pool_metrics,
    'generatedCrisisPool': pool_crisis,
}

lines = ['// AUTO-GENERATED SCENARIO POOLS', '// Each has 50 tiered scenarios with realistic context and difficulty bands', '']
for name, pool in gen.items():
    lines.append(f'export const {name} = {json.dumps(pool, indent=2)};')
    lines.append('')

with open('client/src/scenarios/generated.ts', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

for name, pool in gen.items():
    print(f'{name}: {len(pool)} scenarios')
print('Written to client/src/scenarios/generated.ts')