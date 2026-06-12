"use server";
import { createServerFn } from "@tanstack/react-start";
import { db } from "./db";
import { getEnvVar } from "./env";
import { getCurrentUser } from "./auth-server";

// Your platform UPI ID
export const PLATFORM_UPI_ID = getEnvVar("UPI_ID") || "clutchground@nyes";
export const PLATFORM_NAME = "CLUTCHGROUND";

/** Get active UPI configuration */
export const getActiveUpiConfig = createServerFn({ method: "GET" }).handler(async () => {
  await getCurrentUser();
  const row = await db.prepare("SELECT value FROM site_settings WHERE key = 'upi_config'").get();
  if (row) {
    try {
      const parsed = JSON.parse((row as any).value);
      return {
        upiId: parsed.upiId || "clutchground@nyes",
        upiName: parsed.upiName || "CLUTCHGROUND",
        minDeposit: parsed.minDeposit || "50",
        maxDeposit: parsed.maxDeposit || "10000"
      };
    } catch {}
  }
  return {
    upiId: "clutchground@nyes",
    upiName: "CLUTCHGROUND",
    minDeposit: "50",
    maxDeposit: "10000"
  };
});

/** Create a pending UPI deposit request */
export const createUpiDeposit = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const user = await getCurrentUser();
    const userId = user.id;
    const { amount, description } = data as any;

    if (!amount || amount < 1) {
      throw new Error("Deposit amount must be at least ₹1");
    }

    // Load active settings from DB
    const upiCfg = await getActiveUpiConfig();
    const minVal = parseInt(upiCfg.minDeposit) || 50;
    const maxVal = parseInt(upiCfg.maxDeposit) || 10000;

    if (amount < minVal || amount > maxVal) {
      throw new Error(`Deposit amount must be between ₹${minVal} and ₹${maxVal}`);
    }

    const txnRef = `CG${userId}${Date.now()}`;

    await db
      .prepare(
        `INSERT INTO upi_deposits (user_id, amount, txn_ref, status, description, created_at)
         VALUES (?, ?, ?, 'pending', ?, CURRENT_TIMESTAMP)`,
      )
      .run(userId, amount, txnRef, description || "Wallet Deposit");

    const safePlatformName = encodeURIComponent(upiCfg.upiName.trim().replace(/\s+/g, ''));
    const safeTxnRef = encodeURIComponent(txnRef.trim());
    const safeNote = encodeURIComponent("Wallet_Deposit");
    const safeUpiId = encodeURIComponent(upiCfg.upiId.trim());

    // standard UPI intent
    const upiLink = `upi://pay?pa=${safeUpiId}&pn=${safePlatformName}&am=${amount}&cu=INR&tn=${safeNote}&tr=${safeTxnRef}`;

    return {
      txnRef,
      amount,
      upiId: upiCfg.upiId,
      platformName: upiCfg.upiName,
      upiLink,
    };
  },
);

/** User submits their sender UPI ID after paying (stored in utr column for backward-compat) */
export const submitUpiUtr = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const user = await getCurrentUser();
    const { txnRef, utr: senderUpiId } = data as any;

    const upiIdRegex = /^[a-zA-Z0-9._\-]+@[a-zA-Z0-9]+$/;
    if (!senderUpiId || !upiIdRegex.test(senderUpiId.trim())) {
      throw new Error("Please enter a valid UPI ID (e.g. name@upi)");
    }

    const deposit = (await db
      .prepare("SELECT * FROM upi_deposits WHERE txn_ref = ?")
      .get(txnRef)) as any;

    if (!deposit) throw new Error("Deposit request not found");
    if (deposit.user_id !== user.id) {
      throw new Error("Unauthorized");
    }
    if (deposit.status !== "pending") {
      throw new Error("This deposit request is no longer pending");
    }

    await db
      .prepare(
        "UPDATE upi_deposits SET utr = ?, status = 'submitted', submitted_at = CURRENT_TIMESTAMP WHERE txn_ref = ?",
      )
      .run(senderUpiId.trim(), txnRef);

    // Notify Admins
    try {
      const userObj = await db.prepare("SELECT username FROM users WHERE id = ?").get(deposit.user_id) as any;
      const username = userObj?.username || "A user";
      const { notifyAllAdmins } = await import("./push-server");
      await notifyAllAdmins(`💳 UPI Deposit Submitted: ${username} submitted ₹${deposit.amount} (${senderUpiId.trim()})`, "/admin/deposits");
    } catch (err) {
      console.error("Error notifying admins about UPI deposit submission:", err);
    }

    return { success: true };
  },
);

