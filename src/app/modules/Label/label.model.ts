import { Schema, model, Types, Document } from "mongoose";

export interface ILabel extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  name: string;
  color: string;
  isDeleted: boolean;
}

const schema = new Schema<ILabel>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: "#c8f542" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

schema.index({ workspaceId: 1, name: 1 });

export const LabelModel = model<ILabel>("Label", schema);
