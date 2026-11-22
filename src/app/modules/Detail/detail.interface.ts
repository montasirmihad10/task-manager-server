import { Document } from "mongoose";

export interface IDetail extends Document {
  [key: string]: unknown;
}
