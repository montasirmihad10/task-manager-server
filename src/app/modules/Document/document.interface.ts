import { Document, Types } from "mongoose";

export interface IDocumentFile extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  taskId?: Types.ObjectId | null;
  projectId?: Types.ObjectId | null;
  uploadedBy: Types.ObjectId;
  name: string;
  mimeType: string;
  size: number;
  url: string;
  path?: string;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
