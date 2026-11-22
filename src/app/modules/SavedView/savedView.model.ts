import { Schema, model, Types, Document } from "mongoose";

export interface ISavedViewFilters {
  projectId?: string;
  assigneeId?: string;
  status?: string;
  priority?: string;
  labelIds?: string[];
  due?: "overdue" | "today" | "week" | "none";
  mine?: boolean;
  search?: string;
}

export interface ISavedView extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  filters: ISavedViewFilters;
  isShared: boolean;
}

const schema = new Schema<ISavedView>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    filters: { type: Schema.Types.Mixed, default: {} },
    isShared: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const SavedViewModel = model<ISavedView>("SavedView", schema);
