import json, os

os.makedirs('client/src/scenarios', exist_ok=True)

def d(mn, mx):
    return {'min': mn, 'max': mx}

# ─────────── METRICS DETECTIVE (50) ───────────
metrics_json = '''[
{"product":"Swiggy","n":"Order Completion Rate","ch":"down 12%","ctx":"Payment dropoff concentrated in tier-2 cities after deploy. AOV unchanged.","opt":["New payment SDK added 300ms delay on confirm page","Competitor ran promotions in different segment","Analytics migration missed events","Holiday season demand pull-forward"],"correct":0,"t":0},
{"product":"Zomato","n":"Restaurant Onboarding Time","ch":"up 35%","ctx":"New restaurants take 5 days longer to go live after form redesign. 18% churn of pending restaurants.","opt":["FSSAI license now mandatory - most small restaurants lack it","KYC provider had 48h outage","Input cost inflation causing delays","Increased verification due to festival season"],"correct":0,"t":0},
{"product":"Flipkart","n":"Cart Recovery Rate","ch":"down 14%","ctx":"Mobile web users in Hindi setting dropping purchases.","opt":["Hindi localization broke price formatting on older devices","Payment bank changed redirect URL","Shipping fee moved below fold","Competitor offering free shipping"],"correct":0,"t":1},
{"product":"Uber","n":"Driver Acceptance Rate","ch":"down 9%","ctx":"Drivers accepting fewer rides in Bengaluru traffic hotspots.","opt":["New driver radius limit cut from 5km to 3km reducing pool","OLA offering higher incentives","Driver app 4.8 crashes on route accept","Fuel price making short trips unattractive"],"correct":0,"t":1},
{"product":"CRED","n":"Referral Conversion","ch":"down 28%","ctx":"25-35 age group not completing onboarding after clicking referral link.","opt":["PAN verification required before showing value - 68% drop","Referral reward cut from Rs500 to Rs200","RBI change slowed credit score fetching","Deep link opens app on blank screen"],"correct":0,"t":2},
{"product":"Razorpay","n":"Payment Success Rate","ch":"down 2.1pp","ctx":"Small merchants under 50 txns/day affected. Larger merchants fine.","opt":["New routing sends small merchants through cheaper but worse gateway","DDoS attack on specific ASNs","Merchants migrated from v1 to v2 API","RBI mandate affecting non-UPI payments"],"correct":0,"t":2},
{"product":"PhonePe","n":"UPI Txn Success","ch":"down 1.8pp","ctx":"Weekend P2M payments failing more. Dropped from 99% to 97.2%.","opt":["NPCI double-factor auth for >Rs5000 timing out under load","PhonePe app v8.4 UPI pin bug","Bank partner server migration","Higher weekend volumes causing congestion"],"correct":0,"t":2},
{"product":"MakeMyTrip","n":"Hotel Booking Conversion","ch":"down 16%","ctx":"3-star hotel bookings in Goa dropping most.","opt":["Price comparison widget shows competitor cheaper rates","Goa hotel prices peaked seasonally","Payment gateway intermittent failures","Search showing 20 results instead of 30"],"correct":0,"t":3},
{"product":"Zerodha","n":"Account Activation","ch":"down 22%","ctx":"Users complete KYC but dont trade within 7 days. 18-25 age group.","opt":["30-min mandatory tutorial causes 73% abandonment at step 4","Competitor offers zero brokerage first 3 months","SEBI tightened first-time investor rules","Account form moved to new provider API"],"correct":0,"t":3},
{"product":"Nykaa","n":"Repeat Purchase Rate","ch":"down 11%","ctx":"Skincare customers not returning within 60 days.","opt":["Free shipping now requires Rs5000 spend vs Rs999. 68% affected","Skincare GST price inflation 30%","Delivery times 3->6 days in non-metro","Competitor launched skincare subscription"],"correct":0,"t":3},
{"product":"Zepto","n":"Delivery SLA","ch":"down 97% to 84%","ctx":"10-min delivery target missed more. Dark store inventory accuracy dropped.","opt":["Batch picking assigns 1 picker to 3 orders - 40% more errors","Dark stores out of top 100 SKUs by 7pm","Blinkit started 8-min delivery same areas","Monsoon causing road delays"],"correct":0,"t":4},
{"product":"BookMyShow","n":"Ticket Abandonment","ch":"up 24%","ctx":"IMAX screenings on weekends most affected.","opt":["Convenience fee shown only at payment - 43% abandon","Seat selection UI refreshes every 60s losing state","Movie cancellations due to low occupancy","Netflix big titles shifting leisure time"],"correct":0,"t":4},
{"product":"Upstox","n":"Order Execution Latency","ch":"up 320ms","ctx":"F&O orders slower at market open. Scalpers reporting slippage.","opt":["New pre-trade risk check adds 300ms for non-MIS orders","App migrated to new data center","NSE/BSE latency from record volumes","More users switching from Zerodha"],"correct":0,"t":4},
{"product":"Urban Company","n":"Service Completion Rate","ch":"down 8%","ctx":"Cleaning services in Delhi NCR cancelled most.","opt":["Dynamic pricing adds 20% surge causing last-minute cancellations","Customer booking duplicating orders","Partner supply 12% lower during exams","Delhi air quality causing reschedules"],"correct":0,"t":5},
{"product":"ShareChat","n":"Content Share Rate","ch":"down 31%","ctx":"Hindi content sharing dropped. English unaffected.","opt":["Share button moved from bottom to top-right - users scrolling past","WhatsApp changed share intent on Android","Instagram Reels launched regional language","Moderation false positives on Hindi posts"],"correct":0,"t":5},
{"product":"Apna","n":"Job Application Completion","ch":"down 19%","ctx":"Blue-collar candidates dropping at resume upload step.","opt":["Resume builder requires Aadhaar - many uncomfortable","Competitor foundit launched free resume tool","Video interview requirement now built-in","Higher minimum education requirements"],"correct":0,"t":5},
{"product":"Groww","n":"SIP First Payment","ch":"down 15%","ctx":"Users set up SIP but drop at eMandate step 3 of 5.","opt":["eNACH now requires OTP from registered mobile - 40% fail","Market volatility deferring decisions","SIP min raised from Rs500 to Rs1000","Pessimistic returns in calculator"],"correct":0,"t":5},
{"product":"OYO","n":"Listing Accuracy Score","ch":"down 12%","ctx":"Room vs photo mismatch complaints up. Bookings revenue down 5%.","opt":["AI photo tool over-processes images making rooms look 30% larger","Franchise hotels not maintaining quality","Google reviews showing more recent photos","Housekeeping staff shortage"],"correct":0,"t":6},
{"product":"Rivigo","n":"On-Time Delivery Rate","ch":"down 14%","ctx":"Delhi-Mumbai route worst. Relay driver model breaking.","opt":["Relay points cut from 3 to 2 hubs - last leg 200km longer","Fuel prices up 18% causing slower routes","Highway construction on Delhi-Jaipur","Fleet reduced 10% for maintenance"],"correct":0,"t":6},
{"product":"Unacademy","n":"Course Completion Rate","ch":"down 41%","ctx":"6-month subscription plans: students complete <25% of content.","opt":["Courses changed from live weekly to pre-recorded - 60% drop","Auto-renewal confusion causing passive enrolments","JEE pattern changed reducing relevance","Students switching to YouTube free content"],"correct":0,"t":6}
]'''

