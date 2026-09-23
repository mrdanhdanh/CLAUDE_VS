# Tour mode — acceptance rubric

## Story flow
- Tour starts from a visible button, never auto-starts without user intent.
- Stops cover 2D content: hero/philosophy, 8 phases, 15 system nodes, entropy observatory, roadmap/future, 2D fallback.
- Each stop has title, metadata, explanation, and a progress index.
- Automatic advance works; pause/previous/next/finish work.
- Reduced motion uses manual controls and no automatic timer.

## Interaction / a11y
- Every tour control is a native button with 44px minimum target.
- Esc closes tour; focus returns to the tour trigger.
- Progress/status text is available to assistive tech without noisy `aria-live` spam.
- Tour does not steal focus on every auto step.

## Acceptance
- New E2E guard verifies start, index, pause, next, finish, and reduced motion contract.
- Existing 3D contract remains green.
- `node scripts/slop-check.mjs` clean for tour files.
- Fresh screenshot/evidence at 375/768/1280.
