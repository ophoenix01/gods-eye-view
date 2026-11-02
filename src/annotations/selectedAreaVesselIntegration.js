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

  const publish = () => {
    const state = replay.getState();
    for (const listener of listeners) listener(state);
  };

  const clear = () => {
    const state = replay.reset();
    publish();
    return state;
  };

  const onAreaChange = (event) => {
    if (destroyed || !event) return;
    if (event.type === 'clear') {
      clear();
      return;
    }
    if (event.type !== 'area') return;
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
    publish();
    return result;
  }

  let loading = fixtureUrl
    ? loadFixture(fixtureUrl)
    : fixture
      ? loadFixture(fixture)
      : Promise.resolve(null);

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
