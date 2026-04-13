function computeEnergy(stored, now = Date.now()) {
  if (!stored) return null;
  const { current, max, regenMin, lastUpdated } = stored;
  if (!regenMin) return Math.min(max, Math.max(0, current));
  const gained = Math.floor((now - lastUpdated) / (regenMin * 60000));
  return Math.min(max, Math.max(0, current + gained));
}
