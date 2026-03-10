const makeRef = (prefix = "TXN") => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
const round2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;
const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

module.exports = { makeRef, round2, addMonths };
