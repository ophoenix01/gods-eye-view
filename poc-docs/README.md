# Selected-Area Vessel Tracking Proof of Concept

## Overview

This proof of concept (PoC) is intended for **Coast Guard Duty Controllers**. Its
operational goal is to make it easier to understand which vessels enter or
leave a maritime area selected by a Duty Controller.

Duty Controllers can’t watch every vessel at once, and need to know when traffic through a chokepoint, port approach or incident area changes. This tool would provide the ability to draw an area using the draw tool, show a log of the current vessels within an area, as well as give the ability to step through the history of that area to see which vessels have entered or left that area recently.

Today, the relevant draw-tool and vessel workflows are separate ways to mark
an area and review ship activity. This PoC improves that workflow by
connecting a user-defined polygon with a focused vessel-crossing view, helping
a Duty Controllers track which vessels have entered and left a specific area at a specific time.

This improvement was chosen as it closely resembles an internal project I completed in a team at my old employer where we were tasked with creating an airport simulation application for simulating arrivals and departures for airports with varying runway availability and airplane traffic. This follows similar principles and is a useful tool for tracking vessel traffic.

This feature was built using Spec-Driven workflow skills involving Copilot. A new `/spec-workflow` skill was implemented to be able to retrieve requirements and turn them into a checklist of requirements, an implementation plan and validation checks. A separate agent was then used to implement these features. All work was done on separate branches to main and merged using GitHub's version control.

## Demonstration Behavior

- The demonstration supports **one active user-drawn polygon at a time**.
- The polygon and vessel membership are evaluated **in memory for the duration
  of the demonstration**.
- Deterministic fixture positions provide vessel membership and transitions
  between snapshots. Fixture replay does not require live AIS credentials,
  network access, or a physical vessel to cross a boundary.
- Fixtures identify vessels by **MMSI**. A transition from outside the polygon
  to inside is represented as an incoming crossing; a transition from inside
  to outside is represented as an outgoing crossing.

## Timing and AIS Assumptions

Crossing results are estimates based on **snapshot observations**, not exact
boundary timestamps. A delayed AIS position can produce a result after the
vessel actually entered or left the polygon. Refresh cycles can also miss
intermediate vessel movement, so only the final observed state may be shown
between two snapshots. These results must not be presented as exact real-time
operational tracking.

## PoC scope and exclusions

This PoC is source documentation for a fixed demonstration and is **not a
production maritime surveillance or operations product**. The following are
explicitly out of scope:

- multiple active zones;
- persistent crossing history;
- alerts or notifications;
- production monitoring guarantees;
- operational certification;
- replacing live maritime surveillance systems.

## Prerequisites

- Node.js 24 or 26 and installed dependencies.
- Start the application with `npm run dev`.
- Open the displayed local URL in a browser.
- Live AIS credentials, network fixture access, and vessel-network services
  are not required for this demonstration.

Before drawing, confirm the Draw mode is off and the selected-area results
panel displays "No active polygon". Confirm live-vessel controls can remain
at their normal startup settings.

## Fixture expectations

The bundled fixture is
[src/data/selectedAreaVesselFixtures.json](../src/data/selectedAreaVesselFixtures.json).
It contains two deterministic MMSIs:

- `123456789`
- `987654321`

The default polygon represents an English Channel fixture area around
longitude `-2.5` to `-0.5` and latitude `49.5` to `50.5`; the operator's drawn
ring becomes authoritative when replay activates. The recommended first area
includes `(50, -2)` and excludes `(50, 0)`.

| Snapshot | Timestamp | Expected membership change |
|---|---|---|
| Baseline | 2026-01-01 00:00:00 UTC | `123456789` inside; `987654321` outside; no crossings |
| Next | 2026-01-01 00:01:00 UTC | `987654321` becomes observed inside; incoming |
| Next | 2026-01-01 00:02:00 UTC | `123456789` becomes observed outside; outgoing |
| Next | 2026-01-01 00:03:00 UTC | Delayed/absent `123456789` remains outside; no synthetic transition |
| Next | 2026-01-01 00:04:00 UTC | `123456789` remains outside; unchanged |

The membership results can vary when an operator draws a different polygon.
The panel and fixture engine remain authoritative; use the recommended ring
for the exact incoming/outgoing sequence above.

## Ordered operator walkthrough

1. Leave Draw inactive. Verify replay is inactive and live vessel controls are
   unaffected.
2. Open Draw. Draw the recommended triangle covering fixture area `(2, 2)` but
   excluding `(8, 8)`, then double-click to complete the ring.
3. Verify the panel becomes active at `2026-01-01T00:00:00Z`. Verify
   `123456789` is inside, `987654321` is outside, and Incoming and Outgoing
   are empty.
4. Click Next once. Verify the timestamp changes to
   `2026-01-01T00:01:00Z` and `987654321` appears in Incoming.
5. Click Next again. Verify the timestamp changes to
   `2026-01-01T00:02:00Z` and `123456789` appears in Outgoing.
6. Continue through `00:03:00Z` and `00:04:00Z`. Verify absent observations do
   not create synthetic crossings merely because a vessel was not reported.
7. Click Restart. Verify timestamp, memberships, and crossing lists return to
   baseline with no crossings.
