import { Document, Types } from "mongoose";

export interface IWorkspace extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  ownerId: Types.ObjectId;
  isPersonal: boolean;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
