/* eslint-disable @typescript-eslint/no-explicit-any */

import { getMessaging } from "firebase-admin/messaging";
import app from "./firebase";

export const sendPushNotifications = async (
  tokens: string | string[],
  title: string,
  body: string,
) => {
  if (!tokens || !app) return;

  const tokenArray: string[] = Array.isArray(tokens) ? tokens : [tokens];

  if (tokenArray.length === 0) return;

  const message = {
    notification: { title, body },
    tokens: tokenArray,
  };
  console.log(message);
  const response = await getMessaging(app).sendEachForMulticast(message);
  console.log(response);
  console.log(response.responses[0]?.error);

  response.responses.forEach((res: any, index: any) => {
    if (!res.success) {
      const errorCode = res.error?.code;

      if (
        errorCode === "messaging/registration-token-not-registered" ||
        errorCode === "messaging/invalid-registration-token"
      ) {
        console.log("Removing invalid token:", tokenArray[index]);
      }
    }
  });

  return response;
};