8. Draw a second valid area. Verify baseline restarts, prior positions are
   cleared, and the new drawn ring remains authoritative.
9. Clear Draw. Verify the polygon and replay deactivate, including timestamp,
   memberships, crossings, and errors.
10. Reload or destroy and reconstruct the application. Verify no duplicate
    selected-area panel or Draw listeners remain.

## Failure checks

- Draw a degenerate or invalid area. Replay must remain inactive and live
  vessel behavior must be unchanged.
- Interrupt or replace fixture loading with malformed fixture data.
  Application startup and live vessels must continue, while the PoC panel
  shows its fixture-local error.
- Exercise pins, lines, and ordinary annotation modes after replay clear.
  Their existing behavior must remain unchanged.
- Collapse and resize the results panel. Its estimate banner must remain
  visible, controls must remain keyboard accessible, and collapse state must
  not steal focus.

## Pass criteria

The manual demo passes when Draw activation, baseline membership, deterministic
Next transitions, Restart, replacement, clear, and teardown all match the
expected fixture state above. Live AIS credentials are unnecessary.

## Cleanup

Clear Draw, collapse any demo-only controls, and close the browser tab. No
persistent fixture state, alerts, credentials, or network subscriptions are
created by the demo.

## Known limits

Fixture replay uses snapshot-based observations. AIS or fixture sampling can
delay a position, and refresh intervals can miss intermediate crossings.
Crossing times and timestamps are sampling estimates, not exact vessel
boundary times. This PoC
does not persist results, support multiple zones, send alerts, provide
operational monitoring guarantees, or replace live maritime surveillance.

Given more time I would begin the implementation of integrating the live vessels coordiantes with the draw tool logic, in order to display the information in full. This would then provide a real time snapshot of the vessel activities in that area, with the potential of adding previous history too depending on how far back the vessel data goes. The UI needs cleaning up too and I would like to have included it in it's own custom UI section, with a sidebar for the selected-area vessel history.

## Governance

Since the demo only uses the open-source code from the God's eye View project, there is no considerations beyond what lies in the application. If live vessel integration was added, then the AISStream information would have to be considered. Vessel identifiers can point to people. MMSI, name and track can be linked to an owner or crew, especially for fishing boats and recreational craft. Whether that counts as personal data under UK GDPR depends on context, so it would need to be treated carefully.

## File changes

Files added or updated for this PoC, in delivery order:

1. [.agents/skills/spec-workflow/SKILL.md](../.agents/skills/spec-workflow/SKILL.md)
2. [poc-docs/specs/poc-scope-specification.md](specs/poc-scope-specification.md)
3. [poc-docs/README.md](README.md)
4. [poc-docs/specs/selected-area-vessel-tracking-engine.md](specs/selected-area-vessel-tracking-engine.md)
5. [src/data/vesselTrackingEngine.js](../src/data/vesselTrackingEngine.js)
6. [src/data/vesselTrackingEngine.test.mjs](../src/data/vesselTrackingEngine.test.mjs)
7. [poc-docs/vessel-traffic-draw-tool-poc.md](vessel-traffic-draw-tool-poc.md)
8. [poc-docs/specs/selected-area-vessel-fixture-replay.md](specs/selected-area-vessel-fixture-replay.md)
9. [src/data/selectedAreaVesselFixtures.json](../src/data/selectedAreaVesselFixtures.json)
10. [src/data/vesselFixtureReplay.js](../src/data/vesselFixtureReplay.js)
11. [src/data/vesselFixtureReplay.test.mjs](../src/data/vesselFixtureReplay.test.mjs)
12. [poc-docs/specs/selected-area-vessel-draw-integration.md](specs/selected-area-vessel-draw-integration.md)
13. [src/annotations/selectedAreaVesselIntegration.js](../src/annotations/selectedAreaVesselIntegration.js)
14. [src/annotations/selectedAreaVesselIntegration.test.mjs](../src/annotations/selectedAreaVesselIntegration.test.mjs)
15. [poc-docs/specs/selected-area-vessel-results-panel.md](specs/selected-area-vessel-results-panel.md)
16. [src/ui/templates/display-controls.html](../src/ui/templates/display-controls.html)
17. [src/ui/selectedAreaVesselPanel.js](../src/ui/selectedAreaVesselPanel.js)
18. [src/ui/styles/controls.css](../src/ui/styles/controls.css)
19. [src/ui/selectedAreaVesselPanel.test.mjs](../src/ui/selectedAreaVesselPanel.test.mjs)
20. [poc-docs/specs/selected-area-vessel-application-lifecycle.md](specs/selected-area-vessel-application-lifecycle.md)
21. [src/app/tools.js](../src/app/tools.js)
22. [poc-docs/specs/selected-area-vessel-end-to-end-demo.md](specs/selected-area-vessel-end-to-end-demo.md)
23. [poc-docs/selected-area-vessel-demo.md](selected-area-vessel-demo.md)
24. [poc-docs/specs/selected-area-vessel-map-fixture-visualization.md](specs/selected-area-vessel-map-fixture-visualization.md)
25. [src/annotations/selectedAreaVesselMap.js](../src/annotations/selectedAreaVesselMap.js)
26. [src/annotations/selectedAreaVesselMap.test.mjs](../src/annotations/selectedAreaVesselMap.test.mjs)
