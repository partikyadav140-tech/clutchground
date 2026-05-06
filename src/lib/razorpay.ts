import { createServerFn } from "@tanstack/react-start";
import { createHmac } from "crypto";

// Razorpay Payment Functions
export const createRazorpayOrder = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const { userId, amount, description } = data as any;
    const { db } = await import("./lib/db");

    try {
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!keyId || !keySecret) {
        throw new Error("Razorpay credentials not configured");
      }

      // Create order using Razorpay API
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount * 100, // Razorpay expects amount in paise
          currency: "INR",
          receipt: `wallet_${userId}_${Date.now()}`,
          description: description || "Wallet Deposit",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.description || "Failed to create Razorpay order");
      }

      const order = (await response.json()) as any;

      // Store order in database for verification later
      await db
        .prepare(
          `
        INSERT INTO razorpay_orders (user_id, order_id, amount, status, description, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(order_id) DO UPDATE SET status = 'pending'
      `,
        )
        .run(userId, order.id, amount, "pending", description);

      return {
        orderId: order.id,
        amount: order.amount / 100,
        currency: order.currency,
        keyId: keyId,
      };
    } catch (e: any) {
      console.error("Failed to create Razorpay order:", e);
      throw new Error(e.message || "Failed to create payment order");
    }
  },
);

export const verifyRazorpayPayment = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const { userId, orderId, paymentId, signature } = data as any;
    const { db } = await import("./lib/db");

    try {
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) {
        throw new Error("Razorpay credentials not configured");
      }

      // Verify signature
      const hmac = createHmac("sha256", keySecret);
      hmac.update(`${orderId}|${paymentId}`);
      const generatedSignature = hmac.digest("hex");

      if (generatedSignature !== signature) {
        throw new Error("Payment verification failed");
      }

      // Get order details
      const order = (await db
        .prepare("SELECT amount FROM razorpay_orders WHERE order_id = ?")
        .get(orderId)) as any;

      if (!order) {
        throw new Error("Order not found");
      }

      // Update user balance
      await db.transaction(async (tx) => {
        await tx
          .prepare("UPDATE users SET deposit_balance = deposit_balance + ? WHERE id = ?")
          .run(order.amount, userId);

        await tx
          .prepare(
            "INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)",
          )
          .run(userId, order.amount, "deposit", "Wallet deposit via Razorpay");

        await tx
          .prepare("UPDATE razorpay_orders SET status = 'completed', paid_at = CURRENT_TIMESTAMP WHERE order_id = ?")
          .run(orderId);

        await tx
          .prepare("INSERT INTO notifications (user_id, message) VALUES (?, ?)")
          .run(userId, `💰 Wallet deposit of ${order.amount} CG Coins completed successfully!`);
      });

      return { success: true, amount: order.amount };
    } catch (e: any) {
      console.error("Payment verification failed:", e);

      // Mark order as failed
      if (orderId) {
        await db
          .prepare("UPDATE razorpay_orders SET status = 'failed' WHERE order_id = ?")
          .run(orderId)
          .catch(() => {});
      }

      throw new Error(e.message || "Payment verification failed");
    }
  },
);

export const getWalletBalance = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const { db } = await import("./lib/db");
    const userId = data as any;

    const user = (await db
      .prepare("SELECT deposit_balance, winning_balance FROM users WHERE id = ?")
      .get(userId)) as any;

    if (!user) {
      throw new Error("User not found");
    }

    return {
      depositBalance: user.deposit_balance || 0,
      winningBalance: user.winning_balance || 0,
      totalBalance: (user.deposit_balance || 0) + (user.winning_balance || 0),
    };
  },
);

export const getTransactionHistory = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const { db } = await import("./lib/db");
    const { userId, limit = 10, offset = 0 } = data as any;

    const transactions = (await db
      .prepare(
        `
      SELECT id, amount, type, description, created_at
      FROM transactions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `,
      )
      .all(userId, limit, offset)) as any[];

    const total = (await db
      .prepare("SELECT COUNT(*) as count FROM transactions WHERE user_id = ?")
      .get(userId)) as any;

    return {
      transactions,
      total: total?.count || 0,
      limit,
      offset,
    };
  },
);

export const initializeRazorpayTables = createServerFn({ method: "POST" }).handler(
  async () => {
    const { db } = await import("./lib/db");

    await db
      .prepare(
        `
      CREATE TABLE IF NOT EXISTS razorpay_orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        order_id TEXT UNIQUE NOT NULL,
        amount INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        paid_at TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `,
      )
      .run();

    return { success: true };
  },
);
