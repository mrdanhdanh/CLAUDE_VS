// fixture-score.mjs — đo score của 2 fixture trong auto-learn-guard.spec (dup + novel)
import { parseKNs, tokenize, computeIDF, scoreKN } from '../../.github/harness/scripts/kn-parse.mjs';
const { kns } = await parseKNs('docs/knowleged.md');
const fixtures = [
  ['dup-fixture', 'Rainbow border conic-gradient var lồng không xoay khi hover'],
  ['novel-fixture', 'Zqxjvk kxqzvj mqzvjk'],
];
for (const [name, title] of fixtures) {
  const qTokens = tokenize(title);
  const idf = computeIDF(qTokens, kns);
  const scored = kns.map((k) => ({ id: k.id, score: Math.round(scoreKN(qTokens, title, k, idf) * 10) / 10 })).sort((a, b) => b.score - a.score);
  console.log(name, '→ top3:', scored.slice(0, 3).map((s) => `${s.id}(${s.score})`).join(', '));
}
