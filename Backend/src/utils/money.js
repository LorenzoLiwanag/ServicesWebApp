// All payment math, in integer centavos (PRD_PAYMENT_SYSTEM_V2.md §3, §6).
// The API, the cancel preview and the admin screens all go through here.
// Self-check: node src/utils/money.js
import assert from "assert";
import { pathToFileURL } from "url";
import { loadEnv } from "../config/loadEnv.js";

loadEnv();

// Rates are snapshotted as DECIMAL(4,3), so keep them to whole thousandths.
const readRate = (name, fallback, max) => {
  const rate = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(rate) || rate < 0 || rate > max) {
    throw new Error(`${name} must be a number between 0 and ${max}`);
  }
  return Math.round(rate * 1000) / 1000;
};

// <= 0.5 guarantees the fee never exceeds the deposit, so payouts are never negative.
export const PLATFORM_FEE_RATE = readRate("PLATFORM_FEE_RATE", 0.1, 0.5);
export const CANCEL_FEE_RATE = readRate("CANCEL_FEE_RATE", 0.05, 1);
export const MAX_TOTAL = 99999999.99; // DECIMAL(10,2)

export const toCentavos = (pesos) => Math.round(Number(pesos) * 100);
export const formatPeso = (pesos) =>
  `₱${Number(pesos).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const toPesos = (centavos) => centavos / 100;

// centavos × rate, rounded half up, without floating-point drift.
const applyRate = (centavos, rate) => Math.floor((centavos * Math.round(Number(rate) * 1000) + 500) / 1000);

// Amounts locked onto the booking when the provider accepts.
export const computeAmounts = (agreedTotal, feeRate = PLATFORM_FEE_RATE) => {
  const total = toCentavos(agreedTotal);
  const deposit = Math.ceil(total / 2); // odd centavo goes up front
  const fee = applyRate(total, feeRate);
  return {
    agreedTotal: toPesos(total),
    feeRate,
    depositAmount: toPesos(deposit),
    platformFee: toPesos(fee),
    payout: toPesos(deposit - fee),
    balance: toPesos(total - deposit),
  };
};

export const hourlyTotal = (hours, hourlyRate) =>
  toPesos(Math.floor((Math.round(Number(hours) * 100) * toCentavos(hourlyRate) + 50) / 100));

// §6: who gets what when a booking with a verified deposit is cancelled.
// "late" (< 24h before the service) is decided in SQL against Manila NOW().
export const settleCancellation = ({ depositAmount, platformFee, by, late, cancelFeeRate = CANCEL_FEE_RATE }) => {
  const deposit = toCentavos(depositAmount);
  const fee = toCentavos(platformFee);
  let refund = 0;
  let payout = 0;
  let earned = 0;
  let penalty = 0;

  if (by === "client" && !late) {
    earned = applyRate(deposit, cancelFeeRate);
    refund = deposit - earned;
  } else if (by === "client") {
    payout = deposit - fee;
    earned = fee;
  } else {
    refund = deposit;
    if (late) penalty = fee;
  }

  return {
    refundDue: toPesos(refund),
    payoutDue: toPesos(payout),
    platformEarned: toPesos(earned),
    penalty: toPesos(penalty),
  };
};

export const settleCompletion = ({ depositAmount, platformFee }) => ({
  refundDue: 0,
  payoutDue: toPesos(toCentavos(depositAmount) - toCentavos(platformFee)),
  platformEarned: toPesos(toCentavos(platformFee)),
  penalty: 0,
});

// Admin "custom" dispute outcome must account for every centavo of the deposit.
export const sumsToDeposit = ({ refundDue, payoutDue, platformEarned }, depositAmount) =>
  [refundDue, payoutDue, platformEarned].every((v) => Number.isFinite(Number(v)) && Number(v) >= 0) &&
  toCentavos(refundDue) + toCentavos(payoutDue) + toCentavos(platformEarned) === toCentavos(depositAmount);

// A provider's outstanding penalty is taken out of their next payout first.
export const applyPenalty = (payoutDue, penaltyBalance) => {
  const due = toCentavos(payoutDue);
  const deducted = Math.min(due, toCentavos(penaltyBalance));
  return { send: toPesos(due - deducted), deducted: toPesos(deducted) };
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const amounts = (total) => {
    const a = computeAmounts(total, 0.1);
    return [a.depositAmount, a.platformFee, a.payout, a.balance];
  };
  // §3 table
  assert.deepStrictEqual(amounts(2000), [1000, 200, 800, 1000]);
  assert.deepStrictEqual(amounts(1505), [752.5, 150.5, 602, 752.5]);
  assert.deepStrictEqual(amounts("1505.05"), [752.53, 150.51, 602.02, 752.52]);
  for (const total of [0.01, 0.03, 1, 999.99, 1234.57, 99999999.99]) {
    const a = computeAmounts(total, 0.5);
    assert.ok(a.payout >= 0, `payout negative for ${total}`);
    assert.strictEqual(toCentavos(a.depositAmount) + toCentavos(a.balance), toCentavos(total));
  }

  assert.strictEqual(hourlyTotal(2.5, 500), 1250);
  assert.strictEqual(hourlyTotal("1.33", "333.33"), 443.33);

  // §6 table, ₱2,000 job
  const job = { depositAmount: 1000, platformFee: 200, cancelFeeRate: 0.05 };
  const settle = (by, late) => settleCancellation({ ...job, by, late });
  assert.deepStrictEqual(settle("client", false), { refundDue: 950, payoutDue: 0, platformEarned: 50, penalty: 0 });
  assert.deepStrictEqual(settle("client", true), { refundDue: 0, payoutDue: 800, platformEarned: 200, penalty: 0 });
  assert.deepStrictEqual(settle("provider", false), { refundDue: 1000, payoutDue: 0, platformEarned: 0, penalty: 0 });
  assert.deepStrictEqual(settle("provider", true), { refundDue: 1000, payoutDue: 0, platformEarned: 0, penalty: 200 });
  assert.deepStrictEqual(settleCompletion(job), { refundDue: 0, payoutDue: 800, platformEarned: 200, penalty: 0 });
  // every settlement accounts for the whole deposit
  for (const s of [settle("client", false), settle("client", true), settle("provider", false), settle("provider", true)]) {
    assert.ok(sumsToDeposit(s, 1000));
  }
  assert.ok(!sumsToDeposit({ refundDue: 500, payoutDue: 400, platformEarned: 50 }, 1000));
  assert.ok(!sumsToDeposit({ refundDue: -100, payoutDue: 1000, platformEarned: 100 }, 1000));

  assert.deepStrictEqual(applyPenalty(800, 200), { send: 600, deducted: 200 });
  assert.deepStrictEqual(applyPenalty(150, 200), { send: 0, deducted: 150 });

  console.log("money.js: all checks passed");
}
