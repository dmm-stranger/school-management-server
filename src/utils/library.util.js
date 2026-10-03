/**
 * Pure library business-rule helpers (no DB access) so the rules that touch
 * money and deadlines are easy to test in isolation.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** A book due "on the 14th" is on time until the END of the 14th (UTC), not midnight at its start. */
export const endOfDayUTC = (date) => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
};

export const addDays = (date, days) => new Date(new Date(date).getTime() + days * MS_PER_DAY);

export const computeDueDate = (issueDate, loanDays) => endOfDayUTC(addDays(issueDate, loanDays));

/** Whole days late, rounded UP (1 hour late = 1 day late). 0 when on time. */
export const computeOverdueDays = (dueDate, asOf = new Date()) => {
  const diff = new Date(asOf).getTime() - new Date(dueDate).getTime();
  return diff <= 0 ? 0 : Math.ceil(diff / MS_PER_DAY);
};

/** perDay × days, optionally capped (a null/undefined cap means uncapped). */
export const computeOverdueFine = (days, perDay, cap = null) => {
  const raw = Math.max(0, days) * Math.max(0, perDay);
  return cap === null || cap === undefined ? raw : Math.min(raw, cap);
};

/** Lost-book penalty: the book's price when configured + known, otherwise the flat fallback amount. */
export const computeLostPenalty = ({ price, usePrice, flatFine }) => {
  if (usePrice && typeof price === "number" && price > 0) return price;
  return flatFine;
};
