# Selected-Area Vessel Tracking Proof of Concept

This proof of concept (PoC) is intended for **Coast Guard surveyors**. Its
operational goal is to make it easier to understand which vessels enter or
leave a maritime area selected by a surveyor.

Today, the relevant draw-tool and vessel workflows are separate ways to mark
an area and review ship activity. This PoC improves that workflow by
connecting a user-defined polygon with a focused vessel-crossing view, helping
a surveyor answer "which vessels entered this area?" and "which vessels left
this area?" without maintaining a second mental picture of both workflows.

## Demonstration behavior

- The demonstration supports **one active user-drawn polygon at a time**.
- The polygon and vessel membership are evaluated **in memory for the duration
  of the demonstration**.
- Deterministic fixture positions provide vessel membership and transitions
  between snapshots. Fixture replay does not require live AIS credentials,
  network access, or a physical vessel to cross a boundary.
- Fixtures identify vessels by **MMSI**. A transition from outside the polygon
  to inside is represented as an incoming crossing; a transition from inside
  to outside is represented as an outgoing crossing.

## Timing and AIS assumptions

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

The deliverables for this Phase 0 scope are the [source
code](../src/) and this README documentation. The complete scope is recorded
in the [PoC Scope Specification](../specs/poc-scope-specification.md).

## File changes

Files added or updated for this PoC, in delivery order:

1. [.agents/skills/spec-workflow/SKILL.md](../.agents/skills/spec-workflow/SKILL.md)
2. [specs/poc-scope-specification.md](../specs/poc-scope-specification.md)
3. [poc-docs/README.md](README.md)
4. [specs/selected-area-vessel-tracking-engine.md](../specs/selected-area-vessel-tracking-engine.md)
5. [src/data/vesselTrackingEngine.js](../src/data/vesselTrackingEngine.js)
6. [src/data/vesselTrackingEngine.test.mjs](../src/data/vesselTrackingEngine.test.mjs)
7. [poc-docs/vessel-traffic-draw-tool-poc.md](vessel-traffic-draw-tool-poc.md)
8. [specs/selected-area-vessel-fixture-replay.md](../specs/selected-area-vessel-fixture-replay.md)
9. [src/data/selectedAreaVesselFixtures.json](../src/data/selectedAreaVesselFixtures.json)
10. [src/data/vesselFixtureReplay.js](../src/data/vesselFixtureReplay.js)
11. [src/data/vesselFixtureReplay.test.mjs](../src/data/vesselFixtureReplay.test.mjs)
12. [specs/selected-area-vessel-draw-integration.md](../specs/selected-area-vessel-draw-integration.md)
13. [src/annotations/selectedAreaVesselIntegration.js](../src/annotations/selectedAreaVesselIntegration.js)
14. [src/annotations/selectedAreaVesselIntegration.test.mjs](../src/annotations/selectedAreaVesselIntegration.test.mjs)
15. [specs/selected-area-vessel-results-panel.md](../specs/selected-area-vessel-results-panel.md)
16. [src/ui/templates/display-controls.html](../src/ui/templates/display-controls.html)
17. [src/ui/selectedAreaVesselPanel.js](../src/ui/selectedAreaVesselPanel.js)
18. [src/ui/styles/controls.css](../src/ui/styles/controls.css)
19. [src/ui/selectedAreaVesselPanel.test.mjs](../src/ui/selectedAreaVesselPanel.test.mjs)
20. [specs/selected-area-vessel-application-lifecycle.md](../specs/selected-area-vessel-application-lifecycle.md)
21. [src/app/tools.js](../src/app/tools.js) - Phase 5 application lifetime and lazy Draw activation wiring
22. [specs/selected-area-vessel-end-to-end-demo.md](../specs/selected-area-vessel-end-to-end-demo.md)
23. [poc-docs/selected-area-vessel-demo.md](selected-area-vessel-demo.md)
24. [specs/selected-area-vessel-map-fixture-visualization.md](../specs/selected-area-vessel-map-fixture-visualization.md)
25. [src/annotations/selectedAreaVesselMap.js](../src/annotations/selectedAreaVesselMap.js)
26. [src/annotations/selectedAreaVesselMap.test.mjs](../src/annotations/selectedAreaVesselMap.test.mjs)
