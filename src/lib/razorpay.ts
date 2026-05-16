"use server";
import { createServerFn } from "@tanstack/react-start";
import { createHmac } from "crypto";
import { db } from "./db";

/* ─────────────────────────────────────────────
   CREATE ORDER
   Called by WalletDepositDialog before opening
   the Razorpay checkout modal.
───────────────────────────────────────────── */
export const createRazorpayOrder = createServerFn({ method: "POST" })
  .validator((d: { userId: number; amount: number; description?: string }) => d)
  .handler(async ({ data }) => {
    const { userId, amount, description } = data;

    if (!amount || amount < 100) {
      throw new Error("Minimum deposit amount is ₹100");
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error("Razorpay credentials not configured on server");
    }

    // Call Razorpay Orders API
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount * 100, // paise
        currency: "INR",
        receipt: `wallet_${userId}_${Date.now()}`,
        notes: { description: description || "Wallet Deposit" },
      }),
    });

    if (!response.ok) {
      const err = (await response.json()) as any;
      throw new Error(err?.error?.description || "Failed to create Razorpay order");
    }

    const order = (await response.json()) as any;

    // Persist order for idempotent verification later
    await db
      .prepare(
        `INSERT INTO razorpay_orders (user_id, order_id, amount, status, description, created_at)
         VALUES (?, ?, ?, 'pending', ?, CURRENT_TIMESTAMP)
         ON CONFLICT(order_id) DO UPDATE SET status = 'pending'`,
      )
      .run(userId, order.id, amount, description || "Wallet Deposit");

    return {
      orderId:  order.id,
      amount:   order.amount / 100, // back to rupees for display
      currency: order.currency,
      keyId,  // safe — this is the public KEY_ID, not the secret
    };
  });

/* ─────────────────────────────────────────────
   VERIFY PAYMENT
   Called by WalletDepositDialog after Razorpay
   modal calls its handler() callback.
───────────────────────────────────────────── */
export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .validator((d: {
    userId:    number;
    orderId:   string;
    paymentId: string;
    signature: string;
  }) => d)
  .handler(async ({ data }) => {
    const { userId, orderId, paymentId, signature } = data;

    if (!orderId || !paymentId || !signature) {
      throw new Error("Missing payment fields");
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      throw new Error("Razorpay secret not configured on server");
    }

    // HMAC-SHA256 verification (orderId|paymentId, KEY_SECRET)
    const hmac = createHmac("sha256", keySecret);
    hmac.update(`${orderId}|${paymentId}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== signature) {
      throw new Error("Payment verification failed — signature mismatch");
    }

    // Fetch stored order
    const order = (await db
      .prepare("SELECT amount FROM razorpay_orders WHERE order_id = ?")
      .get(orderId)) as any;

    if (!order) {
      throw new Error("Order not found");
    }

    // Credit wallet inside a transaction
    await db.transaction(async (tx: any) => {
      await tx
        .prepare("UPDATE users SET deposit_balance = deposit_balance + ? WHERE id = ?")
        .run(order.amount, userId);

      await tx
        .prepare(
          "INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)",
        )
        .run(userId, order.amount, "deposit_added", "Wallet deposit via Razorpay");

      await tx
        .prepare(
          "UPDATE razorpay_orders SET status = 'completed', paid_at = CURRENT_TIMESTAMP WHERE order_id = ?",
        )
        .run(orderId);

      await tx
        .prepare(
          "INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)",
        )
        .run(
          userId,
          `💰 ₹${order.amount} deposited — ${order.amount} CG Coins added to your wallet!`,
          "/wallet",
        );
    });

    return { success: true, amount: order.amount };
  });

/* ─────────────────────────────────────────────
   GET WALLET BALANCE  (used by some components)
───────────────────────────────────────────── */
export const getWalletBalance = createServerFn({ method: "POST" })
  .validator((d: number) => d)
  .handler(async ({ data: userId }) => {
    const user = (await db
      .prepare("SELECT deposit_balance, winning_balance FROM users WHERE id = ?")
      .get(userId)) as any;

    if (!user) throw new Error("User not found");

    return {
      depositBalance: user.deposit_balance || 0,
      winningBalance: user.winning_balance || 0,
      totalBalance:   (user.deposit_balance || 0) + (user.winning_balance || 0),
    };
  });

/* ─────────────────────────────────────────────
   GET TRANSACTION HISTORY
───────────────────────────────────────────── */
export const getTransactionHistory = createServerFn({ method: "POST" })
  .validator((d: { userId: number; limit?: number; offset?: number }) => d)
  .handler(async ({ data }) => {
    const { userId, limit = 10, offset = 0 } = data;

    const transactions = (await db
      .prepare(
        `SELECT id, amount, type, description, created_at
         FROM transactions
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
      )
      .all(userId, limit, offset)) as any[];

    const total = (await db
      .prepare("SELECT COUNT(*) as count FROM transactions WHERE user_id = ?")
      .get(userId)) as any;

    return {
      transactions,
      total:  total?.count || 0,
      limit,
      offset,
    };
  });
