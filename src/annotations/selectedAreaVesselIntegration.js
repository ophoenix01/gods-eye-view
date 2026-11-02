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

  const clear = () => replay.reset();

  const onAreaChange = (event) => {
    if (destroyed || !event) return;
    if (event.type === 'clear') {
      clear();
      return;
    }
    if (event.type !== 'area') return;
    replay.replacePolygon(event.ring);
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
    return replay.start();
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
    replacePolygon(ring) {
      return replay.replacePolygon(ring);
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
