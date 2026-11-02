import { loadBundledJson } from './bundledJson.js';
import {
  createVesselTrackingEngine,
  normalizeVesselSnapshot,
  validatePolygon,
} from './vesselTrackingEngine.js';

const ISO_TIMESTAMP =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

function validationError(code, snapshotIndex = null, reason = null) {
  return {
    valid: false,
    code,
    snapshotIndex,
    reason,
  };
}

export function validateVesselFixture(fixture) {
  if (!fixture || typeof fixture !== 'object' || Array.isArray(fixture)) {
    return validationError('invalid-fixture');
  }
  if (!Array.isArray(fixture.snapshots) || fixture.snapshots.length === 0) {
    return validationError('missing-snapshots');
  }
  const polygon = validatePolygon(fixture.polygon);
  if (!polygon.valid) {
    return validationError('invalid-polygon', null, polygon.reason);
  }

  for (let index = 0; index < fixture.snapshots.length; index += 1) {
    const snapshot = fixture.snapshots[index];
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
      return validationError(
        'invalid-snapshot',
        index,
        'snapshot-must-be-object',
      );
    }
    if (
      typeof snapshot.timestamp !== 'string' ||
      !ISO_TIMESTAMP.test(snapshot.timestamp) ||
      !Number.isFinite(Date.parse(snapshot.timestamp))
    ) {
      return validationError('invalid-timestamp', index);
    }
    if (!Array.isArray(snapshot.observations)) {
      return validationError('invalid-observations', index);
    }
    const normalized = normalizeVesselSnapshot(snapshot);
    if (!normalized.valid) {
      return validationError(
        normalized.reason === 'duplicate-mmsi'
          ? 'duplicate-mmsi'
          : 'invalid-observation',
        index,
        normalized.reason,
      );
    }
  }
  return { valid: true, snapshots: fixture.snapshots.length };
}

export async function loadVesselFixture(url, loader = loadBundledJson) {
  const fixture = await loader(url);
  return { fixture, validation: validateVesselFixture(fixture) };
}

export class VesselFixtureReplay {
  constructor({ engine = createVesselTrackingEngine() } = {}) {
    this.engine = engine;
    this.reset();
  }

  reset() {
    this.fixture = null;
    this.snapshots = [];
    this.activeSnapshotIndex = -1;
    this.frozen = false;
    this.error = null;
    this.sequenceComplete = false;
    this.engine.reset();
    return this.getState();
  }

  loadFixture(fixture) {
    this.reset();
    const validation = validateVesselFixture(fixture);
    if (!validation.valid) {
      this.error = validation;
      return { valid: false, error: validation, state: this.getState() };
    }
    this.fixture = fixture;
    this.snapshots = fixture.snapshots;
    return { valid: true, validation, state: this.getState() };
  }

  start() {
    return this.restart();
  }

  restart() {
    if (!this.snapshots.length) {
      return { valid: false, error: this.error, state: this.getState() };
    }
    this.engine.reset();
    const polygon = this.engine.setPolygon(this.fixture.polygon);
    this.frozen = false;
    this.error = null;
    this.activeSnapshotIndex = -1;
    this.sequenceComplete = false;
    if (!polygon.valid) {
      this.frozen = true;
      this.error = validationError('invalid-polygon', null, polygon.reason);
      return { valid: false, error: this.error, state: this.getState() };
    }
    return this.step();
  }

  step() {
    if (this.frozen) {
      return { valid: false, error: this.error, state: this.getState() };
    }
    const nextIndex = this.activeSnapshotIndex + 1;
    if (nextIndex >= this.snapshots.length) {
      this.sequenceComplete = true;
      return { valid: true, complete: true, state: this.getState() };
    }

    const snapshot = this.snapshots[nextIndex];
    const runtimeValidation = normalizeVesselSnapshot(snapshot);
    if (
      typeof snapshot?.timestamp !== 'string' ||
      !ISO_TIMESTAMP.test(snapshot.timestamp) ||
      !Number.isFinite(Date.parse(snapshot.timestamp)) ||
      !runtimeValidation.valid
    ) {
      this.frozen = true;
      const code = !runtimeValidation.valid
        ? runtimeValidation.reason === 'duplicate-mmsi'
          ? 'duplicate-mmsi'
          : 'invalid-observation'
        : 'invalid-timestamp';
      this.error = validationError(code, nextIndex, runtimeValidation.reason);
      return { valid: false, error: this.error, state: this.getState() };
    }

    const result = this.engine.processSnapshot(snapshot);
    if (!result.valid) {
      this.frozen = true;
      this.error = validationError(
        'invalid-observation',
        nextIndex,
        result.reason,
      );
      return { valid: false, error: this.error, state: this.getState() };
    }
    this.activeSnapshotIndex = nextIndex;
    this.sequenceComplete = nextIndex === this.snapshots.length - 1;
    return {
      valid: true,
      complete: this.sequenceComplete,
      state: this.getState(),
      transitions: {
        incoming: result.incoming,
        outgoing: result.outgoing,
      },
    };
  }

  advance() {
    return this.step();
  }

  getState() {
    const snapshot =
      this.activeSnapshotIndex >= 0
        ? this.snapshots[this.activeSnapshotIndex]
        : null;
    return {
      fixture: this.fixture,
      activeSnapshotIndex: this.activeSnapshotIndex,
      timestamp: snapshot?.timestamp ?? null,
      currentSnapshot: snapshot,
      engine: this.engine.getState(),
      sequenceComplete: this.sequenceComplete,
      frozen: this.frozen,
      error: this.error,
    };
  }
}
