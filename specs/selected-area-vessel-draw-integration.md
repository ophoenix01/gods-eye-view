# Selected-Area Vessel Draw Integration Specification

## Requirements

### Decisions

| Decision | Options considered | Selected option | Owner | Status |
|---|---|---|---|---|
| Phase 3 boundary | Fixture/UI implementation; draw-tool polygon integration only | Complete annotation-area subscription, polygon replacement, replay reset, and draw-board clear integration | User | Decided |
| Polygon delivery | Optional draw-tool callback; application polling; annotation subscription | Subscribe to annotation engine area creation and clear lifecycle events | User | Decided |
| Replacement behavior | Replace polygon only; replace polygon and restart replay; leave replay position | Replace the polygon and restart deterministic replay at its baseline | User | Decided |
| Clear behavior | Clear polygon only; clear all PoC state | Clear the polygon, replay position, memberships, crossing history, and replay validation state | User | Decided |
| Polygon authority | Fixture polygon remains authoritative; drawn ring replaces fixture; rings must match | A valid drawn ring replaces the fixture polygon for replay; the fixture polygon remains its default or fallback | User | Decided |
| Annotation shapes | Any annotation; area annotations only; area and route | Only completed manual area annotations activate selected-area vessel tracking | Maintainer | Proposed |
| API event shape | Full annotation objects; area type and ring only | Publish completed area changes with `type: 'area'` and a longitude/latitude ring | Maintainer | Proposed |

### Acceptance Criteria

#### Annotation integration

- [x] The annotation engine shall expose an unsubscribe-capable subscription for completed annotation area changes.
- [x] A completed manual area shall publish its resolved longitude/latitude ring to the selected-area vessel integration.
- [x] A new completed manual area shall replace the previously active PoC polygon with that ring.
- [x] Non-area annotations, including pins and routes, shall not activate or replace selected-area vessel tracking.
- [x] Ordinary voice-generated annotations shall not activate PoC tracking unless they are areas accepted by the integration contract.

#### Polygon validation and replay

- [x] A drawn ring shall be validated by the Phase 1 tracking engine before it becomes active.
- [x] Invalid or degenerate drawn rings shall not replace the active polygon or change replay state.
- [x] Replacing a valid polygon shall restart the active fixture replay from its baseline snapshot without synthetic crossings.
- [x] Replacing a valid polygon shall clear incoming and outgoing crossing history from the previous polygon.
- [x] Replay with no active draw polygon shall use the fixture's bundled polygon as its default.
- [x] If a fixture has no polygon, replay shall remain inactive until a valid drawn area is available.

#### Clearing and lifecycle

- [x] Clearing the draw board shall notify the selected-area vessel integration to clear the active polygon and all replay state.
- [x] Drawing-tool destruction shall remove integration subscriptions and shall clear in-memory PoC state without affecting other annotation consumers.
- [x] Application teardown shall unsubscribe the integration and shall not leave timers, listeners, or replay state behind.
- [x] Clearing a board shall not change the behavior of ordinary annotation persistence or the standard vessel layer.
- [x] Removing one annotation without clearing the board shall not clear the active PoC polygon unless that annotation lifecycle is explicitly defined as the active area replacement in a later approved phase.

#### Existing behavior isolation

- [x] Lines, pins, area drawing previews, and ordinary completed annotations shall retain their existing behavior when the PoC integration is inactive.
- [x] Adding the annotation subscription shall not alter existing draw-tool asynchronous finish, cancellation, clear, or teardown behavior.
- [x] Phase 3 shall not add live AIS requests, persistence, alerts, notifications, presentation controls, or multiple polygon support.

## Plan

- [x] Add a completed annotation-change subscription contract to `src/annotations/annotationEngine.js`.
- [x] Publish manual area additions and removals through the subscription contract with resolved geometry.
- [x] Add unsubscribe-aware subscription tests to the annotation engine or draw integration test suite.
- [x] Extend `src/annotations/drawTool.js` to publish a selected-area candidate after successful area placement and to notify clearing operations.
- [x] Preserve the existing draw-tool result and ensure async in-flight finishes remain protected by current generation cancellation.
- [x] Add a pure draw-polygon integration controller that validates rings through the Phase 1 engine and coordinates polygon replacement with `VesselFixtureReplay`.
- [x] Add the replay controller operation needed to replace its active polygon and restart at fixture baseline.
- [x] Connect a valid drawn ring to the fixture replay controller without mutating fixture snapshots or the bundled fixture polygon.
- [x] Implement draw-board clear and destroy behavior that resets polygon, replay, memberships, crossings, and validation state.
- [x] Add `src/annotations/selectedAreaVesselIntegration.test.mjs` for area-only events, replacement, invalid rings, clear, destroy, and ordinary annotation isolation.
- [x] Add draw-tool integration coverage to the repository's existing draw behavior test harness.
- [x] Run focused annotation, draw-tool, tracking-engine, and fixture-replay unit tests.
- [x] Update `poc-docs/README.md` with each Phase 3 source, implementation, and test path after validation.

## Validation

- [x] Finish a manual area and confirm exactly one valid longitude/latitude ring is emitted through the annotation subscription.
- [x] Finish a manual pin or route and confirm no selected-area polygon event is emitted.
- [x] Subscribe and unsubscribe before and after draw-tool teardown, then confirm listeners are removed with no duplicate callbacks.
- [x] Submit a valid ring and confirm replay uses it instead of the fixture polygon and restarts at baseline.
- [x] Submit a second valid ring and confirm the prior replay position and crossings are replaced by baseline replay state.
- [x] Submit an invalid ring and confirm the active polygon and replay state remain unchanged and a structured validation result is visible to the caller.
- [x] Load a fixture without a drawn polygon and confirm the bundled fixture polygon remains the default.
- [x] Load a fixture with no polygon and confirm replay remains inactive until a valid drawn area is available.
- [x] Clear the draw board and confirm polygon, replay position, memberships, crossings, and replay errors are cleared.
- [x] Destroy the draw tool and integration and confirm no subscription or state survives teardown.
- [x] Cancel an unfinished or superseded draw operation and confirm it emits no stale polygon event.
- [x] Run the existing draw-tool unit tests and confirm finish, cancel, clear, pointer ownership, and keyboard behavior remain unchanged.
- [x] Run the Phase 1 tracking-engine and Phase 2 fixture-replay tests and confirm neither phase regresses.
- [x] Run the repository format check and confirm all Phase 3 files conform to repository formatting.
