import { Document, Types } from "mongoose";
import { TActivityAction } from "../../constants/workspace";

export interface IActivityLog extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  actorId: Types.ObjectId;
  action: TActivityAction;
  taskId?: Types.ObjectId | null;
  projectId?: Types.ObjectId | null;
  documentId?: Types.ObjectId | null;
  meta?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}
