Phase 2 — Animation Engine Audit

Scope: inventory of animation engines and rAF usage in the project files.

Files scanned:
- wedding invitation of Pritam&Beauty.html
- assets/js/main.js

Findings summary:
- GSAP (with ScrollTrigger): primary engine used for scroll-triggered section animations and small pop tweens. Found in 17 locations across HTML and extracted JS (timelines for #p2, #p3, #p4; small fromTo tweens; countdown scale tween).
- anime.js: used for intro timeline and chip stagger; present where precise transform/letter-spacing finishes are used. Found 7 matches.
- Custom RAF scheduler (`addLoop`): central rAF aggregator used to run many canvas and DOM loops; many addLoop() registrations across particle systems and morphing. Found ~15 addLoop registrations.
- requestAnimationFrame usage: wrapped inside the `addLoop` scheduler as a single loop.

Hotspots (high priority for consolidation):
- Intro: anime timeline + multiple canvas loops + GSAP may overlap; consolidate to single timeline or port anime sequences to GSAP.
- Particle systems: many addLoop() callbacks updating canvas layers; keep central scheduler but expose pause/start via a lifecycle wrapper and respect reduced-motion/visibility.
- Scroll-triggered timelines: GSAP + ScrollTrigger are fine — aim to keep them but reduce number of timelines by grouping related tweens into fewer timelines.

Recommendations (next actions):
1. Create a single `animationController` module that exposes: `init()`, `start()`, `pause()`, `stop()`, `isRunning()` and manages:
   - GSAP timelines (store refs to timelines)
   - anime.js timelines (if kept) — wrap them so they can be paused/seeked alongside GSAP
   - addLoop registry — ability to pause/resume the RAF loop (stop invoking callbacks) and to clear callbacks when paused
2. Migrate anime.js sequences to GSAP where behavior matches. Keep anime.js only if a specific effect is significantly easier and low-risk to keep.
3. For each `addLoop` registration, add an identifier tag so we can selectively enable/disable particle sets (e.g., 'stars','galaxy','firework'). This enables per-section gating.
4. Add a feature-flag `USE_ANIME=false` to the controller for a staged migration (toggle to run migration tests).

Deliverables for Phase 2 implementation:
- `assets/js/animation-controller.js` — central lifecycle manager
- Update `assets/js/main.js` to register all animations through the controller rather than starting ad-hoc
- Tests: visual smoke tests for intro, p2/p3/p4 entries; ensure reduced-motion path remains functional

Estimated effort: 6–12 hours (audit + plan + incremental migrations)
Risks: medium — slight timing differences when re-creating timelines; mitigate with visual diffs and small incremental PRs.

Next immediate step: create `assets/js/animation-controller.js` skeleton and refactor `main.js` to register timelines with it (non-breaking — keep current calls until verified).