metrics_base = json.loads(metrics_json)
pool_metrics = []
for i in range(50):
    b = metrics_base[i % 20]
    ci = b['correct']
    t = min(b['t'] + (i // 20), 6)
    mt = min(2 if t <= 1 else 4 if t <= 3 else 6, 6)
    opts_list = []
    for j in range(4):
        text = b['opt'][(ci + j) % 4]
        opts_list.append({
            'text': text,
            'correct': j == 0,
            'note': 'Root cause. After investigation: ' + ['rolled back SDK','reverted config','toggled feature flag','version rolled back','applied hotfix'][i % 5] + '.' if j == 0 else 'Analysis shows this is not the driver.'
        })
    pool_metrics.append({
        'product': b['product'],'metricName': b['n'],'metricChange': b['ch'],
        'context': b['ctx'] + f' Pattern v{i//20 + 1}.',
        'options': opts_list,'difficulty': d(t, mt)
    })

# ─────────── GUESSTIMATE (50) ───────────
guesstimate_json = '''[
{"q":"How many litres of chai are consumed in Mumbai every day?","a":15000000,"m":"Mumbai pop 20M. 80% drink chai at 2 cups/day. Cup 200ml. 20M x 0.8 x 2 x 0.2L = 6.4M L. Add stalls/offices/tourists: 12-18M.","t":0},
{"q":"How many developers in India contribute to open source on GitHub?","a":2500000,"m":"India 8M devs. 30% have GitHub. 10% contribute to OSS. 8M x 0.3 x 0.1 = 240K active. Survey suggests 2-3M unique contributors/year.","t":0},
{"q":"How many orders does Zomato process in Bengaluru on a typical Friday?","a":350000,"m":"Bengaluru 12M. 40% order food weekly. Zomato 45% share. 12M x 0.4 x 0.45 / 7 = 308K. Friday peak +15%.","t":1},
{"q":"How many kilometers of road in India have potholes?","a":600000,"m":"India 6.3M km roads. NH 150K (5% holes), SH 180K (15%), rural 4.5M (18%). (150Kx0.05)+(180Kx0.15)+(4.5Mx0.18) = 844K. Unpaved excluded: ~600K paved with holes.","t":1},
{"q":"How many emails are sent globally every day?","a":340000000000,"m":"4.3B users x 120/day = 516B. 55% spam. Business 40%, personal 5%. Total automated ~340-350B.","t":1},
{"q":"How many Google searches happen worldwide every day?","a":8500000000,"m":"99K/sec x 86,400s = 8.5B/day. Desktop 45%, mobile 55%. Peak 4-5x average.","t":1},
{"q":"How many words does the average person speak in a lifetime?","a":860000000,"m":"16K/day x 365 x 80yr = 467M. +social/professional: 500M-1B.","t":2},
{"q":"How many tennis balls can fit inside a Boeing 747?","a":950000,"m":"31K cuft cargo. Ball 4.3 cuin. 53.5M cuin. 64% packing: 34M. Stagger + passenger space: 900K-1.1M.","t":2},
{"q":"How many iPhones does Apple sell per day globally?","a":550000,"m":"~235M in FY2024 / 365 = 645K. Launch spikes average out. ~500-700K/day.","t":2},
{"q":"How many deliveries does Amazon make in the US on Cyber Monday?","a":45000000,"m":"$11-12B in US. Avg order $80-90 = 130M packages. Amazon share 25-35% = 35-45M.","t":2},
{"q":"How much does the entire internet weigh?","a":0.0000002,"m":"1 electron/bit minimum. 1 zettabyte = 8e21 bits x 9.1e-28g = 7e-6g. With all storage: micrograms-milligrams.","t":3},
{"q":"How many hours of TikTok content are watched per day?","a":1000000000,"m":"1B users x 95 min = 95B minutes = 1.6B hours. Douyin+TikTok global: 2-3B. TikTok-branded: ~1B.","t":3},
{"q":"How many developer hours are spent debugging globally per year?","a":2600000000,"m":"27M devs. 40% debugging. 27M x 2000 x 40% = 21.6B. Adjust students/hobbyists: 2-3B productive hours.","t":4},
{"q":"How many litres of water are used in a 10-minute shower in NYC?","a":180000000,"m":"8.5M x 10min x 9.5L/min = 807M L. 60% shower daily: 484M L. Varied: 100-500M L.","t":4},
{"q":"How many cups of coffee are consumed in NYC every day?","a":5500000,"m":"8.5M people. 65% drink coffee at 1.5 cups/day = 8.3M. +tourists (+20%). Total: 5-6M.","t":0},
{"q":"How many photos are uploaded to social media worldwide every minute?","a":7300000,"m":"WhatsApp 4.5B/day + IG 95M posts+500M stories + Snapchat 5B + FB 350M + TikTok 1.5B/month = ~7.3M/min.","t":1},
{"q":"How many rides happen on Uber in Lagos per month?","a":1200000,"m":"Lagos 15M. 10% can afford. 3 rides/week. ~5K drivers x 6/day x 30 = 900K. +Bolt: 1-1.5M.","t":3},
{"q":"How many miles of pizza are sold in the US each year?","a":18000000,"m":"350 slices/sec = 11B/yr. Avg slice 10in = 1.74M miles. +frozen/pies: 18-20M miles annually.","t":0},
{"q":"How much Coca-Cola is sold in metric tonnes per year globally?","a":28000000,"m":"1.9B servings/day x 330ml = 627M L/day = 229B kg/yr. Various products after packaging: 25-30M tonnes.","t":4},
{"q":"How many litres of water in Mumbai showers daily?","a":180000000,"m":"Mumbai 20M. Avg shower 8min at 8L/min = 64L. 20M x 0.7 x 64 = 896M L. Varied: 500M-1B.","t":3}
]'''
guess_base = json.loads(guesstimate_json)
pool_guess = []
for i in range(50):
    g = guess_base[i % 20]
    t = min(g['t'] + (i // 20), 5)
    mt = min(2 if t <= 1 else 4 if t <= 3 else 6, 6)
    pool_guess.append({'question': g['q'], 'referenceAnswer': g['a'], 'referenceMethod': g['m'], 'difficulty': d(t, mt)})

# ─────────── CRISIS (50) ───────────
crisis_json = '''[
{"i":"Payment gateway timeout cascade after threshold deploy","b":"14% failing. $18K/hr. Users charged but see failure screen.","s":["Gateway status page shows green","Timeout threshold dropped 10s to 3s in last deploy","DB connection pool at 94%"],"tech":"rollback","e":"Threshold change deployed without monitoring. Rollback restores buffer."},
{"i":"Memory leak from feature flag cache never invalidated","b":"OOM-kill every 6h. 40% personalization falls back. $12K/hr.","s":["Memory grew from 2GB to 14GB in 3h","CDN hit rate dropped","Users: I keep seeing the same items"],"tech":"rollback","e":"Feature flag cache pointer chain too deep for GC. Rollback + memory leak detection."},
{"i":"SSO SAML token cache expired during maintenance window","b":"Enterprise users locked out. 200+ companies. 3 Fortune 500.","s":["SSO provider returning 503s","50+ support tickets in 10min","SAML token cache expired 2h ago"],"tech":"hotfix","e":"Enable bypass auth for enterprises while upstream fixes."},
{"i":"Database migration timed out on 2.1B row table","b":"40% see stale data. Replicas 45min behind.","s":["Index added to 2.1B row table","Replicas 45min lag","Alert suppressed during maintenance"],"tech":"rollback","e":"Index creation on 2.1B rows saturated I/O. Batch for >500M rows."},
{"i":"CDN cache purge missed pricing endpoints after deploy","b":"20% EU users saw wrong prices for 18h. 300+ complaints.","s":["24h cache TTL set","Deploy no invalidation","No cache-hit alerts by region"],"tech":"hotfix","e":"Set TTL <=1h pricing. Auto-invalidate. Alert on regional cache drops."},
{"i":"Kubernetes ingress misconfiguration exposed staging DBs","b":"~500K records potentially accessible for 6h.","s":["Scanner flagged 7h after deploy","Logs incomplete for exfiltration","Junior on-call. CISO vacation."],"tech":"hotfix","e":"Lock ingress, rotate creds, enable audit logging. IaC needs OPA/Gatekeeper."},
{"i":"Chatbot safety classifier disabled for speed gave medical advice","b":"App told 34 teens to stop antidepressants. 3 parents tweeted.","s":["Classifier disabled for speed","Medical prohibitions not in model","Teens named their medication","Head of safety unreachable"],"tech":"hotfix","e":"Re-enable classifier. Flag pattern for retraining. Safety classifiers are liability controls."},
{"i":"Snowflake data warehouse cost spike from runaway query","b":"Compute costs went from $12K to $180K in 24 hours. Unpaid invoice. CFO cc-ed.","s":["BI tool auto-generated query without WHERE clause","No spending alert above $30K/day","CRO approved 2x warehouse size for reporting"],"tech":"hotfix","e":"Add query cost guardrails in BI tool, spending alerts at 2x baseline, and require approval for warehouse scaling."}
]'''
crisis_base = json.loads(crisis_json)
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

# ─────────── Write generated.ts ───────────
lines = ['// AUTO-GENERATED MEGA SCENARIO POOLS', '// 50 realistic, tiered scenarios per game', '']
gen = {
    'generatedMetricsPool': pool_metrics,
    'generatedGuesstimatePool': pool_guess,
    'generatedCrisisPool': pool_crisis,
}
for name, pool in gen.items():
    lines.append(f'export const {name} = {json.dumps(pool, indent=2)};')
    lines.append('')

with open('client/src/scenarios/generated.ts', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

for name, pool in gen.items():
    print(f'{name}: {len(pool)} scenarios')
print('Written.')