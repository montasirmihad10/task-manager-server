import mongoose from "mongoose";
import config from "../app/config";
import { landingServices } from "../app/modules/Landing/landing.service";

async function main() {
  if (!config.DATABASE_URL) throw new Error("DATABASE_URL missing");
  process.env.FORCE_LANDING_SEED = "1";
  await mongoose.connect(config.DATABASE_URL);
  const result = await landingServices.seedLandingIfNeeded(true);
  // eslint-disable-next-line no-console
  console.log(result);
  const doc = await landingServices.getPublicLanding();
  // eslint-disable-next-line no-console
  console.log("Landing ready:", doc.hero.brand, doc.hero.bannerImage?.slice(0, 48));
  await mongoose.disconnect();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
