import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyPointInPolygon,
  createVesselTrackingEngine,
  normalizeVesselSnapshot,
  pointInPolygon,
  validatePolygon,
  VesselTrackingEngine,
} from './vesselTrackingEngine.js';

const TRIANGLE = [
  [0, 0],
  [10, 0],
  [0, 10],
  [0, 0],
];

test('validates and classifies closed draw-tool polygon rings', () => {
  assert.equal(validatePolygon(TRIANGLE).valid, true);
  assert.equal(pointInPolygon(2, 2, TRIANGLE), true);
  assert.equal(pointInPolygon(8, 8, TRIANGLE), false);
  assert.equal(classifyPointInPolygon(0, 5, TRIANGLE), 'inside');
});

test('rejects polygons that are degenerate, repeated or invalid', () => {
  assert.equal(
    validatePolygon([
      [0, 0],
      [1, 0],
      [2, 0],
    ]).valid,
    false,
  );
  assert.equal(
    validatePolygon([
      [0, 0],
      [0, 0],
      [1, 1],
    ]).valid,
    false,
  );
  assert.equal(
    validatePolygon([
      [0, 0],
      [190, 0],
      [0, 1],
    ]).valid,
    false,
  );
});

test('uses continuous longitudes across the antimeridian', () => {
  const polygon = [
    [179, 0],
    [179, 10],
    [-179, 10],
    [-179, 0],
    [179, 0],
  ];
  assert.equal(pointInPolygon(180, 5, polygon), true);
  assert.equal(pointInPolygon(0, 5, polygon), false);
});

test('first snapshot establishes memberships without crossings', () => {
  const engine = createVesselTrackingEngine();
  engine.setPolygon(TRIANGLE);
  const result = engine.processSnapshot({
    timestamp: '2026-01-01T00:00:00Z',
    observations: [
      { mmsi: '123456789', latitude: 2, longitude: 2 },
      { mmsi: '987654321', latitude: 8, longitude: 8 },
    ],
  });
  assert.equal(result.valid, true);
  assert.deepEqual(result.incoming, []);
  assert.deepEqual(result.outgoing, []);
  assert.deepEqual(
    engine.getState().inside.map((vessel) => vessel.mmsi),
    ['123456789'],
  );
  assert.deepEqual(
    engine.getState().outside.map((vessel) => vessel.mmsi),
    ['987654321'],
  );
});

test('reports entry and exit transitions at snapshot timestamps', () => {
  const engine = new VesselTrackingEngine();
  engine.setPolygon(TRIANGLE);
  engine.processSnapshot({
    timestamp: 't1',
    observations: [{ mmsi: 123456789, longitude: 8, latitude: 8 }],
  });
  const entered = engine.processSnapshot({
    timestamp: 't2',
    observations: [{ mmsi: 123456789, longitude: 2, latitude: 2 }],
  });
  assert.equal(entered.incoming[0].mmsi, '123456789');
  assert.equal(entered.incoming[0].timestamp, 't2');
  assert.equal(entered.incoming[0].estimate, 'snapshot-based');
  const exited = engine.processSnapshot({
    timestamp: 't3',
    observations: [{ mmsi: 123456789, longitude: 8, latitude: 8 }],
  });
  assert.equal(exited.outgoing[0].timestamp, 't3');
});

test('unchanged memberships produce no crossings across snapshots', () => {
  const engine = createVesselTrackingEngine();
  engine.setPolygon(TRIANGLE);
  engine.processSnapshot({
    timestamp: 't1',
    observations: [{ mmsi: 123456789, longitude: 2, latitude: 2 }],
  });
  const result = engine.processSnapshot({
    timestamp: 't2',
    observations: [{ mmsi: 123456789, longitude: 3, latitude: 1 }],
  });
  assert.deepEqual(result.incoming, []);
  assert.deepEqual(result.outgoing, []);
});

test('absent vessels retain membership and are compared only when observed again', () => {
  const engine = createVesselTrackingEngine();
  engine.setPolygon(TRIANGLE);
  engine.processSnapshot({
    timestamp: 't1',
    observations: [{ mmsi: 123456789, longitude: 2, latitude: 2 }],
  });
  engine.processSnapshot({ timestamp: 't2', observations: [] });
  assert.deepEqual(engine.getState().incoming, []);
  assert.deepEqual(
    engine.getState().inside.map((vessel) => vessel.mmsi),
    ['123456789'],
  );
  const result = engine.processSnapshot({
    timestamp: 't3',
    observations: [{ mmsi: 123456789, longitude: 8, latitude: 8 }],
  });
  assert.equal(result.outgoing.length, 1);
});

test('duplicate and invalid snapshots leave state unchanged', () => {
  const engine = createVesselTrackingEngine();
  engine.setPolygon(TRIANGLE);
  engine.processSnapshot({
    timestamp: 't1',
    observations: [{ mmsi: 123456789, longitude: 2, latitude: 2 }],
  });
  const before = engine.getState();
  assert.equal(
    engine.processSnapshot({
      timestamp: 't2',
      observations: [
        { mmsi: 123456789, longitude: 2, latitude: 2 },
        { mmsi: 123456789, longitude: 3, latitude: 3 },
      ],
    }).valid,
    false,
  );
  assert.deepEqual(engine.getState(), before);
  assert.equal(
    engine.processSnapshot({
      timestamp: 't3',
      observations: [{ mmsi: 123456789, longitude: 181, latitude: 2 }],
    }).valid,
    false,
  );
  assert.deepEqual(engine.getState(), before);
});

test('polygon replacement reevaluates retained observations and reset clears state', () => {
  const engine = createVesselTrackingEngine();
  engine.setPolygon(TRIANGLE);
  engine.processSnapshot({
    timestamp: 't1',
    observations: [{ mmsi: 123456789, longitude: 8, latitude: 8 }],
  });
  const result = engine.replacePolygon(
    [
      [7, 7],
      [10, 7],
      [10, 10],
      [7, 10],
      [7, 7],
    ],
    't2',
  );
  assert.equal(result.valid, true);
  assert.equal(result.outgoing.length, 0);
  assert.equal(result.incoming.length, 1);
  engine.reset();
  assert.equal(engine.getState().polygon, null);
  assert.deepEqual(engine.getState().inside, []);
  assert.deepEqual(engine.getState().incoming, []);
});

test('invalid polygon replacement leaves engine state unchanged', () => {
  const engine = createVesselTrackingEngine();
  engine.setPolygon(TRIANGLE);
  engine.processSnapshot({
    timestamp: 't1',
    observations: [{ mmsi: 123456789, longitude: 2, latitude: 2 }],
  });
  const before = engine.getState();
  assert.deepEqual(
    engine.replacePolygon([
      [0, 0],
      [1, 0],
      [2, 0],
    ]),
    { valid: false, reason: 'zero-area' },
  );
  assert.deepEqual(engine.getState(), before);
});

test('snapshot normalization rejects invalid MMSIs and duplicate observations', () => {
  assert.equal(
    normalizeVesselSnapshot([{ mmsi: 123456789, latitude: 0, longitude: 0 }])
      .valid,
    true,
  );
  assert.equal(
    normalizeVesselSnapshot([{ mmsi: 'bad', latitude: 0, longitude: 0 }]).valid,
    false,
  );
  assert.equal(
    normalizeVesselSnapshot([
      { mmsi: '123456789', latitude: 0, longitude: 0 },
      { mmsi: '123456789', latitude: 1, longitude: 1 },
    ]).valid,
    false,
  );
});
