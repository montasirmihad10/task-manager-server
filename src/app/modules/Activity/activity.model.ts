import { Schema, model } from "mongoose";
import { ACTIVITY_ACTION } from "../../constants/workspace";
import { IActivityLog } from "./activity.interface";

const activitySchema = new Schema<IActivityLog>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: Object.values(ACTIVITY_ACTION),
      required: true,
    },
    taskId: { type: Schema.Types.ObjectId, ref: "Task", default: null },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      default: null,
    },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

activitySchema.index({ workspaceId: 1, createdAt: -1 });
activitySchema.index({ taskId: 1, createdAt: -1 });

export const ActivityLogModel = model<IActivityLog>(
  "ActivityLog",
  activitySchema,
);
