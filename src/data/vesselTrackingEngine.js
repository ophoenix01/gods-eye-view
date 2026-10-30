/**
 * Pure selected-area vessel tracking.
 *
 * This module deliberately has no application, renderer, network, or DOM
 * dependencies. Polygons use the draw tool's longitude/latitude ring contract.
 */

const EPSILON = 1e-12;

export function normalizeMmsi(value) {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value <= 0) return null;
    return String(value);
  }
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return /^\d+$/.test(normalized) && normalized.length <= 9
    ? normalized.replace(/^0+(?=\d)/, '')
    : null;
}

function isFiniteCoordinate(value, maximum) {
  return Number.isFinite(value) && Math.abs(value) <= maximum;
}

function ringCoordinates(ring) {
  if (!Array.isArray(ring)) return null;
  const coordinates = [];
  for (const point of ring) {
    if (!Array.isArray(point) || point.length !== 2) return null;
    const longitude = point[0];
    const latitude = point[1];
    if (
      !isFiniteCoordinate(longitude, 180) ||
      !isFiniteCoordinate(latitude, 90)
    )
      return null;
    coordinates.push([longitude, latitude]);
  }
  return coordinates;
}

function unwrapRing(ring) {
  if (!ring.length) return [];
  const reference = ring[0][0];
  return ring.map(([longitude, latitude]) => {
    let unwrapped = longitude;
    while (unwrapped - reference > 180) unwrapped -= 360;
    while (unwrapped - reference < -180) unwrapped += 360;
    return [unwrapped, latitude];
  });
}

function ringArea(ring) {
  let twiceArea = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const [x1, y1] = ring[index];
    const [x2, y2] = ring[index + 1];
    twiceArea += x1 * y2 - x2 * y1;
  }
  return Math.abs(twiceArea) / 2;
}

export function validatePolygon(ring) {
  const coordinates = ringCoordinates(ring);
  if (!coordinates) {
    return { valid: false, reason: 'invalid-coordinate' };
  }

  if (
    coordinates.length > 1 &&
    coordinates[0][0] === coordinates.at(-1)[0] &&
    coordinates[0][1] === coordinates.at(-1)[1]
  ) {
    coordinates.pop();
  }
  const distinct = [];
  for (const coordinate of coordinates) {
    if (
      !distinct.some(
        ([longitude, latitude]) =>
          longitude === coordinate[0] && latitude === coordinate[1],
      )
    ) {
      distinct.push(coordinate);
    }
  }
  if (distinct.length < 3) {
    return { valid: false, reason: 'too-few-distinct-vertices' };
  }
  if (ringArea(unwrapRing(coordinates)) <= EPSILON) {
    return { valid: false, reason: 'zero-area' };
  }
  return {
    valid: true,
    ring: coordinates.map(([longitude, latitude]) => [longitude, latitude]),
  };
}

function pointOnSegment(
  longitude,
  latitude,
  aLongitude,
  aLatitude,
  bLongitude,
  bLatitude,
) {
  const cross =
    (longitude - aLongitude) * (bLatitude - aLatitude) -
    (latitude - aLatitude) * (bLongitude - aLongitude);
  if (Math.abs(cross) > EPSILON) return false;
  return (
    longitude >= Math.min(aLongitude, bLongitude) - EPSILON &&
    longitude <= Math.max(aLongitude, bLongitude) + EPSILON &&
    latitude >= Math.min(aLatitude, bLatitude) - EPSILON &&
    latitude <= Math.max(aLatitude, bLatitude) + EPSILON
  );
}

export function pointInPolygon(longitude, latitude, ring) {
  if (!isFiniteCoordinate(longitude, 180) || !isFiniteCoordinate(latitude, 90))
    return false;
  const validation = validatePolygon(ring);
  if (!validation.valid) return false;

  const coordinates = unwrapRing(validation.ring);
  let unwrappedLongitude = longitude;
  while (unwrappedLongitude - coordinates[0][0] > 180)
    unwrappedLongitude -= 360;
  while (unwrappedLongitude - coordinates[0][0] < -180)
    unwrappedLongitude += 360;
  coordinates.push(coordinates[0]);

  let inside = false;
  for (let index = 0; index < coordinates.length - 1; index += 1) {
    const a = coordinates[index];
    const b = coordinates[index + 1];
    if (pointOnSegment(unwrappedLongitude, latitude, a[0], a[1], b[0], b[1]))
      return true;
    if (
      a[1] > latitude !== b[1] > latitude &&
      unwrappedLongitude <
        ((b[0] - a[0]) * (latitude - a[1])) / (b[1] - a[1]) + a[0]
    ) {
      inside = !inside;
    }
  }
  return inside;
}

export const classifyPointInPolygon = (longitude, latitude, ring) =>
  pointInPolygon(longitude, latitude, ring) ? 'inside' : 'outside';

