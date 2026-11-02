# Selected-Area Vessel Application Lifecycle Specification

## Requirements

### Decisions

| Decision | Options considered | Selected option | Owner | Status |
|---|---|---|---|---|
| Phase 5 boundary | Feature behavior implementation; application lifetime isolation only | Own integration and panel construction, activation, teardown, and boundary validation within the application tools lifecycle | User | Decided |
| Activation | Always active; after draw area; explicit feature flag | Activate replay and results only after a valid draw area is completed | User | Decided |
| Lifecycle owner | Draw tool; dedicated controller; application Tools component | Application tools lifetime owns integration and panel construction and teardown | User | Decided |
| Teardown | Destroy only; reset and destroy | Reset PoC state, unsubscribe consumers, destroy the panel, integration, and draw-owned resources, and then continue application cleanup | User | Decided |
| Normal vessel layer | Isolated by separate state; shared fixtures with live AIS | Keep the standard live vessel layer independent from PoC fixture state and rendering | User | Decided |
| Fixture loading | Load on startup; load only when activated | Load or process the deterministic fixture only when PoC activation has a valid draw polygon | Maintainer | Proposed |
| Initialization failure | Block application startup; isolated non-fatal failure | A fixture-load or PoC initialization failure shall be surfaced only by the PoC panel and shall not block application startup | Maintainer | Proposed |

### Acceptance Criteria

#### Activation and ownership

- [x] The application Tools component shall construct the selected-area integration and Draw-panel controller for the application lifetime.
- [x] Fixture replay shall remain inactive until a valid completed draw area activates the selected-area PoC.
- [x] Completing a valid area shall activate one replay session using that ring as the authoritative polygon.
- [x] Replacing the active draw area shall replace the active polygon and restart the replay session from baseline.
- [x] Clearing the draw board shall deactivate the PoC and clear fixture replay, memberships, and crossings.
- [x] The application shall expose no additional activation control in Phase 5 beyond the existing draw area and clear lifecycle.

#### Isolation from live vessel behavior

- [x] Selected-area fixture state shall not modify the standard vessel layer or its live AIS subscriptions.
- [x] Live vessel records shall not feed fixture replay automatically.
- [x] Rendered live vessels shall remain independent from selected-area membership lists.
- [x] Enabling, disabling, clearing, or tearing down the PoC shall not change live vessel provider loading or controls outside the PoC.
- [x] Application startup shall remain functional when the PoC fixture loader is unavailable or invalid.

#### Application lifecycle

- [x] Each application Tools construction shall create no more than one selected-area integration and one selected-area panel.
- [x] Tools-component cleanup shall unsubscribe the panel before destroying the integration.
- [x] Tools-component cleanup shall reset replay and clear integration listeners before application teardown completes.
- [x] Application teardown shall remove selected-area DOM listeners, timers, observers, and subscriptions.
- [x] Repeated application construction or teardown shall not leave duplicate PoC subscriptions, panels, or debug handles.
- [x] Errors during selected-area cleanup shall be reported through the repository application cleanup mechanism rather than silently ignored.

#### Failure and degraded startup

- [x] If fixture loading fails, the application shall continue starting and the PoC panel shall display an isolated fixture-load error.
- [x] If integration initialization fails, standard Draw, annotation, and live vessel behavior shall remain available.
- [x] If the panel cannot find its markup, PoC integration state shall still be cleaned up when the application is destroyed.
- [x] Invalid polygons shall not activate replay or affect live vessel behavior.

#### Debug and observability

- [x] Existing application debug exposure shall not include mutable PoC state as a substitute for a public integration API.
- [x] The selected-area integration shall expose lifecycle diagnostics only through its existing state, subscribe, control, and destroy contract.
- [x] Phase 5 shall not add persistent logs, analytics, alerts, monitoring guarantees, credentials, or network services.

## Plan

- [x] Define the application tools lifetime contract for constructing, activating, and destroying selected-area integration and panel instances.
- [x] Gate fixture replay activation on receipt of a valid draw area rather than application startup.
- [x] Ensure the Tools component retains exactly one integration and one panel cleanup registration in reverse construction order.
- [x] Add a panel initialization fallback that leaves application startup and integration cleanup functional if markup is unavailable.
- [x] Add integration subscription publication without coupling fixture state to live vessel data sources.
- [x] Connect draw clear and integration clear events so deactivation resets replay, memberships, crossings, and errors.
- [x] Register reset-and-destroy cleanup for panel and integration instances through the existing `defer` mechanism.
- [x] Verify application teardown ordering with the repository application lifecycle harness.
- [x] Add application-tools boundary coverage for construction, draw-area activation, repeated teardown, and fixture-load failure isolation.
- [x] Add standard vessel-layer isolation tests proving live vessel controls remain independent of fixture state.
- [x] Add a startup regression test for unavailable, malformed, or slow PoC fixture loading.
- [x] Run focused application, Tools, draw integration, panel, and vessel-layer unit tests.
- [x] Update `poc-docs/README.md` with Phase 5 application wiring and test paths after validation.

## Validation

- [x] Start the application with no completed draw area and confirm selected-area replay remains inactive.
- [x] Complete a valid area and confirm only one integration activates and one baseline replay begins.
- [x] Complete another valid area and confirm the old replay position and crossings are cleared and baseline restarts.
- [x] Clear the board and confirm replay deactivates and the Draw panel returns to its no-active-polygon state.
- [x] Destroy the Tools component and confirm integration, panel, DOM listeners, and subscriptions are removed.
- [x] Destroy and reconstruct the application and confirm no duplicate selected-area listeners or debug handles remain.
- [x] Load a malformed fixture and confirm startup continues and the panel reports the PoC-specific error.
- [x] Simulate fixture loading failure and confirm live vessel startup and controls remain available.
- [x] Disable or remove PoC markup and confirm application teardown still completes and integration state is reset.
- [x] Enable the standard vessel layer with fixture replay active and confirm live vessel records and controls remain independent.
- [x] Clear or destroy the PoC while live vessels are active and confirm standard live vessel behavior does not change.
- [x] Run application cleanup tests and confirm cleanup failures, if injected, are surfaced by the application lifecycle result.
- [x] Run the Phase 1 through Phase 4 focused tests and confirm application wiring introduces no regression.
- [x] Run the repository format check and confirm all Phase 5 application wiring files conform.
