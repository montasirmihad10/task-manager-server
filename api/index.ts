import type { Request, Response } from "express";
import mongoose from "mongoose";
import app from "../src/app";
import config from "../src/app/config";

let dbReady: Promise<void> | null = null;

function ensureDb(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve();
  }
  if (!dbReady) {
    if (!config.DATABASE_URL) {
      dbReady = Promise.reject(
        new Error("DATABASE_URL is not defined in environment variables"),
      );
    } else {
      dbReady = mongoose
        .connect(config.DATABASE_URL as string)
        .then(() => undefined);
    }
  }
  return dbReady;
}

export default async function handler(req: Request, res: Response) {
  await ensureDb();
  return app(req, res);
}
