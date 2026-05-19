"use server";
import { createServerFn } from "@tanstack/react-start";
import { db } from "./db";

// Your platform UPI ID
export const PLATFORM_UPI_ID = process.env.UPI_ID || "8307224756.wallet@phonepe";
export const PLATFORM_NAME = "CLUTCHGROUND";

/** Create a pending UPI deposit request */
export const createUpiDeposit = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const { userId, amount, description } = data as any;

    if (!amount || amount < 1) {
      throw new Error("Deposit amount must be at least ₹1");
    }

    const txnRef = `CG${userId}${Date.now()}`;

    await db
      .prepare(
        `INSERT INTO upi_deposits (user_id, amount, txn_ref, status, description, created_at)
         VALUES (?, ?, ?, 'pending', ?, CURRENT_TIMESTAMP)`,
      )
      .run(userId, amount, txnRef, description || "Wallet Deposit");

    const safePlatformName = encodeURIComponent(PLATFORM_NAME.trim().replace(/\s+/g, ''));
    const safeTxnRef = encodeURIComponent(txnRef.trim());
    const safeNote = encodeURIComponent("Wallet_Deposit");
    const safeUpiId = encodeURIComponent(PLATFORM_UPI_ID.trim());

    // standard UPI intent
    const upiLink = `upi://pay?pa=${safeUpiId}&pn=${safePlatformName}&am=${amount}&cu=INR&tn=${safeNote}&tr=${safeTxnRef}`;

    return {
      txnRef,
      amount,
      upiId: PLATFORM_UPI_ID,
      platformName: PLATFORM_NAME,
      upiLink,
    };
  },
);

/** User submits their sender UPI ID after paying (stored in utr column for backward-compat) */
export const submitUpiUtr = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const { txnRef, utr: senderUpiId } = data as any;

    const upiIdRegex = /^[a-zA-Z0-9._\-]+@[a-zA-Z0-9]+$/;
    if (!senderUpiId || !upiIdRegex.test(senderUpiId.trim())) {
      throw new Error("Please enter a valid UPI ID (e.g. name@upi)");
    }

    const deposit = (await db
      .prepare("SELECT * FROM upi_deposits WHERE txn_ref = ?")
      .get(txnRef)) as any;

    if (!deposit) throw new Error("Deposit request not found");
    if (deposit.status !== "pending") {
      throw new Error("This deposit request is no longer pending");
    }

    await db
      .prepare(
        "UPDATE upi_deposits SET utr = ?, status = 'submitted', submitted_at = CURRENT_TIMESTAMP WHERE txn_ref = ?",
      )
      .run(senderUpiId.trim(), txnRef);

    return { success: true };
  },
);

/** Admin: get all pending UPI deposits */
export const getPendingUpiDeposits = createServerFn({ method: "GET" }).handler(
  async () => {
    return (await db
      .prepare(
        `SELECT d.*, u.username, u.phone
         FROM upi_deposits d
         JOIN users u ON d.user_id = u.id
         WHERE d.status IN ('submitted', 'pending')
         ORDER BY d.created_at DESC`,
      )
      .all()) as any[];
  },
);

/** Admin: approve a UPI deposit → credit wallet */
export const approveUpiDeposit = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
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

    return { success: true };
  },
);

/** Admin: reject a UPI deposit */
export const rejectUpiDeposit = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
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

    return { success: true };
  },
);

/** Get UPI deposit history for a user */
export const getUserUpiDeposits = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const userId = data as any;
    return (await db
      .prepare(
        `SELECT * FROM upi_deposits WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
      )
      .all(userId)) as any[];
  },
);

export { getWalletBalance, getTransactionHistory } from "./razorpay";
