# Selected-Area Vessel Results Panel Specification

## Requirements

### Decisions

| Decision | Options considered | Selected option | Owner | Status |
|---|---|---|---|---|
| Phase 4 boundary | Application wiring; UI and replay presentation only | Extend the Draw controls with fixture replay and selected-area vessel results; defer application lifecycle wiring | User | Decided |
| Panel location | Left application panel; floating panel; Draw controls extension | Draw controls extension | User | Decided |
| Replay controls | Manual controls; manual controls plus play/pause | Previous, Next, and Restart controls; no automatic play/pause | User | Decided |
| Crossing history | Current snapshot; all crossings since baseline | Current snapshot crossings only | User | Decided |
| Narrow viewport | Bottom sheet; collapsible right panel | Collapsible right-panel presentation | User | Decided |
| Vessels inside/outside | Derived lists; no current membership lists | Show current vessels inside and outside the selected polygon | Maintainer | Proposed |
| Error presentation | Silent state; status text; status text plus replay freeze | Show the validation reason inline and preserve the last valid result state | Phase 2 | Decided |
| Snapshot estimate copy | Exact event language; snapshot-estimate warning | Label crossing and timestamp results as snapshot-based estimates | README | Decided |
| Vessel rendering | Add map vessel markers; result panel only | Phase 4 adds panel data presentation only; map rendering remains for a later phase | Maintainer | Proposed |
| Data source | Live AIS; deterministic fixture replay | Deterministic fixture replay exposed through the existing integration state | User | Decided |

### Acceptance Criteria

#### Results panel

- [x] The Draw controls shall expose an in-panel selected-area vessel results section.
- [x] The section shall display vessels currently classified inside the active polygon.
- [x] The section shall display vessels currently classified outside the active polygon.
- [x] The section shall display incoming MMSIs and outgoing MMSIs detected by the current snapshot.
- [x] The section shall retain only current-snapshot incoming and outgoing crossings; advancing or restarting shall replace those lists.
- [x] Every crossing shall display its MMSI, its snapshot timestamp, and snapshot-based estimate language.
- [x] The panel shall show a no-active-polygon state when replay has no polygon.
- [x] The panel shall show explicit empty states for empty inside, outside, incoming, and outgoing lists.
- [x] The panel shall preserve the last valid displayed result while a replay snapshot is frozen by validation error.
- [x] The panel shall display fixture or replay validation errors without presenting them as live AIS failures or operational alerts.

#### Replay controls

- [x] The panel shall provide Previous, Next, and Restart controls.
- [x] Selecting Next shall advance exactly one deterministic snapshot when replay is active.
- [x] Selecting Previous shall restore the immediately preceding snapshot only if controller support for reverse navigation is provided; otherwise it shall be disabled without implying unsupported behavior.
- [x] Selecting Restart shall restore the baseline snapshot and clear current crossing lists.
- [x] Replay controls shall disable only when no fixture is loaded, replay is complete where Next is unsupported, or the selected operation cannot be performed.
- [x] No automatic replay or timer shall run in Phase 4.
- [x] When replay is complete, Next shall be disabled and the panel shall state that the fixture sequence is complete.

#### Accessibility and responsiveness

- [x] All replay controls shall be native keyboard-operable buttons with visible focus.
- [x] Current vessel and crossing updates shall be announced through one polite status region rather than repeated announcements for each list item.
- [x] Replay controls shall expose accessible names that identify Previous, Next, and Restart actions.
- [x] The panel shall use semantic headings and lists for inside, outside, incoming, and outgoing results.
- [x] On viewports at or below the repository mobile breakpoint, the results section shall remain available as a collapsible right-panel presentation.
- [x] When collapsed, the narrow viewport control shall expose expanded and collapsed state to assistive technology.
- [x] Expanding, collapsing, and using replay controls shall preserve keyboard focus and shall not steal focus between snapshots.

#### Lifecycle and isolation

- [x] Rendering shall subscribe only to the Phase 3 selected-area vessel integration state exposed by the application.
- [x] Panel teardown shall remove DOM listeners, observers, and subscription callbacks.
- [x] Clearing the active draw area shall remove the panel's results and restore its no-active-polygon state.
- [x] Destroying the panel shall not destroy the Draw tool, annotation engine, fixture replay controller, or live vessel layer.
- [x] The panel shall not persist replay position, panel contents, or crossing history.

## Plan

- [x] Extend `src/ui/templates/display-controls.html` with selected-area vessel result and replay controls inside the existing Draw controls.
- [x] Add repository-style panel markup, styling, and mobile collapse behavior consistent with existing right-panel controls.
- [x] Add a pure panel state mapper that converts selected-area integration state into display labels, sorted MMSI lists, empty states, and validation copy.
- [x] Sort MMSIs numerically by normalized string value and publish snapshots with unchanged source timestamp strings.
- [x] Implement a Draw-panel controller in `src/ui/` to subscribe to integration state, render updates, and manage Previous, Next, and Restart actions.
- [x] Disable unsupported Previous navigation and render its disabled reason only if the replay controller does not implement reverse navigation by implementation time.
- [x] Add polite status announcements without announcing unchanged lists repeatedly.
- [x] Add inline current-snapshot estimate and sampling-limit copy derived from the PoC README language.
- [x] Add keyboard, focus, and narrow-viewport accessibility behavior matching repository shell conventions.
- [x] Add `src/ui/selectedAreaVesselPanel.test.mjs` for state mapping, empty states, snapshot replacement, errors, and teardown.
- [x] Add DOM behavior coverage to the existing Draw controls and mobile-shell test harnesses.
- [x] Run focused Draw control, panel, mobile shell, fixture replay, and integration unit tests.
- [x] Update `poc-docs/README.md` with Phase 4 template, controller, style, and test paths after validation.

## Validation

- [x] Load the Draw controls and confirm the selected-area vessel section and replay controls are visible and associated with the existing Draw panel.
- [x] With no active polygon, confirm the panel shows a no-active-polygon state and empty or disabled replay controls as applicable.
- [x] At baseline, confirm no incoming or outgoing crossings are displayed and current membership lists reflect the baseline snapshot.
- [x] Select Next and confirm exactly one fixture snapshot is applied, current memberships update, and only that snapshot's crossings appear.
- [x] Advance to a snapshot with no crossings and confirm incoming and outgoing lists show explicit empty states.
- [x] Restart at baseline and confirm memberships are reset, crossings are cleared, and snapshot timestamp returns to baseline.
- [x] Place the current-snapshot estimate label beside crossing results and confirm it does not claim exact boundary time.
- [x] Trigger a replay validation error and confirm the error is visible while the last valid memberships and crossings remain displayed.
- [x] Clear the draw area and confirm the panel removes memberships, crossings, timestamp, and replay state.
- [x] Tab through Previous, Next, Restart, and the panel collapse control and confirm visible focus and native keyboard activation.
- [x] Trigger snapshot updates and confirm the panel publishes one polite status announcement rather than one announcement per vessel.
- [x] Set a viewport at the repository mobile breakpoint and confirm the results section remains accessible and collapsible in the right-panel presentation.
- [x] Destroy the panel controller and confirm all listeners, subscriptions, timers, and rendered panel state are removed without affecting Draw or live vessels.
- [x] Run existing Draw control and mobile-shell tests and confirm their behavior remains unchanged.
- [x] Run fixture replay and draw integration tests and confirm Phase 4 consumes their contracts without regressions.
- [x] Run `npm run format:check` and confirm all Phase 4 markup, JavaScript, styles, and tests conform.
