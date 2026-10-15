import type { NotificationResponse } from "expo-notifications";
// No token registration, permission requests, listeners or synthetic notifications until backend/FCM support exists.
export const notificationPreparation = {
  enabled: false,
  missing: [
    "Firebase Android google-services.json for ph.islasafe.mobile",
    "FCM credentials managed by the backend",
    "Authenticated token registration/removal endpoints",
    "Official alert source and delivery policy",
  ],
};
export type NotificationNavigation = (response: NotificationResponse) => void;
