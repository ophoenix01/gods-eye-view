import {
  VesselFixtureReplay,
  loadVesselFixture,
} from '../data/vesselFixtureReplay.js';

/**
 * Connect completed manual draw areas to deterministic vessel replay.
 * No rendering or live AIS behavior belongs in this controller.
 */
export function initSelectedAreaVesselIntegration({
  annotations,
  replay = new VesselFixtureReplay(),
  fixture,
  fixtureUrl,
} = {}) {
  let destroyed = false;
  let unsubscribe = () => {};
  const listeners = new Set();
  let loadingSettled = false;
  let pendingManualPolygon = null;

  const publish = () => {
    const state = replay.getState();
    for (const listener of listeners) listener(state);
  };

  const clear = () => {
    const state = replay.reset();
    publish();
    return state;
  };

  const applyPendingManualPolygon = () => {
    if (!pendingManualPolygon) return false;
    const ring = pendingManualPolygon;
    pendingManualPolygon = null;
    replay.replacePolygon(ring);
    return true;
  };

  const onAreaChange = (event) => {
    if (destroyed || !event) return;
    if (event.type === 'clear') {
      pendingManualPolygon = null;
      clear();
      return;
    }
    if (event.type !== 'area') return;
    if (!loadingSettled) {
      pendingManualPolygon = event.ring;
      return;
    }
    replay.replacePolygon(event.ring);
    publish();
  };

  if (annotations?.onAreaChange) {
    unsubscribe = annotations.onAreaChange(onAreaChange);
  }

  async function loadFixture(source) {
    let loaded;
    if (typeof source === 'string') {
      loaded = await loadVesselFixture(source);
    } else {
      loaded = { fixture: source, validation: undefined };
      const { validateVesselFixture } =
        await import('../data/vesselFixtureReplay.js');
      loaded.validation = validateVesselFixture(source);
    }
    if (!loaded.validation.valid) return loaded.validation;
    replay.loadFixture(loaded.fixture);
    const result = replay.start();
    applyPendingManualPolygon();
    publish();
    return result;
  }

  const initialLoading = fixtureUrl
    ? loadFixture(fixtureUrl)
    : fixture
      ? loadFixture(fixture)
      : Promise.resolve(null);
  let loading = initialLoading.finally(() => {
    loadingSettled = true;
    if (applyPendingManualPolygon()) publish();
  });

  return {
    loading,
    loadFixture,
    clear,
    subscribe(listener) {
      if (destroyed || typeof listener !== 'function') return () => {};
      listeners.add(listener);
      listener(replay.getState());
      return () => listeners.delete(listener);
    },
    next() {
      const result = replay.advance();
      publish();
      return result;
    },
    restart() {
      const result = replay.restart();
      publish();
      return result;
    },
    replacePolygon(ring) {
      if (!loadingSettled) {
        pendingManualPolygon = ring;
        return replay.getState();
      }
      const result = replay.replacePolygon(ring);
      publish();
      return result;
    },
    getState: () => replay.getState(),
    destroy() {
      if (destroyed) return;
      destroyed = true;
      unsubscribe();
      replay.reset();
    },
  };
}
