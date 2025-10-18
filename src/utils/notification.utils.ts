// src/utils/notification.utils.ts (NEW FILE)

/**
 * Requests permission for desktop notifications if not already granted.
 */
export const requestNotificationPermission = (): void => {
    if (!("Notification" in window)) {
        console.warn("Notification API not supported by this browser.");
        return;
    }

    if (Notification.permission === "default") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                console.log("Notification permission granted.");
            }
        });
    }
};

/**
 * Displays a desktop notification if permission is granted.
 * @param title The title of the notification.
 * @param body The main text content.
 */
export const sendNotification = (title: string, body: string): void => {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, {
            body: body,
            icon: '/favicon.ico', // Use your app's icon
            
        });
    } else {
        console.warn("Notification blocked or permission denied.");
    }
};