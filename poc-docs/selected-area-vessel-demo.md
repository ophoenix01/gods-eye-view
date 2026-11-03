# Selected-Area Vessel End-to-End Demo

This script demonstrates selected-area vessel replay without live AIS
credentials, fixture downloads, or vessel movement.

## Automated evidence

Run these commands before starting the operator walkthrough:

```sh
npm test
npm run test:track
npm run format:check
npm run check:boundaries
npm run build
```

Automated passes verify deterministic fixture replay, Draw activation,
replacement, clear, teardown, package boundaries, tracking invariants, and
application bundling. Screenshots and recordings are optional.

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

The default polygon represents the fixed fixture area of
`(0, 0)`, `(10, 0)`, `(0, 10)`, and `(0, 0)`; the operator's drawn ring becomes
authoritative when replay activates. The recommended first area is one that
includes `(2, 2)` and excludes `(8, 8)`.

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

## Known limits

Fixture replay uses snapshot-based observations. AIS or fixture sampling can
delay a position, and refresh intervals can miss intermediate crossings.
Crossing times and timestamps are sampling estimates, not exact vessel
boundary times. This PoC
does not persist results, support multiple zones, send alerts, provide
operational monitoring guarantees, or replace live maritime surveillance.

## Cleanup

Clear Draw, collapse any demo-only controls, and close the browser tab. No
persistent fixture state, alerts, credentials, or network subscriptions are
created by the demo.
