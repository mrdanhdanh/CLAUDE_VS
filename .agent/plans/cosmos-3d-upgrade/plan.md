# Plan — COSMOS 3D upgrade

## Todos
1. **Telemetry shell** — index + HUD/provenance/fallback states; test DOM contract.
2. **Black-hole + warp** — scene engine layers and reduced-motion branch; test API/visual.
3. **Constellation links** — data groups + one line mesh; test map data/count.
4. **Content pass** — phase/node lore and 2D map alignment; test sync.
5. **Responsive polish** — 375/768/1280, a11y, motion; screenshot + diagnostics.
6. **Verify gates** — e2e, cosmos regression, slop, evals rubric, governance audit.

## Files
- Modify: `www/cosmos-3d/index.html`
- Modify: `www/cosmos-3d/style.css`
- Modify: `www/cosmos-3d/scene-data.js`
- Modify: `www/cosmos-3d/scene.js`
- Modify only if needed: `www/cosmos-3d/README.md`
- Verify: `tests/e2e/cosmos-3d.spec.ts` (immutable unless explicit spec change; production behavior first)

## TDD / guard strategy
Before production behavior, run a focused failing Playwright assertion for the new public contract (telemetry fields / constellation link count / warp pulse), confirm RED, then implement minimal behavior. Do not alter existing tests to make them pass.

## Entanglement
- `scene-data.js` ↔ `www/cosmos/index.html` MAPS/phases: any node/phase edit must stay synchronized.
- `scene.js` ↔ `index.html` IDs: telemetry/panel/drawer selectors are a contract.
- `style.css` ↔ `scene.js`: CSS class names for links/warp must be consumed.
- `scale.json` ↔ `scene.js`: read-only telemetry and error states.

## Minimal ladder
1. Existing engine/data already solve most requirements — reuse.
2. Existing self-host three.js and CSS2D — no dependency.
3. Use `LineSegments`, `Points`, `Sprite`, `TorusGeometry` — native primitives.
4. Avoid shader/postprocessing; preserve 60fps-friendly draw calls.
5. Add only one signature transition and one links layer.

## Risk / rollback
- New WebGL objects can break old engine → keep build functions isolated and expose fallback; run existing 3D guard after each batch.
- Telemetry can silently claim fresh data → display source and generatedAt, mark stale/unavailable.
- More copy can create cognitive load → cap rail to five signals and keep detailed lore behind click.

## Dissent / acceptance
Critic challenged “dữ dội = hiểu hơn”. Acceptance requires data provenance, no clip, reduced-motion, and existing 3D contract all pass. A screenshot-only green is insufficient.
