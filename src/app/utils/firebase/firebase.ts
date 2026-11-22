import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import config from "../../config";

let app: App | undefined;

if (!getApps().length) {
  app = initializeApp({
    credential: cert({
      projectId: config.FIREBASE_PROJECT_ID,
      privateKey: config.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      clientEmail: config.FIREBASE_CLIENT_EMAIL,
    }),
  });
} else {
  app = getApps()[0];
}

export default app;