/** Admin: get all UPI deposits */
export const getPendingUpiDeposits = createServerFn({ method: "GET" }).handler(
  async () => {
    await getCurrentUser("admin");
    return (await db
      .prepare(
        `SELECT d.*, u.username, u.phone
         FROM upi_deposits d
         JOIN users u ON d.user_id = u.id
         ORDER BY d.created_at DESC`,
      )
      .all()) as any[];
  },
);

/** Admin: approve a UPI deposit → credit wallet */
export const approveUpiDeposit = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    await getCurrentUser("admin");
    const { depositId } = data as any;

    const deposit = (await db
      .prepare("SELECT * FROM upi_deposits WHERE id = ?")
      .get(depositId)) as any;

    if (!deposit) throw new Error("Deposit not found");
    if (deposit.status === "approved") throw new Error("Already approved");

    await db.transaction(async (tx: any) => {
      await tx
        .prepare("UPDATE upi_deposits SET status = 'approved', approved_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(depositId);

      await tx
        .prepare("UPDATE users SET deposit_balance = deposit_balance + ? WHERE id = ?")
        .run(deposit.amount, deposit.user_id);

      await tx
        .prepare(
          "INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)",
        )
        .run(
          deposit.user_id,
          deposit.amount,
          "deposit_added",
          `Wallet deposit via UPI (${deposit.utr || deposit.txn_ref})`,
        );

      await tx
        .prepare(
          "INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)",
        )
        .run(
          deposit.user_id,
          `💰 ₹${deposit.amount} deposited — ${deposit.amount} CG Coins added to your wallet!`,
          "/wallet",
        );
    });

    try {
      const { triggerPushNotification } = await import("./push-server");
      triggerPushNotification(
        deposit.user_id,
        "💰 Wallet Deposit",
        `💰 ₹${deposit.amount} deposited — ${deposit.amount} CG Coins added to your wallet!`,
        "/wallet"
      ).catch(e => console.error("UPI deposit approval push error:", e));
    } catch(e) {}

    return { success: true };
  },
);

/** Admin: reject a UPI deposit */
export const rejectUpiDeposit = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    await getCurrentUser("admin");
    const { depositId, reason } = data as any;

    const deposit = (await db
      .prepare("SELECT * FROM upi_deposits WHERE id = ?")
      .get(depositId)) as any;

    if (!deposit) throw new Error("Deposit not found");

    await db
      .prepare(
        "UPDATE upi_deposits SET status = 'rejected', reject_reason = ? WHERE id = ?",
      )
      .run(reason || "Payment could not be verified", depositId);

    await db
      .prepare("INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)")
      .run(
        deposit.user_id,
        `❌ Your deposit of ₹${deposit.amount} was rejected. Reason: ${reason || "Payment not verified"}. Contact support if you believe this is an error.`,
        "/wallet",
      );

    try {
      const { triggerPushNotification } = await import("./push-server");
      triggerPushNotification(
        deposit.user_id,
        "❌ Deposit Rejected",
        `❌ Your deposit of ₹${deposit.amount} was rejected. Reason: ${reason || "Payment not verified"}.`,
        "/wallet"
      ).catch(e => console.error("UPI deposit rejection push error:", e));
    } catch(e) {}

    return { success: true };
  },
);

/** Get UPI deposit history for a user */
export const getUserUpiDeposits = createServerFn({ method: "POST" }).handler(
  async () => {
    const user = await getCurrentUser();
    const userId = user.id;
    return (await db
      .prepare(
        `SELECT * FROM upi_deposits WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
      )
      .all(userId)) as any[];
  },
);

export { getWalletBalance, getTransactionHistory } from "./razorpay";
