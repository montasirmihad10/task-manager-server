import { Schema, model } from "mongoose";
import { ILandingDocument } from "./landing.interface";

const pillarSchema = new Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    image: { type: String, default: "" },
    moreInfo: { type: String, default: "" },
    iconKey: { type: String, default: "boards" },
  },
  { _id: false },
);

const stageSchema = new Schema(
  {
    name: { type: String, required: true },
    detail: { type: String, required: true },
    moreInfo: { type: String, default: "" },
    image: { type: String, default: "" },
  },
  { _id: false },
);

const legalDocSchema = new Schema(
  {
    slug: { type: String, required: true },
    title: { type: String, required: true },
    blurb: { type: String, default: "" },
    coverImage: { type: String, default: "" },
  },
  { _id: false },
);

const roleCardSchema = new Schema(
  {
    key: { type: String, required: true },
    eyebrow: { type: String, required: true },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    points: { type: [String], default: [] },
    ctaLabel: { type: String, default: "" },
    ctaHref: { type: String, default: "" },
  },
  { _id: false },
);

const landingSchema = new Schema<ILandingDocument>(
  {
    hero: {
      brand: { type: String, required: true },
      headline: { type: String, required: true },
      subhead: { type: String, required: true },
      primaryCta: { type: String, required: true },
      secondaryCta: { type: String, required: true },
      bannerImage: { type: String, default: "" },
      accentImage: { type: String, default: "" },
    },
    roles: {
      eyebrow: { type: String, default: "" },
      title: { type: String, default: "" },
      subtitle: { type: String, default: "" },
      cards: { type: [roleCardSchema], default: [] },
    },
    product: {
      eyebrow: { type: String, required: true },
      title: { type: String, required: true },
      subtitle: { type: String, required: true },
      items: { type: [pillarSchema], default: [] },
    },
    pipeline: {
      eyebrow: { type: String, required: true },
      title: { type: String, required: true },
      subtitle: { type: String, required: true },
      image: { type: String, default: "" },
      stages: { type: [stageSchema], default: [] },
    },
    legal: {
      eyebrow: { type: String, required: true },
      title: { type: String, required: true },
      subtitle: { type: String, required: true },
      docs: { type: [legalDocSchema], default: [] },
    },
    close: {
      eyebrow: { type: String, required: true },
      title: { type: String, required: true },
      subtitle: { type: String, required: true },
      backgroundImage: { type: String, default: "" },
      primaryCta: { type: String, required: true },
      secondaryCta: { type: String, required: true },
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

export const LandingModel =
  model<ILandingDocument>("Landing", landingSchema);
