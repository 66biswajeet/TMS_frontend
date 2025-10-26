// src/lib/notifications.ts

/**
 * Asks the user for permission to show notifications.
 * This should be called once when the app loads.
 */
// export const requestNotificationPermission = async () => {
//    console.log("🙏🙏This browser  support desktop notification");
//   if (!("Notification" in window)) {
//     console.log("🙏🙏This browser does not support desktop notification");
//     return;
//   }

//   // Don't ask again if permission is already granted or denied
//   if (
//     Notification.permission === "granted" ||
//     Notification.permission === "denied"
//   ) {
//     return;
//   }

//   try {
//     const permission = await Notification.requestPermission();
//     if (permission === "granted") {
//       console.log("Notification permission granted.");
//     }
//   } catch (err) {
//     console.error("Error requesting notification permission:", err);
//   }
// };


export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  console.log("🙏🙏This browser support desktop notification");
  
  if (!("Notification" in window)) {
    console.log("🙏🙏This browser does not support desktop notification");
    return "denied"; // Return 'denied' as it's not supported
  }

  // If permission is already granted or denied, just return it.
  if (Notification.permission !== "default") {
    console.log(`Notification permission is already: ${Notification.permission}`);
    return Notification.permission; // <--- THE CRITICAL FIX
  }

  // If permission is 'default', then request it.
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("Notification permission granted.");
    } else {
      console.log(`Notification permission was ${permission}.`);
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
   console.log("🙏🙏show notification called");
  if (!("Notification" in window) || Notification.permission !== "granted") {
     console.log("🙏🙏 returned");
    return; // Don't show if not supported or permission not granted
  }
console.log("🙏🙏show notification called once again");
  const options = {
    body: body,
    // You can add an icon here
    // icon: "/path/to/your/icon.png"
  };

  new Notification(title, options);
};
