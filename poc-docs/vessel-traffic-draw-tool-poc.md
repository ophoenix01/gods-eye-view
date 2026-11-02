# Vessel Traffic Draw Tool PoC Specification

## Requirements

### Decisions

| Decision | Options considered | Selected option | Owner | Status |
|---|---|---|---|---|
| Delivery baseline | Start over; build on completed Phases 0 and 1 | Build the remaining PoC on the existing documentation and tracking engine | User | Decided |
| Polygon source | Separate zone picker; existing draw tool area finish | Use the completed area geometry produced by the existing draw tool | Maintainer | Proposed |
| Demonstration data | Live AIS; deterministic fixtures | Deterministic in-memory vessel snapshots replayed by the PoC | User | Decided |
| Integration state | Persistent store; application lifetime in memory | One active controller and one active polygon for the demonstration lifetime | Maintainer | Proposed |
| Crossing display | Canvas-only markers; dedicated in-app panel; combined map and panel | Show incoming and outgoing MMSIs in a dedicated focused panel and keep the selected polygon on the map | Maintainer | Proposed |
| Replay controls | Automatic timer only; manual steps and play/pause | Provide manual snapshot stepping plus play/pause controls | Maintainer | Proposed |
| Vessel metadata | MMSI only; MMSI plus names or labels | Use MMSI as the primary fixture identity and display fixture metadata only when already available | Maintainer | Proposed |
| Reset behavior | Clear only results; clear polygon and replay state | Reset polygon, memberships, crossings, and replay position together | Maintainer | Proposed |
| Timing display | Exact event time; snapshot estimate label | Label results as snapshot-based estimates and show the fixture snapshot timestamp | User | Decided |

### Acceptance Criteria

#### Phased delivery

- [ ] The implementation shall preserve the completed Phase 0 scope documentation and the completed Phase 1 tracking engine.
- [ ] The remaining PoC shall be delivered in independently testable phases that establish fixture replay, draw-tool integration, in-app presentation, lifecycle behavior, and demo validation.
- [ ] Each phase shall have an observable outcome before the next dependent phase begins.

#### Draw-tool integration

- [ ] When a surveyor finishes an area in the existing draw tool, the PoC shall pass its longitude/latitude ring to the tracking engine.
- [ ] Invalid area geometry shall produce no tracking or crossing update.
- [ ] Finishing another area while one is active shall replace the one active polygon and reevaluate retained vessel observations.
- [ ] Clearing or destroying the draw board shall clear the PoC polygon and in-memory vessel-tracking state.
- [ ] The integration shall not change existing draw behavior for lines, pins, or ordinary annotations.

#### Fixture replay

- [ ] A fixture shall contain ordered snapshots with timestamps and MMSI latitude/longitude observations.
- [ ] Fixture replay shall run without credentials, network access, live AIS, or physical vessel movement.
- [ ] The replay shall establish baseline membership without synthetic crossings.
- [ ] Stepping to the next snapshot shall update memberships and crossing results from the tracking engine.
- [ ] A replay step shall leave current crossings unchanged when the tracking engine rejects invalid or duplicate fixture data.
- [ ] Replaying or restarting fixtures shall reset prior memberships and crossing history before applying the baseline snapshot.

#### Incoming and outgoing view

- [ ] The PoC shall display the current vessels inside and outside the active polygon, or clearly indicate when tracking has no active polygon.
- [ ] The PoC shall display incoming and outgoing crossings attributed to MMSI and the current snapshot timestamp.
- [ ] The view shall identify crossing results as snapshot-based estimates rather than exact boundary timestamps.
- [ ] Empty current lists and crossing lists shall have explicit in-app empty states.
- [ ] All replay and vessel-result controls shall have keyboard-operable equivalents and visible focus states consistent with the application shell.

#### Lifecycle and isolation

