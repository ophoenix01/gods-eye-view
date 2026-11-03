# Selected-Area Vessel Tracking Engine Specification

## Requirements

### Decisions

| Decision | Options considered | Selected option | Owner | Status |
|---|---|---|---|---|
| Phase 1 feature boundary | Polygon/UI integration; tracking engine only | Pure polygon membership, vessel-state evaluation, and snapshot-transition logic | User | Decided |
| Polygon geometry | Application-specific annotation object; existing draw-tool `area` ring contract | Consume a closed latitude/longitude ring compatible with the existing draw-tool area contract | Maintainer | Proposed |
| Vessel identity | Call sign; IMO; MMSI | MMSI | User | Decided |
| Position input | Single vessel list; timestamped snapshot of MMSI positions | Timestamped immutable snapshot containing MMSI and latitude/longitude | Maintainer | Proposed |
| Crossing semantics | Exact boundary timestamps; snapshot-to-snapshot transitions | One incoming/outgoing result when observed membership changes between snapshots | User | Decided |
| Initial snapshot | Mark first observed vessels as crossings; establish membership without crossing | Establish membership from the baseline snapshot without synthetic crossing events | Maintainer | Proposed |
| Missing vessel between snapshots | Treat as gone; preserve last known membership | Preserve the last known membership until a later snapshot identifies the same MMSI inside or outside | Maintainer | Proposed |
| Duplicate MMSI in one snapshot | Reject snapshot; use last position; evaluate each record | Reject the snapshot as invalid | Maintainer | Proposed |
| Polygon boundary points | Outside; inside; preserve separate boundary state | Treat a position exactly on the polygon boundary as inside | User | Decided |
| Antimeridian polygons | Unwrapped geometry; project or reject antimeridian polygons | Reuse the repository's longitude-continuity convention for membership calculations | Maintainer | Proposed |
| Invalid coordinates | Reject whole snapshot; ignore invalid records; preserve previous state | Reject the snapshot and do not publish any membership or crossing changes | Maintainer | Proposed |

### Acceptance Criteria

#### Polygon membership

- [x] The tracking engine shall classify a latitude/longitude position as inside or outside a valid closed polygon.
- [x] The tracking engine shall accept the existing draw-tool area ring shape containing longitude/latitude pairs.
- [x] The tracking engine shall accept a ring across the antimeridian when the repository's existing longitude-continuity convention is used.
- [x] The tracking engine shall return a validation failure when a polygon has fewer than three distinct vertices, has repeated or invalid coordinates, or encloses no measurable area.
- [x] Replacing the active polygon shall immediately reevaluate all vessel positions against the new polygon.
- [x] No portion of the tracking engine shall use Cesium, DOM, network, or live AIS services.

#### Snapshot processing

- [x] The tracking engine shall process each fixture snapshot as an immutable set of vessel observations identified by MMSI.
- [x] The first snapshot shall establish each vessel's observed membership without creating an incoming or outgoing event.
- [x] A vessel observed outside followed by inside shall produce one incoming crossing attributed to its MMSI and snapshot timestamp.
- [x] A vessel observed inside followed by outside shall produce one outgoing crossing attributed to its MMSI and snapshot timestamp.
- [x] A vessel that remains on the same side of the polygon shall produce no crossing.
- [x] A vessel absent from two snapshots shall not produce a crossing.
- [x] A vessel absent from one snapshot and present in the next snapshot shall be evaluated only from its last observed membership.
- [x] A snapshot containing duplicate MMSIs shall produce no membership or crossing changes.
- [x] A snapshot containing an invalid latitude, longitude, or MMSI shall produce no membership or crossing changes.

#### Engine state and observability

- [x] The tracking engine shall expose the current vessels classified inside the active polygon.
- [x] The tracking engine shall expose the vessels classified outside the active polygon.
- [x] The tracking engine shall expose incoming and outgoing transitions detected by the most recent snapshot.
- [x] All crossing results shall be identified by MMSI and shall describe them as snapshot-based estimates rather than exact boundary timestamps.
- [x] Resetting the engine shall clear the active polygon, observed vessel membership, and crossing history from memory.

#### Phase exclusions

- [x] The engine shall not provide persistence, alerts, notifications, live AIS integration, or production monitoring guarantees.
- [x] The engine shall not support multiple active polygons.

## Plan

- [x] Define the engine's pure contracts for polygons, vessel snapshots, memberships, crossings, and validation results.
- [x] Implement point-in-polygon membership using longitude-continuity behavior consistent with the draw tool.
- [x] Implement immutable MMSI snapshot normalization and duplicate/invalid-record rejection.
- [x] Implement baseline membership initialization without synthetic first-snapshot crossings.
- [x] Implement snapshot-to-snapshot incoming and outgoing transition detection.
- [x] Implement polygon replacement so existing MMSI observations are reevaluated against the new polygon.
- [x] Implement reset and teardown behavior for active polygon and in-memory crossing state.
- [x] Add deterministic unit fixtures covering inside, outside, entry, exit, unchanged state, absent vessels, duplicates, and invalid records.
- [x] Add focused unit tests for antimeridian polygons and boundary-coordinate behavior after its decision is approved.
- [x] Run repository formatting and focused unit-test validation for the tracking engine.
- [x] Document the public contracts only; integration with drawing, fixtures, replay, and UI remains for later phases.

## Validation

- [x] With a valid triangular fixture, verify a point inside the polygon is returned as inside and a point outside is returned as outside.
- [x] With points in the repository's existing antimeridian fixture set, verify membership does not treat the longitude seam as an artificial gap.
- [x] Verify an invalid or degenerate polygon produces a validation result and causes no membership or crossing update.
- [x] Verify the first snapshot establishes membership and produces no incoming or outgoing crossings.
- [x] Verify an outside-to-inside MMSI transition produces one incoming crossing with the snapshot timestamp.
- [x] Verify an inside-to-outside MMSI transition produces one outgoing crossing with the snapshot timestamp.
- [x] Verify unchanged memberships produce no crossings across two or more snapshots.
- [x] Verify a vessel absent from a single snapshot is omitted from that snapshot's crossing results and retains its last known classification for later comparison.
- [x] Verify duplicate MMSIs and invalid position data reject a snapshot without changing engine state.
- [x] Verify replacing a polygon reevaluates all retained vessel observations and reports only transitions justified by the polygon change where required by the approved contract.
- [x] Verify reset removes the polygon, vessel memberships, and crossing history.
- [x] Run the tracking engine's focused unit-test command and confirm all tests pass.
- [x] Run the repository boundary check and confirm the pure engine introduces no prohibited UI, network, or rendering dependency.
- [x] Confirm fixture replay can demonstrate the engine without credentials, network access, live AIS, or physical vessel movement.
