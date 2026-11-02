import assert from 'node:assert/strict';
import test from 'node:test';
import { initSelectedAreaVesselIntegration } from './selectedAreaVesselIntegration.js';

const fixture = {
  polygon: [
    [0, 0],
    [10, 0],
    [0, 10],
    [0, 0],
  ],
  snapshots: [
    {
      timestamp: '2026-01-01T00:00:00Z',
      observations: [{ mmsi: '123456789', longitude: 2, latitude: 2 }],
    },
    {
      timestamp: '2026-01-01T00:01:00Z',
      observations: [],
    },
  ],
};

function mockAnnotations() {
  const listeners = new Set();
  return {
    listeners,
    onAreaChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emit(event) {
      for (const listener of listeners) listener(event);
    },
  };
}

test('valid manual area replaces the fixture polygon and restarts baseline', async () => {
  const annotations = mockAnnotations();
  const integration = initSelectedAreaVesselIntegration({
    annotations,
    fixture,
  });
  await integration.loading;

  annotations.emit({
    type: 'area',
    ring: [
      [20, 20],
      [30, 20],
      [20, 30],
      [20, 20],
    ],
  });

  const state = integration.getState();
  assert.equal(state.activeSnapshotIndex, 0);
  assert.deepEqual(state.engine.polygon, [
    [20, 20],
    [30, 20],
    [20, 30],
  ]);
});

test('invalid rings preserve active replay state', async () => {
  const annotations = mockAnnotations();
  const integration = initSelectedAreaVesselIntegration({
    annotations,
    fixture,
  });
  await integration.loading;
  const before = integration.getState();

  annotations.emit({ type: 'area', ring: [[0, 0], [1, 0], [1, 0]] });

  const state = integration.getState();
  assert.equal(state.activeSnapshotIndex, before.activeSnapshotIndex);
  assert.deepEqual(state.engine.polygon, before.engine.polygon);
  assert.equal(state.error.code, 'invalid-polygon');
});

test('clear resets replay and destroy unsubscribes area changes', async () => {
  const annotations = mockAnnotations();
  const integration = initSelectedAreaVesselIntegration({
    annotations,
    fixture,
  });
  await integration.loading;

  annotations.emit({ type: 'clear' });
  assert.equal(annotations.listeners.size, 1);
  assert.equal(integration.getState().activeSnapshotIndex, -1);

  integration.destroy();
  assert.equal(annotations.listeners.size, 0);
  annotations.emit({ type: 'area', ring: [[0, 0], [1, 0], [0, 1]] });
  assert.equal(integration.getState().activeSnapshotIndex, -1);
});

test('fixtures without a polygon remain inactive until a ring is drawn', async () => {
  const fixtureWithoutPolygon = {
    snapshots: [
      {
        timestamp: '2026-01-01T00:00:00Z',
        observations: [],
      },
    ],
  };
  const integration = initSelectedAreaVesselIntegration({
    annotations: mockAnnotations(),
    fixture: fixtureWithoutPolygon,
  });
  await integration.loading;

  assert.equal(integration.getState().activeSnapshotIndex, -1);
  integration.replacePolygon([
    [0, 0],
    [1, 0],
    [0, 1],
    [0, 0],
  ]);
  assert.equal(integration.getState().activeSnapshotIndex, 0);
});
