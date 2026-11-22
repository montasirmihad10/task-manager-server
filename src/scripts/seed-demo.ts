import mongoose from "mongoose";
import config from "../app/config";
import { seedDemoData } from "../app/DB/seedDemoData";

async function main() {
  if (!config.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined in environment variables");
  }
  await mongoose.connect(config.DATABASE_URL);
  // eslint-disable-next-line no-console
  console.log("Connected. Seeding sample users + team data…");
  await seedDemoData();
  await mongoose.disconnect();
  // eslint-disable-next-line no-console
  console.log("Done.");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
