import mongoose from "mongoose";
import config from "../app/config";
import { seedAbout, seedPrivacy, seedTerms } from "../app/DB";

async function main() {
  if (!config.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }
  process.env.FORCE_LEGAL_SEED = "1";
  await mongoose.connect(config.DATABASE_URL);
  // eslint-disable-next-line no-console
  console.log("Seeding About / Privacy / Terms HTML templates…");
  await seedAbout();
  await seedPrivacy();
  await seedTerms();
  await mongoose.disconnect();
  // eslint-disable-next-line no-console
  console.log("Legal content ready.");
  // eslint-disable-next-line no-console
  console.log(`
Preview (with server running):
  GET /api/v1/settings/about/html
  GET /api/v1/settings/privacy/html
  GET /api/v1/settings/terms/html

JSON:
  GET /api/v1/settings/about
  GET /api/v1/settings/privacy
  GET /api/v1/settings/terms
`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
