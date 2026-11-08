import "dotenv/config";
import * as webPush from "web-push";

let configured = false;

export function getWebPush() {
  if (configured) {
    return webPush;
  }

  const subject = process.env["VAPID_SUBJECT"]?.trim();
  const publicKey = process.env["VAPID_PUBLIC_KEY"]?.trim();
  const privateKey = process.env["VAPID_PRIVATE_KEY"]?.trim();

  if (!subject || !publicKey || !privateKey) {
    throw new Error(
      "Configure VAPID_SUBJECT, VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY no backend.",
    );
  }

  webPush.setVapidDetails(subject, publicKey, privateKey);

  configured = true;

  return webPush;
}
