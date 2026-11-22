import sanitizeHtml from "sanitize-html";
import config from "../config";
import { AboutModel } from "../modules/Settings/About/About.model";
import { PrivacyModel } from "../modules/Settings/privacy/Privacy.model";
import { TermsModel } from "../modules/Settings/Terms/Terms.model";
import { UserModel } from "../modules/User/user.model";
import { sanitizeOptions } from "../utils/SanitizeOptions";
import {
  aboutHtmlTemplate,
  isLegalSeedPlaceholder,
  privacyHtmlTemplate,
  termsHtmlTemplate,
} from "./legalHtmlTemplates";
import { landingServices } from "../modules/Landing/landing.service";

const admin = {
  email: config.ADMIN_EMAIL as string,
  password: config.ADMIN_PASS as string,
  role: "admin" as const,
  isVerified: true,
};

const superAdmin = {
  email: config.SUPER_ADMIN_EMAIL as string,
  password: config.SUPER_ADMIN_PASS as string,
  role: "super_admin" as const,
  isVerified: true,
};

export const seedAdmin = async () => {
  try {
    if (!admin.email || !admin.password) return;

    const isAdminExist = await UserModel.findOne({ email: admin.email });
    if (!isAdminExist) {
      await UserModel.create(admin);
      // eslint-disable-next-line no-console
      console.log("Admin created successfully.");
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error seeding Admin:", error);
  }
};

export const seedSuperAdmin = async () => {
  try {
    if (!superAdmin.email || !superAdmin.password) return;
    const isSuperAdminExist = await UserModel.findOne({
      email: superAdmin.email,
    });
    if (!isSuperAdminExist) {
      await UserModel.create(superAdmin);
      // eslint-disable-next-line no-console
      console.log("Super admin created successfully.");
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error seeding super admin:", error);
  }
};

async function upsertLegalDoc(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Model: any,
  html: string,
  label: string,
) {
  const force = process.env.FORCE_LEGAL_SEED === "1";
  const description = sanitizeHtml(html, sanitizeOptions);
  const existing = await Model.findOne().sort({ createdAt: -1 });

  if (!existing) {
    await Model.create({ description });
    // eslint-disable-next-line no-console
    console.log(`${label} seeded (HTML template with images).`);
    return;
  }

  if (force || isLegalSeedPlaceholder(existing.description)) {
    existing.description = description;
    await existing.save();
    // eslint-disable-next-line no-console
    console.log(`${label} seed refreshed (HTML template with images).`);
  }
}

export const seedPrivacy = async () => {
  try {
    await upsertLegalDoc(PrivacyModel, privacyHtmlTemplate, "Privacy policy");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error seeding privacy policy:", error);
  }
};

export const seedTerms = async () => {
  try {
    await upsertLegalDoc(TermsModel, termsHtmlTemplate, "Terms and conditions");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error seeding terms and conditions:", error);
  }
};

export const seedAbout = async () => {
  try {
    await upsertLegalDoc(AboutModel, aboutHtmlTemplate, "About us");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error seeding about us:", error);
  }
};

export const seedLanding = async () => {
  try {
    const force = process.env.FORCE_LANDING_SEED === "1";
    const result = await landingServices.seedLandingIfNeeded(force);
    if (result.created) {
      // eslint-disable-next-line no-console
      console.log("Landing CMS seeded with default content.");
    } else if (result.refreshed) {
      // eslint-disable-next-line no-console
      console.log("Landing CMS refreshed from defaults.");
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error seeding landing:", error);
  }
};
