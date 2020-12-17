const getStats = (rawStats) => {
  return Object.values(rawStats).map(stat => {
    const { displayName, displayValue } = stat;
    return { displayName, displayValue };
  });
}

module.exports = {
  getStats
}