- [ ] The PoC shall support only one active polygon and one fixture replay session.
- [ ] Polygon, vessel positions, memberships, crossing history, and replay controls shall remain in memory for the demonstration.
- [ ] Page reload or explicit reset shall remove the demonstration state.
- [ ] Destroying or replacing the PoC controller shall remove its DOM listeners, timers, subscriptions, and UI state without affecting the standard vessel layer or draw tool.
- [ ] The demonstration shall not provide persistence, alerts, notifications, production monitoring guarantees, operational certification, or multi-zone support.

## Plan

- [x] Phase 0: preserve the README scope and source-documentation structure.
- [x] Phase 1: complete and validate the pure polygon membership and snapshot-transition tracking engine.
- [ ] Phase 2 - Fixture contract and replay controller: define the ordered fixture contract, deterministic sample snapshots, validation, baseline/reset behavior, and the pure replay state controller.
- [ ] Add unit tests for fixture validation, replay sequencing, restart behavior, rejected snapshots, and baseline membership.
- [ ] Phase 3 - Draw-tool boundary: connect completed draw-tool area rings to the tracking engine, preserve existing draw behavior, and add replacement and clear/reset integration tests.
- [ ] Phase 4 - In-app PoC presentation: add a focused incoming/outgoing/current-membership panel, snapshot timestamp and estimate labeling, empty states, and replay controls.
- [ ] Add DOM/state tests for panel updates, fixture stepping, play/pause, reset, keyboard controls, and lifecycle teardown.
- [ ] Phase 5 - Application wiring and isolation: instantiate the PoC controller from the application shell, isolate it from the live vessel layer, and connect teardown to draw-tool clearing and application destruction.
- [ ] Verify the standard draw tool, vessel layer, and ordinary application startup remain unaffected outside the PoC fixture mode.
- [ ] Phase 6 - End-to-end demonstration: add one deterministic maritime-area walkthrough covering drawing, baseline, entry, exit, replacement, reset, and replay restart.
- [ ] Run focused unit tests, repository formatting checks, the relevant application boundary tests, and the existing browser/manual PoC smoke path.
- [ ] Update the PoC README file-change list with every source, test, documentation, and specification path added or updated for each remaining phase.
- [ ] Document sampling limitations in the final demo-facing copy so users do not interpret fixture crossings as exact real-time vessel events.

## Validation

- [ ] Run the Phase 1 tracking-engine unit tests and confirm polygon membership, snapshots, transitions, replacement, and reset behavior pass unchanged.
- [ ] Run the fixture/replay unit tests and confirm ordered stepping, baseline initialization, restart, invalid snapshots, and missing-vessel behavior.
- [ ] Draw a valid area and confirm only that finished ring activates selected-area tracking.
- [ ] Replace the active area and confirm the engine reevaluates retained fixture positions and reports only transitions justified by the new polygon.
- [ ] Finish a line or pin and confirm it does not activate vessel-area tracking.
- [ ] Clear the draw board and confirm polygon, membership, crossing, fixture, and replay state are removed.
- [ ] Step through the deterministic fixtures and confirm the documented MMSI appears under incoming or outgoing at each crossing snapshot.
- [ ] Restart replay and confirm old crossings and memberships are absent from the baseline view.
- [ ] Play, pause, step, and reset using keyboard and pointer input; confirm controls expose visible focus and correct replay state.
- [ ] Inspect the demo without network access and confirm it completes using fixtures only.
- [ ] Confirm invalid fixture records and duplicate MMSIs produce visible rejection behavior without changing the prior displayed state.
- [ ] Run `npm run format:check` and confirm the PoC files conform to repository formatting.
- [ ] Run the repository unit-test command appropriate to the changed files and confirm all focused and boundary tests pass.
- [ ] Run the application/manual smoke path and confirm ordinary draw-tool and vessel-layer behavior remains intact when the PoC is inactive.
- [ ] Confirm the PoC README and specification clearly identify fixtures and snapshot estimates, and exclude persistence, alerts, operations guarantees, and multiple zones.
