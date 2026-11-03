# Selected-Area Vessel End-to-End Demo Specification

## Requirements

### Decisions

| Decision | Options considered | Selected option | Owner | Status |
|---|---|---|---|---|
| Phase 6 boundary | Additional implementation; end-to-end validation and demonstration only | Validate all completed phases, document the operator walkthrough, and prove fixture-only behavior | User | Decided |
| Demonstration format | Automated browser harness; written manual script | Written manual walkthrough using the running application and deterministic fixtures | User | Decided |
| Sign-off evidence | Tests and recordings; tests only; manual sign-off | Automated focused tests, unit tests, boundary checks, build, and format validation | User | Decided |
| Known-limitations display | README only; presenter script; persistent banner | Persistent visible snapshot-estimate banner in the results panel | User | Decided |
| Demo polygon | Fixed fixture polygon only; operator-selected area | Operator draws one area and confirms replay uses the drawn ring | Maintainer | Proposed |
| Demo vessel evidence | Live vessel overlay; fixture panel only; fixtures and panel | Fixture panel lists and crossing transitions are the primary evidence; live vessel markers are out of scope | Maintainer | Proposed |
| Final deliverables | README updates only; README and manual script | README updates plus a repository manual demonstration script | Maintainer | Proposed |
| Success definition | Visual impression only; observable automated and manual outcomes | All Phase 1-5 focused tests pass and the manual script completes without live AIS dependencies | User | Decided |

### Acceptance Criteria

#### End-to-end demonstration

- [x] A surveyor shall be able to start the demo without live AIS credentials, network fixture access, or physical vessel movement.
- [ ] The demo shall begin with Draw inactive and selected-area tracking inactive.
- [ ] Drawing and completing one valid area shall activate baseline fixture replay and display the baseline timestamp.
- [ ] The baseline step shall establish membership without displaying synthetic incoming or outgoing crossings.
- [ ] The Next control shall step through deterministic snapshots and display observed incoming and outgoing MMSIs.
- [ ] Restart shall restore the baseline snapshot and clear current crossing results.
- [ ] Drawing a second valid area shall replace the active polygon, restart baseline replay, and clear prior crossings.
- [ ] Clearing Draw shall deactivate selected-area replay and clear memberships, crossings, timestamp, and replay errors.
- [x] The manual script shall cover normal completion, polygon replacement, restart, clear, invalid fixture, and teardown scenarios.
- [x] The persistent banner shall state that crossings and timestamps are snapshot-based estimates, not exact boundary times.

#### Regression isolation

- [ ] Phase 6 shall confirm that live vessel controls and providers remain independent from fixture replay.
- [ ] Phase 6 shall confirm that pins, lines, ordinary annotations, and other Draw shapes retain their existing behavior.
- [ ] Phase 6 shall confirm standard application startup and teardown remain functional outside the fixture PoC.
- [x] Phase 6 shall confirm no persistence, alerts, notifications, multi-zone support, or operational-monitoring guarantees are introduced.

#### Documentation and evidence

- [x] The README shall link to a Phase 6 manual demonstration script and list all PoC source and test changes in delivery order.
- [x] The manual script shall identify preconditions, exact controls, expected fixture state, pass criteria, and cleanup.
- [x] The script shall identify known limits: fixture sampling, delayed observations, missed intermediate crossings, snapshot estimates, and no exact boundary timestamps.
- [x] The script shall distinguish automated pass evidence from manual operator checks.
- [x] Any manual screenshots or recordings shall be optional evidence and shall not be required by the automated sign-off decision.

## Plan

- [x] Add `poc-docs/selected-area-vessel-demo.md` containing setup, prerequisites, the ordered operator walkthrough, expected results, failure checks, and cleanup.
- [x] Include at least one baseline, incoming, outgoing, unchanged, replacement, restart, clear, and teardown step in the manual script.
- [x] Verify the fixture has deterministic MMSIs and timestamp expectations documented in the script.
- [x] Verify the persistent snapshot-estimate banner is visible wherever the PoC results panel is active.
- [x] Add or update focused Phase 6 repository boundary assertions for README delivery order and demo script presence.
- [x] Run the tracking-engine, fixture-replay, draw-integration, panel, application-tools, and Draw behavior focused unit tests.
- [x] Run `npm test` and confirm the repository unit-test suite passes for the completed PoC.
- [ ] Run `npm run test:track` and confirm tracking invariants pass.
- [x] Run `npm run format:check` and `npm run check:boundaries`.
- [x] Run `npm run build` and confirm the application bundles successfully with the fixture-only PoC.
- [ ] Perform the manual script using the existing development server and record pass/fail observations only as required by the script.
- [x] Confirm the live AIS network and credentials are unnecessary for every fixture demonstration step.
- [x] Update `poc-docs/README.md` delivery order with the Phase 6 specification and manual demo script.

## Validation

- [x] Run the Phase 1 tracking-engine tests and confirm baseline membership, incoming, outgoing, missing-vessel, invalid snapshot, and reset behavior pass.
- [x] Run the Phase 2 fixture-replay tests and confirm ordered stepping, restart, freeze, replacement, and completion pass.
- [x] Run the Phase 3 draw integration tests and confirm valid area activation, replacement, clear, invalid polygon, and teardown pass.
- [x] Run the Phase 4 panel tests and confirm current memberships, current crossings, estimate copy, empty states, controls, and accessibility copy pass.
- [x] Run the Phase 5 application tests and confirm activation, isolation, fixture failure, and cleanup pass.
- [ ] Start the app with no area drawn and confirm selected-area replay is inactive and live vessel behavior remains independent.
- [ ] Draw a valid maritime area, complete baseline replay, and confirm the panel displays baseline membership without synthetic crossings.
- [ ] Step through the fixture sequence and confirm expected incoming and outgoing MMSIs occur only at their documented snapshots.
- [ ] Restart replay and confirm memberships restore to baseline and current crossings are empty.
- [ ] Replace the area and confirm replay starts at baseline, prior positions and crossings do not leak, and the new polygon remains authoritative.
- [ ] Clear Draw and confirm the active polygon, fixture position, memberships, crossings, error, and panel content are cleared.
- [ ] Complete the manual script offline from live AIS credentials and confirm every fixture step succeeds.
- [ ] Interrupt fixture loading or inject a malformed fixture and confirm startup and live vessel behavior remain functional with a PoC-local error.
- [ ] Exercise pin, line, and ordinary annotation behavior and confirm the PoC does not alter existing Draw behavior.
- [ ] Resize or switch to a narrow viewport and confirm the panel remains available and collapsible without losing keyboard focus.
- [ ] Run `npm test`, `npm run test:track`, `npm run format:check`, `npm run check:boundaries`, and `npm run build`; all required commands must report success.
- [x] Review the README, Phase 6 script, and persistent banner and confirm every limitation is visible and no exact-real-time claim is made.
