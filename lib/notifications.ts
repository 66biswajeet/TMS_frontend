// src/lib/notifications.ts

/**
 * Asks the user for permission to show notifications.
 * This should be called once when the app loads.
 */
export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notification");
    return;
  }

  // Don't ask again if permission is already granted or denied
  if (
    Notification.permission === "granted" ||
    Notification.permission === "denied"
  ) {
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("Notification permission granted.");
    }
  } catch (err) {
    console.error("Error requesting notification permission:", err);
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
