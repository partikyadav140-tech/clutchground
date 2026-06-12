import webpush from "web-push";
import { getEnvVar } from "./env";

let isVapidInitialized = false;

function ensureVapidInitialized() {
  if (isVapidInitialized) return true;

  let publicVapidKey = getEnvVar("VITE_VAPID_PUBLIC_KEY");
  let privateVapidKey = getEnvVar("VAPID_PRIVATE_KEY");
  let vapidSubject = getEnvVar("VAPID_SUBJECT") || "https://clutchground.onrender.com";

  // Clean quotes if any are present
  if (publicVapidKey) publicVapidKey = publicVapidKey.replace(/['"]/g, "").trim();
  if (privateVapidKey) privateVapidKey = privateVapidKey.replace(/['"]/g, "").trim();
  if (vapidSubject) vapidSubject = vapidSubject.replace(/['"]/g, "").trim();

  if (publicVapidKey && privateVapidKey) {
    try {
      webpush.setVapidDetails(vapidSubject, publicVapidKey, privateVapidKey);
      isVapidInitialized = true;
      console.log(`[Push Server] VAPID details successfully configured with subject: ${vapidSubject}`);
      return true;
    } catch (err) {
      console.error("[Push Server] Failed to initialize web-push VAPID details:", err);
      return false;
    }
  } else {
    console.warn(
      "[Push Server] VAPID keys not configured in environment. Web Push notifications will be disabled.",
      { publicVapidKeyExists: !!publicVapidKey, privateVapidKeyExists: !!privateVapidKey }
    );
    return false;
  }
}

/**
 * Sends a real-time Web Push notification to all active devices/browsers subscribed by a user.
 */
export async function triggerPushNotification(
  userId: number,
  title: string,
  body: string,
  url = "/notifications"
) {
  const { db } = await import("./db");
  try {
    if (!ensureVapidInitialized()) {
      console.warn("[Push Server] Skipping push dispatch because VAPID is not initialized.");
      return;
    }

    const subs = (await db
      .prepare("SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?")
      .all(userId)) as any[];

    if (!subs || subs.length === 0) return;

    const payload = JSON.stringify({
      title,
      body,
      url,
    });

    const sendPromises = subs.map((sub) => {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      return webpush.sendNotification(subscription, payload).catch(async (err) => {
        // If the subscription is no longer valid (e.g. user uninstalled PWA or revoked permission)
        // clean it up from the database.
        if (err.statusCode === 410 || err.statusCode === 404) {
          try {
            await db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").run(sub.endpoint);
          } catch (dbErr) {
            console.error("Failed to delete expired subscription:", dbErr);
          }
        } else {
          console.error("Web push dispatch error:", err);
        }
      });
    });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error("Error triggering push notification:", error);
  }
}

/**
 * Creates a notification in the database and triggers a background Web Push event.
 */
export async function sendNotificationHelper(
  userId: number,
  message: string,
  redirectUrl?: string | null,
  actionType?: string | null,
  actionData?: string | null
) {
  const { db } = await import("./db");
  const url = redirectUrl || null;
  const actType = actionType || null;
  const actData = actionData || null;

  let notifId: number | undefined;
  try {
    const result = await db
      .prepare(
        "INSERT INTO notifications (user_id, message, redirect_url, action_type, action_data) VALUES (?, ?, ?, ?, ?)"
      )
      .run(userId, message, url, actType, actData);
    notifId = result.lastInsertRowid;
  } catch (err) {
    console.error("Failed to store notification record:", err);
  }

  // Trigger web push in background
  triggerPushNotification(userId, "🎮 ClutchGround", message, url || "/notifications").catch((err) => {
    console.error("Background push trigger failed:", err);
  });

  return notifId;
}

/**
 * Sends a real-time notification (database + push) to all admin users.
 */
export async function notifyAllAdmins(message: string, redirectUrl?: string | null) {
  const { db } = await import("./db");
  try {
    const admins = (await db.prepare("SELECT id FROM users WHERE role = 'admin'").all()) as any[];
    if (admins && admins.length > 0) {
      const promises = admins.map((admin) =>
        sendNotificationHelper(admin.id, message, redirectUrl)
      );
      await Promise.all(promises);
    }
  } catch (err) {
    console.error("Failed to notify admins:", err);
  }
}
