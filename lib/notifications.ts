export const requestNotificationPermission =
  async (): Promise<NotificationPermission> => {
    console.log("🙏🙏This browser support desktop notification");

    if (!("Notification" in window)) {
      console.log("🙏🙏This browser does not support desktop notification");
      return "denied"; // Return 'denied' as it's not supported
    }

    // If permission is already granted or denied, just return it.
    if (Notification.permission !== "default") {
      console.log(
        `Notification permission is already: ${Notification.permission}`
      );
      return Notification.permission; // <--- THE CRITICAL FIX
    }

    // If permission is 'default', then request it.
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
      } else {
      }
      return permission; // Return the user's new choice
    } catch (err) {
      console.error("Error requesting notification permission:", err);
      return "default"; // Return 'default' on error
    }
  };
/**
 * Shows a browser notification.
 * @param title The title of the notification
 * @param body The body text of the notification
 */
export const showNotification = (title: string, body: string) => {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return; // Don't show if not supported or permission not granted
  }

  const options = {
    body: body,
    // You can add an icon here
    // icon: "/path/to/your/icon.png"
  };

  new Notification(title, options);
};