function snapshotValues(snapshot) {
  if (Array.isArray(snapshot)) {
    return { timestamp: null, observations: snapshot };
  }
  const observations =
    snapshot?.observations ?? snapshot?.vessels ?? snapshot?.positions;
  return {
    timestamp: snapshot?.timestamp ?? snapshot?.time ?? null,
    observations: Array.isArray(observations) ? observations : [],
  };
}

export function normalizeVesselSnapshot(snapshot) {
  const { timestamp, observations } = snapshotValues(snapshot);
  const normalized = new Map();
  for (const observation of observations) {
    const mmsi = normalizeMmsi(observation?.mmsi);
    const latitude = observation?.latitude ?? observation?.lat;
    const longitude = observation?.longitude ?? observation?.lon;
    if (
      !mmsi ||
      !isFiniteCoordinate(latitude, 90) ||
      !isFiniteCoordinate(longitude, 180)
    ) {
      return { valid: false, reason: 'invalid-observation' };
    }
    if (normalized.has(mmsi)) {
      return { valid: false, reason: 'duplicate-mmsi' };
    }
    normalized.set(mmsi, Object.freeze({ mmsi, latitude, longitude }));
  }
  return { valid: true, timestamp, observations: normalized };
}

function crossing(mmsi, timestamp, direction) {
  return Object.freeze({
    mmsi,
    timestamp,
    estimate: 'snapshot-based',
    type: direction,
  });
}

export class VesselTrackingEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.polygon = null;
    this.positions = new Map();
    this.memberships = new Map();
    this.incoming = [];
    this.outgoing = [];
    return this.getState();
  }

  setPolygon(ring, timestamp = null) {
    const validation = validatePolygon(ring);
    if (!validation.valid) return { valid: false, reason: validation.reason };

    const incoming = [];
    const outgoing = [];
    for (const [mmsi, position] of this.positions) {
      const previous = this.memberships.get(mmsi);
      const current = pointInPolygon(
        position.longitude,
        position.latitude,
        validation.ring,
      )
        ? 'inside'
        : 'outside';
      this.memberships.set(mmsi, current);
      if (previous === 'outside' && current === 'inside')
        incoming.push(crossing(mmsi, timestamp, 'incoming'));
      if (previous === 'inside' && current === 'outside')
        outgoing.push(crossing(mmsi, timestamp, 'outgoing'));
    }
    this.polygon = validation.ring.map((point) => Object.freeze([...point]));
    this.incoming = incoming;
    this.outgoing = outgoing;
    return { valid: true, polygon: this.getPolygon(), incoming, outgoing };
  }

  replacePolygon(ring, timestamp = null) {
    return this.setPolygon(ring, timestamp);
  }

  processSnapshot(snapshot) {
    const normalized = normalizeVesselSnapshot(snapshot);
    if (!normalized.valid) return normalized;
    const incoming = [];
    const outgoing = [];

    for (const [mmsi, position] of normalized.observations) {
      const previous = this.memberships.get(mmsi);
      const current = this.polygon
        ? pointInPolygon(position.longitude, position.latitude, this.polygon)
          ? 'inside'
          : 'outside'
        : 'unclassified';
      this.positions.set(mmsi, Object.freeze({ ...position }));
      if (!this.polygon) continue;
      this.memberships.set(mmsi, current);
      if (previous === 'outside' && current === 'inside') {
        incoming.push(crossing(mmsi, normalized.timestamp, 'incoming'));
      } else if (previous === 'inside' && current === 'outside') {
        outgoing.push(crossing(mmsi, normalized.timestamp, 'outgoing'));
      }
    }

    if (this.polygon) {
      this.incoming = incoming;
      this.outgoing = outgoing;
    }
    return {
      valid: true,
      timestamp: normalized.timestamp,
      incoming: [...incoming],
      outgoing: [...outgoing],
    };
  }

  addSnapshot(snapshot) {
    return this.processSnapshot(snapshot);
  }

  getPolygon() {
    return this.polygon?.map((point) => [...point]) ?? null;
  }

  getState() {
    const inside = [];
    const outside = [];
    for (const [mmsi, membership] of this.memberships) {
      const position = this.positions.get(mmsi);
      if (!position) continue;
      (membership === 'inside' ? inside : outside).push({
        ...position,
      });
    }
    return {
      polygon: this.getPolygon(),
      inside: [...inside].sort((a, b) => a.mmsi.localeCompare(b.mmsi)),
      outside: [...outside].sort((a, b) => a.mmsi.localeCompare(b.mmsi)),
      memberships: Object.fromEntries(this.memberships),
      incoming: this.incoming.map((entry) => ({ ...entry })),
      outgoing: this.outgoing.map((entry) => ({ ...entry })),
    };
  }
}

export const createVesselTrackingEngine = () => new VesselTrackingEngine();
