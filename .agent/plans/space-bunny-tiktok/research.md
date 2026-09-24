# Space Bunny Free — Research brief

**Snapshot:** 2026-09-23 · **Confidence labels:** `A = official primary`, `B = indexed official statement`, `C = community/aggregator`, `D = rumor`.

## Executive summary

Space Bunny Free is a newly added anonymous/stealth model on OpenCode, model ID `space-bunny-free`. OpenCode offers it free for a limited time through its Zen/Go model lists. The provider is not publicly named. No official model card, weights, technical paper, or reproducible task-level benchmark was found in the searches performed for this clip.

The most eye-catching specifications — **1M context**, **multimodal input**, and **zero data retention** — appear in an indexed snippet attributed to OpenCode's X post and in community reposts/aggregators. A follow-up check (see *Context verification*) upgraded **1M context** to a cross-source claim and found a **retention conflict** between the two hosting platforms. The public `/zen/v1/models` endpoint still returns only `id`, `object`, `created`, and `owned_by`, with no context or output-limit field, so none of this is a first-party API number.

## Evidence ledger

| Claim | Status | Evidence | Clip treatment |
|---|---|---|---|
| Model name and ID: Space Bunny Free / `space-bunny-free` | A | [OpenCode Zen docs](https://opencode.ai/docs/zen/), [Go docs](https://opencode.ai/docs/go/), model endpoints | State plainly |
| Free for a limited time | A | [OpenCode Go docs](https://opencode.ai/docs/go/), [Zen docs](https://opencode.ai/docs/zen/), [PR #50572](https://github.com/anomalyco/opencode/pull/50572) | State plainly |
| Available via OpenAI-compatible endpoint | A | `https://opencode.ai/zen/v1/chat/completions`; Go equivalent `/zen/go/v1/chat/completions` | State plainly |
| Anonymous / stealth model | A | OpenCode English i18n string: “Space Bunny Free, a new anonymous model, is available for a limited time”; docs call it a stealth model | State plainly |
| Free input/output/cached tokens in Zen pricing | A | [Zen pricing](https://opencode.ai/docs/zen/) | State plainly |
| Go estimated requests: Unlimited per 5h/week/month, limited time | A | [Go usage table](https://opencode.ai/docs/go/) | Mention only if space allows |
| Training: not used; retention: 0 days | A for OpenCode's provider table, not independent audit | [Go privacy table](https://opencode.ai/docs/go/) | Attribute to OpenCode/provider |
| 1M context | **B, cross-checked (4 sources), not independently benchmarked** | Indexed snippet attributed to OpenCode X; [OpenRouter model page](https://openrouter.ai/stealth/space-bunny-alpha/api) (“1M-token context window”, CONTEXT 1.0M); [LM Market Cap](https://lmmarketcap.com/model/space-bunny-alpha) (1,000K); [Benchable](https://benchable.ai/models/stealth/space-bunny-alpha) | State “1M” as a claim backed by 2 platforms + 2 aggregators; no 1.5M/2M claim exists anywhere |
| Multimodal input | B/C, not independently verified | OpenCode X snippet, OpenRouter listing (video/image/text input), aggregators | Label “claim / chưa benchmark độc lập” |
| Retention | **Conflict between platforms** | OpenCode Go table: “not used, 0 days”. [OpenRouter stealth terms](https://openrouter.ai/stealth/space-bunny-alpha/api): “Prompts and completions for this model may be retained by the provider but are not used for training” | Present as “2 nguồn nói khác nhau”, never as “zero retention” alone |
| 524K max output | C, weak evidence | LM Market Cap page reports 524.3K; official OpenCode metadata has no output field | Do not put in voiceover as fact |
| Coding rank #235/436, score 40/100 | C/D, methodology unclear | LM Market Cap aggregate; no raw task results found | Do not use as a performance claim |
| Provider / base model | Unknown | No official disclosure found | Say “chưa công khai” |
| Official paper / model card / weights | Not found | Exact arXiv search for “Space Bunny” returned no results; official model page has no such document | Say “chưa thấy” |
| OpenCode data / usage rows | Not found | [OpenCode model data page](https://opencode.ai/data/unknown/space-bunny-free) says no matching facts/usage rows | Do not imply adoption/quality |

## Context verification (2026-09-23, follow-up)

Question asked: **1M, 1.5M, or 2M?** Answer: **1M** — and only 1M.

| Source | What it says | Class |
|---|---|---|
| OpenCode X post (indexed snippet) | “Space Bunny (stealth model) is free for the next week — **1M Context** — Multi-modal — Zero Data Retention” | B |
| OpenRouter model page `stealth/space-bunny-alpha` | “adjustable reasoning effort, and a **1M-token context window**”; header shows `CONTEXT 1.0M`; released Sep 23, 2026 | B (platform listing) |
| LM Market Cap | “1,000K token context window (1,000,000 tokens total)”, max output 524.3K | C |
| Benchable | “Context 1M” | C |
| Searches for `"Space Bunny" "1.5M context"`, `"Space Bunny Alpha" "1.5M"` | **zero results** | — |
| Searches for `"Space Bunny" "2M context"` | no relevant results (only unrelated videos) | — |

**Why this matters:** the two hosting platforms agree on 1M, which is stronger than a single community repost — but OpenCode's own API metadata exposes no context field, so it remains a *published claim*, not a measured number. Treat “1M” as high-confidence for *what the vendors say*, low-confidence for *what you will actually get at 1M*.

**Retention discrepancy (new):** OpenCode's Go privacy table lists Space Bunny as “not used / 0 days”, while OpenRouter's stealth-model notice says prompts and completions **may be retained by the provider** (not used for training). Two platforms, two different statements about the same anonymous model family — report the disagreement, do not pick a side.

**Also new:** the same stealth model appears to be served on OpenRouter as `stealth/space-bunny-alpha` with the same release date, free access, 1M context, and multimodal description as OpenCode's `space-bunny-free`. Same model family is plausible but **not officially confirmed** — do not state it as fact on camera.

## “Tin ngầm” / community signal

- **LuminaBench / Lumina**, 2026-09-23: called it a new stealth model, free for the next week, and wrote “let’s see if this is as bad as the last few were.” This is community skepticism, not a benchmark.
- **alex getman**, 2026-09-23: reposted the “1M context, multimodal” claim. Treat as a secondary repost until the original OpenCode post is directly readable.
- The PR was merged into OpenCode `dev` on 2026-09-23 as `feat(go): add Space Bunny promotion` ([commit](https://github.com/anomalyco/opencode/commit/1b4a6dbc6588d698b36e54dbf8817acbe3621e07)). This confirms the rollout, not the model's quality.
- No credible leak of provider, weights, training recipe, or model lineage was found. Do not turn “anonymous” into a guessed company.

## Capability assessment (pre-test)

### What can be said now

- **Strongly supported:** free promotion, model ID, OpenAI-compatible route, anonymous status, OpenCode privacy table.
- **Plausible but pending:** multimodal input, reasoning/tool use, real usable window at 1M, 524K output cap.
- **Cross-checked claim:** 1M context (OpenCode X + OpenRouter listing + 2 aggregators) — still not independently benchmarked.
- **Unknown:** coding quality, latency, context behavior at 1M, output cap, reliability, rate limit, cost after promotion, data handling beyond the provider table, whether OpenCode's and OpenRouter's Space Bunny are the same model.

### Suggested test suite

Run the same five tasks on Space Bunny Free and one known model:

1. **Long-context retrieval:** place a marker in a 100k-token synthetic file; ask for it. Record exact retrieval, hallucination, and token overhead.
2. **Repository navigation:** ask it to identify an entry point and explain three call paths; score factual file/line references.
3. **Bug repair:** give a small failing test and require a minimal patch; score pass@k and regression count.
4. **Tool calling:** use a mock tool with structured arguments; score schema validity and recovery after tool error.
5. **Image instruction:** attach a screenshot/diagram; ask for a grounded description; score unsupported details.

Report: success rate, first-pass rate, retries, latency, input/output tokens, cost (currently $0 during promotion), and provider errors. Do not collapse these into a single “intelligence score.”

## Clip script direction

**Hook:** “OpenCode vừa thêm một model ẩn danh: Space Bunny Free, đang miễn phí trong thời gian giới hạn.”

**Proof card:** “Model ID `space-bunny-free` · OpenAI-compatible endpoint · provider chưa công khai.”

**Claims card:** “1M context · multimodal · retention 2 nguồn nói khác nhau” with a visible yellow badge: “claims đã đối chiếu 4 nguồn — chưa có benchmark độc lập.”

**Research card:** “Chưa thấy paper, model card, weights hay provider chính thức.”

**CTA:** “Bạn sẽ test nó với fix bug, đọc repo, hay xây feature?”

## Sources

- [OpenCode Zen documentation](https://opencode.ai/docs/zen/)
- [OpenCode Go documentation](https://opencode.ai/docs/go/)
- [OpenCode model endpoint](https://opencode.ai/zen/v1/models)
- [OpenCode Go model endpoint](https://opencode.ai/zen/go/v1/models)
- [OpenCode PR #50572](https://github.com/anomalyco/opencode/pull/50572)
- [OpenCode promotion commit](https://github.com/anomalyco/opencode/commit/1b4a6dbc6588d698b36e54dbf8817acbe3621e07)
- [LM Market Cap profile](https://lmmarketcap.com/model/space-bunny-alpha)
- [Benchable profile](https://benchable.ai/models/stealth/space-bunny-alpha)
- [Lumina community post](https://x.com/LuminaBench/status/2102769042217914491)
- [OpenCode model data page](https://opencode.ai/data/unknown/space-bunny-free)
