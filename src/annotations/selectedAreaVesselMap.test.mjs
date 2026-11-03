import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mapSelectedAreaVesselMarkers,
  initSelectedAreaVesselMap,
} from './selectedAreaVesselMap.js';

const activeState = () => ({
  activeSnapshotIndex: 0,
  frozen: false,
  engine: {
    polygon: [[0, 0], [10, 0], [0, 10]],
    memberships: { 123456789: 'inside', 987654321: 'outside' },
  },
  currentSnapshot: {
    observations: [
      { mmsi: '123456789', longitude: 2, latitude: 2 },
      { mmsi: '987654321', longitude: 8, latitude: 8 },
    ],
  },
});

test('maps current fixture observations with MMSI and membership', () => {
  assert.deepEqual(mapSelectedAreaVesselMarkers(activeState()), [
    {
      mmsi: '123456789',
      longitude: 2,
      latitude: 2,
      membership: 'inside',
    },
    {
      mmsi: '987654321',
      longitude: 8,
      latitude: 8,
      membership: 'outside',
    },
  ]);
});

test('fixture markers stay hidden without an active polygon', () => {
  assert.deepEqual(
    mapSelectedAreaVesselMarkers({
      ...activeState(),
      activeSnapshotIndex: -1,
    }),
    [],
  );
});

test('map controller adds, updates, removes, freezes, and destroys markers', () => {
  const listeners = new Set();
  const integration = {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  const entities = [];
  const dataSource = {
    entities: {
      add(spec) {
        const entity = { ...spec };
        entities.push(entity);
        return entity;
      },
      remove(entity) {
        entities.splice(entities.indexOf(entity), 1);
      },
    },
  };
  const cesium = {
    CustomDataSource: function CustomDataSource() {
      return dataSource;
    },
    Cartesian3: { fromDegrees: (longitude, latitude) => ({ longitude, latitude }) },
    Cartesian2: function Cartesian2(x, y) {
      return { x, y };
    },
    Color: {
      WHITE: 'white',
      BLACK: 'black',
      fromCssColorString: (value) => value,
    },
    HeightReference: { CLAMP_TO_GROUND: 'clamp' },
    LabelStyle: { FILL_AND_OUTLINE: 'fill-outline' },
    VerticalOrigin: { BOTTOM: 'bottom' },
  };
  const viewer = {
    dataSources: {
      add(source) {
        assert.equal(source, dataSource);
      },
      remove(source, destroy) {
        assert.equal(source, dataSource);
        assert.equal(destroy, true);
      },
    },
  };
  const overlayEntries = new Map();
  const overlay = {
    setOverlayEntries(source, entries) {
      overlayEntries.set(source, entries);
    },
    clearOverlaySource(source) {
      overlayEntries.delete(source);
    },
  };
  const map = initSelectedAreaVesselMap({
    integration,
    viewer,
    cesium,
    overlay,
  });

  map.render(activeState());
  assert.equal(entities.length, 2);
  assert.equal(overlayEntries.get('selected-area-vessel-fixture-markers')[0].title, '123456789');
  assert.equal(entities[0].point.color, '#5dff9f');

  const absent = {
    ...activeState(),
    currentSnapshot: { observations: [activeState().currentSnapshot.observations[0]] },
  };
  map.render(absent);
  assert.equal(entities.length, 1);

  const frozen = { ...absent, frozen: true };
  const positionBefore = entities[0].position;
  map.render(frozen);
  assert.equal(entities[0].position, positionBefore);

  map.destroy();
  assert.equal(listeners.size, 0);
});
