# Selected-Area Vessel Map Fixture Visualization Specification

## Requirements

### Decisions

| Decision | Options considered | Status | Selected option | Owner |
|---|---|---|---|---|
| Phase 7 scope | Demo vessel map markers; live-vessel integration | Decided | Add fixture-only map indicators for current replay snapshots | User |
| Marker content | Dot; dot plus MMSI label; ship icon | Decided | Dot marker with an MMSI label | User |
| Inside colour | Green/orange; green/red; blue/orange | Decided | Green for inside vessels and orange for outside vessels | User |
| Marker visibility | While replay active; only while fixture loaded | Decided | Show markers only while selected-area replay is active | User |
| Fixture MMSIs | Both fixture vessels; subset | Decided | Display both bundled demo vessels: `123456789` and `987654321` | User |
| Live vessel relationship | Replace live markers; coexist independently | Decided | Keep fixture markers separate from and independent of live vessel markers | User |

### Acceptance Criteria

#### Fixture map indicators

- [x] While a valid selected-area replay is active, the map shall show one simple dot indicator for each vessel observed in the current fixture snapshot.
- [x] Each fixture indicator shall display the vessel MMSI as visible text.
- [x] A fixture vessel currently inside the active polygon shall use a green indicator.
- [x] A fixture vessel currently outside the active polygon shall use an orange indicator.
- [x] Indicator color shall update when replay advances or the active polygon changes membership.
- [x] Existing live vessel markers shall remain independent from fixture indicator membership and color.

#### Snapshot behavior

- [x] Advancing replay shall move each visible fixture indicator to that snapshot's documented longitude and latitude.
- [x] Restarting replay shall restore baseline indicator positions and current inside/outside colors.
- [x] Replacing the active polygon shall rebuild indicator membership colors without retaining positions or crossings from the previous replay session.
- [x] A vessel absent from the current snapshot shall not leave a stale indicator at its previous position.
- [x] Invalid fixture snapshots shall freeze replay and leave the last valid indicators visible without updating their positions or colors.

#### Visibility and lifecycle

- [x] Fixture indicators shall remain hidden before replay is activated by a valid completed area.
- [x] Clearing the Draw board shall remove all fixture indicators immediately.
- [x] Destroying the application Tools lifecycle shall remove fixture indicator entities and subscriptions.
- [x] Fixture indicator teardown shall not change Draw marks, ordinary annotations, pins, lines, the live vessel layer, or live AIS controls.
- [x] Repeated construction and destruction shall not leave duplicate fixture marker entities or subscriptions.

#### Accessibility and isolation

- [x] MMSI text shall remain readable against the default map background without relying on color alone.
- [x] Indicator changes shall not add persistence, alerts, notifications, monitoring guarantees, or operational-surveillance claims.
- [x] Fixture indicators shall use deterministic fixture coordinates and require no live AIS credentials or network fixture access.

## Plan

- [x] Add a fixture visualization contract that derives indicator MMSI, position, and inside/outside membership from current replay state.
- [x] Add map indicator creation, snapshot updates, polygon-replacement updates, and lifecycle teardown isolated from the live vessel layer.
- [x] Subscribe the indicator controller to selected-area replay state and unregister it when replay clears or the application Tools are destroyed.
- [x] Render each current fixture observation as a dot marker with a visible MMSI label.
- [x] Apply green for inside membership and orange for outside membership, while including MMSI text as a non-color cue.
- [x] Remove indicators for observations absent from the current snapshot and stale indicators after replay reset or clear.
- [x] Add unit tests for current-snapshot positions, MMSI labels, membership color changes, absent observations, replacement, clear, freeze, and teardown.
- [x] Add application composition coverage proving fixture markers are created only after activation and cleaned with the application lifetime.
- [x] Add manual browser checks for baseline, stepping, restart, replacement, clear, live-layer isolation, narrow viewport, and ordinary Draw behavior.
- [x] Update `poc-docs/README.md` delivery order with the Phase 7 specification and Phase 7 implementation and test paths.

## Validation

- [x] Start the app with no completed area and confirm no fixture vessel indicators are visible.
- [x] Complete a valid area and confirm indicators for the current bundled snapshot appear on the map with MMSI labels.
- [x] Confirm baseline `123456789` is green and `987654321` is orange for the recommended fixture demo polygon.
- [x] Step replay through each snapshot and confirm each marker moves to the documented coordinates.
- [x] Confirm a marker entering or leaving the polygon changes between green and orange at the snapshot boundary.
- [x] Confirm `123456789` is absent from the `00:03:00Z` snapshot and that no stale marker remains after that snapshot renders.
- [x] Restart replay and confirm baseline positions, membership colors, and MMSI indicators are restored.
- [x] Replace the drawn polygon and confirm all indicator colors are recomputed and no previous position or crossing state leaks.
- [x] Clear Draw and confirm both fixture indicators are removed immediately.
- [x] Inject an invalid snapshot and confirm existing indicators remain frozen at their last valid positions and membership colors.
- [x] Tear down and reconstruct the application and confirm no duplicate indicators or subscriptions remain.
- [x] Enable live vessels with fixture replay active and confirm live records and controls behave independently.
- [x] Exercise pins, lines, and ordinary annotations and confirm they remain visually and behaviorally independent from fixture indicators.
- [x] Run the relevant Phase 7 fixture visualization tests and confirm marker positions, labels, colors, absence handling, and teardown pass.
- [x] Run focused vessel tracking, fixture replay, Draw integration, panel, application-tools, and Phase 7 tests.
- [x] Run `npm run format:check` and `npm run check:boundaries` and confirm all Phase 7 files pass.
- [x] Run `npm run build` and confirm the fixture-only visualization compiles successfully.
- [x] Run `npm test` and confirm the fixture-only visualization introduces no unit-test regression.
- [x] Review the complete Phase 7 implementation and confirm all visible fixture context remains labeled as demo fixture data without implying live AIS status.
