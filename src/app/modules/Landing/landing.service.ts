import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";
import { DEFAULT_LANDING } from "./landing.defaults";
import { ILandingContent } from "./landing.interface";
import { LandingModel } from "./landing.model";

const getOrCreate = async () => {
  let doc = await LandingModel.findOne().sort({ createdAt: -1 });
  if (!doc) {
    doc = await LandingModel.create(DEFAULT_LANDING);
  }
  return doc;
};

const getPublicLanding = async () => {
  const doc = await getOrCreate();
  return doc.toObject();
};

const updateLanding = async (
  payload: Partial<ILandingContent>,
  userId: string,
) => {
  const doc = await getOrCreate();

  if (payload.hero) doc.hero = { ...doc.hero, ...payload.hero };
  if (payload.roles) {
    doc.roles = {
      ...doc.roles,
      ...payload.roles,
      cards: payload.roles.cards ?? doc.roles?.cards ?? [],
    };
  }
  if (payload.product) {
    doc.product = {
      ...doc.product,
      ...payload.product,
      items: payload.product.items ?? doc.product.items,
    };
  }
  if (payload.pipeline) {
    doc.pipeline = {
      ...doc.pipeline,
      ...payload.pipeline,
      stages: payload.pipeline.stages ?? doc.pipeline.stages,
    };
  }
  if (payload.legal) {
    doc.legal = {
      ...doc.legal,
      ...payload.legal,
      docs: payload.legal.docs ?? doc.legal.docs,
    };
  }
  if (payload.close) doc.close = { ...doc.close, ...payload.close };

  doc.updatedBy = userId as unknown as typeof doc.updatedBy;
  await doc.save();
  return doc;
};

const uploadSiteImage = async (file?: Express.Multer.File) => {
  if (!file?.buffer) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Image file is required");
  }
  if (!file.mimetype.startsWith("image/")) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Only image uploads are allowed");
  }

  const result = await sendFileToCloudinary(
    file.buffer,
    file.originalname || "landing-image",
    file.mimetype,
    "task-manager/landing",
  );

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
  };
};

const seedLandingIfNeeded = async (force = false) => {
  const existing = await LandingModel.findOne();
  if (!existing) {
    await LandingModel.create(DEFAULT_LANDING);
    return { created: true };
  }
  if (force) {
    existing.set(DEFAULT_LANDING);
    await existing.save();
    return { created: false, refreshed: true };
  }
  return { created: false, refreshed: false };
};

export const landingServices = {
  getPublicLanding,
  updateLanding,
  uploadSiteImage,
  seedLandingIfNeeded,
};
