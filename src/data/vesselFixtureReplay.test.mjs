import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadBundledJson } from './bundledJson.js';
import {
  loadVesselFixture,
  validateVesselFixture,
  VesselFixtureReplay,
} from './vesselFixtureReplay.js';

const FIXTURE_URL = new URL(
  './selectedAreaVesselFixtures.json',
  import.meta.url,
);

const fixture = () => ({
  polygon: [
    [0, 0],
    [10, 0],
    [0, 10],
    [0, 0],
  ],
  snapshots: [
    {
      timestamp: '2026-01-01T00:00:00Z',
      observations: [{ mmsi: '123456789', latitude: 2, longitude: 2 }],
    },
    {
      timestamp: '2026-01-01T00:01:00Z',
      observations: [{ mmsi: '123456789', latitude: 8, longitude: 8 }],
    },
  ],
});

test('loads and validates the bundled fixture without credentials or network', async () => {
  const loaded = await loadVesselFixture(FIXTURE_URL, loadBundledJson);
  assert.equal(loaded.validation.valid, true);
  assert.equal(loaded.fixture.snapshots.length, 5);
});

test('starts at baseline without synthetic crossings and steps snapshot transitions', () => {
  const replay = new VesselFixtureReplay();
  assert.equal(replay.loadFixture(fixture()).valid, true);

  let result = replay.start();
  assert.equal(result.valid, true);
  assert.equal(result.state.activeSnapshotIndex, 0);
  assert.deepEqual(result.transitions.incoming, []);
  assert.deepEqual(result.transitions.outgoing, []);

  result = replay.step();
  assert.equal(result.valid, true);
  assert.equal(result.transitions.outgoing.length, 1);
});

test('incoming crossing is published from the bundled fixture', async () => {
  const loaded = await loadVesselFixture(FIXTURE_URL);
  const replay = new VesselFixtureReplay();
  replay.loadFixture(loaded.fixture);
  replay.start();
  const result = replay.step();
  assert.equal(result.transitions.incoming.length, 1);
  assert.equal(result.transitions.incoming[0].mmsi, '987654321');
  assert.equal(result.transitions.incoming[0].estimate, 'snapshot-based');
});

test('outgoing, unchanged, and absent bundled snapshots replay in order', async () => {
  const loaded = await loadVesselFixture(FIXTURE_URL);
  const replay = new VesselFixtureReplay();
  replay.loadFixture(loaded.fixture);
  replay.start();

  const incoming = replay.step();
  assert.equal(incoming.transitions.incoming.length, 1);
  const outgoing = replay.step();
  assert.equal(outgoing.transitions.outgoing.length, 1);
  assert.equal(outgoing.transitions.outgoing[0].mmsi, '123456789');
  const absent = replay.step();
  assert.deepEqual(absent.transitions.incoming, []);
  assert.deepEqual(absent.transitions.outgoing, []);
  assert.equal(replay.getState().engine.memberships['123456789'], 'outside');
});

test('restart restores baseline and clears prior crossings', async () => {
  const loaded = await loadVesselFixture(FIXTURE_URL);
  const replay = new VesselFixtureReplay();
  replay.loadFixture(loaded.fixture);
  replay.start();
  replay.step();
  replay.step();
  const result = replay.restart();
  assert.equal(result.state.activeSnapshotIndex, 0);
  assert.deepEqual(result.state.engine.incoming, []);
  assert.deepEqual(result.state.engine.outgoing, []);
});

test('rejects malformed fixtures without applying state', () => {
  const replay = new VesselFixtureReplay();
  const invalid = fixture();
  invalid.snapshots[0].timestamp = 'yesterday';
  const loaded = replay.loadFixture(invalid);
  assert.equal(loaded.valid, false);
  assert.equal(loaded.error.code, 'invalid-timestamp');
  assert.equal(loaded.error.snapshotIndex, 0);
  assert.deepEqual(replay.getState().engine.inside, []);
});

