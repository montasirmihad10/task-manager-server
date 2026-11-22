import mongoose, { Schema } from "mongoose";
import { IDetail } from "./detail.interface";

const detailSchema = new Schema<IDetail>(
  {},
  { timestamps: true, strict: false },
);

export const DetailModel =
  mongoose.models.Detail || mongoose.model<IDetail>("Detail", detailSchema);
