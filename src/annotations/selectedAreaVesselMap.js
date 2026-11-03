import * as Cesium from 'cesium';
import {
  clearOverlaySource,
  setOverlayEntries,
} from '../overlays/worldOverlay.js';

export const FIXTURE_INSIDE_COLOR = '#5dff9f';
export const FIXTURE_OUTSIDE_COLOR = '#ff9f43';

export function mapSelectedAreaVesselMarkers(state = {}) {
  if (!state.engine?.polygon || state.activeSnapshotIndex < 0) return [];
  const memberships = state.engine.memberships || {};
  return (state.currentSnapshot?.observations || [])
    .filter(
      (observation) =>
        Number.isFinite(Number(observation.longitude)) &&
        Number.isFinite(Number(observation.latitude)),
    )
    .map((observation) => ({
      mmsi: String(observation.mmsi),
      longitude: Number(observation.longitude),
      latitude: Number(observation.latitude),
      membership:
        memberships[String(observation.mmsi)] === 'inside'
          ? 'inside'
          : 'outside',
    }));
}

export function initSelectedAreaVesselMap({
  integration,
  viewer,
  cesium = Cesium,
  overlay = { clearOverlaySource, setOverlayEntries },
} = {}) {
  if (!integration || !viewer) return null;
  const dataSource = new cesium.CustomDataSource(
    'selected-area-vessel-fixture-markers',
  );
  viewer.dataSources.add(dataSource);
  const entities = new Map();
  let destroyed = false;

  const render = (state) => {
    if (destroyed) return;
    const hasActivePolygon =
      state.activeSnapshotIndex >= 0 && Boolean(state.engine?.polygon);
    const markers = hasActivePolygon
      ? mapSelectedAreaVesselMarkers(state.frozen ? lastValidState : state)
      : [];
    const active = hasActivePolygon && !state.frozen;
    if (active) lastValidState = state;
    const desired = active
      ? new Map(markers.map((marker) => [marker.mmsi, marker]))
      : new Map();
    if (state.frozen && hasActivePolygon) {
      for (const marker of markers) desired.set(marker.mmsi, marker);
    }

    overlay.setOverlayEntries(
      'selected-area-vessel-fixture-markers',
      [...desired.values()].map((marker) => {
        const position = cesium.Cartesian3.fromDegrees(
          marker.longitude,
          marker.latitude,
          100,
        );
        return {
          id: marker.mmsi,
          position,
          variant: 'label',
          title: marker.mmsi,
          accent:
            marker.membership === 'inside'
              ? FIXTURE_INSIDE_COLOR
              : FIXTURE_OUTSIDE_COLOR,
          paintLane: 'ambient-label',
        };
      }),
      { collisionCapacity: 2 },
    );

    for (const [mmsi, entity] of entities) {
      if (desired.has(mmsi)) continue;
      dataSource.entities.remove(entity);
      entities.delete(mmsi);
    }
    for (const [mmsi, marker] of desired) {
      let entity = entities.get(mmsi);
      if (!entity) {
        entity = dataSource.entities.add({
          point: {},
        });
        entities.set(mmsi, entity);
        entity.position = cesium.Cartesian3.fromDegrees(
          marker.longitude,
          marker.latitude,
          100,
        );
      }
      if (!state.frozen || !entities.has(mmsi)) {
        entity.position = cesium.Cartesian3.fromDegrees(
          marker.longitude,
          marker.latitude,
          100,
        );
      }
      entity.point = {
        pixelSize: 12,
        color:
          marker.membership === 'inside'
            ? cesium.Color.fromCssColorString(FIXTURE_INSIDE_COLOR)
            : cesium.Color.fromCssColorString(FIXTURE_OUTSIDE_COLOR),
        outlineColor: cesium.Color.WHITE,
        outlineWidth: 2,
        heightReference: cesium.HeightReference.CLAMP_TO_GROUND,
      };
    }
  };

  let lastValidState = null;
  const unsubscribe = integration.subscribe(render);

  return {
    render,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      unsubscribe();
      overlay.clearOverlaySource('selected-area-vessel-fixture-markers');
      viewer.dataSources.remove(dataSource, true);
    },
  };
}
