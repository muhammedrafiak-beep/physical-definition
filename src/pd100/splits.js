// Station splits for PD-100.
// A PR-1 device check showed two defects in the old code: (a) splits missing
// from the submitted payload (finish() read a stale React state), (b) names
// shifted to the next station (the setState updater read stationRef after it
// had already been advanced).
// Fix: the name is taken from the index passed in, at the moment of the
// split, and the list lives in a ref that finish() reads.

export function addSplit(list, stations, stationIndex, at) {
  const st = stations[stationIndex];
  return [...list, { name: st ? st.name : String(stationIndex), at }];
}
