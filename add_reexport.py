content = open('client/src/scenarios/index.ts', 'r').read()
old = 'function pick<T>(arr: T[]): T {'
new = '''export {
  generatedMetricsPool, generatedGuesstimatePool, generatedPrioritizePool,
  generatedProductSensePool, generatedABTestPool, generatedCrisisPool,
  generatedNorthStarPool, generatedStandoffPool, generatedScopePool,
  generatedInterviewPool, generatedQueryQuestPool, generatedPostmortemPool,
  generatedTrustSafetyPool
} from './generated';

function pick<T>(arr: T[]): T {'''
content = content.replace(old, new)
open('client/src/scenarios/index.ts', 'w').write(content)
print('Re-export added')