# Selected-Area Vessel Fixture Replay Specification

## Requirements

### Decisions

| Decision | Options considered | Selected option | Owner | Status |
|---|---|---|---|---|
| Phase 2 boundary | UI and draw integration; fixtures and replay controller only | Pure deterministic fixture validation and replay control, with no DOM, draw-tool, network, or renderer dependencies | User | Decided |
| Fixture format | JavaScript module; static JSON; implementation-defined format | Static JSON with an ordered `snapshots` array loaded through the repository bundled JSON convention | User | Decided |
| Invalid snapshot behavior | Freeze and report; stop replay; skip snapshot | Freeze replay state and expose a validation error without changing memberships or crossings | User | Decided |
| Restart behavior | Restart at baseline; restart at current position; restart from blank state | Restart replay at baseline snapshot and process the baseline without synthetic crossings | User | Decided |
| Tracking integration | Controller owns independent state; controller wraps the Phase 1 engine | Replay controller owns snapshot sequencing and delegates polygon membership and crossing detection to the Phase 1 engine | Maintainer | Proposed |
| Fixture identity | Vessel name; call sign; MMSI | MMSI must be present and valid for every fixture observation | User | Decided |
| Snapshot timestamps | Omitted; optional strings; required ISO 8601 strings | Require an ISO 8601 timestamp for every snapshot | Maintainer | Proposed |

### Acceptance Criteria

#### Fixture contract

- [ ] The Phase 2 fixture shall be valid JSON with an ordered top-level `snapshots` array.
- [ ] Each snapshot shall contain a valid ISO 8601 timestamp and an `observations` array.
- [ ] Each observation shall contain MMSI, latitude, and longitude values accepted by the Phase 1 tracking engine.
- [ ] Fixture loading shall validate every snapshot before replay changes tracking state.
- [ ] Invalid fixture structure, timestamps, duplicate MMSIs, invalid coordinates, or invalid MMSIs shall produce a structured validation result naming the affected snapshot.
- [ ] The fixture shall contain deterministic positions that demonstrate baseline membership, at least one incoming crossing, and at least one outgoing crossing.

#### Replay controller

- [ ] The replay controller shall reset its sequence, tracking state, and crossing history before loading or restarting a fixture.
- [ ] Loading a fixture shall validate the complete fixture and report success or failure without applying snapshots when validation fails.
- [ ] Starting or restarting replay shall process the first snapshot as the baseline through the Phase 1 engine and shall produce no synthetic crossing.
- [ ] Advancing one step shall process exactly the next snapshot and publish its memberships and crossing results.
- [ ] Advancing beyond the final snapshot shall leave the replay state unchanged and report that the sequence is complete.
- [ ] The replay controller shall expose the active snapshot index, timestamp, engine state, and sequence-complete status to a caller.

#### Failure and reset behavior

- [ ] An invalid snapshot encountered during replay shall freeze replay state and expose the validation reason without changing memberships or crossings.
- [ ] A fixture loaded without any snapshots shall be rejected without creating engine state.
- [ ] Resetting the replay controller shall clear the active fixture sequence, current snapshot, memberships, crossings, and validation error.
- [ ] Replacement of an active fixture shall restart from the baseline and shall not merge snapshots or state from the prior fixture.
- [ ] Replay state shall remain in memory only and shall not persist between controller instances or page reloads.
- [ ] Phase 2 shall not start timers, animate transitions, render map entities, access the DOM, or establish network dependencies.

#### Phase isolation

- [ ] The replay controller shall consume the Phase 1 tracking engine contract without modifying it.
- [ ] Phase 2 shall not integrate fixture replay with the draw tool or application shell.
- [ ] Phase 2 shall not add live AIS data, credentials, alerts, persistence, production monitoring, or multiple replay sessions.

## Plan

- [ ] Add the static fixture contract at `src/data/selectedAreaVesselFixtures.json` using ordered snapshots and snapshot-based timestamps.
- [ ] Add a pure fixture validation and replay controller in `src/data/vesselFixtureReplay.js`.
- [ ] Reuse `loadBundledJson` for fixture loading so browser and Node builds use the repository's existing JSON convention.
- [ ] Define structured validation results for invalid fixture shape, snapshot timestamps, observations, MMSIs, coordinates, and duplicate MMSIs.
- [ ] Instantiate the Phase 1 tracking engine within the replay controller or accept it through a narrow dependency seam.
- [ ] Implement load, start, restart, step, complete, reset, and replacement operations in replay order.
- [ ] Preserve engine state after invalid snapshots and expose a structured replay error instead of publishing partial results.
- [ ] Freeze the replay position on failure and prevent subsequent advancement until restart, reset, or a valid replacement fixture.
- [ ] Add deterministic fixture coverage for baseline, incoming crossing, outgoing crossing, unchanged membership, and sequence completion.
- [ ] Add `src/data/vesselFixtureReplay.test.mjs` covering valid load, restart, step, invalid fixture, invalid snapshot, duplicate MMSI, final snapshot, and reset behavior.
- [ ] Add a JSON fixture boundary test using the repository bundled JSON loader when the fixture is introduced.
- [ ] Update `poc-docs/README.md` with the Phase 2 specification, fixture, controller, and test paths after validation.

## Validation

- [ ] Run the fixture replay unit tests with Node and confirm all Phase 2 cases pass.
- [ ] Load `src/data/selectedAreaVesselFixtures.json` through `loadBundledJson` and confirm each snapshot parses and validates.
- [ ] Process the first fixture snapshot through the replay controller and confirm membership is established with no incoming or outgoing crossings.
- [ ] Step into a snapshot that moves one MMSI outside-to-inside and confirm exactly one snapshot-based incoming result is published.
- [ ] Step into a snapshot that moves one MMSI inside-to-outside and confirm exactly one snapshot-based outgoing result is published.
- [ ] Advance through unchanged, absent, and final snapshots and confirm replay reports the expected membership and sequence-complete states.
- [ ] Restart replay from a non-baseline position and confirm the first baseline memberships are restored and prior crossings are absent.
- [ ] Load a fixture containing malformed structure, invalid timestamps, invalid coordinates, invalid MMSIs, or duplicate MMSIs and confirm no snapshots are applied.
- [ ] Encounter an invalid snapshot during replay and confirm displayed membership and crossings remain unchanged while a structured error is exposed.
- [ ] Attempt to advance a replay frozen by an invalid snapshot and confirm no additional snapshot changes state until restart, reset, or replacement.
- [ ] Reset the controller and confirm fixture sequence, current snapshot, memberships, crossings, and validation error are cleared.
- [ ] Replace one valid fixture with another valid fixture and confirm the controller restarts at the new baseline without retaining prior state.
- [ ] Run the Phase 1 tracking-engine test command and confirm fixture replay introduces no engine regression.
- [ ] Run the repository format check and confirm the Phase 2 JSON and JavaScript files conform.
