import assert from 'node:assert/strict';
import test from 'node:test';
import { mapSelectedAreaVesselState } from './selectedAreaVesselPanel.js';

const state = (overrides = {}) => ({
  fixture: { snapshots: [{}] },
  timestamp: '2026-01-01T00:00:00Z',
  sequenceComplete: false,
  frozen: false,
  error: null,
  engine: {
    polygon: [[0, 0], [10, 0], [0, 10]],
    inside: [{ mmsi: '20' }, { mmsi: '3' }],
    outside: [{ mmsi: '100' }, { mmsi: '9' }],
    incoming: [{ mmsi: '20', timestamp: '2026-01-01T00:00:00Z' }],
    outgoing: [{ mmsi: '9', timestamp: '2026-01-01T00:00:00Z' }],
  },
  ...overrides,
});

test('maps memberships and MMSIs numerically', () => {
  const view = mapSelectedAreaVesselState(state());
  assert.deepEqual(view.inside, ['3', '20']);
  assert.deepEqual(view.outside, ['9', '100']);
  assert.equal(view.incoming[0].mmsi, '20');
  assert.equal(view.incoming[0].timestamp, '2026-01-01T00:00:00Z');
});

test('maps empty lists and complete replay controls', () => {
  const view = mapSelectedAreaVesselState(
    state({
      sequenceComplete: true,
      engine: {
        polygon: [[0, 0], [1, 0], [0, 1]],
        inside: [],
        outside: [],
        incoming: [],
        outgoing: [],
      },
    }),
  );
  assert.deepEqual(view.inside, []);
  assert.deepEqual(view.incoming, []);
  assert.equal(view.complete, true);
  assert.equal(view.nextDisabled, true);
});

test('maps frozen validation copy while preserving prior results', () => {
  const view = mapSelectedAreaVesselState(
    state({
      frozen: true,
      error: { code: 'invalid-timestamp', reason: 'bad timestamp' },
    }),
  );
  assert.deepEqual(view.inside, ['3', '20']);
  assert.equal(view.error, 'invalid-timestamp: bad timestamp');
  assert.equal(view.nextDisabled, true);
});

test('maps no-polygon and fixture-state separately', () => {
  const view = mapSelectedAreaVesselState({
    fixture: null,
    engine: { polygon: null, inside: [], outside: [], incoming: [], outgoing: [] },
  });
  assert.equal(view.active, false);
  assert.equal(view.fixtureLoaded, false);
  assert.equal(view.previousDisabled, true);
});

test('previous is enabled after advancing beyond the baseline', () => {
  const view = mapSelectedAreaVesselState(
    state({ activeSnapshotIndex: 2 }),
  );
  assert.equal(view.previousDisabled, false);
  assert.equal(view.previousReason, '');
});
