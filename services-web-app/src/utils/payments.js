const pesoFormat = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

export const formatPeso = (amount) =>
  amount === null || amount === undefined ? "—" : pesoFormat.format(amount);

// Payment deadlines are Manila time regardless of where the viewer is.
export const formatManilaDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

// "YYYY-MM-DD" from the API is a calendar date, not an instant: parse it as local.
export const parseCalendarDate = (dateStr) => new Date(`${String(dateStr).slice(0, 10)}T00:00`);

// Preview for the accept dialog only. Mirrors Backend/src/utils/money.js, which
// recomputes and locks the real amounts when the provider accepts.
export const previewAmounts = (total, feeRate) => {
  const cents = Math.round(Number(total) * 100);
  if (!Number.isFinite(cents) || cents <= 0) return null;
  const deposit = Math.ceil(cents / 2);
  const fee = Math.floor((cents * Math.round(Number(feeRate) * 1000) + 500) / 1000);
  return {
    total: cents / 100,
    deposit: deposit / 100,
    fee: fee / 100,
    payout: (deposit - fee) / 100,
    balance: (cents - deposit) / 100,
  };
};

export const previewHourlyTotal = (hours, rate) =>
  Math.floor((Math.round(Number(hours) * 100) * Math.round(Number(rate) * 100) + 50) / 100) / 100;

export const PLATFORM_GCASH = {
  name: process.env.REACT_APP_GCASH_NAME || "",
  number: process.env.REACT_APP_GCASH_NUMBER || "",
  qrSrc: `${process.env.PUBLIC_URL || ""}/gcash-qr.png`,
};
