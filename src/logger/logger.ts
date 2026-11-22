import { createLogger, format, transports, type Logger } from "winston";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";

import { blue, green, red, yellowBright, magenta, yellow } from "colorette";

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

const consoleTransport = new transports.Console({
  format: format.combine(format.colorize(), format.simple()),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loggerTransports: any[] = [consoleTransport];

if (!isServerless) {
  const logDirectory = path.join(__dirname, "logs");
  try {
    if (!fs.existsSync(logDirectory)) {
      fs.mkdirSync(logDirectory, { recursive: true });
    }
    // Lazy-require so serverless bundles don't need the rotate transport
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const DailyRotateFile = require("winston-daily-rotate-file");
    loggerTransports.unshift(
      new DailyRotateFile({
        filename: path.join(logDirectory, "error-%DATE%.log"),
        datePattern: "YYYY-MM-DD",
        level: "error",
        format: format.combine(format.uncolorize(), format.json()),
      }),
      new DailyRotateFile({
        filename: path.join(logDirectory, "combined-%DATE%.log"),
        datePattern: "YYYY-MM-DD",
        format: format.combine(format.uncolorize(), format.json()),
      }),
    );
  } catch {
    // Fall back to console-only if the filesystem is read-only
  }
}

export const logger: Logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "DD-MM-YYYY HH:mm:ss" }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  transports: loggerTransports,
});

export const logHttpRequests = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const colorizeByStatusCode = (statusCode: number) => {
      if (statusCode >= 200 && statusCode < 300) {
        return green(`${statusCode} 🎉`);
      } else if (statusCode >= 400 && statusCode < 500) {
        return red(`${statusCode} ⚠️`);
      } else if (statusCode >= 500) {
        return yellowBright(`${statusCode} 🔥`);
      }
      return blue(`${statusCode} ❗`);
    };

    const colorizeByMethod = (method: string) => {
      if (method === "GET") {
        return green(method + " 🔍");
      } else if (method === "POST") {
        return blue(method + " ✏️");
      } else if (method === "PATCH") {
        return yellowBright(method + " ✨");
      } else if (method === "PUT") {
        return yellow(method + " 🛠️");
      } else if (method === "DELETE") {
        return red(method + " ❌");
      }
      return magenta(method + " Unknown 😢☹️");
    };

    const clientIp = req.ip
      ? req.ip.startsWith("::ffff:")
        ? req.ip.substring(7)
        : req.ip
      : "Unknown IP";

    logger.info({
      message: `🖥️ IP: ${clientIp} 🌐 ${colorizeByMethod(req.method)} ${colorizeByStatusCode(res.statusCode)} ${magenta(req.originalUrl)} ⏱️ Response Time: ${yellowBright(`${Date.now() - startTime} ms`)}`,
      size: res.get("Content-Length") || 0,
    });
  });

  next();
};
