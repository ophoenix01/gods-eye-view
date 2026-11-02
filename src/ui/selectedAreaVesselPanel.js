import { normalizeMmsi } from '../data/vesselTrackingEngine.js';
// i18n-ignore: PoC copy is intentionally kept in English for this phase.
export const ESTIMATE_COPY =
  'Snapshot-based estimate; timestamps are sampling estimates, not exact boundary times.';

export function mapSelectedAreaVesselState(state = {}) {
  const engine = state.engine || {};
  const polygon = engine.polygon || null;
  const frozen = Boolean(state.frozen);
  const complete = Boolean(state.sequenceComplete);
  const fixtureLoaded = Boolean(state.fixture);
  const numericMmsis = (entries) =>
    [
      ...new Set(
        (entries || [])
          .map((entry) => normalizeMmsi(entry.mmsi))
          .filter(Boolean),
      ),
    ].sort((a, b) =>
      BigInt(a) < BigInt(b) ? -1 : BigInt(a) > BigInt(b) ? 1 : 0,
    );

  const crossings = (entries) =>
    numericMmsis(entries).map((mmsi) => ({
      mmsi,
      timestamp:
        (entries || []).find((entry) => normalizeMmsi(entry.mmsi) === mmsi)
          ?.timestamp ||
        state.timestamp ||
        null,
      estimate: ESTIMATE_COPY,
    }));

  return {
    active: Boolean(polygon),
    frozen,
    complete,
    fixtureLoaded,
    timestamp: state.timestamp || null,
    inside: numericMmsis(engine.inside || []),
    outside: numericMmsis(engine.outside || []),
    incoming: crossings(engine.incoming || []),
    outgoing: crossings(engine.outgoing || []),
    error:
      frozen && state.error
        ? `${state.error.code}${state.error.reason ? `: ${state.error.reason}` : ''}`
        : '',
    previousDisabled:
      !fixtureLoaded || !polygon || frozen || state.activeSnapshotIndex <= 0,
    previousReason:
      state.activeSnapshotIndex <= 0
        ? 'Previous snapshot is not available at the baseline.'
        : '',
    nextDisabled: !fixtureLoaded || !polygon || frozen || complete,
    restartDisabled: !fixtureLoaded || !polygon,
  };
}

function setList(list, values, emptyText = 'None') {
  list.replaceChildren();
  if (!values.length) {
    const item = list.ownerDocument.createElement('li');
    item.textContent = emptyText;
    list.appendChild(item);
    return;
  }
  for (const value of values) {
    const item = list.ownerDocument.createElement('li');
    item.textContent =
      typeof value === 'string'
        ? value
        : `${value.mmsi} - ${value.timestamp || 'Unknown timestamp'} - ${value.estimate}`;
    list.appendChild(item);
  }
}

export function initSelectedAreaVesselPanel({ integration, document }) {
  if (!integration || !document) return null;
  const root = document.getElementById('selected-area-vessel-panel');
  if (!root) return null;
  const find = (id) => root.querySelector(`#${id}`);
  const previous = find('selected-area-vessel-previous');
  const next = find('selected-area-vessel-next');
  const restart = find('selected-area-vessel-restart');
  const collapse = find('selected-area-vessel-collapse');
  const content = find('selected-area-vessel-content');
  const inside = find('selected-area-vessel-inside');
  const outside = find('selected-area-vessel-outside');
  const incoming = find('selected-area-vessel-incoming');
  const outgoing = find('selected-area-vessel-outgoing');
  let destroyed = false;
  let lastSignature = '';

  const render = (state) => {
    const view = mapSelectedAreaVesselState(state);
    // i18n-ignore: PoC copy is intentionally kept in English.
    find('selected-area-vessel-state').textContent = view.active
      ? view.complete
        ? 'Fixture sequence complete'
        : 'Active polygon'
      : 'No active polygon';
    // i18n-ignore: PoC copy is intentionally kept in English.
    find('selected-area-vessel-timestamp').textContent = view.timestamp
      ? `Snapshot: ${view.timestamp}`
      : '';
    const error = find('selected-area-vessel-error');
    error.hidden = !view.error;
    error.textContent = view.error;
    setList(inside, view.inside);
    setList(outside, view.outside);
    setList(incoming, view.incoming);
    setList(outgoing, view.outgoing);
    previous.disabled = view.previousDisabled;
    previous.title = view.previousReason;
    next.disabled = view.nextDisabled;
    restart.disabled = view.restartDisabled;

    const signature = JSON.stringify([
      view.inside,
      view.outside,
      view.incoming,
      view.outgoing,
      view.timestamp,
      view.error,
    ]);
    if (signature !== lastSignature) {
      lastSignature = signature;
      // i18n-ignore: PoC copy is intentionally kept in English.
      find('selected-area-vessel-status').textContent = view.active
        ? `Vessel results updated. ${view.timestamp ? `Snapshot ${view.timestamp}.` : ''}`
        : 'No active polygon.';
    }
  };

  const unsubscribe = integration.subscribe(render);
  const listeners = [
    [previous, 'click', () => integration.previous()],
    [next, 'click', () => integration.next()],
    [restart, 'click', () => integration.restart()],
    [
      collapse,
      'click',
      () => {
        const expanded = collapse.getAttribute('aria-expanded') !== 'true';
        collapse.setAttribute('aria-expanded', String(expanded));
        content.hidden = !expanded;
        collapse.lastElementChild.textContent = expanded ? '−' : '+';
      },
    ],
  ];
  for (const [element, type, listener] of listeners)
    element.addEventListener(type, listener);

  return {
    render,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      unsubscribe();
      for (const [element, type, listener] of listeners)
        element.removeEventListener(type, listener);
      root.replaceChildren();
    },
  };
}
