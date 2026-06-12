"use server";
import { createServerFn } from "@tanstack/react-start";
import { getEnvVar } from "./env";

const getDb = async () => (await import("./db")).db;

async function getCurrentUser(requiredRole?: "admin" | "user", dataSessionId?: string) {
  const { getCurrentUser: get } = await import("./auth-server");
  return get(requiredRole, dataSessionId);
}

export const createRazorpayOrder = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const user = await getCurrentUser();
    const db = await getDb();
    const userId = user.id;
    const { amount, description } = data as any;

    if (!amount || amount < 100) {
      throw new Error("Minimum deposit amount is ₹100");
    }

    const keyId = getEnvVar("RAZORPAY_KEY_ID");
    const keySecret = getEnvVar("RAZORPAY_KEY_SECRET");

    if (!keyId || !keySecret) {
      throw new Error("Razorpay credentials not configured on server");
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount * 100,
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

    await db
      .prepare(
        `INSERT INTO razorpay_orders (user_id, order_id, amount, status, description, created_at)
         VALUES (?, ?, ?, 'pending', ?, CURRENT_TIMESTAMP)
         ON CONFLICT(order_id) DO UPDATE SET status = 'pending'`,
      )
      .run(userId, order.id, amount, description || "Wallet Deposit");

    return {
      orderId:  order.id,
      amount:   order.amount / 100,
      currency: order.currency,
      keyId,
    };
  },
);

export const verifyRazorpayPayment = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const userObj = await getCurrentUser();
    const db = await getDb();
    const userId = userObj.id;
    const { orderId, paymentId, signature } = data as any;

    if (!orderId || !paymentId || !signature) {
      throw new Error("Missing payment fields");
    }

    const keySecret = getEnvVar("RAZORPAY_KEY_SECRET");
    if (!keySecret) {
      throw new Error("Razorpay secret not configured on server");
    }

    const { createHmac } = await import("crypto");
    const hmac = createHmac("sha256", keySecret);
    hmac.update(`${orderId}|${paymentId}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== signature) {
      throw new Error("Payment verification failed — signature mismatch");
    }

    const order = (await db
      .prepare("SELECT amount, user_id FROM razorpay_orders WHERE order_id = ?")
      .get(orderId)) as any;

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.user_id !== userId) {
      throw new Error("Unauthorized: Order ownership verification failed");
    }

    await db.transaction(async (tx: any) => {
      await tx
        .prepare("UPDATE razorpay_orders SET status = 'completed', paid_at = CURRENT_TIMESTAMP WHERE order_id = ?")
        .run(orderId);

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
          "INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)",
        )
        .run(
          userId,
          `💰 ₹${order.amount} deposited — ${order.amount} CG Coins added to your wallet!`,
          "/wallet",
        );
    });

    try {
      const { triggerPushNotification, notifyAllAdmins } = await import("./push-server");
      triggerPushNotification(
        userId,
        "💰 Wallet Deposit",
        `💰 ₹${order.amount} deposited — ${order.amount} CG Coins added to your wallet!`,
        "/wallet"
      ).catch(e => console.error("Razorpay deposit push error:", e));

      // Notify Admins
      const username = userObj.username || "A user";
      await notifyAllAdmins(`💰 Successful Razorpay Deposit: ${username} added ₹${order.amount}`, "/admin/deposits");
    } catch(e) {
      console.error("Error notifying admins about Razorpay deposit:", e);
    }

    return { success: true, amount: order.amount };
  },
);

export const getWalletBalance = createServerFn({ method: "POST" }).handler(
  async () => {
    const userObj = await getCurrentUser();
    const db = await getDb();
    const userId = userObj.id;

    const user = (await db
      .prepare("SELECT deposit_balance, winning_balance FROM users WHERE id = ?")
      .get(userId)) as any;

    if (!user) throw new Error("User not found");

    return {
      depositBalance: user.deposit_balance || 0,
      winningBalance: user.winning_balance || 0,
      totalBalance:   (user.deposit_balance || 0) + (user.winning_balance || 0),
    };
  },
);

export const getTransactionHistory = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const userObj = await getCurrentUser();
    const db = await getDb();
    const userId = userObj.id;
    const { limit = 10, offset = 0 } = data as any;

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
  },
);
