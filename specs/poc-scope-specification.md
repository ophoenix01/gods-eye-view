# POC Scope Specification

## Requirements

### Decisions

| Decision | Options considered | Selected option | Owner | Status |
|---|---|---|---|---|
| Intended users | Coast Guard surveyors; maritime analysts; general operators | Coast Guard surveyors | User | Decided |
| Operational problem | General vessel monitoring; selected-area vessel tracking; crossing-event reporting | Improved tracking of vessels in a selected area | User | Decided |
| Demonstration evidence | Live AIS only; live AIS and fixtures; fixtures only | Fixtures only | User | Decided |
| Monitoring scope | One active polygon; multiple zones | One active polygon | User | Decided |
| Runtime state | Persistent; session in-memory | In-memory for the POC | User | Decided |
| Vessel identity | Call sign; IMO; MMSI | MMSI | User | Decided |
| Snapshot timing | Exact boundary timestamps; snapshot-to-snapshot transitions | Snapshot-based estimates | User | Decided |
| PoC deliverables | Source code only; source code and README; source code, README, and production deployment | Source code and README | User | Decided |
| Production monitoring | Included in POC scope; excluded from POC scope | Excluded from POC scope | User | Decided |
| Crossing alerts and persistence | Included in POC scope; excluded from POC scope | Excluded from POC scope | User | Decided |
| Delayed or missed AIS positions | Treated as exact movement; documented as sampling limitations | Document missed and delayed positions as sampling limitations | User | Decided |
| Assumption approval owner | User; separate product owner; maritime operations team | User | User | Decided |

### Acceptance Criteria

#### Operational problem

- [x] The README describes the operational problem of understanding which vessels enter or leave a Coast Guard surveyor-selected maritime area.
- [x] The README identifies Coast Guard surveyors as the intended users.
- [x] The README explains that the improvement should improve vessel tracking within a selected area compared with the current draw-tool and vessel workflows.
- [x] The README explains why a user-defined polygon and vessel crossing view are useful for this operational need.

#### POC behavior

- [x] The POC supports one active user-drawn polygon at a time.
- [x] The selected polygon is evaluated in memory for the duration of the demonstration.
- [x] The POC uses deterministic fixture positions to demonstrate vessel membership and transitions.
- [x] A vessel changing from outside to inside the polygon is represented as an incoming crossing.
- [x] A vessel changing from inside to outside the polygon is represented as an outgoing crossing.
- [x] Vessel identity in fixture records is identified by MMSI.
- [x] Fixture replay does not depend on live AIS credentials, network availability, or a vessel physically crossing a boundary.

#### Timing and data assumptions

- [x] The README states that crossing results are based on snapshot observations rather than exact boundary timestamps.
- [x] The README states that delayed AIS data may produce a result after the vessel's actual boundary event.
- [x] The README states that a refresh cycle may miss intermediate vessel movement and may show only the final snapshot state.
- [x] The README does not present snapshot-detected crossings as exact real-time operational tracking.

#### Scope exclusions

- [x] The README explicitly excludes multiple active zones from this POC.
- [x] The README explicitly excludes persistent crossing history.
- [x] The README explicitly excludes alerts or notifications.
- [x] The README explicitly excludes production monitoring guarantees and operational certification.
- [x] The README does not imply support for replacing live maritime surveillance systems.

## Plan

- [x] Draft the README problem statement from the Coast Guard surveyor perspective.
- [x] Document the selected improvement: better tracking of vessels in a user-selected area.
- [x] Document fixture-only demonstration assumptions and setup.
- [x] Describe one active polygon, in-memory state, and snapshot-based crossings.
- [x] List MMSI, AIS sampling, delayed-position, and missed-crossing assumptions.
- [x] Record explicit exclusions for multiple zones, persistence, alerts, and production monitoring.
- [x] Review the scope text against the acceptance criteria.
- [x] Add source code and README links to the POC deliverable structure when implementation begins.

## Validation

- [x] Confirm a Coast Guard surveyor can understand the operational problem without technical implementation knowledge.
- [x] Confirm the README identifies Coast Guard surveyors as intended users.
- [x] Confirm the README explains why selected-area vessel tracking improves the current draw-tool and vessel workflows.
- [x] Confirm one active polygon and fixture replay are unambiguous throughout the README.
- [x] Confirm snapshot timing, delayed observations, and missed intermediate crossings are documented.
- [x] Confirm MMSI is described as the vessel identifier.
- [x] Confirm multi-zone support, persistence, alerts, and production monitoring are visibly listed as out of scope.
- [x] Confirm fixture replay can be demonstrated without live AIS credentials or network access.
- [x] Confirm the README identifies source code and documentation as the POC deliverables.
- [x] Review the specification for unsupported claims or assumptions that were not confirmed.
- [x] Confirm no implementation code or repository commit was created as part of this Phase 0 workflow.
