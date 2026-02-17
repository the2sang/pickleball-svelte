export const MAX_WAITING_COUNT = 10;
export const CANCEL_DEADLINE_HOURS = 2;

export function isPartnerAccount(accountType) {
  if (!accountType) return false;
  const t = String(accountType).trim().toUpperCase();
  return t === 'PARTNER';
}

export function isGeneralMember(accountType) {
  return !isPartnerAccount(accountType);
}

export function parseTimeSlotStart(timeSlot) {
  const start = String(timeSlot || '').split('~')[0]?.trim() || '';
  const [hStr, mStr] = start.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return { hours: h, minutes: m };
}

export function toLocalDateTime(dateStr, hours, minutes) {
  const [yStr, monStr, dStr] = String(dateStr || '').split('-');
  const y = Number(yStr);
  const mon = Number(monStr);
  const d = Number(dStr);
  if (!Number.isFinite(y) || !Number.isFinite(mon) || !Number.isFinite(d)) return null;
  return new Date(y, mon - 1, d, hours, minutes, 0, 0);
}

export function isPastSlot(timeSlot, gameDate) {
  try {
    const start = parseTimeSlotStart(timeSlot);
    if (!start) return false;
    const dt = toLocalDateTime(gameDate, start.hours, start.minutes);
    if (!dt) return false;
    return new Date() > dt;
  } catch {
    return false;
  }
}

export function isCancelDeadlinePassed(timeSlot, gameDate) {
  const start = parseTimeSlotStart(timeSlot);
  if (!start) return false;
  const gameStart = toLocalDateTime(gameDate, start.hours, start.minutes);
  if (!gameStart) return false;
  const deadline = new Date(gameStart.getTime() - CANCEL_DEADLINE_HOURS * 60 * 60 * 1000);
  return new Date() > deadline;
}

export function getReservationCounts(reservedCount, capacity) {
  const cap = Number.isFinite(Number(capacity)) ? Number(capacity) : 6;
  const total = Number.isFinite(Number(reservedCount)) ? Number(reservedCount) : 0;
  const confirmedCount = Math.min(total, cap);
  const waitingCount = Math.max(total - cap, 0);
  const waitingLimit = cap + MAX_WAITING_COUNT;
  const isFull = total >= cap;
  const isWaitingFull = total >= waitingLimit;
  return { cap, total, confirmedCount, waitingCount, waitingLimit, isFull, isWaitingFull };
}
