// Server save resets at 07:40 BRT (10:40 UTC). A "game day" starts then, not at midnight.
// Subtracting RESET_OFFSET before dividing into days shifts the day boundary accordingly.
// Note: the Main process uses equivalent UTC constants (RESET_HOUR_UTC=10, RESET_MIN_UTC=40)
// for actual task reset scheduling — keep both in sync if the server save time changes.
const RESET_OFFSET = (7 * 60 + 40) * 60 * 1000;

function adjustedDay(ts) {
  return Math.floor((ts - RESET_OFFSET) / 86400000);
}

function houseRemaining(house) {
  if (!house?.bidDay) return null;
  const now  = new Date(Date.now() - RESET_OFFSET);
  let next   = new Date(now.getFullYear(), now.getMonth(), house.bidDay);
  if (next <= now) next = new Date(now.getFullYear(), now.getMonth() + 1, house.bidDay);
  return Math.ceil((next - now) / 86400000);
}
