export function isAllowedPushEndpoint(value: string): boolean {
  try {
    const url = new URL(value);

    if (
      url.protocol !== "https:" ||
      url.port !== "" ||
      url.username !== "" ||
      url.password !== "" ||
      url.hash !== ""
    ) {
      return false;
    }

    const hostname = url.hostname.toLowerCase();

    return (
      hostname === "fcm.googleapis.com" ||
      hostname === "updates.push.services.mozilla.com" ||
      hostname.endsWith(".push.apple.com") ||
      hostname.endsWith(".notify.windows.com")
    );
  } catch {
    return false;
  }
}
