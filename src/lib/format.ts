export const money = (n: number, dp = 0) =>
  (Number.isFinite(n) ? n : 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: dp, maximumFractionDigits: dp });
export const num = (n: number, dp = 0) =>
  (Number.isFinite(n) ? n : 0).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
export const addDays = (d: Date, days: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x.toISOString().slice(0, 10);
};