test('rejects empty, duplicate MMSI, and invalid observation fixtures', () => {
  assert.equal(validateVesselFixture({ snapshots: [] }).valid, false);
  const duplicate = fixture();
  duplicate.snapshots[0].observations.push({
    mmsi: '123456789',
    latitude: 3,
    longitude: 3,
  });
  assert.equal(validateVesselFixture(duplicate).valid, false);
  assert.equal(validateVesselFixture(duplicate).snapshotIndex, 0);
  assert.equal(validateVesselFixture(duplicate).code, 'duplicate-mmsi');
});

test('structured validation names invalid timestamps, coordinates, and MMSIs', () => {
  const invalidTimestamp = fixture();
  invalidTimestamp.snapshots[0].timestamp = 'not-a-date';
  assert.equal(
    validateVesselFixture(invalidTimestamp).code,
    'invalid-timestamp',
  );
  assert.equal(validateVesselFixture(invalidTimestamp).snapshotIndex, 0);

  const invalidCoordinate = fixture();
  invalidCoordinate.snapshots[0].observations[0].latitude = 91;
  assert.equal(
    validateVesselFixture(invalidCoordinate).code,
    'invalid-observation',
  );
  assert.equal(validateVesselFixture(invalidCoordinate).snapshotIndex, 0);

  const invalidMmsi = fixture();
  invalidMmsi.snapshots[0].observations[0].mmsi = 'not-an-mmsi';
  assert.equal(validateVesselFixture(invalidMmsi).code, 'invalid-observation');
  assert.equal(validateVesselFixture(invalidMmsi).snapshotIndex, 0);
});

test('final snapshot reports completion and advancing beyond it leaves state unchanged', async () => {
  const loaded = await loadVesselFixture(FIXTURE_URL);
  const replay = new VesselFixtureReplay();
  replay.loadFixture(loaded.fixture);
  replay.start();
  replay.step();
  replay.step();
  replay.step();
  const finalResult = replay.step();
  assert.equal(finalResult.complete, true);
  const before = replay.getState();
  const beyond = replay.step();
  assert.equal(beyond.complete, true);
  assert.deepEqual(replay.getState(), before);
});

test('runtime invalid snapshot freezes replay and blocks advancement', () => {
  const replay = new VesselFixtureReplay();
  const valid = fixture();
  replay.loadFixture(valid);
  replay.start();
  valid.snapshots[1].observations[0].longitude = 181;
  const before = replay.getState();
  const result = replay.step();
  assert.equal(result.valid, false);
  assert.equal(result.error.code, 'invalid-observation');
  assert.equal(replay.getState().frozen, true);
  assert.deepEqual(replay.getState().engine, before.engine);
  assert.deepEqual(replay.step(), result);
});

test('reset clears fixture state and replacing fixture starts from its baseline', () => {
  const replay = new VesselFixtureReplay();
  replay.loadFixture(fixture());
  replay.start();
  replay.reset();
  assert.equal(replay.getState().fixture, null);
  assert.equal(replay.getState().activeSnapshotIndex, -1);
  assert.equal(replay.getState().timestamp, null);
  assert.equal(replay.getState().error, null);

  replay.loadFixture(fixture());
  replay.start();
  assert.equal(replay.getState().activeSnapshotIndex, 0);
});

test('replacement fixture does not merge prior snapshots or crossings', () => {
  const replay = new VesselFixtureReplay();
  replay.loadFixture(fixture());
  replay.start();
  replay.step();

  const replacement = fixture();
  replacement.snapshots = [
    {
      timestamp: '2027-01-01T00:00:00Z',
      observations: [{ mmsi: '111222333', latitude: 1, longitude: 1 }],
    },
  ];
  replay.loadFixture(replacement);
  const result = replay.start();
  assert.equal(result.valid, true);
  assert.equal(result.state.timestamp, '2027-01-01T00:00:00Z');
  assert.deepEqual(result.state.engine.incoming, []);
  assert.deepEqual(result.state.engine.outgoing, []);
  assert.equal(replay.snapshots.length, 1);
  assert.equal(replay.engine.getState().memberships['123456789'], undefined);
});
