import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import config from "../../config";

let app: App | undefined;

function hasFirebaseCreds(): boolean {
  return Boolean(
    config.FIREBASE_PROJECT_ID &&
      config.FIREBASE_PRIVATE_KEY &&
      config.FIREBASE_CLIENT_EMAIL,
  );
}

/** Lazily init Firebase Admin only when credentials are present. */
export function getFirebaseApp(): App | undefined {
  if (app) return app;
  if (getApps().length) {
    app = getApps()[0];
    return app;
  }
  if (!hasFirebaseCreds()) {
    return undefined;
  }
  app = initializeApp({
    credential: cert({
      projectId: config.FIREBASE_PROJECT_ID,
      privateKey: config.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      clientEmail: config.FIREBASE_CLIENT_EMAIL,
    }),
  });
  return app;
}

export default getFirebaseApp;
