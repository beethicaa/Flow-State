import re

with open('client/src/scenarios/index.ts', 'r') as f:
    content = f.read()

# Fix remaining d(X, 6) patterns
replacements = [
    ('difficulty: d(0, 6)', 'difficulty: d(0, 2)'),
    ('difficulty: d(1, 6)', 'difficulty: d(1, 3)'),
    ('difficulty: d(2, 6)', 'difficulty: d(2, 4)'),
    ('difficulty: d(3, 6)', 'difficulty: d(3, 5)'),
]
for old, new in replacements:
    content = content.replace(old, new)

# Find trustSafetyPool closing bracket and insert before it
marker = "];\n\nfunction pick<T>"
idx = content.find(marker)

# Build trust insert as array and join
trust_items = []
trust_items.append('  { issue: "A user was doxxed - PII partially redacted by classifier but attacker used leetspeak to bypass.", severity: "high", contentCategory: "doxxing", policyCategories: ["PII protection", "Evasion detection", "Victim support escalation"], difficulty: d(4, 6) }')
trust_items.append('  { issue: "Photorealistic deepfake of a celebrity uploaded as profile pic. Celebrity filed DMCA. 50K followers.", severity: "high", contentCategory: "deepfake", policyCategories: ["Impersonation policy", "DMCA compliance", "Synthetic media disclosure"], difficulty: d(5, 6) }')
trust_items.append('  { issue: "Religious leader posts anti-LGBTQ+ content framed as theology. Local law protects religious speech. 500K shares.", severity: "high", contentCategory: "hate_speech", policyCategories: ["Hate speech policy", "Religious freedom vs harm", "Jurisdictional enforcement"], difficulty: d(5, 6) }')
trust_items.append('  { issue: "News outlet published article using docs allegedly from your admin panel. Must determine: hack or insider?", severity: "critical", contentCategory: "data_breach", policyCategories: ["Breach notification", "Insider threat investigation", "Law enforcement engagement"], difficulty: d(6, 6) }')

trust_insert = "\n" + ",\n".join(trust_items) + ",\n"
content = content[:idx] + trust_insert + content[idx:]

with open('client/src/scenarios/index.ts', 'w') as f:
    f.write(content)

print("Done. File length: " + str(len(content)))