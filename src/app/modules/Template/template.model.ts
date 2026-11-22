import { Schema, model, Types, Document } from "mongoose";

export type TTemplateKind = "project" | "task";

export interface ITemplate extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  kind: TTemplateKind;
  name: string;
  description?: string;
  payload: Record<string, unknown>;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
}

const schema = new Schema<ITemplate>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    kind: { type: String, enum: ["project", "task"], required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    payload: { type: Schema.Types.Mixed, default: {} },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const TemplateModel = model<ITemplate>("Template", schema);
