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
