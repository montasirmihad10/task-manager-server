import { Document, Types } from "mongoose";

export type TProjectStatus = "active" | "archived" | "completed";

export interface IProject extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  name: string;
  description?: string;
  status: TProjectStatus;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
