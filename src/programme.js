// Where a client actually is inside their programme.
//
// Every system now carries `weeks` and `deloadEvery`, which is the programming
// information the library never had: how long a block runs before it is worth
// measuring again, and how often a lighter week belongs in it.
//
// The position is counted in SESSIONS ACTUALLY LOGGED, not in days since the
// programme was assigned. That is deliberate, and it is the whole design:
//
//   - A calendar week counts weeks whether or not anybody trained. Somebody
//     who managed two sessions in six weeks is not "in week six" of anything,
//     and telling them so is the app lying to them about their own effort.
//   - It also needs no new column and no new source of truth. workout_logs
//     already records what happened, with the system it happened on.
//
// The cost is honest and worth paying: a client who trains four times in a
// week moves through the block faster than the calendar. For a retest prompt —
// which is what this is for — sessions completed is the better trigger anyway.
// You reassess somebody because they have done the work, not because a month
// has passed.

export function sessionsPerWeek(system) {
  const n = Array.isArray(system?.days) ? system.days.length : 0;
  return n > 0 ? n : 3;
}

export function programmeTarget(system) {
  const weeks = Number(system?.weeks) || 0;
  if (!weeks) return 0;
  return weeks * sessionsPerWeek(system);
}

// `logs` is whatever /api/client-data logs.list returned. Only sessions on
// THIS system count: switching programmes starts the block again, which is
// what switching programmes means.
//
// `since` is the date of the client's last assessment. Sessions before it do
// not count, because the block runs from the measurement — and being measured
// again is what starts a new one. Without this the retest prompt would appear
// once and then never leave, including for somebody assessed that morning.
export function programmeState(system, logs, since) {
  const from = since ? Date.parse(since) : null;
  const weeks = Number(system?.weeks) || 0;
  const perWeek = sessionsPerWeek(system);
  const target = programmeTarget(system);
  const done = Array.isArray(logs)
    ? logs.filter((l) => {
        if (String(l?.workout_system_id || "") !== String(system?.id || "")) return false;
        if (!Number.isFinite(from)) return true;
        const at = Date.parse(l?.completed_at);
        // A session with an unreadable date is counted rather than dropped:
        // losing somebody's work is the worse error of the two.
        return !Number.isFinite(at) || at >= from;
      }).length
    : 0;

  // Week 1 until the first session is finished, then one week per `perWeek`
  // sessions. Capped at the block length so a client who keeps going past the
  // end is not told they are in week 11 of 8.
  const week = Math.min(weeks || 1, Math.floor(done / perWeek) + 1);
  const deloadEvery = Number(system?.deloadEvery) || 0;

  return {
    weeks,
    perWeek,
    target,
    done,
    week,
    // A deload is only meaningful once there is something to deload from.
    isDeloadWeek: deloadEvery > 0 && done >= perWeek && week % deloadEvery === 0,
    deloadEvery,
    dueRetest: target > 0 && done >= target,
    // 0..1, for a bar. Guarded so a target of zero cannot divide.
    fraction: target > 0 ? Math.min(1, done / target) : 0,
  };
}
