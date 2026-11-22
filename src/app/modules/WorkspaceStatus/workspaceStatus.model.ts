import { Schema, model, Types, Document } from "mongoose";

export interface IWorkspaceStatus extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  key: string;
  label: string;
  color: string;
  order: number;
  isDone: boolean;
  isDefault: boolean;
  isDeleted: boolean;
}

const schema = new Schema<IWorkspaceStatus>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    color: { type: String, default: "#8b95a1" },
    order: { type: Number, default: 0 },
    isDone: { type: Boolean, default: false },
    isDefault: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

schema.index({ workspaceId: 1, key: 1 }, { unique: true });

export const WorkspaceStatusModel = model<IWorkspaceStatus>(
  "WorkspaceStatus",
  schema,
);
